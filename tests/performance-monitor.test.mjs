import {test} from 'node:test';
import assert from 'node:assert/strict';
import {summarizeFrames,createPerformanceMonitor} from '../frontend/js/performance-monitor.mjs';

test('diagnóstico usa o tempo total para calcular FPS e preserva travadas no p95',()=>{
  const frames=Array.from({length:20},(_,i)=>({frame:i<18?10:100,cpu:4,render:2}));
  const result=summarizeFrames(frames);
  assert.equal(result.frameMs,19);
  assert.equal(result.fps,1000/19);
  assert.equal(result.p95Ms,100);
  assert.equal(result.cpuMs,4);
  assert.equal(result.renderSubmitMs,2);
  assert.equal(summarizeFrames([]),null);
});

test('diagnóstico desativado não precisa de DOM nem consulta o renderer',()=>{
  const renderer=new Proxy({},{get(){throw new Error('Renderer não deve ser consultado.');}});
  const monitor=createPerformanceMonitor(renderer);
  monitor.begin();monitor.renderStart();monitor.renderEnd();monitor.end(1000);monitor.pause();monitor.dispose();
  assert.equal(globalThis.homelabPerformance,undefined);
});

test('diagnostico soma passes de renderizacao e restaura configuracao ao descartar',()=>{
  const previousDocument=globalThis.document;let removed=0;
  globalThis.document={createElement:()=>({style:{},remove(){removed++;}}),body:{append(){}}};
  const renderer={info:{autoReset:true,render:{calls:0,triangles:0},memory:{geometries:2,textures:3},programs:[],reset(){this.render.calls=0;this.render.triangles=0;}},getPixelRatio:()=>1.5};
  const monitor=createPerformanceMonitor(renderer,{enabled:true});
  try{
    monitor.begin();monitor.renderStart();monitor.renderEnd();monitor.end(1000);
    monitor.begin();renderer.info.render.calls=12;renderer.info.render.triangles=120;monitor.renderStart();monitor.renderEnd();monitor.end(2000);
    const snapshot=globalThis.homelabPerformance.snapshot();assert.equal(snapshot.drawCalls,12);assert.equal(snapshot.gpuMs,null);assert.equal(renderer.info.autoReset,false);
  }finally{monitor.dispose();globalThis.document=previousDocument;}
  assert.equal(renderer.info.autoReset,true);assert.equal(removed,1);assert.equal(globalThis.homelabPerformance,undefined);
});
