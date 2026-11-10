import {createGpuTimer} from './gpu-timer.mjs';
// Opt in with ?perf=1. No timers, DOM or renderer hooks in production by default.
export function summarizeFrames(samples){
  if(!samples.length)return null;
  const sorted=samples.map(sample=>sample.frame).sort((a,b)=>a-b);
  const mean=key=>samples.reduce((sum,sample)=>sum+sample[key],0)/samples.length;
  const frame=mean('frame');
  return {fps:1000/frame,frameMs:frame,p95Ms:sorted[Math.ceil(sorted.length*.95)-1],cpuMs:mean('cpu'),renderSubmitMs:mean('render')};
}

export function createPerformanceMonitor(renderer,{enabled=false}={}){
  if(!enabled)return {begin(){},renderStart(){},renderEnd(){},end(){},pause(){},dispose(){}};
  const samples=[];let previous=null,start=0,renderStart=0,renderMs=0,lastReport=0,latest=null;
  const gpu=createGpuTimer(renderer),autoReset=renderer.info.autoReset;
  renderer.info.autoReset=false;
  const panel=document.createElement('pre');panel.id='performanceMonitor';
  panel.style.cssText='position:fixed;top:8px;left:8px;z-index:10000;margin:0;padding:10px;background:#07120feb;color:#b9ffda;font:12px/1.5 monospace;pointer-events:none;white-space:pre';
  document.body.append(panel);
  const api={snapshot:()=>latest?structuredClone(latest):null};
  globalThis.homelabPerformance=api;
  return {
    begin(){start=performance.now();renderMs=0;renderer.info.reset();},
    renderStart(){renderStart=performance.now();gpu.begin();},
    renderEnd(){gpu.end();renderMs=performance.now()-renderStart;},
    pause(){previous=null;},
    end(time){
      const cpu=performance.now()-start;
      if(previous!==null){samples.push({frame:time-previous,cpu,render:renderMs});if(samples.length>180)samples.shift();}
      previous=time;
      if(time-lastReport<1000||!samples.length)return;lastReport=time;
      const heap=performance.memory;
      latest={...summarizeFrames(samples),currentFps:1000/samples.at(-1).frame,
        drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
        geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,
        programs:renderer.info.programs?.length||0,pixelRatio:renderer.getPixelRatio(),
        heapBytes:heap?.usedJSHeapSize??null,loadMs:performance.getEntriesByType('measure').find(entry=>entry.name==='homelab-world-load')?.duration??null,
        gpuMs:gpu.poll()};
      panel.textContent=`FPS atual / média: ${latest.currentFps.toFixed(1)} / ${latest.fps.toFixed(1)}\nFrame / p95: ${latest.frameMs.toFixed(1)} / ${latest.p95Ms.toFixed(1)} ms\nCPU JS: ${latest.cpuMs.toFixed(1)} ms | envio WebGL: ${latest.renderSubmitMs.toFixed(1)} ms\nDraw calls: ${latest.drawCalls} | triângulos: ${latest.triangles}\nGeometrias: ${latest.geometries} | texturas: ${latest.textures} | shaders: ${latest.programs}\nPixel ratio: ${latest.pixelRatio.toFixed(2)} | heap JS: ${latest.heapBytes===null?'indisponível':(latest.heapBytes/1048576).toFixed(1)+' MiB'}\nCarga do mundo: ${latest.loadMs===null?'em andamento':(latest.loadMs/1000).toFixed(2)+' s'}\nGPU: ${latest.gpuMs===null?'indisponivel':latest.gpuMs.toFixed(2)+' ms'} | VRAM: indisponivel`;
    },
    dispose(){gpu.dispose();renderer.info.autoReset=autoReset;panel.remove();samples.length=0;if(globalThis.homelabPerformance===api)delete globalThis.homelabPerformance;}
  };
}
