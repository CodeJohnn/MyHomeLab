import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../backend/server.mjs';
import {defaultAvatar} from '../backend/avatar.mjs';

test('avatar individual e atualizado, validado e preservado ao reconectar',async()=>{
  const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=(route,data,token)=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data)});
  try{
    const {room}=await(await post('/api/rooms',{})).json(),route=`/api/rooms/${room}`;
    const feminine={...defaultAvatar,gender:'feminine',hairStyle:'long',shirt:'#335599',glasses:false};
    const a=await(await post(route+'/join',{name:'Ana',avatar:feminine})).json();
    const b=await(await post(route+'/join',{name:'Bruno'})).json();
    assert.deepEqual(b.members.find(m=>m.id===a.id).avatar,feminine);
    assert.deepEqual(b.members.find(m=>m.id===b.id).avatar,defaultAvatar);
    const changed={...feminine,hairStyle:'curly',hair:'#663311'};
    assert.equal((await post(route+'/state',{avatar:changed},a.token)).status,200);
    assert.equal((await post(route+'/state',{avatar:{...changed,shirt:'<script>'}},a.token)).status,400);
    const resumed=await(await post(route+'/join',{token:a.token})).json();
    assert.deepEqual(resumed.members.find(m=>m.id===a.id).avatar,changed);
    assert.deepEqual(resumed.members.find(m=>m.id===b.id).avatar,defaultAvatar);
    assert.equal((await post(route+'/state',{avatar:changed})).status,401);
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
