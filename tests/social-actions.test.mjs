import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createPlayerAvatar} from '../frontend/js/player-avatar.mjs';
import {poseAvatarAction,resetAvatarAction} from '../frontend/js/avatar-actions.mjs';
import {soloActions,pairActions,pairPlacement,validActionPose} from '../frontend/js/social-action-catalog.mjs';
import {socialAction,socialSnapshot} from '../backend/social-actions.mjs';
import {poseSocialSession} from '../frontend/js/social-actions-ui.mjs';
import {createServer} from '../backend/server.mjs';

function rig(){
  const prior=globalThis.document;
  globalThis.document={createElementNS(){return {addEventListener(){},removeEventListener(){},set src(value){}};}};
  try{const result=createPlayerAvatar({THREE,RoundedBoxGeometry});result.avatar.position.set(0,0,0);return {...result,baseY:0};}
  finally{if(prior===undefined)delete globalThis.document;else globalThis.document=prior;}
}
const member=(id,x)=>({id,pose:{x,y:0,z:0,r:0,equipmentActive:true}});

test('consentimento exige destinatario, proximidade, disponibilidade e convite valido',()=>{
  const a=member('a',0),b=member('b',1),c=member('c',2),room={members:new Map([['a',a],['b',b],['c',c]])};
  const pending=socialAction(room,a,{type:'invite',target:'b',kind:'kiss'},0,()=> 'kiss-1');
  assert.equal(pending.state,'pending');assert.equal(pending.anchors,undefined);
  assert.throws(()=>socialAction(room,a,{type:'accept',id:pending.id},10),error=>error.status===403);
  assert.throws(()=>socialAction(room,c,{type:'cancel',id:pending.id},10),error=>error.status===403);
  b.pose.x=10;assert.throws(()=>socialAction(room,b,{type:'accept',id:pending.id},10));
  b.pose.x=1;b.pose.equipmentActive=false;assert.throws(()=>socialAction(room,b,{type:'accept',id:pending.id},10));
  b.pose.equipmentActive=true;
  const session=socialAction(room,b,{type:'accept',id:pending.id},100);
  assert.equal(session.startsAt,850);assert.equal(session.state,'active');
  assert.throws(()=>socialAction(room,b,{type:'accept',id:pending.id},101));
  assert.throws(()=>socialAction(room,c,{type:'invite',target:'b',kind:'hug'},102));
  socialAction(room,b,{type:'cancel',id:pending.id},200);assert.equal(socialSnapshot(room,200).length,0);
  assert.throws(()=>socialAction(room,a,null,300),error=>error.status===400);
});

test('convites expiram e sair da sala encerra interacoes sem reativacao',()=>{
  const a=member('a',0),b=member('b',1),room={members:new Map([['a',a],['b',b]])};
  socialAction(room,a,{type:'invite',target:'b',kind:'hug'},0,()=> 'first');
  assert.equal(socialSnapshot(room,20001).length,0);
  const invite=socialAction(room,a,{type:'invite',target:'b',kind:'duet'},21000,()=> 'second');
  socialAction(room,b,{type:'accept',id:invite.id},21001);room.members.delete('b');
  assert.equal(socialSnapshot(room,21002).length,0);
});

test('todas as poses sao finitas, nao deformam geometrias e respeitam transicao inicial',()=>{
  const r=rig(),joints=[...r.legs,...r.knees,...r.arms,...r.elbows];
  const original=r.johnTorso.geometry.attributes.position.array.slice();
  for(const [kind] of [...soloActions,...pairActions]){
    r.avatar.position.y=0;r.avatar.rotation.set(0,0,0);joints.forEach(j=>j.rotation.set(0,0,0));resetAvatarAction(r.avatar);
    poseAvatarAction(kind,0,r);assert.equal(r.avatar.position.y,0,kind+' entry');
    for(const time of [.08,.2,.32,1,2,5]){
      poseAvatarAction(kind,time,r);
      assert.ok([r.avatar.position.y,r.avatar.rotation.x,r.avatar.rotation.z,...joints.flatMap(j=>[j.rotation.x,j.rotation.y,j.rotation.z])].every(Number.isFinite),kind);
    }
    assert.deepEqual(r.johnTorso.geometry.attributes.position.array,original);
  }
});

test('sentar, ajoelhar e dormir mantem as malhas acima do piso',()=>{
  for(const kind of ['floor','kneel','sleep']){
    const r=rig();r.avatar.traverse(node=>{if(node.userData.avatarHide)node.visible=false;});
    poseAvatarAction(kind,2,r);
    const bounds=new THREE.Box3().setFromObject(r.avatar,true);
    assert.ok(bounds.min.y>=-.025,kind+': '+bounds.min.y);
  }
});

test('aproximacao e fase em dupla usam o mesmo relogio para ambos participantes',()=>{
  const origins=[{x:0,y:0,z:0,r:0},{x:2,y:0,z:0,r:Math.PI}];
  const session={from:'a',to:'b',kind:'hug',origins,anchors:pairPlacement(...origins,'hug'),startsAt:1000,approach:1500};
  const a=rig(),b=rig();
  poseSocialSession(session,'a',1000,a,poseAvatarAction);assert.equal(a.avatar.position.x,0);
  poseSocialSession(session,'a',4000,a,poseAvatarAction);poseSocialSession(session,'b',4000,b,poseAvatarAction);
  assert.ok(Math.abs(a.avatar.position.distanceTo(b.avatar.position)-.64)<1e-5);
  assert.ok(Math.abs(a.arms[0].rotation.x-b.arms[0].rotation.x)<1e-5);
});

test('API transmite convites e fases, impede aceite unilateral e valida emotes',async()=>{
  const server=createServer({privateRooms:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const post=(path,data={},token)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});
  try{
    const {room}=await(await post('/api/rooms',{capacity:12})).json(),route='/api/rooms/'+room;
    const a=await(await post(route+'/join',{name:'A'})).json(),b=await(await post(route+'/join',{name:'B'})).json();
    const invitation=await(await post(route+'/social',{type:'invite',target:b.id,kind:'handshake'},a.token)).json();
    assert.equal(invitation.social[0].state,'pending');
    assert.equal((await post(route+'/social',{type:'accept',id:invitation.result.id},a.token)).status,403);
    const accepted=await(await post(route+'/social',{type:'accept',id:invitation.result.id},b.token)).json();
    assert.equal(accepted.social[0].state,'active');assert.equal(accepted.social[0].anchors.length,2);
    await post(route+'/social',{type:'cancel',id:invitation.result.id},a.token);
    assert.equal((await post(route+'/state',{pose:{...a.pose,action:'kiss'}},a.token)).status,400);
    assert.equal((await post(route+'/state',{pose:{...a.pose,action:'clap',actionTime:1,actionBaseY:0}},a.token)).status,200);
    const state=await(await post(route+'/join',{token:b.token})).json();
    assert.equal(state.members.find(member=>member.id===a.id).pose.action,'clap');
    assert.ok(Number.isFinite(state.members.find(member=>member.id===a.id).pose.actionStamp));
    assert.equal(validActionPose({action:'sleep',pitch:Infinity}),false);
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
