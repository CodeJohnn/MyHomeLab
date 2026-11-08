import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTypingPresence} from '../frontend/js/typing-presence.mjs';
import {createServer} from '../backend/server.mjs';

test('digitação limita avisos, renova presença e encerra por inatividade ou campo vazio',async()=>{
  let time=0,timer=null;const sent=[],local=[];
  const typing=createTypingPresence({send:value=>sent.push(value),onChange:value=>local.push(value),now:()=>time,
    schedule:callback=>{timer=callback;return callback;},cancel:()=>{timer=null;}});
  const flush=()=>new Promise(resolve=>setImmediate(resolve));
  typing.input('o');typing.input('oi');await flush();
  assert.deepEqual(sent,[true]);assert.deepEqual(local,[true]);
  time=2100;typing.input('oi!');await flush();assert.deepEqual(sent,[true,true]);
  timer();await flush();assert.deepEqual(sent,[true,true,false]);assert.deepEqual(local,[true,false]);
  typing.input('novo');typing.input('   ');typing.stop();await flush();
  assert.deepEqual(sent,[true,true,false,true,false]);assert.equal(timer,null);
});

test('avisos de digitação chegam em ordem mesmo com a primeira requisição pendente',async()=>{
  let release;const calls=[];
  const typing=createTypingPresence({send:value=>{calls.push(value);if(value)return new Promise(resolve=>{release=resolve;});}});
  typing.input('oi');typing.stop();await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(calls,[true]);release();await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(calls,[true,false]);
});

test('API compartilha somente presença temporária, valida valores e encerra ao enviar mensagem',async()=>{
  const server=createServer({privateRooms:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const post=(path,data={},token)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});
  const realNow=Date.now;
  try{
    const {room}=await(await post('/api/rooms')).json(),route='/api/rooms/'+room;
    const a=await(await post(route+'/join',{name:'Ana'})).json(),b=await(await post(route+'/join',{name:'Bia'})).json();
    const snapshot=async()=>await(await post(route+'/join',{token:b.token})).json();
    assert.equal((await post(route+'/state',{typing:true})).status,401);
    assert.equal((await post(route+'/state',{typing:'true'},a.token)).status,400);
    assert.equal((await post(route+'/state',{typing:true},a.token)).status,200);
    let state=await snapshot(),member=state.members.find(m=>m.id===a.id);
    assert.ok(member.typingFor>0&&member.typingFor<=5000);assert.equal(state.messages.length,0);
    assert.equal(state.members.find(m=>m.id===b.id).typingFor,0);
    await post(route+'/state',{typing:false},a.token);assert.equal((await snapshot()).members.find(m=>m.id===a.id).typingFor,0);
    await post(route+'/state',{typing:true},a.token);
    Date.now=()=>realNow()+6000;
    assert.equal((await snapshot()).members.find(m=>m.id===a.id).typingFor,0);Date.now=realNow;
    await post(route+'/state',{typing:true},a.token);
    await post(route+'/state',{message:'olá',typing:true},a.token);
    state=await snapshot();assert.equal(state.members.find(m=>m.id===a.id).typingFor,0);
    assert.equal(state.messages.at(-1).text,'olá');
  }finally{Date.now=realNow;server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
