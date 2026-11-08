import {accessoryById,validateEquipment,articulatedAccessoryModels} from './accessory-catalog.mjs';
import {createAccessoryVisual} from './accessory-models.mjs';
const states=new WeakMap();
function buildContext(THREE,root,visual){
  const hands={};
  for(const [slot,index] of [['LeftHand',0],['RightHand',1]]){
    const hand=root.getObjectByName('networkJoint'+(6+index));
    hands[slot]={hand,lower:hand,upper:root.getObjectByName('networkJoint'+(4+index)),side:index===0?-1:1};
  }
  return {THREE,root,visual,head:visual,hands};
}
function mountFor(context,slot){
  const {THREE,root,head,hands}=context;
  const mount=new THREE.Group();mount.name='equipment:'+slot;mount.userData.equipmentSlot=slot;
  if(['Head','Face','FaceDetail','Ears'].includes(slot)){head.add(mount);return mount;}
  if(slot.endsWith('Hand')){const hand=hands[slot].hand;if(!hand)return null;hand.add(mount);mount.position.set(0,-.265,.015);return mount;}
  root.add(mount);mount.position.set(0,slot==='Back'?1.08:1.12,slot==='Back'?-.19:0);return mount;
}
export function applyEquipment(root,config,THREE){
  const equipment=validateEquipment(config.accessories)||{};
  const visual=root.getObjectByName('onlineAvatarHead');
  const signature=JSON.stringify([config.model||'default',equipment]);let state=states.get(root);
  if(state&&state.signature===signature&&state.visual===visual)return;
  const previousContext=state&&state.visual===visual?state.context:null;
  if(state)disposeEquipment(root);
  state={signature,visual,config,entries:new Map(),handEntries:[],context:null,headRest:null};states.set(root,state);
  if(!visual||!Object.keys(equipment).length)return;
  state.context=previousContext||buildContext(THREE,root,visual);
  state.context.rootQuaternion||=new THREE.Quaternion();state.context.parentQuaternion||=new THREE.Quaternion();
  for(const [slot,entry] of Object.entries(equipment)){
    if(slot.endsWith('Hand')&&!articulatedAccessoryModels.has(config.model||'default'))continue;
    const mount=mountFor(state.context,slot);if(!mount)continue;
    const resource=createAccessoryVisual(THREE,entry.id,entry.color);mount.add(resource.visual);
    state.entries.set(slot,{...resource,mount,item:accessoryById.get(entry.id)});
  }
  state.handEntries=[...state.entries].filter(([slot])=>slot.endsWith('Hand'));
}
export function disposeEquipment(root){
  const state=states.get(root);if(!state)return;
  if(state.headRest&&state.context?.head)state.context.head.quaternion.copy(state.headRest);
  for(const entry of state.entries.values()){entry.release();entry.mount.removeFromParent();}
  states.delete(root);
}
export function hasEquippedHands(root){const state=states.get(root);return !!(state?.entries.has('LeftHand')||state?.entries.has('RightHand'));}

// Solve two links without changing their lengths or moving the gameplay root.
export function solveElbow(THREE,shoulder,target,a,b,side){
  const direction=target.clone().sub(shoulder),distance=Math.min(a+b-.0001,Math.max(Math.abs(a-b)+.0001,direction.length()));
  if(direction.lengthSq()<1e-12)direction.set(0,-1,0);else direction.normalize();
  const along=(a*a-b*b+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,a*a-along*along));
  const bend=new THREE.Vector3(side*.35,-1,0).addScaledVector(direction,-new THREE.Vector3(side*.35,-1,0).dot(direction)).normalize();
  return {elbow:shoulder.clone().addScaledVector(direction,along).addScaledVector(bend,height),target:shoulder.clone().addScaledVector(direction,distance)};
}
export function updateEquipment(root,time,{suspended=false,pose=true}={}){
  const state=states.get(root),context=state?.context;if(!context||!state.handEntries.length)return;
  const {THREE}=context;
  const handEntries=state.handEntries;
  if(suspended||!handEntries.length){
    for(const [,entry] of handEntries)entry.mount.visible=!suspended;
    if(state.headRest&&context.head){context.head.quaternion.copy(state.headRest);state.headRest=null;}
    return;
  }
  if(pose){
  const targets=new Map();
  for(const [slot,entry] of handEntries){
    entry.mount.visible=true;
    const side=slot==='LeftHand'?-1:1,mode=entry.item.pose;
    let target=[side*.24,1.06,.29];
    if(mode==='carry')target=[side*.32,.83,.10];
    if(mode==='phone'||mode==='camera')target=[side*.22,1.17,.34];
    if(mode==='umbrella')target=[side*.30,1.12,.18];
    if(mode==='twoHands'){const grip=entry.item.id==='tablet'?.128:entry.item.id==='book'?.16:.18;target=[grip,1.04,.39];targets.set('LeftHand',new THREE.Vector3(-grip,1.04,.39));}
    if(mode!=='carry')target[1]+=.008*Math.sin(time*.002);
    targets.set(slot,new THREE.Vector3(...target));
  }
    for(const [slot,position] of targets){
      const chain=context.hands[slot];if(!chain?.hand||!chain.lower||!chain.upper)continue;
      {
        const shoulder=chain.upper.position.clone(),solution=solveElbow(THREE,shoulder,position,.28,.265,chain.side),down=new THREE.Vector3(0,-1,0);
        chain.upper.quaternion.setFromUnitVectors(down,solution.elbow.clone().sub(shoulder).normalize());
        chain.lower.quaternion.setFromUnitVectors(down,solution.target.clone().sub(solution.elbow).normalize().applyQuaternion(chain.upper.quaternion.clone().invert()));
      }
    }
  }
  root.updateWorldMatrix(true,true);
  root.getWorldQuaternion(context.rootQuaternion);
  for(const [,entry] of handEntries){
    entry.mount.quaternion.copy(entry.mount.parent.getWorldQuaternion(context.parentQuaternion).invert()).multiply(context.rootQuaternion);
  }
  if(pose&&context.head){
    if(!state.headRest)state.headRest=context.head.quaternion.clone();
    context.head.quaternion.copy(state.headRest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),.12));
  }
}
