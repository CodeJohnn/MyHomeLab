import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../backend/server.mjs';
test('todas as entradas resolvem a mesma sala publica e compartilham participantes',async()=>{
  const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const post=async(path,data={},token)=>{const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});return {status:response.status,body:await response.json()};};
  try{
    const a=await post('/api/lobby'),b=await post('/api/rooms',{capacity:2}),c=await post('/api/lobby');
    assert.equal(a.body.room,b.body.room);assert.equal(a.body.room,c.body.room);assert.equal(a.body.room,'000000000000000000000000000000000001');
    const route='/api/rooms/'+a.body.room;
    const first=await post(route+'/join',{name:'Ana'}),second=await post(route+'/join',{name:'Bia'});
    assert.equal(second.body.members.length,2);assert.ok(second.body.members.some(m=>m.id===first.body.id));
    await post(route+'/leave',{},first.body.token);await post(route+'/leave',{},second.body.token);
    assert.equal((await post('/api/lobby')).body.room,a.body.room);
    const again=await post(route+'/join',{name:'Ana'});assert.equal(again.status,200);assert.equal(again.body.members.length,1);
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
