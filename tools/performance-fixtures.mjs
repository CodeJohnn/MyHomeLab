import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createHouseExterior} from '../frontend/js/house-exterior.mjs';
import {createPrimitivePool} from '../frontend/js/primitive-pool.mjs';

export function exteriorFixture({pooled=true,batch=true}={}){
  const scene=new THREE.Scene(),pool=pooled?createPrimitivePool(THREE,RoundedBoxGeometry):null;
  const mesh=(parent,geometry,material,x,y,z,receive=false)=>{
    const part=new THREE.Mesh(geometry,material);part.position.set(x,y,z);part.castShadow=true;part.receiveShadow=receive;parent.add(part);return part;
  };
  const box=(parent,w,h,d,material,x=0,y=0,z=0,r=0)=>mesh(parent,pool?pool.box(w,h,d,r):r?new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/2-.001,h/2-.001,d/2-.001)):new THREE.BoxGeometry(w,h,d),material,x,y,z,true);
  const cyl=(parent,r,h,material,x,y,z,segments=24)=>mesh(parent,pool?pool.cylinder(r,h,segments):new THREE.CylinderGeometry(r,r,h,segments),material,x,y,z);
  const sphere=(parent,r,material,x,y,z)=>mesh(parent,pool?pool.sphere(r):new THREE.SphereGeometry(r,18,12),material,x,y,z);
  const M=(color,metalness=0,roughness=.72)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
  const exterior=createHouseExterior({THREE,scene,box,cyl,sphere,M,optimizeDecoration:batch});
  return {scene,exterior,pool,dispose(){
    const geometries=new Set(),materials=new Set();scene.traverse(node=>{if(node.geometry)geometries.add(node.geometry);if(node.material)materials.add(node.material);if(node.isInstancedMesh)node.dispose();});
    for(const geometry of geometries)if(!geometry.userData.sharedPrimitive)geometry.dispose();pool?.dispose();for(const material of materials)material.dispose();scene.clear();
  }};
}

export function sceneMetrics(scene){
  const geometries=new Set(),materials=new Set(),buffers=new Set();let meshes=0,triangles=0,bufferBytes=0;
  function buffer(array){if(!buffers.has(array.buffer)){buffers.add(array.buffer);bufferBytes+=array.buffer.byteLength;}}
  scene.traverse(node=>{
    if(!node.isMesh)return;meshes++;geometries.add(node.geometry);materials.add(node.material);
    triangles+=(node.geometry.index?.count||node.geometry.attributes.position.count)/3*(node.isInstancedMesh?node.count:1);
    if(node.isInstancedMesh)buffer(node.instanceMatrix.array);
  });
  for(const geometry of geometries){for(const attribute of Object.values(geometry.attributes))buffer(attribute.array);if(geometry.index)buffer(geometry.index.array);}
  return {meshSubmissionsIfAllVisible:meshes,triangles,uniqueGeometries:geometries.size,uniqueMaterials:materials.size,geometryAndInstanceBufferBytes:bufferBytes};
}

export function typingFixture(count=5){
  const station=new THREE.Group(),keyboard=new THREE.Group();station.position.set(1,.8,-.3);station.rotation.y=.3;keyboard.position.set(.1,.3,.2);station.add(keyboard);
  const npcs=[];
  for(let n=0;n<count;n++){
    const root=new THREE.Group();root.position.set(n*.1,.1,1);root.rotation.y=.15;
    const arms=[],forearms=[];
    for(let i=0;i<2;i++){const arm=new THREE.Group(),elbow=new THREE.Group();arm.position.set((i?1:-1)*.184,1.2,0);elbow.position.y=-.22;root.add(arm);arm.add(elbow);arms.push(arm);forearms.push(elbow);}
    npcs.push({root,arms,forearms});
  }
  return {npcs,station:{userData:{keyboard}}};
}
