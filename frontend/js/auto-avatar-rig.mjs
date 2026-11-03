import {autoAvatarWeights} from './auto-avatar-weights.mjs';
export async function createAutoAvatarRig(wrapper,THREE,height,id){
  const profile=id==='gnomo'?{hips:.30,shoulder:.53,head:.66,armEdge:.15}:id==='android'?{hips:.36,shoulder:.63,head:.72,armEdge:.16}:{};
  const hips=profile.hips||.44,shoulder=profile.shoulder||.73,head=profile.head||.8;
  const bones=[];
  function bone(index,parent,x,y,z){const b=new THREE.Bone();b.name='autoRig_'+index;b.position.set(x,y,z);(parent||wrapper).add(b);bones[index]=b;return b;}
  const root=bone(0,null,0,0,0),spine=bone(1,root,0,hips*height,0);bone(2,spine,0,(head-hips)*height,0);
  for(let side=0;side<2;side++){
    const sign=side?1:-1,hip=bone(3+side,root,sign*.085*height,hips*height,0);bone(5+side,hip,0,-hips*.5*height,0);
    const arm=bone(7+side,spine,sign*.175*height,(shoulder-hips)*height,0);bone(9+side,arm,0,-.16*height,0);
  }
  wrapper.updateMatrixWorld(true);const inverse=wrapper.matrixWorld.clone().invert(),sources=[];
  wrapper.traverse(node=>{if(node.isMesh)sources.push(node);});
  const skeleton=new THREE.Skeleton(bones);
  for(const source of sources){
    const geometry=source.geometry.clone();
    if(source.isSkinnedMesh){
      source.skeleton.update();const position=geometry.attributes.position,point=new THREE.Vector3();
      for(let i=0;i<position.count;i++){point.fromBufferAttribute(position,i);source.applyBoneTransform(i,point);position.setXYZ(i,point.x,point.y,point.z);}
      geometry.computeVertexNormals();
    }
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,source.matrixWorld));
    const p=geometry.attributes.position,indices=new Uint16Array(geometry.attributes.position.count*4),weights=new Float32Array(geometry.attributes.position.count*4);
    for(let i=0;i<p.count;i++){const w=autoAvatarWeights(p.getX(i),p.getY(i),height,profile);indices.set(w.indices,i*4);weights.set(w.weights,i*4);if(i>0&&i%4096===0)await new Promise(resolve=>setTimeout(resolve,0));}
    geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
    const mesh=new THREE.SkinnedMesh(geometry,source.material);mesh.name='animated_'+source.name;mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;wrapper.add(mesh);source.visible=false;
    wrapper.updateMatrixWorld(true);mesh.bind(skeleton);
  }
  return createAutoRigAnimator(wrapper);
}
export function createAutoRigAnimator(wrapper){
  const bones=Array.from({length:11},(_,i)=>wrapper.getObjectByName('autoRig_'+i)),spine=bones[1];
  let time=0;
  return {update(dt,{moving,wave,source=[]}){
    time+=dt;bones.forEach(b=>b.rotation.set(0,0,0));
    spine.rotation.z=Math.sin(time*1.6)*.008;spine.rotation.x=Math.sin(time*1.1)*.008;
    bones[2].rotation.y=Math.sin(time*.8)*.025;
    for(let side=0;side<2;side++){
      const gait=Math.sin(time*8+side*Math.PI);
      bones[3+side].rotation.x=moving?gait*.34:0;bones[5+side].rotation.x=moving?Math.max(0,-gait)*.3:0;
      bones[7+side].rotation.x=moving?-gait*.22:0;bones[9+side].rotation.x=-.07;
      if(source[side]&&Math.abs(source[side][0])>.8){bones[3+side].rotation.x=source[side][0];bones[5+side].rotation.x=source[side+2]?.[0]||0;}
      if(!moving&&source[side+4]){bones[7+side].rotation.set(...source[side+4]);if(source[side+6])bones[9+side].rotation.set(...source[side+6]);}
    }
    if(wave){bones[8].rotation.z=-2.15;bones[10].rotation.x=Math.sin(time*9)*.35;}
  }};
}
