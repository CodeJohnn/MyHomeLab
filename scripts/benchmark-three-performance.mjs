import {createLegacyTypingPose} from '../tools/legacy-typing-reference.mjs';
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import * as THREE from 'three';
import {exteriorFixture,sceneMetrics,typingFixture} from '../tools/performance-fixtures.mjs';
import {createTypingPoseSolver} from '../frontend/js/npc-typing-pose.mjs';
import {createColliderIndex} from '../frontend/js/collider-index.mjs';

const baselineRef='b643598';
const baseline=createLegacyTypingPose(THREE),optimized=createTypingPoseSolver(THREE);
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const fixture=typingFixture();
function typingRun(solver,frames){const start=performance.now();for(let frame=0;frame<frames;frame++)for(const npc of fixture.npcs)solver(npc,fixture.station,frame*16.667);return performance.now()-start;}
typingRun(baseline,1000);typingRun(optimized,1000);
const oldTimes=[],newTimes=[];
for(let trial=0;trial<9;trial++)for(const [solver,times] of trial%2?[[optimized,newTimes],[baseline,oldTimes]]:[[baseline,oldTimes],[optimized,newTimes]])times.push(typingRun(solver,2000));
const exterior={};
for(const [name,options] of [['before',{pooled:false,batch:false}],['after',{pooled:true,batch:true}]]){
  const builds=[];let metrics,pool,batching;
  for(let i=0;i<5;i++){globalThis.gc?.();const start=performance.now();const world=exteriorFixture(options);builds.push(performance.now()-start);metrics=sceneMetrics(world.scene);pool=world.pool?.stats()||null;batching=world.exterior.batching;world.dispose();}
  exterior[name]={...metrics,buildMedianMs:median(builds.slice(1)),pool,batching};
}
const collisionWorld=exteriorFixture(),boxes=collisionWorld.exterior.colliders,index=createColliderIndex(boxes);
const points=Array.from({length:20000},(_,i)=>({x:-10+(i*17%5000)/100,z:-20+(i*31%5000)/100}));
const linear=(x,z,r)=>boxes.some(({min,max})=>{const dx=x-Math.max(min.x,Math.min(x,max.x)),dz=z-Math.max(min.z,Math.min(z,max.z));return dx*dx+dz*dz<r*r;});
const indexed=(x,z,r)=>index.blocked(x,z,r),collisionTimes={before:[],after:[]};let expected=0,actual=0;
for(let trial=0;trial<9;trial++)for(const [name,check] of trial%2?[['after',indexed],['before',linear]]:[['before',linear],['after',indexed]]){
  const start=performance.now();let hits=0;for(const point of points)if(check(point.x,point.z,.36))hits++;
  collisionTimes[name].push(performance.now()-start);if(name==='before')expected=hits;else actual=hits;
}
if(expected!==actual)throw Error('Collision results changed');collisionWorld.dispose();
function disposeCycles(count){for(let i=0;i<count;i++){const world=exteriorFixture();world.dispose();}}
disposeCycles(12);globalThis.gc?.();const heapBefore=process.memoryUsage().heapUsed;
const heapSamples=[];
for(let batch=0;batch<4;batch++){disposeCycles(12);globalThis.gc?.();heapSamples.push(process.memoryUsage().heapUsed);}
const heapAfter=heapSamples.at(-1);
const report={baselineRef,node:process.version,platform:process.platform,mode:'CPU-only Node microbenchmark; no WebGL rendering',
  npcTyping:{characters:5,framesPerTrial:2000,trials:9,beforeMedianMs:median(oldTimes),afterMedianMs:median(newTimes),speedup:median(oldTimes)/median(newTimes)},
  exterior,collision:{queries:points.length,boxes:boxes.length,identicalHits:actual,beforeMedianMs:median(collisionTimes.before),afterMedianMs:median(collisionTimes.after),speedup:median(collisionTimes.before)/median(collisionTimes.after)},stability:{warmupBuildDisposeCycles:12,measuredBuildDisposeCycles:48,explicitGc:typeof globalThis.gc==='function',heapBeforeBytes:heapBefore,heapAfterBytes:heapAfter,heapDeltaBytes:heapAfter-heapBefore,postGcHeapSamples:heapSamples},
  browser:{fps:null,gpuMs:null,vramBytes:null,note:'Browser unavailable; mesh submissions are theoretical and buffer bytes are CPU typed arrays, not measured draw calls or VRAM.'}};
const outputIndex=process.argv.indexOf('--output');if(outputIndex>=0)fs.writeFileSync(process.argv[outputIndex+1],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
