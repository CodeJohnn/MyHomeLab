import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../backend/server.mjs';
import {createWorld} from '../backend/room-world.mjs';

test('falha e reparo chegam às duas conexões SSE',async()=>{
  const server=createServer({privateRooms:true,serverRoomPassword:'test-server-pass',createRoomWorld:()=>createWorld(0,()=>0)});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`,controllers=[];
  const post=(route,data={},token)=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data)});
  async function connect(route,token){
    const controller=new AbortController();controllers.push(controller);
    const response=await fetch(base+route+`/events?token=${token}`,{signal:controller.signal});
    const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
    return async predicate=>{
      while(true){
        let boundary;
        while((boundary=buffer.indexOf('\n\n'))>=0){const event=buffer.slice(0,boundary);buffer=buffer.slice(boundary+2);if(event.startsWith('data: ')){const state=JSON.parse(event.slice(6));if(predicate(state))return state;}}
        const result=await reader.read();if(result.done)throw new Error('Conexão encerrada.');buffer+=decoder.decode(result.value,{stream:true});
      }
    };
  }
  try{
    const {room}=await(await post('/api/rooms')).json(),route=`/api/rooms/${room}`;
    const a=await(await post(route+'/join',{name:'Ana'})).json(),b=await(await post(route+'/join',{name:'Bia'})).json();
    const readA=await connect(route,a.token),readB=await connect(route,b.token);
    const [failedA,failedB]=await Promise.all([readA(s=>s.world.incident.down),readB(s=>s.world.incident.down)]);
    assert.deepEqual(failedA.world,failedB.world);
    const incidentId=failedA.world.incident.id;
    assert.equal((await post(route+'/state',{worldAction:{type:'repair',id:incidentId}},b.token)).status,200);
    const [fixedA,fixedB]=await Promise.all([readA(s=>!s.world.incident.down),readB(s=>!s.world.incident.down)]);
    assert.deepEqual(fixedA.world,fixedB.world);
    assert.equal((await post(route+'/state',{worldAction:{type:'repair',id:incidentId}},a.token)).status,409);
    assert.equal((await post(route+'/state',{worldAction:{type:'door',id:'restricted',open:true,password:'wrong-password'}},b.token)).status,403);
    assert.equal((await post(route+'/state',{worldAction:{type:'door',id:'restricted',open:true,password:'test-server-pass'}},a.token)).status,200);
    await post(route+'/state',{worldAction:{type:'light',id:'servers',on:false}},b.token);
    const [worldA,worldB]=await Promise.all([readA(s=>s.world.lights.servers===false),readB(s=>s.world.lights.servers===false)]);
    assert.deepEqual(worldA.world,worldB.world);assert.equal(worldA.world.doors.restricted,true);
    const resumed=await(await post(route+'/join',{token:a.token})).json();assert.deepEqual(resumed.world,worldA.world);
    await post(route+'/state',{name:'Beatriz'},b.token);
    assert.equal((await post(route+'/leave',{},b.token)).status,200);
    const departed=await readA(s=>s.messages.some(m=>m.event==='leave'));
    assert.equal(departed.members.length,1);
    const notices=departed.messages.filter(m=>m.event==='leave');
    assert.equal(notices.length,1);assert.equal(notices[0].kind,'system');assert.equal(notices[0].text,'Beatriz saiu da sala.');
    assert.equal((await post(route+'/leave',{},b.token)).status,401);
  }finally{controllers.forEach(c=>c.abort());server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});

test('duas pessoas, acesso, vídeo com range, sincronização e saída',async()=>{
  const server=createServer({privateRooms:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=(route,data={},token)=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data)});
  try{
    const {room}=await (await post('/api/rooms')).json();const route=`/api/rooms/${room}`;
    const a=await(await post(route+'/join',{name:'Ana'})).json();
    const b=await(await post(route+'/join',{name:'Bia'})).json();
    assert.notEqual(a.id,b.id);
    assert.notDeepEqual(a.pose,b.pose);
    assert.ok(a.members.every(m=>m.id!==a.token));
    assert.equal((await post(route+'/join',{name:'Terceiro'})).status,409);
    assert.equal((await post(route+'/state',{})).status,401);
    assert.equal((await post(route+'/state',{pose:{x:1,y:0,z:2,r:0}},a.token)).status,200);
    assert.equal((await post(route+'/state',{pose:{x:'inválido',y:0,z:2,r:0}},a.token)).status,400);
    const upload=await fetch(base+route+'/upload?screen=screen-3',{method:'POST',headers:{Authorization:`Bearer ${a.token}`,'Content-Type':'video/mp4'},body:Buffer.from('test-video')});assert.equal(upload.status,200);
    assert.equal((await upload.json()).media.screen,'screen-3');
    assert.equal((await post(route+'/state',{playback:{paused:false,time:12}},b.token)).status,200);
    const controller=new AbortController();
    const stream=await fetch(base+route+`/events?token=${a.token}`,{signal:controller.signal});
    const reader=stream.body.getReader();const {value}=await reader.read();const state=JSON.parse(new TextDecoder().decode(value).split('data: ')[1].split('\n\n')[0]);
    assert.equal(state.members.length,2);assert.equal(state.media.time,12);assert.equal(state.media.paused,false);
    assert.equal(state.media.screen,'screen-3');
    const otherView=await(await post(route+'/join',{token:b.token})).json();assert.deepEqual(otherView.media,state.media);
    assert.equal(state.members.find(m=>m.id===a.id).pose.x,1);
    const media=await fetch(base+state.media.url+`&token=${b.token}`,{headers:{Range:'bytes=0-3'}});assert.equal(media.status,206);assert.equal(await media.text(),'test');
    controller.abort();await reader.cancel().catch(()=>{});
    assert.equal((await post(route+'/leave',{},b.token)).status,200);
    assert.equal((await post(route+'/join',{name:'Nova pessoa'})).status,200);
    assert.equal((await fetch(base+'/server.mjs')).status,404);
    assert.equal((await fetch(base+'/')).status,200);
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});

test('mundo comum, reconexão, poses e chat compartilhados',async()=>{
  const server=createServer({privateRooms:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=(route,data={},token)=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data)});
  try{
    const one=await(await post('/api/lobby')).json(),two=await(await post('/api/lobby')).json();assert.equal(one.room,two.room);
    const route=`/api/rooms/${one.room}`;
    const a=await(await post(route+'/join',{name:'Ana'})).json(),b=await(await post(route+'/join',{name:'Bia'})).json();
    const joints=Array.from({length:8},()=>[.1,.2,.3]);
    assert.equal((await post(route+'/state',{pose:{x:3,y:0,z:1,r:.7,joints},message:'Olá Bia!'},a.token)).status,200);
    assert.equal((await post(route+'/state',{pose:{x:3,y:0,z:1,r:0,joints:[[99,0,0]]}},a.token)).status,400);
    const resumed=await(await post(route+'/join',{token:b.token})).json();
    assert.equal(resumed.id,b.id);assert.equal(resumed.members.length,2);
    assert.equal((await post(route+'/state',{name:'  Beatriz  '},b.token)).status,200);
    const renamed=await(await post(route+'/join',{token:a.token})).json();
    assert.equal(renamed.members.find(m=>m.id===b.id).name,'Beatriz');
    assert.equal((await post(route+'/state',{name:'   '},b.token)).status,400);
    assert.equal((await post(route+'/state',{name:'x'.repeat(31)},b.token)).status,400);
    assert.deepEqual(resumed.members.find(m=>m.id===a.id).pose.joints,joints);
    assert.equal(resumed.messages[0].text,'Olá Bia!');assert.equal(resumed.messages[0].sender,a.id);
    assert.equal((await post(route+'/state',{message:'x'.repeat(281)},b.token)).status,400);
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
