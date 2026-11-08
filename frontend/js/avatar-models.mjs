import {rigidAvatarMotion} from './avatar-rigid-motion.mjs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {findAvatarModel,findModelAnimation} from './avatar-model-catalog.mjs?v=stable-6';
import {applyEquipment,disposeEquipment} from './avatar-equipment.mjs';
const states=new WeakMap(),assets=new Map(),ready=new Map();
function pruneCache(){
  if(ready.size<=3)return;
  for(const [id,asset] of [...ready].sort((a,b)=>a[1].used-b[1].used)){
    if(ready.size<=3)break;if(asset.refs)continue;
    const geometries=new Set(),materials=new Set(),textures=new Set();asset.scene.traverse(node=>{if(node.geometry)geometries.add(node.geometry);for(const material of [].concat(node.material||[])){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());ready.delete(id);assets.delete(id);
  }
}
async function optimizeTextures(scene){
  const textures=new Set();scene.traverse(node=>{for(const material of [].concat(node.material||[]))for(const value of Object.values(material))if(value?.isTexture)textures.add(value);});
  const resized=new Map(),limit=matchMedia('(max-width:700px)').matches?768:1024;
  for(const texture of textures){
    const image=texture.image;if(!image?.width||!image?.height)continue;
    if(Math.max(image.width,image.height)>limit){
      let canvas=resized.get(image);
      if(!canvas){canvas=document.createElement('canvas');const scale=limit/Math.max(image.width,image.height);canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);resized.set(image,canvas);}
      texture.image=canvas;texture.needsUpdate=true;
    }
    texture.anisotropy=Math.min(texture.anisotropy||1,2);await new Promise(resolve=>setTimeout(resolve,0));
  }
  for(const image of resized.keys())image.close?.();
}
function loadAsset(definition,THREE){
  if(!assets.has(definition.id))assets.set(definition.id,(async()=>{
    const gltf=await new GLTFLoader().loadAsync(new URL('../assets/personagens/'+definition.file,import.meta.url).href);
    await optimizeTextures(gltf.scene);
    const scene=new THREE.Group(),model=gltf.scene;scene.add(model);
    const mixer=new THREE.AnimationMixer(model),idle=findModelAnimation(gltf.animations,'Idle');if(idle)mixer.clipAction(idle).play();mixer.update(0);model.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(model),height=bounds.max.y-bounds.min.y;if(!Number.isFinite(height)||height<=0)throw new Error('Altura invalida: '+definition.label);
    const scale=definition.height/height;model.scale.multiplyScalar(scale);model.position.set(-(bounds.min.x+bounds.max.x)*.5*scale,-bounds.min.y*scale,-(bounds.min.z+bounds.max.z)*.5*scale);
    const rigidMotion=!gltf.animations.length;
    scene.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=false;}});
    mixer.stopAllAction();mixer.uncacheRoot(model);
    const asset={scene,animations:gltf.animations,rigidMotion,refs:0,used:performance.now()};ready.set(definition.id,asset);return asset;
  })().catch(error=>{assets.delete(definition.id);throw error;}));
  return assets.get(definition.id);
}
function release(entry){
  entry.mixer.stopAllAction();entry.mixer.uncacheRoot(entry.wrapper);entry.wrapper.removeFromParent();
  const skeletons=new Set();entry.wrapper.traverse(node=>{if(node.skeleton)skeletons.add(node.skeleton);});skeletons.forEach(s=>s.dispose());entry.asset.refs--;pruneCache();
}
function show(root,state,id){
  const entry=state.entries.get(id);if(!entry)return;
  for(const node of root.children){if(node.userData.importedAvatar||node.isSprite)continue;if(!state.base.has(node))state.base.set(node,node.visible);node.visible=false;}
  for(const [key,value] of state.entries)if(key!==id){release(value);state.entries.delete(key);}
  entry.wrapper.visible=true;state.current=id;state.previous.copy(root.position);
}
export function applyAvatarModel(root,config,THREE){
  let state=states.get(root);if(!state){state={desired:'default',base:new Map(),entries:new Map(),pending:new Set(),failed:new Set(),current:null,previous:new THREE.Vector3()};states.set(root,state);}
  state.config=config;
  const definition=findAvatarModel(config.model);state.desired=definition?.file?definition.id:'default';
  if(state.desired==='default'){
    for(const entry of state.entries.values())release(entry);state.entries.clear();
    for(const [node,visible] of state.base)node.visible=visible;state.base.clear();state.current=null;return false;
  }
  if(state.entries.has(state.desired)){if(state.current!==state.desired)show(root,state,state.desired);return true;}
  const id=state.desired;
  if(!state.pending.has(id)&&!state.failed.has(id)){
    state.pending.add(id);root.userData.avatarModelError=null;
    void loadAsset(definition,THREE).then(asset=>{
      state.pending.delete(id);if(state.disposed||state.desired!==id){pruneCache();return;}
      const wrapper=clone(asset.scene);wrapper.name='importedAvatar_'+id;wrapper.userData.importedAvatar=true;wrapper.visible=false;asset.refs++;asset.used=performance.now();root.add(wrapper);
      const mixer=new THREE.AnimationMixer(wrapper),actions={};for(const key of ['Idle','Walk','Wave']){const clip=findModelAnimation(asset.animations,key);if(clip)actions[key]=mixer.clipAction(clip);}
      actions.Idle?.play();
      state.entries.set(id,{wrapper,mixer,actions,asset,current:'Idle',accumulated:0,motionTime:0});show(root,state,id);applyEquipment(root,state.config,THREE);pruneCache();globalThis.dispatchEvent(new Event('avatar-texture-ready'));
    }).catch(error=>{state.pending.delete(id);state.failed.add(id);root.userData.avatarModelError='Nao foi possivel carregar '+definition.label+'.';console.error(error);globalThis.dispatchEvent(new Event('avatar-texture-ready'));});
  }
  return true;
}
export function avatarModelIsAnimated(root){const state=states.get(root),entry=state?.entries.get(state.current);return Boolean(entry?.wrapper.visible&&(entry.asset.rigidMotion||Object.keys(entry.actions).length));}
export async function waitForAvatarModel(root){
  const state=states.get(root);if(!state||state.desired==='default')return;
  const pending=assets.get(state.desired);if(pending)await pending;
  if(state.failed.has(state.desired)||!state.entries.has(state.desired))throw new Error('Não foi possível preparar seu avatar.');
}
export function disposeAvatarModel(root){disposeEquipment(root);const state=states.get(root);if(!state)return;state.disposed=true;for(const entry of state.entries.values())release(entry);state.entries.clear();states.delete(root);}
export function updateAvatarModel(root,dt,{preview=false}={}){
  const state=states.get(root),entry=state?.entries.get(state.current);if(!entry?.wrapper.visible)return;
  if(!root.visible){state.previous.copy(root.position);return;}
  entry.accumulated+=Math.min(dt,.1);if(entry.accumulated<1/30)return;const elapsed=entry.accumulated;entry.accumulated=0;
  const distance=root.position.distanceTo(state.previous);state.previous.copy(root.position);
  const moving=!preview&&distance/elapsed>.12,wave=root.userData.waveUntil>performance.now()||root.getObjectByName('networkJoint5')?.rotation.z< -1.8;
  const wanted=!preview&&wave?'Wave':moving?'Walk':'Idle',key=entry.actions[wanted]?wanted:'Idle';
  if(entry.current!==key&&entry.actions[key]){entry.actions[entry.current]?.fadeOut(.16);entry.actions[key].reset().fadeIn(.16).play();entry.current=key;}
  entry.mixer.update(elapsed);
  if(entry.asset.rigidMotion){entry.motionTime+=elapsed;const motion=rigidAvatarMotion(entry.motionTime,moving);entry.wrapper.position.y=motion.y;entry.wrapper.rotation.z=motion.z;}
}
