import {createLegacyTypingPose} from '../tools/legacy-typing-reference.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createPrimitivePool,disposePrivateGeometry} from '../frontend/js/primitive-pool.mjs';
import {instanceStaticDecoration} from '../frontend/js/repeated-meshes.mjs';
import {createTypingPoseSolver} from '../frontend/js/npc-typing-pose.mjs';
import {disposeAvatarAppearance} from '../frontend/js/avatar-appearance.mjs';
import {createAvatarEditorPreview} from '../frontend/js/avatar-editor-preview.mjs';
import {exteriorFixture,sceneMetrics,typingFixture} from '../tools/performance-fixtures.mjs';

test('pool preserva todos os vertices e indices e limita geometria compartilhada',()=>{
  const pool=createPrimitivePool(THREE,RoundedBoxGeometry,{limit:3});
  const variants=[[pool.box(1,2,3),new THREE.BoxGeometry(1,2,3)],[pool.box(1,2,3,.04),new RoundedBoxGeometry(1,2,3,2,.04)],[pool.sphere(.2),new THREE.SphereGeometry(.2,18,12)]];
  for(const [actual,expected] of variants){for(const key of Object.keys(expected.attributes))assert.deepEqual(actual.attributes[key].array,expected.attributes[key].array);assert.deepEqual(actual.index?.array,expected.index?.array);expected.dispose();}
  assert.equal(pool.box(1,2,3),variants[0][0]);assert.equal(pool.stats().cached,3);
  const outside=pool.cylinder(.2,.3);assert.equal(outside.userData.sharedPrimitive,undefined);
  let freed=0;variants[0][0].addEventListener('dispose',()=>freed++);
  disposePrivateGeometry(variants[0][0]);assert.equal(freed,0);
  pool.dispose();assert.equal(freed,1);assert.equal(pool.stats().cached,0);outside.dispose();
});

test('instancias preservam sombras, raycast e culling e nao agrupam materiais transparentes',()=>{
  const root=new THREE.Group(),geometry=new THREE.BoxGeometry(1,1,1),material=new THREE.MeshStandardMaterial();
  for(let i=0;i<4;i++){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(i,0,0);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
  const transparent=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({transparent:true,opacity:.6}));root.add(transparent);
  root.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(1,0,5),new THREE.Vector3(0,0,-1));
  const distance=ray.intersectObject(root,true)[0].distance;
  const result=instanceStaticDecoration(THREE,root);assert.equal(result.removed,3);
  root.updateMatrixWorld(true);assert.equal(ray.intersectObject(root,true)[0].distance,distance);
  const batch=root.children.find(mesh=>mesh.isInstancedMesh);
  assert.ok(batch.castShadow&&batch.receiveShadow&&batch.frustumCulled);assert.ok(batch.boundingSphere.radius>1.5);assert.equal(transparent.parent,root);
  batch.dispose();geometry.dispose();material.dispose();transparent.material.dispose();
});

test('exterior otimizado mantem triangulos, materiais, colisoes, telhado e trafego',()=>{
  const before=exteriorFixture({pooled:false,batch:false}),after=exteriorFixture();
  try{
    const a=sceneMetrics(before.scene),b=sceneMetrics(after.scene);
    assert.equal(a.triangles,b.triangles);assert.equal(a.uniqueMaterials,b.uniqueMaterials);
    assert.ok(b.uniqueGeometries<a.uniqueGeometries*.2);assert.ok(b.meshSubmissionsIfAllVisible<a.meshSubmissionsIfAllVisible);
    assert.deepEqual(before.exterior.colliders.map(box=>[box.min.toArray(),box.max.toArray()]),after.exterior.colliders.map(box=>[box.min.toArray(),box.max.toArray()]));
    const cars=world=>world.scene.getObjectByName('Carros nas ruas').children.map(car=>[car.position.toArray(),car.rotation.toArray()]);
    before.exterior.updateTraffic(.5);after.exterior.updateTraffic(.5);assert.deepEqual(cars(before),cars(after));
    after.exterior.roof.visible=false;assert.equal(after.exterior.roof.visible,false);
  }finally{before.dispose();after.dispose();}
});

test('solver sem alocacoes preserva as poses do solver anterior em diferentes transformacoes',()=>{
  const old=createLegacyTypingPose(THREE);
  let allocations=0;class Vector extends THREE.Vector3{constructor(...args){super(...args);allocations++;}}
  const fast=createTypingPoseSolver({...THREE,Vector3:Vector}),allocated=allocations;
  const a=typingFixture(),b=typingFixture();
  for(let frame=0;frame<120;frame++)for(let i=0;i<a.npcs.length;i++){
    const x=a.npcs[i],y=b.npcs[i];x.root.rotation.y=y.root.rotation.y=frame*.013;
    old(x,a.station,frame*16.67);fast(y,b.station,frame*16.67);
    for(let arm=0;arm<2;arm++){assert.ok(x.arms[arm].quaternion.angleTo(y.arms[arm].quaternion)<1e-6);assert.ok(x.forearms[arm].quaternion.angleTo(y.forearms[arm].quaternion)<1e-6);}
  }
  assert.equal(allocations,allocated);
});

test('descarte do avatar libera recursos privados uma vez e preserva template e texturas',()=>{
  const root=new THREE.Group(),templateGeometry=new THREE.BoxGeometry(),texture=new THREE.Texture(),templateMaterial=new THREE.MeshStandardMaterial({map:texture});
  const body=new THREE.Mesh(templateGeometry.clone(),templateMaterial.clone());body.userData={avatarOwnMaterial:true,bodyBasePositions:[0]};root.add(body);
  const counters={private:0,shared:0};
  for(const resource of [body.geometry,body.material])resource.addEventListener('dispose',()=>counters.private++);
  for(const resource of [templateGeometry,templateMaterial,texture])resource.addEventListener('dispose',()=>counters.shared++);
  for(const name of ['customAvatarHair','customAvatarClothes']){const group=new THREE.Group();group.name=name;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshStandardMaterial({map:texture}));for(const resource of [mesh.geometry,mesh.material])resource.addEventListener('dispose',()=>counters.private++);group.add(mesh);root.add(group);}
  disposeAvatarAppearance(root);disposeAvatarAppearance(root);assert.equal(counters.private,6);assert.equal(counters.shared,0);
  templateGeometry.dispose();templateMaterial.dispose();texture.dispose();
});

test('previa descarta template proprio e preserva recursos emprestados do mundo',()=>{
  const previous={document:globalThis.document,ResizeObserver:globalThis.ResizeObserver,addEventListener:globalThis.addEventListener,removeEventListener:globalThis.removeEventListener};
  globalThis.document={addEventListener(){},removeEventListener(){}};
  globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.addEventListener=()=>{};globalThis.removeEventListener=()=>{};
  try{
    for(const ownsTemplate of [false,true]){
      const template=new THREE.Group(),geometry=new THREE.BoxGeometry(),texture=new THREE.Texture(),material=new THREE.MeshStandardMaterial({map:texture});template.add(new THREE.Mesh(geometry,material));
      let disposed=0;for(const resource of [geometry,material,texture])resource.addEventListener('dispose',()=>disposed++);
      const preview=createAvatarEditorPreview({container:{},THREE,template,applyAppearance(){},ownsTemplate});preview.dispose();preview.dispose();assert.equal(disposed,ownsTemplate?3:0);
      if(!ownsTemplate){geometry.dispose();material.dispose();texture.dispose();}
    }
  }finally{Object.assign(globalThis,previous);}
});
