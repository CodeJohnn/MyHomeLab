import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../backend/server.mjs';

test('frontend externo acessa API; origem desconhecida é bloqueada e backend não entrega site',async()=>{
  const origin='https://exemplo.github.io';
  const server=createServer({allowedOrigins:[origin],serveFrontend:false});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    const preflight=await fetch(base+'/api/lobby',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});
    assert.equal(preflight.status,204);
    assert.equal(preflight.headers.get('access-control-allow-origin'),origin);
    assert.match(preflight.headers.get('access-control-allow-headers'),/Authorization/);
    const response=await fetch(base+'/api/lobby',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});
    assert.equal(response.status,200);
    assert.equal(response.headers.get('access-control-allow-origin'),origin);
    assert.ok((await response.json()).room);
    assert.equal((await fetch(base+'/api/lobby',{method:'POST',headers:{Origin:'https://outro.example'}})).status,403);
    assert.equal((await fetch(base+'/')).status,404);
    assert.equal((await fetch(base+'/health')).status,200);
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
