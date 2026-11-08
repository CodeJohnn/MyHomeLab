import {accessoryById,validateEquipment,articulatedAccessoryModels} from './accessory-catalog.mjs';
import {createAccessoryVisual} from './accessory-models.mjs';
const states=new WeakMap();
const rigCache=new WeakMap();

function component(attribute,index,axis){return axis===0?attribute.getX(index):axis===1?attribute.getY(index):axis===2?attribute.getZ(index):attribute.getW(index);}
function findBone(root,pattern){
  if(!rigCache.has(root)){
    const bones=[],direct=new Map(),scores=new Map();root.traverse(node=>{
      if(node.isBone)bones.push(node);
      const weights=node.geometry?.attributes.skinWeight,indices=node.geometry?.attributes.skinIndex;
      if(!node.isSkinnedMesh||!weights||!indices)return;
      for(let i=0;i<weights.count;i+=8)for(let axis=0;axis<4;axis++){
        const bone=node.skeleton.bones[component(indices,i,axis)];if(bone)direct.set(bone,(direct.get(bone)||0)+component(weights,i,axis));
      }
    });
    for(const [bone,weight] of direct)for(let n=bone;n?.isBone;n=n.parent)scores.set(n,(scores.get(n)||0)+weight);
    rigCache.set(root,{bones,scores});
  }
  const {bones,scores}=rigCache.get(root);
  return bones.filter(bone=>pattern.test(bone.name)&&!/_end$|end$/i.test(bone.name)).sort((a,b)=>(scores.get(b)||0)-(scores.get(a)||0))[0]||null;
}
function headBounds(THREE,visual,head,avatar){
  const bounds=new THREE.Box3(),point=new THREE.Vector3();
  visual.traverse(mesh=>{
    const weights=mesh.geometry?.attributes.skinWeight,indices=mesh.geometry?.attributes.skinIndex;
    if(!mesh.isSkinnedMesh||!head||!weights||!indices)return;
    const selected=mesh.skeleton.bones.map(bone=>{for(let n=bone;n;n=n.parent)if(n===head)return true;return false;});
    for(let i=0;i<weights.count;i++){
      let weight=0;for(let j=0;j<4;j++)if(selected[component(indices,i,j)])weight+=component(weights,i,j);
      if(weight<.45)continue;
      point.fromBufferAttribute(mesh.geometry.attributes.position,i);mesh.applyBoneTransform(i,point);mesh.localToWorld(point);avatar.worldToLocal(point);bounds.expandByPoint(point);
    }
  });
  return bounds;
}
function buildContext(THREE,root,visual,imported,model){
  root.updateWorldMatrix(true,true);
  const head=imported?findBone(visual,/^(head|headroot)(_|$)|^head$/i):root.getObjectByName('onlineAvatarHead');
  const chest=imported?findBone(visual,/chest|spine0?3|torso/i):root;
  const worldBounds=new THREE.Box3().setFromObject(visual),size=worldBounds.getSize(new THREE.Vector3());
  const rootScale=root.getWorldScale(new THREE.Vector3());
  const height=imported?size.y/Math.abs(rootScale.y):1.85;
  let headSize=imported?height*.42:1.48,headCenter=new THREE.Vector3(0,height*.88,0),faceCenter=headCenter.clone();
  if(imported){
    const bounds=headBounds(THREE,visual,head,root);
    if(!bounds.isEmpty()){
      const headWidth=Math.min(height*.24,Math.max(height*.12,bounds.max.x-bounds.min.x));
      headSize=headWidth/.36;headCenter=bounds.getCenter(new THREE.Vector3());headCenter.y=bounds.max.y-headSize*.22;
      faceCenter.copy(headCenter);faceCenter.z=bounds.max.z-headSize*.19;
    }
  }
  const hands={};
  for(const [slot,index,side] of [['LeftHand',0,'L'],['RightHand',1,'R']]){
    const hand=imported?(findBone(visual,new RegExp('(wrist|hand)[._ ]?'+side+'([._ ]|$)|(wrist|hand)[_ ]'+(side==='L'?'left':'right'),'i'))||findBone(visual,new RegExp('middle1[._ ]?'+side+'([._ ]|$)','i'))):root.getObjectByName('networkJoint'+(6+index));
    const lower=imported?hand?.parent:hand,upper=imported?lower?.parent:root.getObjectByName('networkJoint'+(4+index));
    hands[slot]={hand,lower,upper,side:index===0?-1:1};
  }
  return {THREE,root,visual,imported,model,head,chest,hands,height,headSize,headCenter,faceCenter};
}
function mountFor(context,slot){
  const {THREE,root,visual,imported,head,chest,height,headSize,headCenter,faceCenter,hands}=context;
  const mount=new THREE.Group();mount.name='equipment:'+slot;mount.userData.equipmentSlot=slot;
  if(!imported){
    if(['Head','Face','FaceDetail','Ears'].includes(slot)){head.add(mount);return mount;}
    if(slot.endsWith('Hand')){const hand=hands[slot].hand;if(!hand)return null;hand.add(mount);mount.position.set(0,-.265,.015);return mount;}
    root.add(mount);mount.position.set(0,slot==='Back'?1.08:1.12,slot==='Back'?-.19:0);return mount;
  }
  const parent=slot.endsWith('Hand')?hands[slot].hand:['Head','Face','FaceDetail','Ears'].includes(slot)?head||visual:chest||visual;
  if(!parent)return null;parent.add(mount);
  const point=slot.endsWith('Hand')?root.worldToLocal(parent.getWorldPosition(new THREE.Vector3())):
    ['Head','Ears'].includes(slot)?headCenter.clone():slot==='Face'||slot==='FaceDetail'?faceCenter.clone():new THREE.Vector3(0,height*(slot==='Back'?.58:.61),slot==='Back'?-height*.10:0);
  mount.position.copy(parent.worldToLocal(root.localToWorld(point)));
  const parentScale=parent.getWorldScale(new THREE.Vector3()),baseScale=root.getWorldScale(new THREE.Vector3());
  const scale=['Head','Face','FaceDetail','Ears'].includes(slot)?headSize:height/1.85;
  mount.scale.set(scale*baseScale.x/parentScale.x,scale*baseScale.y/parentScale.y,scale*baseScale.z/parentScale.z);
  mount.quaternion.copy(parent.getWorldQuaternion(new THREE.Quaternion()).invert()).multiply(root.getWorldQuaternion(new THREE.Quaternion()));
  return mount;
}
export function applyEquipment(root,config,THREE){
  const equipment=validateEquipment(config.accessories)||{},imported=!!config.model&&config.model!=='default';
  const visual=imported?root.children.find(node=>node.userData.importedAvatar&&node.visible):root.getObjectByName('onlineAvatarHead');
  const signature=JSON.stringify([config.model||'default',equipment]);let state=states.get(root);
  if(state&&state.signature===signature&&state.visual===visual)return;
  const previousContext=state&&state.visual===visual?state.context:null;
  if(state)disposeEquipment(root);
  state={signature,visual,config,entries:new Map(),handEntries:[],context:null,headRest:null};states.set(root,state);
  if(!visual||!Object.keys(equipment).length)return;
  state.context=previousContext||buildContext(THREE,root,visual,imported,config.model||'default');
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
function aimBone(THREE,bone,child,target){
  const origin=bone.getWorldPosition(new THREE.Vector3()),current=child.getWorldPosition(new THREE.Vector3()).sub(origin).normalize(),desired=target.clone().sub(origin).normalize();
  const world=bone.getWorldQuaternion(new THREE.Quaternion());world.premultiply(new THREE.Quaternion().setFromUnitVectors(current,desired));
  bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert()).multiply(world);bone.updateWorldMatrix(true,true);
}
export function updateEquipment(root,time,{suspended=false,pose=true}={}){
  const state=states.get(root),context=state?.context;if(!context||!state.handEntries.length)return;
  const {THREE,height,imported}=context;
  const handEntries=state.handEntries;
  if(suspended||!handEntries.length){
    for(const [,entry] of handEntries)entry.mount.visible=!suspended;
    if(state.headRest&&context.head){context.head.quaternion.copy(state.headRest);state.headRest=null;}
    return;
  }
  if(pose||imported){
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
      if(!imported){
        const shoulder=chain.upper.position.clone(),solution=solveElbow(THREE,shoulder,position,.28,.265,chain.side),down=new THREE.Vector3(0,-1,0);
        chain.upper.quaternion.setFromUnitVectors(down,solution.elbow.clone().sub(shoulder).normalize());
        chain.lower.quaternion.setFromUnitVectors(down,solution.target.clone().sub(solution.elbow).normalize().applyQuaternion(chain.upper.quaternion.clone().invert()));
      }else{
        root.updateWorldMatrix(true,true);
        const target=root.localToWorld(position.clone().multiplyScalar(height/1.85));
        const a=chain.upper.getWorldPosition(new THREE.Vector3()),b=chain.lower.getWorldPosition(new THREE.Vector3()),c=chain.hand.getWorldPosition(new THREE.Vector3());
        if(a.distanceTo(b)<.0001||b.distanceTo(c)<.0001)continue;
        const solution=solveElbow(THREE,a,target,a.distanceTo(b),b.distanceTo(c),chain.side);
        aimBone(THREE,chain.upper,chain.lower,solution.elbow);aimBone(THREE,chain.lower,chain.hand,solution.target);
      }
    }
  }
  root.updateWorldMatrix(true,true);
  root.getWorldQuaternion(context.rootQuaternion);
  for(const [,entry] of handEntries){
    entry.mount.quaternion.copy(entry.mount.parent.getWorldQuaternion(context.parentQuaternion).invert()).multiply(context.rootQuaternion);
  }
  if(pose&&!imported&&context.head){
    if(!state.headRest)state.headRest=context.head.quaternion.clone();
    context.head.quaternion.copy(state.headRest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),.12));
  }
}
