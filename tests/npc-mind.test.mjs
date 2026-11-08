import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createNpcMind,npcPersonality} from '../frontend/js/npc-mind.mjs';
import {replyToNpc} from '../frontend/js/npc-dialogue.mjs';

const event={id:'test:1',type:'equipment',target:'instrumentosTI',label:'instrumento de teste'};

test('personalidades possuem habilidades distintas e respeitam ocupacao e intervalo de pensamento',()=>{
  assert.notDeepEqual(npcPersonality({name:'Vitória'}),npcPersonality({name:'Snot'}));
  const mind=createNpcMind({random:()=>.1}),npc={name:'Snot'};
  mind.observe(event,0);
  assert.equal(mind.decide(npc,0),null);
  assert.equal(mind.decide(npc,5000,{busy:true}),null);
  assert.equal(mind.decide(npc,5001),null);
  const result=mind.decide(npc,10000,{working:true});
  assert.equal(result.action,'attempt');
  assert.match(result.text,/simulação|observar|conferir/);
  assert.equal(mind.decide(npc,15000),null,'same event is remembered');
});

test('NPCs podem ignorar, comunicar ou investigar sem callbacks administrativos',()=>{
  for(const [name,roll,action] of [['Snot',.99,'ignore'],['Luiza',.5,'communicate'],['Alex',.45,'investigate']]){
    const mind=createNpcMind({random:()=>roll}),npc={name};mind.observe(event,0);mind.decide(npc,0);
    assert.equal(mind.decide(npc,5000).action,action);
  }
});

test('incidentes expiram, sao limitados e apenas um NPC reserva cada investigacao',()=>{
  const mind=createNpcMind({random:()=>.1}),a={name:'Snot'},b={name:'Luiza'};
  mind.observe(event,0);mind.decide(a,0);mind.decide(b,0);
  assert.equal(mind.decide(a,5000).action,'attempt');
  assert.equal(mind.decide(b,5000).action,'communicate');
  mind.resolve(event.id);
  assert.equal(mind.decide({name:'Alex'},10000),null);
  const bounded=createNpcMind({random:()=>0}),npc={name:'Snot'};
  for(let i=0;i<30;i++)bounded.observe({...event,id:'bounded:'+i},0);
  let count=0;
  for(let time=0;time<50000;time+=3000)if(bounded.decide(npc,time)?.event)count++;
  assert.equal(count,8);
  const expired=createNpcMind({random:()=>0});expired.observe(event,0);
  assert.equal(expired.decide({name:'Snot'},60001),null);
});

test('destinos e falas evitam repeticao imediata com memoria limitada',()=>{
  const mind=createNpcMind({random:()=>0}),npc={name:'Luiza'};
  const tasks=['a','b','c','d','e'].map(id=>({id,action:'inspect'})),recent=[];
  for(let i=0;i<50;i++){
    const task=mind.chooseTask(npc,tasks);assert.ok(!recent.slice(-3).includes(task.id));
    recent.push(task.id);npc.task=task;
  }
  assert.equal(mind.chooseLine(npc,['a','b','c']),'a');
  assert.equal(mind.chooseLine(npc,['a','b','c']),'b');
  assert.match(mind.complete(npc,event,'attempt',true),/simulad/);
  assert.equal(npc.aiLastEvent.outcome,'simulated-check');
  assert.match(mind.complete(npc,event,'investigate',false),/consegui|ocupado/);
});

test('memoria inclui respostas tecnicas, fatos pessoais e contexto dos incidentes',()=>{
  const npc={name:'Xandy'};
  const first=replyToNpc(npc,'Como organizar uma API?',1,'bancada');
  const second=replyToNpc(npc,'Como organizar uma API?',1,'bancada');
  assert.notEqual(first,second);
  assert.match(replyToNpc(npc,'lembra da conversa?',1),/API/);
  replyToNpc(npc,'me chamo Ana',1);
  assert.match(replyToNpc(npc,'qual meu nome?',1),/Ana/);
  npc.aiLastEvent={...event,action:'attempt',outcome:'simulated-check'};
  assert.match(replyToNpc(npc,'Como está o servidor?',1),/não executei comandos/);
  for(let i=0;i<100;i++)replyToNpc(npc,'Olá '+i,1);
  assert.ok(npc.dialogueMemory.exchanges.length<=12);
  assert.ok(npc.dialogueMemory.recentReplies.length<=8);
  assert.ok(npc.dialogueMemory.history.length<=12);
  assert.equal({name:'Luiza'}.dialogueMemory,undefined);
});
