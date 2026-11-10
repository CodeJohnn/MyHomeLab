import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createColliderIndex} from '../frontend/js/collider-index.mjs';

const linear=(boxes,x,z,radius)=>boxes.some(({min,max})=>{const dx=x-Math.max(min.x,Math.min(x,max.x)),dz=z-Math.max(min.z,Math.min(z,max.z));return dx*dx+dz*dz<radius*radius;});
test('indice espacial preserva colisoes em limites, celulas negativas e grandes obstaculos',()=>{
  const boxes=Array.from({length:150},(_,i)=>({min:{x:-15+i%15*2.1,z:-15+Math.floor(i/15)*2.3},max:{x:-14.1+i%15*2.1,z:-14+Math.floor(i/15)*2.3}}));
  boxes.push({min:{x:28,z:-500},max:{x:29,z:500}});
  const index=createColliderIndex(boxes);assert.ok(index.info.largeBoxes>0);
  for(let i=0;i<20000;i++){const x=-20+(i*17%6000)/100,z=-20+(i*31%6000)/100,radius=[0,.23,.36,1.5,50][i%5];assert.equal(index.blocked(x,z,radius),linear(boxes,x,z,radius),[x,z,radius].join(','));}
  for(const [x,z,radius] of [[Infinity,0,.23],[0,NaN,.23],[0,0,Infinity]])assert.equal(index.blocked(x,z,radius),linear(boxes,x,z,radius));
  assert.throws(()=>createColliderIndex([],{cellSize:0}),RangeError);
});
test('reconstruir indice acompanha nova disposicao dos moveis',()=>{
  const box={min:{x:0,z:0},max:{x:1,z:1}};
  assert.equal(createColliderIndex([box]).blocked(.5,.5,.23),true);
  box.min.x=10;box.max.x=11;const rebuilt=createColliderIndex([box]);
  assert.equal(rebuilt.blocked(.5,.5,.23),false);assert.equal(rebuilt.blocked(10.5,.5,.23),true);
});
