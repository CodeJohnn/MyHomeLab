import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../backend/server.mjs';

test('sala de amigos recebe doze pessoas e rejeita a decima terceira',async()=>{
  const server=createServer({privateRooms:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=(route,data)=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  try{
    const {room}=await(await post('/api/rooms',{capacity:12})).json();
    for(let i=0;i<12;i++)assert.equal((await post(`/api/rooms/${room}/join`,{name:'Amigo '+i})).status,200);
    assert.equal((await post(`/api/rooms/${room}/join`,{name:'Extra'})).status,409);
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
