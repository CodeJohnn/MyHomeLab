import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {accessoryCatalog,validateEquipment,equipAccessory} from '../frontend/js/accessory-catalog.mjs';
import {createAccessoryVisual,accessoryPoolSize} from '../frontend/js/accessory-models.mjs';
import {applyEquipment,disposeEquipment,updateEquipment,solveElbow} from '../frontend/js/avatar-equipment.mjs';
import {defaultAvatar,validateAvatar} from '../backend/avatar.mjs';
import {createServer} from '../backend/server.mjs';

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


test('todos os acessorios mantem encaixe e escala durante movimentos e retomam visibilidade',()=>{
  for(const item of accessoryCatalog){
    const root=avatarRig(),slot=item.slots.at(-1);
    applyEquipment(root,{...defaultAvatar,accessories:equipAccessory({},item.id,slot)},THREE);
    const mount=root.getObjectByName('equipment:'+slot);
    assert.ok(mount,item.id);
    const local=mount.position.clone();
    root.position.set(3,.4,-2);root.rotation.set(.08,1.2,-.06);root.scale.setScalar(.8);
    root.getObjectByName('onlineAvatarHead').rotation.y=.35;
    root.getObjectByName('networkJoint7').rotation.x=-.7;
    updateEquipment(root,750,{pose:false});root.updateMatrixWorld(true);
    assert.ok(mount.position.equals(local),item.id+' anchor drift');
    const scale=mount.getWorldScale(new THREE.Vector3());
    assert.ok(Math.abs(scale.x-scale.y)<1e-6&&Math.abs(scale.y-scale.z)<1e-6,item.id+' stretched');
    const bounds=new THREE.Box3().setFromObject(mount);
    assert.ok([...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite),item.id);
    if(slot.endsWith('Hand')){
      updateEquipment(root,800,{pose:false,suspended:true});assert.equal(mount.visible,false);
      updateEquipment(root,900,{pose:false});assert.equal(mount.visible,true,item.id+' hidden after interaction');
    }
    disposeEquipment(root);
  }
  assert.equal(accessoryPoolSize(),0);
});

test('IK preserva o cotovelo quando o alvo coincide com a direcao de dobra',()=>{
  const shoulder=new THREE.Vector3(),target=new THREE.Vector3(.35,-1,0).normalize().multiplyScalar(.3);
  const result=solveElbow(THREE,shoulder,target,.28,.265,1);
  assert.ok(Math.abs(result.elbow.length()-.28)<1e-6);
  assert.ok(Math.abs(result.elbow.distanceTo(result.target)-.265)<1e-6);
});

test('objetos de duas maos mantem as pegadas alinhadas ao longo do tempo',()=>{
  for(const id of ['laptop_open','tablet','book']){
    const root=avatarRig();applyEquipment(root,{...defaultAvatar,accessories:equipAccessory({},id)},THREE);
    for(const time of [0,750,2000,3500]){
      updateEquipment(root,time);root.updateMatrixWorld(true);
      const a=root.getObjectByName('networkJoint6').localToWorld(new THREE.Vector3(0,-.265,.015));
      const b=root.getObjectByName('networkJoint7').localToWorld(new THREE.Vector3(0,-.265,.015));
      assert.ok(Math.abs(a.y-b.y)<.006,id+' unequal grip height');
    }
    disposeEquipment(root);
  }
});


test('pose de acessorio preserva novas animacoes da cabeca ao suspender e remover',()=>{
  const root=avatarRig();applyEquipment(root,{...defaultAvatar,accessories:equipAccessory({},'phone')},THREE);
  updateEquipment(root,0);
  const head=root.getObjectByName('onlineAvatarHead');
  head.rotation.set(.1,.4,-.05);const animated=head.quaternion.clone();
  updateEquipment(root,100);updateEquipment(root,200,{suspended:true});
  assert.ok(head.quaternion.angleTo(animated)<1e-6);
  updateEquipment(root,300);head.rotation.y=.8;const next=head.quaternion.clone();
  disposeEquipment(root);assert.ok(head.quaternion.angleTo(next)<1e-6);
});

test('camera encaixa pelo grip da mao selecionada sem espelhar a geometria',()=>{
  for(const slot of ['LeftHand','RightHand']){
    const root=avatarRig();applyEquipment(root,{...defaultAvatar,accessories:equipAccessory({},'camera',slot)},THREE);
    const camera=root.getObjectByName('accessory:camera');
    assert.equal(camera.position.x,slot==='LeftHand'?.065:-.065);
    assert.deepEqual(camera.scale.toArray(),[1,1,1]);disposeEquipment(root);
  }
});
