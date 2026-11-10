
// One-off thumbnails reuse the game's renderer. No extra WebGL contexts or animation loop.
export function createAvatarPortraits({THREE,renderer,getCharacter}){
  const cache=new Map(),pending=new Map();
  const target=new THREE.WebGLRenderTarget(96,96);target.texture.colorSpace=THREE.SRGBColorSpace;
  let disposed=false;
  function capture(member){
    const source=getCharacter(member);if(!source)return null;
    const visual=(source.getObjectByName('onlineAvatarHead')||source).clone(true);
    visual.position.set(0,0,0);visual.rotation.set(0,0,0);visual.visible=true;
    const sprites=[];visual.traverse(node=>{if(node.isSprite)sprites.push(node);});sprites.forEach(node=>node.removeFromParent());
    const scene=new THREE.Scene();scene.add(visual);
    scene.add(new THREE.HemisphereLight('#f0f9ff','#65878a',2.5));
    const light=new THREE.DirectionalLight('#fff2e5',2.8);light.position.set(-2,3,4);scene.add(light);
    const bounds=new THREE.Box3().setFromObject(visual),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
    const frame=Math.max(size.y,size.x)*1.12;
    const camera=new THREE.PerspectiveCamera(30,1,.01,30);
    camera.position.set(center.x,center.y,center.z+frame/(2*Math.tan(Math.PI/12)));camera.lookAt(center);
    const oldTarget=renderer.getRenderTarget(),oldClear=renderer.getClearColor(new THREE.Color()),oldAlpha=renderer.getClearAlpha();
    const oldShadow=renderer.shadowMap.enabled,oldExposure=renderer.toneMappingExposure,oldAutoClear=renderer.autoClear;
    try{
      renderer.shadowMap.enabled=false;renderer.toneMappingExposure=1.2;renderer.autoClear=true;
      renderer.setRenderTarget(target);renderer.setClearColor(0x000000,0);renderer.render(scene,camera);
      const bytes=new Uint8Array(96*96*4);renderer.readRenderTargetPixels(target,0,0,96,96,bytes);
      const canvas=document.createElement('canvas');canvas.width=canvas.height=96;
      const context=canvas.getContext('2d'),pixels=context.createImageData(96,96);
      for(let row=0;row<96;row++)pixels.data.set(bytes.subarray((95-row)*384,(96-row)*384),row*384);
      context.putImageData(pixels,0,0);return canvas.toDataURL('image/png');
    }finally{
      renderer.setRenderTarget(oldTarget);renderer.setClearColor(oldClear,oldAlpha);
      renderer.shadowMap.enabled=oldShadow;renderer.toneMappingExposure=oldExposure;renderer.autoClear=oldAutoClear;
    }
  }
  return {
    get(member){
      if(disposed)return Promise.resolve(null);
      const key=JSON.stringify(member.avatar||{});
      if(cache.has(key))return Promise.resolve(cache.get(key));
      if(!pending.has(key)){
        let complete;
        const job={promise:new Promise(resolve=>{complete=resolve;}),resolve:value=>complete(value),frame:null};
        pending.set(key,job);
        job.frame=requestAnimationFrame(()=>{
          let portrait=null;
          try{if(!disposed)portrait=capture(member);}catch(error){console.warn('Retrato indisponível:',error);}
          if(portrait){cache.set(key,portrait);if(cache.size>24)cache.delete(cache.keys().next().value);}
          pending.delete(key);job.resolve(portrait);
        });
      }
      return pending.get(key).promise;
    },
    dispose(){
      if(disposed)return;
      disposed=true;
      for(const job of pending.values()){cancelAnimationFrame(job.frame);job.resolve(null);}
      pending.clear();target.dispose();cache.clear();
    }
  };
}
