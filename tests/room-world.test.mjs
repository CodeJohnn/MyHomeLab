import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,tickWorld,actOnWorld} from '../backend/room-world.mjs';
test('porta de entrada abre e fecha no estado compartilhado',()=>{
  const world=createWorld();
  assert.equal(world.doors.entrance,false);
  assert.equal(actOnWorld(world,{type:'door',id:'entrance',open:true}),true);
  assert.equal(world.doors.entrance,true);
  assert.equal(actOnWorld(world,{type:'door',id:'entrance',open:false}),true);
  assert.equal(world.doors.entrance,false);
});
test('relógio da sala e reparo único por incidente',()=>{
  const world=createWorld(1000,()=>0);
  assert.equal(tickWorld(world,65999,()=>0),false);
  assert.equal(tickWorld(world,66000,()=>0),true);
  assert.equal(world.incident.rackId,'bancadaTI');assert.equal(world.incident.id,1);
  assert.equal(tickWorld(world,999999),false);
  assert.equal(actOnWorld(world,{type:'repair',id:99}),false);
  assert.equal(actOnWorld(world,{type:'repair',id:1},100000,()=>0),true);
  assert.equal(actOnWorld(world,{type:'repair',id:1}),false);
  assert.equal(world.incident.nextAt,200000);
  assert.equal(tickWorld(world,200000,()=>.9),true);
  assert.equal(world.incident.id,2);
});
