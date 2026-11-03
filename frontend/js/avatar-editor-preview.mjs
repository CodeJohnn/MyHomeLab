import {updateAvatarModel,avatarModelIsAnimated,disposeAvatarModel} from './avatar-models.mjs?v=stable-6';
export function createAvatarEditorPreview({container,THREE,template,applyAppearance}){
  const scene=new THREE.Scene(),model=template.clone(true);
  model.position.set(0,0,0);model.rotation.set(0,-.2,0);model.visible=true;scene.add(model);
  scene.add(new THREE.HemisphereLight('#edf8ff','#788b80',2.8));
  const key=new THREE.DirectionalLight('#fff0de',3);key.position.set(3,5,4);scene.add(key);
  const fill=new THREE.DirectionalLight('#b2d8ec',1.5);fill.position.set(-3,2,-2);scene.add(fill);
  const camera=new THREE.PerspectiveCamera(35,1,.05,20);camera.position.set(0,1.05,3.65);camera.lookAt(0,.94,0);
  let renderer=null,visible=false,drag=null,lastConfig=null,frame=null,lastTime=0,lastWidth=0,lastHeight=0,disposed=false;
  function render(){
    if(disposed||!visible||!renderer||document.hidden)return;
    const rect=container.getBoundingClientRect();if(rect.width<1||rect.height<1)return;
    const width=Math.round(rect.width),height=Math.round(rect.height);
    if(width!==lastWidth||height!==lastHeight){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();lastWidth=width;lastHeight=height;}
    const now=performance.now();if(lastTime&&now-lastTime<33&&!drag){requestRender();return;}
    updateAvatarModel(model,lastTime?Math.min((now-lastTime)/1000,.1):.016,{preview:true});lastTime=now;
    renderer.render(scene,camera);if(avatarModelIsAnimated(model))requestRender();
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
  globalThis.addEventListener('avatar-texture-ready',requestRender);
  document.addEventListener('visibilitychange',requestRender);
  const observer=new ResizeObserver(requestRender);observer.observe(container);
  return {
    update(config){lastConfig=config;applyAppearance(model,config,THREE);requestRender();},
    setVisible(value){visible=value;lastTime=0;if(!value&&frame!==null){cancelAnimationFrame(frame);frame=null;}if(value){initialize();if(lastConfig)applyAppearance(model,lastConfig,THREE);requestRender();}},
    turn(angle){model.rotation.y=angle;requestRender();},
    dispose(){disposed=true;disposeAvatarModel(model);document.removeEventListener('visibilitychange',requestRender);globalThis.removeEventListener('avatar-texture-ready',requestRender);visible=false;observer.disconnect();if(frame!==null)cancelAnimationFrame(frame);model.traverse(node=>{if(node.userData.avatarOwnMaterial)node.material?.dispose();});renderer?.dispose();}
  };
}
