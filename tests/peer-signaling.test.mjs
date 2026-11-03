import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../backend/server.mjs';

test('transmissao direta sinaliza apenas ao destinatario e restringe controle ao anfitriao',async()=>{
  const server=createServer({privateRooms:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=(path,data,token)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data)});
  const controller=new AbortController();
  try{
    const {room}=await(await post('/api/rooms',{})).json(),route=`/api/rooms/${room}`;
    const host=await(await post(route+'/join',{name:'Host'})).json();
    const guest=await(await post(route+'/join',{name:'Amigo'})).json();
    assert.equal((await post(route+'/rtc',{})).status,401);
    const events=await fetch(base+route+'/events?token='+guest.token,{signal:controller.signal});
    const reader=events.body.getReader(),decoder=new TextDecoder();let buffer='';
    async function nextEvent(predicate){
      while(true){
        let boundary;
        while((boundary=buffer.indexOf('\n\n'))>=0){const event=buffer.slice(0,boundary);buffer=buffer.slice(boundary+2);if(predicate(event))return event;}
        const {value,done}=await reader.read();if(done)throw Error('SSE encerrado');buffer+=decoder.decode(value,{stream:true});
      }
    }
    assert.equal((await post(route+'/share',{screen:'invalid'},host.token)).status,400);
    const shared=await(await post(route+'/share',{screen:'screen-1'},host.token)).json();
    assert.equal(shared.media.kind,'peer');assert.equal(shared.media.hostId,host.id);assert.equal(shared.media.url,undefined);
    const stateEvent=await nextEvent(e=>e.startsWith('data: ')&&JSON.parse(e.slice(6)).media?.kind==='peer');
    assert.equal(JSON.parse(stateEvent.slice(6)).media.streamId,shared.media.streamId);
    assert.equal((await post(route+'/share',{screen:'screen-0'},guest.token)).status,409);
    assert.equal((await post(route+'/state',{playback:{paused:true,time:100}},guest.token)).status,403);
    assert.equal((await post(route+'/state',{playback:{paused:true,time:7200}},host.token)).status,200);
    const signal={to:guest.id,type:'offer',streamId:shared.media.streamId,data:{type:'offer',sdp:'test-session'}};
    assert.equal((await post(route+'/signal',{...signal,streamId:'old'},host.token)).status,409);
    assert.equal((await post(route+'/signal',{...signal,to:host.id},guest.token)).status,403);
    assert.equal((await post(route+'/signal',signal,host.token)).status,200);
    const event=await nextEvent(e=>e.startsWith('event: peer-signal'));
    const payload=JSON.parse(event.split('\ndata: ')[1]);assert.equal(payload.from,host.id);assert.equal(payload.data.sdp,'test-session');
    assert.equal((await post(route+'/share',{stop:true},guest.token)).status,403);
    assert.equal((await post(route+'/leave',{},host.token)).status,200);
    await nextEvent(e=>e.startsWith('data: ')&&JSON.parse(e.slice(6)).media===null);
  }finally{controller.abort();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
