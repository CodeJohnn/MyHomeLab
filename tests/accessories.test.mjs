import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {accessoryCatalog,validateEquipment,equipAccessory} from '../frontend/js/accessory-catalog.mjs';
import {createAccessoryVisual,accessoryPoolSize} from '../frontend/js/accessory-models.mjs';
import {applyEquipment,disposeEquipment,updateEquipment,solveElbow} from '../frontend/js/avatar-equipment.mjs';
import {defaultAvatar,validateAvatar} from '../backend/avatar.mjs';
import {createServer} from '../backend/server.mjs';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {avatarModels} from '../frontend/js/avatar-model-catalog.mjs';

function avatarRig(){
  const root=new THREE.Group(),head=new THREE.Group();head.name='onlineAvatarHead';head.position.y=1.6;head.scale.setScalar(1.48);root.add(head);
  const skull=new THREE.Mesh(new THREE.SphereGeometry(.18,12,8),new THREE.MeshBasicMaterial());head.add(skull);
  for(let i=0;i<2;i++){
    const arm=new THREE.Group();arm.name='networkJoint'+(4+i);arm.position.set((i?1:-1)*.275,1.22,0);root.add(arm);
    const elbow=new THREE.Group();elbow.name='networkJoint'+(6+i);elbow.position.y=-.28;arm.add(elbow);
  }
  root.updateMatrixWorld(true);return root;
}

test('26 acessórios completos têm geometria finita, orçamento limitado e pool liberado',()=>{
  assert.equal(accessoryCatalog.length,26);assert.equal(new Set(accessoryCatalog.map(item=>item.id)).size,26);
  for(const item of accessoryCatalog){
    const a=createAccessoryVisual(THREE,item.id,item.color),b=createAccessoryVisual(THREE,item.id,item.color);
    let triangles=0;const geometries=[];
    a.visual.traverse(node=>{
      if(!node.geometry)return;geometries.push(node.geometry);const p=node.geometry.attributes.position,n=node.geometry.attributes.normal;
      assert.ok(p.array.every(Number.isFinite),item.id);assert.ok(n.array.every(Number.isFinite),item.id);triangles+=p.count/3;
    });
    assert.ok(triangles>50&&triangles<3500,item.id+' polygon budget');assert.ok(a.visual.children.length<=7);
    assert.equal(a.visual.children[0].geometry,b.visual.children[0].geometry);assert.equal(a.visual.children[0].material,b.visual.children[0].material);
    let disposals=0;geometries[0].addEventListener('dispose',()=>disposals++);
    a.release();assert.equal(disposals,0);b.release();assert.equal(disposals,1);b.release();assert.equal(disposals,1);
  }
  assert.equal(accessoryPoolSize(),0);
});

test('slots, cores, conflitos e avatares legados são validados',()=>{
  assert.deepEqual(validateEquipment(undefined),{});assert.equal(validateEquipment({Head:{id:'phone'}}),null);
  assert.equal(validateEquipment({Face:{id:'optical',color:'red'}}),null);assert.equal(validateEquipment({unknown:{id:'cap'}}),null);
  assert.equal(validateEquipment({RightHand:{id:'phone',geometry:[1,2,3]}}),null);
  let equipment=equipAccessory({},'cap');equipment=equipAccessory(equipment,'headset');equipment=equipAccessory(equipment,'school_bag');
  assert.ok(equipment.Head&&equipment.Ears&&equipment.Back);
  const wideHat=equipAccessory(equipment,'fedora');assert.ok(!wideHat.Ears);
  assert.equal(validateEquipment({...wideHat,Ears:{id:'headset'}}),null);
  assert.ok(equipAccessory(equipAccessory({},'sunglasses'),'mask').FaceDetail);
  equipment=equipAccessory(equipment,'crossbody');assert.ok(equipment.Shoulder);assert.ok(!equipment.Back);
  equipment=equipAccessory(equipment,'coffee','LeftHand');equipment=equipAccessory(equipment,'phone','RightHand');assert.ok(equipment.LeftHand&&equipment.RightHand);
  equipment=equipAccessory(equipment,'laptop_open');assert.ok(!equipment.LeftHand);assert.equal(equipment.RightHand.id,'laptop_open');
  assert.equal(validateEquipment({...equipment,LeftHand:{id:'coffee'}}),null);
  const legacy={...defaultAvatar};delete legacy.accessories;assert.deepEqual(validateAvatar(legacy).accessories,{});
  assert.equal(validateAvatar({...defaultAvatar,accessories:{Head:{id:'cap'}},hat:'beanie'}).hat,'none');
  assert.equal(validateAvatar({...defaultAvatar,accessories:{Face:{id:'optical'}},glasses:true}).glasses,false);
  assert.equal(validateAvatar({...defaultAvatar,model:'android',accessories:{RightHand:{id:'phone'}}}),null);
});

test('acessórios acompanham cabeça e mãos sem alterar o movimento do avatar',()=>{
  const root=avatarRig(),config={...defaultAvatar,accessories:equipAccessory(equipAccessory({},'headset'),'coffee','RightHand')};
  applyEquipment(root,config,THREE);const headMount=root.getObjectByName('equipment:Ears'),handMount=root.getObjectByName('equipment:RightHand');
  assert.equal(headMount.parent.name,'onlineAvatarHead');assert.equal(handMount.parent.name,'networkJoint7');
  root.position.set(3,0,2);root.rotation.y=.8;const position=root.position.clone(),rotation=root.quaternion.clone();
  updateEquipment(root,1000);root.updateMatrixWorld(true);
  assert.deepEqual(root.position,position);assert.ok(root.quaternion.equals(rotation));
  const hand=handMount.getWorldPosition(new THREE.Vector3());assert.ok(hand.toArray().every(Number.isFinite));
  assert.ok(hand.distanceTo(root.localToWorld(new THREE.Vector3(.24,1.06,.29)))<.04);
  const a=headMount.getWorldPosition(new THREE.Vector3());root.getObjectByName('onlineAvatarHead').position.y+=.2;root.updateMatrixWorld(true);
  assert.ok(Math.abs(headMount.getWorldPosition(new THREE.Vector3()).y-a.y-.2)<1e-6);
  updateEquipment(root,1100,{suspended:true});assert.equal(handMount.visible,false);
  updateEquipment(root,1200);assert.equal(handMount.visible,true);
  applyEquipment(root,{...defaultAvatar,accessories:{}},THREE);assert.equal(root.getObjectByName('equipment:RightHand'),undefined);
  disposeEquipment(root);assert.equal(accessoryPoolSize(),0);
});

test('equipamento aguarda o carregamento do modelo importado sem criar acessórios no avatar anterior',()=>{
  const root=avatarRig(),accessories=equipAccessory({},'cap');
  assert.doesNotThrow(()=>applyEquipment(root,{...defaultAvatar,model:'punk',accessories},THREE));
  assert.equal(root.getObjectByName('equipment:Head'),undefined);
  applyEquipment(root,{...defaultAvatar,accessories},THREE);assert.ok(root.getObjectByName('equipment:Head'));
  disposeEquipment(root);assert.equal(accessoryPoolSize(),0);
});

test('ossos importados compensam escala do GLB e os objetos seguem a mão animada',()=>{
  const root=new THREE.Group(),visual=new THREE.Group();visual.userData.importedAvatar=true;visual.scale.setScalar(.01);root.add(visual);
  const body=new THREE.Mesh(new THREE.BoxGeometry(50,200,30),new THREE.MeshBasicMaterial());body.position.y=100;visual.add(body);
  const head=new THREE.Bone();head.name='Head';head.position.y=170;visual.add(head);
  for(const [side,x] of [['L',-27.5],['R',27.5]]){
    const upper=new THREE.Bone();upper.name='UpperArm.'+side;upper.position.set(x,122,0);visual.add(upper);
    const lower=new THREE.Bone();lower.name='LowerArm.'+side;lower.position.y=-28;upper.add(lower);
    const wrist=new THREE.Bone();wrist.name='Wrist.'+side;wrist.position.y=-26.5;lower.add(wrist);
  }
  applyEquipment(root,{...defaultAvatar,model:'punk',accessories:equipAccessory(equipAccessory({},'headset'),'phone')},THREE);
  updateEquipment(root,500);root.updateMatrixWorld(true);
  const hand=root.getObjectByName('equipment:RightHand'),gear=root.getObjectByName('equipment:Ears');
  assert.equal(hand.parent.name,'Wrist.R');assert.equal(gear.parent,head);
  assert.ok(Math.abs(hand.getWorldScale(new THREE.Vector3()).x-2/1.85)<1e-5);
  const before=hand.getWorldPosition(new THREE.Vector3());root.position.x+=3;root.updateMatrixWorld(true);
  assert.ok(Math.abs(hand.getWorldPosition(new THREE.Vector3()).x-before.x-3)<1e-5);
  disposeEquipment(root);assert.equal(accessoryPoolSize(),0);
});

test('GLBs articulados reais têm fixação de cabeça e mão sem escalas inválidas',async()=>{
  for(const id of ['punk','female_punk','caveirata']){
    const definition=avatarModels.find(model=>model.id===id),bytes=await readFile(new URL('../frontend/assets/personagens/'+definition.file,import.meta.url));
    // Geometry and skeleton validation only: decoding image pixels requires a browser.
    const loader=new GLTFLoader();for(const name of ['TEST_TEXTURES','EXT_texture_webp','EXT_texture_avif','KHR_texture_basisu'])loader.register(()=>({name,loadTexture:()=>Promise.resolve(new THREE.Texture())}));
    const gltf=await new Promise((resolve,reject)=>loader.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'',resolve,reject));
    const root=new THREE.Group(),visual=new THREE.Group(),model=gltf.scene;visual.userData.importedAvatar=true;visual.add(model);root.add(visual);
    model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),scale=definition.height/(bounds.max.y-bounds.min.y);
    model.scale.multiplyScalar(scale);model.position.set(-(bounds.min.x+bounds.max.x)*.5*scale,-bounds.min.y*scale,-(bounds.min.z+bounds.max.z)*.5*scale);
    const accessories=equipAccessory(equipAccessory({},'cap'),'phone');
    applyEquipment(root,{...defaultAvatar,model:id,accessories},THREE);updateEquipment(root,1000);root.updateMatrixWorld(true);
    assert.ok(root.getObjectByName('equipment:Head'),id+' head');assert.ok(root.getObjectByName('equipment:RightHand'),id+' hand');
    for(const slot of ['Head','RightHand']){
      const mount=root.getObjectByName('equipment:'+slot),position=mount.getWorldPosition(new THREE.Vector3()),size=mount.getWorldScale(new THREE.Vector3());
      assert.ok([...position.toArray(),...size.toArray()].every(Number.isFinite),id+' transforms');
      assert.ok(size.x>0&&size.x<3,id+' scale');
      assert.ok(position.y>-.1&&position.y<definition.height*1.3,id+' height');
    }
    disposeEquipment(root);
    const geometries=new Set(),materials=new Set();model.traverse(node=>{if(node.geometry)geometries.add(node.geometry);for(const material of [].concat(node.material||[]))materials.add(material);});geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());
  }
  assert.equal(accessoryPoolSize(),0);
});

test('IK mantém comprimentos dos braços e limita alvos fora de alcance',()=>{
  const shoulder=new THREE.Vector3(.275,1.22,0);
  for(const target of [new THREE.Vector3(.18,1.04,.39),new THREE.Vector3(9,9,9),shoulder.clone()]){
    const result=solveElbow(THREE,shoulder,target,.28,.265,1);
    assert.ok(Math.abs(shoulder.distanceTo(result.elbow)-.28)<1e-6);
    assert.ok(Math.abs(result.elbow.distanceTo(result.target)-.265)<1e-6);
  }
});

test('notebook, tablet e livro alinham as duas mãos às bordas do objeto',()=>{
  for(const id of ['laptop_open','tablet','book']){
    const root=avatarRig();applyEquipment(root,{...defaultAvatar,accessories:equipAccessory({},id)},THREE);updateEquipment(root,0);root.updateMatrixWorld(true);
    const visual=root.getObjectByName('accessory:'+id),bounds=new THREE.Box3().setFromObject(visual);
    const left=root.getObjectByName('networkJoint6').localToWorld(new THREE.Vector3(0,-.265,.015));
    const right=root.getObjectByName('networkJoint7').localToWorld(new THREE.Vector3(0,-.265,.015));
    assert.ok(Math.abs(left.x-bounds.min.x)<.04,id+' left grip');assert.ok(Math.abs(right.x-bounds.max.x)<.04,id+' right grip');disposeEquipment(root);
  }
});

test('multiplayer sincroniza somente configuração, permite troca e preserva equipamento na reconexão',async()=>{
  const server=createServer({privateRooms:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const post=(path,data={},token)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});
  try{
    const {room}=await(await post('/api/rooms')).json(),route='/api/rooms/'+room;
    const config={...defaultAvatar,accessories:equipAccessory(equipAccessory({},'gamer_bag'),'phone')};
    const a=await(await post(route+'/join',{name:'Ana',avatar:config})).json(),b=await(await post(route+'/join',{name:'Bia'})).json();
    assert.deepEqual(b.members.find(member=>member.id===a.id).avatar.accessories,config.accessories);
    assert.ok(JSON.stringify(config.accessories).length<500);
    const changed={...config,accessories:equipAccessory(config.accessories,'headset')};
    assert.equal((await post(route+'/state',{avatar:changed,pose:{x:0,y:0,z:0,r:0,equipmentActive:false}},a.token)).status,200);
    const snapshot=await(await post(route+'/join',{token:a.token})).json();
    assert.deepEqual(snapshot.members.find(member=>member.id===a.id).avatar.accessories,changed.accessories);
    assert.equal(snapshot.members.find(member=>member.id===a.id).pose.equipmentActive,false);
    assert.equal((await post(route+'/state',{avatar:{...changed,accessories:{Head:{id:'hack'}}}},a.token)).status,400);
    assert.equal((await post(route+'/state',{pose:{x:0,y:0,z:0,r:0,equipmentActive:'yes'}},a.token)).status,400);
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
