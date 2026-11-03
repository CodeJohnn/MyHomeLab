import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,actOnWorld,tickWorld,leaveBilliards} from '../backend/room-world.mjs';
import {createBilliardsState,stepBilliards} from '../backend/billiards.mjs';
import {createServer} from '../backend/server.mjs';

test('sair durante uma tacada interrompe a simulacao sem quebrar a partida',()=>{
  const world=createWorld(),a={id:'ana',name:'Ana'},b={id:'bia',name:'Bia'};
  actOnWorld(world,{type:'billiards',action:'join'},0,Math.random,a);
  actOnWorld(world,{type:'billiards',action:'join'},0,Math.random,b);
  assert.equal(actOnWorld(world,{type:'billiards',action:'shot',angle:0,power:.8},0,Math.random,a),true);
  assert.equal(actOnWorld(world,{type:'billiards',action:'leave'},0,Math.random,b),true);
  assert.equal(world.billiards.moving,false);
  assert.doesNotThrow(()=>stepBilliards(world.billiards));
  assert.ok(world.billiards.balls.every(ball=>ball.vx===0&&ball.vz===0));
  assert.equal(actOnWorld(world,{type:'billiards',action:'join'},0,Math.random,{id:'carol',name:'Carol'}),true);
  assert.ok(world.billiards.players.every(Boolean));
});

test('sinuca online reserva dois lugares e respeita a vez',()=>{
  const world=createWorld(0,()=>0),game=world.billiards;
  assert.equal(actOnWorld(world,{type:'billiards',action:'join'},0,Math.random,{id:'ana',name:'Ana'}),true);
  assert.equal(actOnWorld(world,{type:'billiards',action:'join'},0,Math.random,{id:'bia',name:'Bia'}),true);
  assert.deepEqual(game.players.map(player=>player.id),['ana','bia']);
  assert.equal(game.turn,0);
  assert.equal(actOnWorld(world,{type:'billiards',action:'shot',angle:0,power:.65},0,Math.random,{id:'bia',name:'Bia'}),false);
  assert.equal(actOnWorld(world,{type:'billiards',action:'shot',angle:0,power:.65},0,Math.random,{id:'ana',name:'Ana'}),true);
  assert.equal(game.moving,true);
  assert.equal(actOnWorld(world,{type:'billiards',action:'shot',angle:0,power:.65},0,Math.random,{id:'ana',name:'Ana'}),false);
  for(let i=0;i<2000&&game.moving;i++)tickWorld(world,i*50,()=>0);
  assert.equal(game.moving,false);
  assert.equal(game.contacted,true);
  assert.ok(game.balls.every(ball=>[ball.x,ball.z,ball.vx,ball.vz].every(Number.isFinite)));
  assert.ok([0,1].includes(game.turn));
});

test('sinuca libera o lugar de quem sai e valida as tacadas',()=>{
  const world=createWorld(),game=world.billiards;
  assert.equal(actOnWorld(world,{type:'billiards',action:'join'},0,Math.random,{id:'ana',name:'Ana'}),true);
  assert.equal(actOnWorld(world,{type:'billiards',action:'join'},0,Math.random,{id:'bia',name:'Bia'}),true);
  assert.equal(actOnWorld(world,{type:'billiards',action:'shot',angle:10,power:2},0,Math.random,{id:'ana',name:'Ana'}),false);
  assert.equal(leaveBilliards(game,'ana'),true);
  assert.deepEqual(game.players.map(player=>player?.id||null),[null,'bia']);
  assert.equal(game.turn,1);
});

test('a bola 8 só dá a vitória depois de limpar o próprio grupo',()=>{
  const game=createBilliardsState();
  game.players=[{id:'ana',name:'Ana'},{id:'bia',name:'Bia'}];
  game.groups=['solids','stripes'];
  game.balls.forEach(ball=>{if(ball.id>0&&ball.id<8)ball.alive=false;});
  game.balls.find(ball=>ball.id===8).alive=false;
  game.moving=true;
  assert.equal(stepBilliards(game),true);
  assert.equal(game.winner,'ana');
  assert.match(game.message,/Ana venceu/);

  const earlyEight=createBilliardsState();
  earlyEight.players=game.players;earlyEight.groups=['solids','stripes'];
  earlyEight.balls.find(ball=>ball.id===8).alive=false;earlyEight.moving=true;
  assert.equal(stepBilliards(earlyEight),true);
  assert.equal(earlyEight.winner,'bia');
});

test('a API sincroniza a partida e rejeita tacadas fora da vez',async()=>{
  const server=createServer({privateRooms:true});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=(path,data={},token)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data)});
  try{
    const {room}=await(await post('/api/rooms')).json(),route=`/api/rooms/${room}`;
    const ana=await(await post(route+'/join',{name:'Ana'})).json();
    const bia=await(await post(route+'/join',{name:'Bia'})).json();
    const join={worldAction:{type:'billiards',action:'join'}};
    assert.equal((await post(route+'/state',join,ana.token)).status,200);
    assert.equal((await post(route+'/state',join,bia.token)).status,200);
    const shot={worldAction:{type:'billiards',action:'shot',angle:0,power:.65}};
    assert.equal((await post(route+'/state',shot,bia.token)).status,409);
    assert.equal((await post(route+'/state',shot,ana.token)).status,200);
    const shared=await(await post(route+'/join',{token:bia.token})).json();
    assert.deepEqual(shared.world.billiards.players.map(player=>player.name),['Ana','Bia']);
    assert.equal(shared.world.billiards.moving,true);
    assert.equal((await post(route+'/leave',{},ana.token)).status,200);
    const afterLeave=await(await post(route+'/join',{token:bia.token})).json();
    assert.deepEqual(afterLeave.world.billiards.players.map(player=>player?.name||null),[null,'Bia']);
  }finally{
    server.closeAllConnections();
    await new Promise(resolve=>server.close(resolve));
  }
});

test('sinuca registra sons de impactos e cacapas com historico limitado',()=>{
  const game=createBilliardsState();game.players=[{id:'a',name:'A'},{id:'b',name:'B'}];
  game.balls=game.balls.slice(0,2);game.balls[0].x=0;game.balls[0].z=0;game.balls[0].vx=1;game.balls[1].x=.09;game.balls[1].z=0;game.moving=true;
  stepBilliards(game,.008);assert.ok(game.soundEvents.some(e=>e.type==='ball'));
  game.balls[0].x=1.079;game.balls[0].z=0;game.balls[0].vx=1;
  stepBilliards(game,.008);assert.ok(game.soundEvents.some(e=>e.type==='rail'));
  game.balls[1].x=0;game.balls[1].z=.47;game.balls[1].vz=.5;
  stepBilliards(game,.008);assert.ok(game.soundEvents.some(e=>e.type==='pocket'));
  for(let i=0;i<70;i++){game.moving=true;game.balls[0].x=1.079;game.balls[0].z=0;game.balls[0].vx=1;stepBilliards(game,.008);}
  assert.ok(game.soundEvents.length<=48);
  assert.equal(new Set(game.soundEvents.map(e=>e.id)).size,game.soundEvents.length);
});
