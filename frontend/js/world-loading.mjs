// Track actual Three.js resource batches, including requests started by GLTFLoader.
export function trackWorldAssets(manager,onProgress=()=>{}){
  let busy=false,errors=[],waiters=[];
  const previous={onStart:manager.onStart,onProgress:manager.onProgress,onLoad:manager.onLoad,onError:manager.onError};
  manager.onStart=(...args)=>{busy=true;previous.onStart?.(...args);};
  manager.onProgress=(url,loaded,total)=>{onProgress(loaded,total);previous.onProgress?.(url,loaded,total);};
  manager.onError=url=>{errors.push(url);previous.onError?.(url);};
  manager.onLoad=()=>{busy=false;previous.onLoad?.();for(const resolve of waiters.splice(0))resolve();};
  return {async wait(){
    while(busy)await new Promise(resolve=>waiters.push(resolve));
    if(errors.length)throw new Error('Não foi possível carregar todos os recursos do mundo. Tente novamente.');
  },dispose(){Object.assign(manager,previous);}};
}
