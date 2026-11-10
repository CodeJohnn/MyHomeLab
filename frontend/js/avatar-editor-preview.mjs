import {updateEquipment,hasEquippedHands,disposeEquipment} from './avatar-equipment.mjs';
import {disposeAvatarAppearance} from './avatar-appearance.mjs';
export function createAvatarEditorPreview({container,THREE,template,applyAppearance,ownsTemplate=false}){
  const ownedGeometries=new Set(),ownedMaterials=new Set(),ownedTextures=new Set();
  if(ownsTemplate)template.traverse(node=>{if(node.geometry)ownedGeometries.add(node.geometry);for(const material of [].concat(node.material||[])){ownedMaterials.add(material);for(const value of Object.values(material))if(value?.isTexture)ownedTextures.add(value);}});
  const scene=new THREE.Scene(),model=template.clone(true);
  model.position.set(0,0,0);model.rotation.set(0,-.2,0);model.visible=true;scene.add(model);
  scene.add(new THREE.HemisphereLight('#edf8ff','#788b80',2.8));
  const key=new THREE.DirectionalLight('#fff0de',3);key.position.set(3,5,4);scene.add(key);
  const fill=new THREE.DirectionalLight('#b2d8ec',1.5);fill.position.set(-3,2,-2);scene.add(fill);
  const camera=new THREE.PerspectiveCamera(35,1,.05,20);camera.position.set(0,1.05,3.65);camera.lookAt(0,.94,0);
  let renderer=null,visible=false,drag=null,lastConfig=null,frame=null,lastTime=0,lastWidth=0,lastHeight=0,disposed=false,needsFit=true;
  function render(){
    if(disposed||!visible||!renderer||document.hidden)return;
    const rect=container.getBoundingClientRect();if(rect.width<1||rect.height<1)return;
    const width=Math.round(rect.width),height=Math.round(rect.height);
    if(width!==lastWidth||height!==lastHeight){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();lastWidth=width;lastHeight=height;needsFit=true;}
    const now=performance.now();if(lastTime&&now-lastTime<33&&!drag){requestRender();return;}
    updateEquipment(model,now);lastTime=now;
    if(needsFit){
      model.updateWorldMatrix(true,true);const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
      const tangent=Math.tan(camera.fov*Math.PI/360),distance=Math.max(2.8,size.y*1.16/(2*tangent),Math.max(size.x,size.z)*1.16/(2*tangent*camera.aspect));
      camera.position.set(center.x,center.y+.08,center.z+distance);camera.lookAt(center);needsFit=false;
    }
    renderer.render(scene,camera);if(hasEquippedHands(model))requestRender();
  }
  function requestRender(){if(frame!==null||disposed||!visible||document.hidden)return;frame=requestAnimationFrame(()=>{frame=null;render();});}
  function initialize(){
    if(renderer)return;
    try{
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));
      renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
      renderer.domElement.setAttribute('aria-label','Previa 3D do seu avatar. Arraste para girar.');renderer.domElement.style.cssText='width:100%;height:100%;display:block;touch-action:none;cursor:grab';container.append(renderer.domElement);
      const canvas=renderer.domElement;
      canvas.addEventListener('pointerdown',event=>{drag={id:event.pointerId,x:event.clientX};canvas.setPointerCapture(event.pointerId);});
      canvas.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;model.rotation.y+=(event.clientX-drag.x)*.012;drag.x=event.clientX;requestRender();});
      const end=()=>{drag=null;};for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,end);
    }catch{
      container.textContent='A previa 3D nao esta disponivel neste navegador. Suas escolhas continuam funcionando.';
      container.classList.add('avatarPreviewUnavailable');
    }
  }
  const assetReady=()=>{needsFit=true;requestRender();};
  globalThis.addEventListener('avatar-texture-ready',assetReady);
  document.addEventListener('visibilitychange',requestRender);
  const observer=new ResizeObserver(requestRender);observer.observe(container);
  return {
    update(config){lastConfig=config;applyAppearance(model,config,THREE);needsFit=true;requestRender();},
    setVisible(value){visible=value;lastTime=0;if(!value&&frame!==null){cancelAnimationFrame(frame);frame=null;}if(value){initialize();if(lastConfig)applyAppearance(model,lastConfig,THREE);requestRender();}},
    turn(angle){model.rotation.y=angle;requestRender();},
    dispose(){if(disposed)return;disposed=true;disposeEquipment(model);document.removeEventListener('visibilitychange',requestRender);globalThis.removeEventListener('avatar-texture-ready',assetReady);visible=false;observer.disconnect();if(frame!==null)cancelAnimationFrame(frame);disposeAvatarAppearance(model);ownedGeometries.forEach(geometry=>geometry.dispose());ownedMaterials.forEach(material=>material.dispose());ownedTextures.forEach(texture=>texture.dispose());ownedGeometries.clear();ownedMaterials.clear();ownedTextures.clear();renderer?.dispose();renderer?.forceContextLoss();}
  };
}
