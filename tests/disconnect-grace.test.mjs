import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDisconnectGrace} from '../backend/disconnect-grace.mjs';
import {createServer} from '../backend/server.mjs';

function clock(){
  const timers=new Map();let id=0;
  return {timers,schedule:(fn,delay)=>{const timer=++id;timers.set(timer,{fn,delay});return timer;},cancel:timer=>timers.delete(timer)};
}

test('desconexão remove a presença após cinco segundos e reconexão cancela a saída',()=>{
  const timer=clock(),grace=createDisconnectGrace(timer),member={};let departures=0;
  grace.disconnected(member,()=>departures++);
  assert.equal(departures,0);assert.equal([...timer.timers.values()][0].delay,5000);
  const expired=[...timer.timers.values()][0].fn;
  grace.connected(member);assert.equal(timer.timers.size,0);
  expired();assert.equal(departures,0);
  grace.disconnected(member,()=>departures++);[...timer.timers.values()][0].fn();
  assert.equal(departures,1);
});

test('substituir conexão não duplica saída e membros desconectados são independentes',()=>{
  const timer=clock(),grace=createDisconnectGrace(timer),a={},b={};const left=[];
  grace.disconnected(a,()=>left.push('old a'));const stale=[...timer.timers.values()][0].fn;
  grace.disconnected(a,()=>left.push('a'));grace.disconnected(b,()=>left.push('b'));
  assert.equal(timer.timers.size,2);stale();assert.deepEqual(left,[]);
  grace.connected(a);[...timer.timers.values()][0].fn();assert.deepEqual(left,['b']);
});

test('sala avisa saída e remove membro tanto no botão quanto ao perder a conexão SSE',{timeout:12000},async()=>{
  const server=createServer({privateRooms:true}),controllers=[];
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const post=(path,data={},token)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});
  async function connect(route,token){
    const controller=new AbortController();controllers.push(controller);
    const response=await fetch(base+route+'/events?token='+token,{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(10000)])});
    const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
    return {controller,async next(predicate){
      while(true){
        let boundary;
        while((boundary=buffer.indexOf('\n\n'))>=0){
          const event=buffer.slice(0,boundary);buffer=buffer.slice(boundary+2);
          if(event.startsWith('data: ')){const state=JSON.parse(event.slice(6));if(predicate(state))return state;}
        }
        const result=await reader.read();if(result.done)throw new Error('Conexão encerrada.');buffer+=decoder.decode(result.value,{stream:true});
      }
    }};
  }
  try{
    const {room}=await(await post('/api/rooms')).json(),route='/api/rooms/'+room;
    const a=await(await post(route+'/join',{name:'Ana'})).json(),b=await(await post(route+'/join',{name:'Bia'})).json();
    const observer=await connect(route,a.token),old=await connect(route,b.token);
    await observer.next(state=>state.members.length===2);
    old.controller.abort();
    const replacement=await connect(route,b.token);
    assert.equal((await post(route+'/state',{typing:true},b.token)).status,200);
    assert.equal((await post(route+'/leave',{},b.token)).status,200);
    const left=await observer.next(state=>!state.members.some(member=>member.id===b.id));
    assert.equal(left.messages.filter(message=>message.event==='leave'&&message.name==='Bia').length,1);
    replacement.controller.abort();
    const c=await(await post(route+'/join',{name:'Caio'})).json(),disconnected=await connect(route,c.token);
    await observer.next(state=>state.members.some(member=>member.id===c.id));
    disconnected.controller.abort();
    const expired=await observer.next(state=>!state.members.some(member=>member.id===c.id));
    assert.equal(expired.members.length,1);assert.equal(expired.members[0].id,a.id);
    assert.equal(expired.messages.filter(message=>message.event==='leave'&&message.name==='Caio').length,1);
    assert.equal((await post(route+'/state',{},c.token)).status,401);
    assert.equal(expired.messages.filter(message=>message.event==='leave'&&message.name==='Bia').length,1);
  }finally{controllers.forEach(controller=>controller.abort());server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
