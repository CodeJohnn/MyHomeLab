import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {selectOfficeClip,validateOfficeClips,requiredOfficeClips} from './office-character-state.mjs';

// This controller replaces only the visual layer, never the gameplay root.
export function createOfficeCharacterLoader(THREE){
  const assets=new Map();
  const loader=new GLTFLoader();
  async function prepare(url){
    if(!assets.has(url))assets.set(url,loader.loadAsync(url).then(gltf=>{
      validateOfficeClips(gltf.animations);
      let skinned=false;gltf.scene.traverse(node=>{if(node.isSkinnedMesh)skinned=true;});
      if(!skinned)throw new Error('O personagem precisa de uma malha com esqueleto.');
      return gltf;
    }).catch(error=>{assets.delete(url);throw error;}));
    return assets.get(url);
  }
  async function attach(root,{url,height=1.8,seatOffset=0,visualNodes=[]}){
    const gltf=await prepare(url),visual=clone(gltf.scene);
    const bounds=new THREE.Box3().setFromObject(visual),size=bounds.max.y-bounds.min.y;
    if(!Number.isFinite(size)||size<=0)throw new Error('Dimensões inválidas do personagem.');
    const scale=height/size;
    const wrapper=new THREE.Group();wrapper.name='OfficeCharacterVisual';
    visual.scale.multiplyScalar(scale);
    visual.position.set(-(bounds.min.x+bounds.max.x)*scale/2,-bounds.min.y*scale,-(bounds.min.z+bounds.max.z)*scale/2);
    wrapper.add(visual);root.add(wrapper);
    const mixer=new THREE.AnimationMixer(visual),actions={};
    for(const name of requiredOfficeClips)actions[name]=mixer.clipAction(gltf.animations.find(clip=>clip.name===name));
    let current='Idle',disposed=false;
    actions.Idle.play();
    const saved=visualNodes.map(node=>({node,visible:node.visible}));
    saved.forEach(({node})=>{node.visible=false;});
    return {
      visual:wrapper,
      update(dt,state={}){
        if(disposed)return;
        const next=selectOfficeClip(state);
        if(next!==current){actions[next].reset().play();actions[next].crossFadeFrom(actions[current],.2,false);current=next;}
        const seated=current==='Sit'||current==='Typing';
        wrapper.position.y=seated?seatOffset:0;
        mixer.update(Math.min(Math.max(dt,0),.1));
      },
      dispose(){
        if(disposed)return;disposed=true;mixer.stopAllAction();mixer.uncacheRoot(visual);wrapper.removeFromParent();
        const skeletons=new Set();visual.traverse(node=>{if(node.skeleton)skeletons.add(node.skeleton);});
        skeletons.forEach(skeleton=>skeleton.dispose());saved.forEach(({node,visible})=>{node.visible=visible;});
      }
    };
  }
  return {prepare,attach,dispose(){
    // Call only after disposing all attached instances.
    for(const promise of assets.values())promise.then(gltf=>{
      const geometries=new Set(),materials=new Set(),textures=new Set();
      gltf.scene.traverse(node=>{if(node.geometry)geometries.add(node.geometry);for(const material of [].concat(node.material||[])){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}});
      geometries.forEach(value=>value.dispose());materials.forEach(value=>value.dispose());textures.forEach(value=>value.dispose());
    }).catch(()=>{});
    assets.clear();
  }};
}
