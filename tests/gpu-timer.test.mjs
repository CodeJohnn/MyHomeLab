import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGpuTimer} from '../frontend/js/gpu-timer.mjs';

test('timer GPU usa consultas assincronas limitadas e descarta resultados disjoint',()=>{
  let ready=false,disjoint=false,created=0,deleted=0;
  const ext={TIME_ELAPSED_EXT:1,GPU_DISJOINT_EXT:2};
  const gl={QUERY_RESULT_AVAILABLE:3,QUERY_RESULT:4,getExtension:()=>ext,createQuery:()=>({id:++created}),beginQuery(){},endQuery(){},deleteQuery(){deleted++;},getParameter:()=>disjoint,getQueryParameter:(_,kind)=>kind===3?ready:2500000};
  const timer=createGpuTimer({getContext:()=>gl});
  for(let i=0;i<12;i++){timer.begin();timer.end();}
  assert.equal(created,4);assert.equal(timer.poll(),null);ready=true;assert.equal(timer.poll(),2.5);assert.equal(deleted,4);
  timer.begin();timer.end();disjoint=true;assert.equal(timer.poll(),null);assert.equal(deleted,5);timer.dispose();
});
test('ausencia de suporte GPU nao altera o renderer',()=>{
  const timer=createGpuTimer({getContext:()=>({getExtension:()=>null})});timer.begin();timer.end();assert.equal(timer.poll(),null);timer.dispose();
});
