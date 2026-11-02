import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
export function createCharacterPreview(avatar,button){
 let model=null,enabled=true,failed=false,phase=0,speed=0,sitBlend=0,typeBlend=0,visualYaw=avatar.rotation.y;
 const previous=avatar.position.clone(),legacy=avatar.children.map(child=>({child,visible:child.visible}));
 const joints=new Map(),desired=new THREE.Vector3(),modelRotation=new THREE.Quaternion(),parentRotation=new THREE.Quaternion(),delta=new THREE.Quaternion(),poseOffset=new THREE.Quaternion(),poseEuler=new THREE.Euler();
 function show(){for(const {child,visible} of legacy)child.visible=enabled&&model?false:visible;if(model)model.visible=enabled;button.textContent=failed?'Modelo FBX indisponivel':model?(enabled?'Voltar ao boneco antigo':'Testar primeiro boneco'):'Carregando primeiro boneco...';}
 button.onclick=()=>{if(failed)return;enabled=!enabled;show();};show();
 new FBXLoader().load(new URL('../assets/boneco/boneco.fbx',import.meta.url).href,root=>{
   root.updateMatrixWorld(true);
   root.traverse(node=>{
     if(node.isSkinnedMesh)node.frustumCulled=false;
     if(node.isMesh){node.castShadow=false;node.receiveShadow=true;}
     if(node.isBone){const name=node.name.replace(/^.*mixamorig\d*[:_]?/i,'');const child=node.children.find(c=>c.isBone);if(child)joints.set(name,{bone:node,rest:node.quaternion.clone(),direction:child.position.clone().normalize().applyQuaternion(node.quaternion)});}
   });
   if(!joints.has('Hips')||!joints.has('LeftUpLeg')){failed=true;show();console.warn('O FBX nao apresentou o esqueleto esperado.');return;}
   const bounds=new THREE.Box3().setFromObject(root),height=bounds.max.y-bounds.min.y;
   if(!Number.isFinite(height)||height<=0){failed=true;show();return;}
   const scale=1.75/height;root.scale.multiplyScalar(scale);
   const holder=new THREE.Group();holder.name='Teste de personagem FBX';
   root.position.x-=(bounds.min.x+bounds.max.x)/2*scale;root.position.z-=(bounds.min.z+bounds.max.z)/2*scale;root.position.y-=bounds.min.y*scale;
   holder.add(root);avatar.add(holder);model=holder;
   root.updateWorldMatrix(true,true);addGuedesAppearance();show();
 },progress=>{if(progress.total)button.textContent='Carregando boneco '+Math.round(progress.loaded/progress.total*100)+'%';},error=>{failed=true;enabled=false;show();console.warn('Falha ao carregar boneco FBX; mantendo personagem original.',error);});
 function addGuedesAppearance(){
   const white=new THREE.MeshStandardMaterial({color:'#f0f0e9',roughness:.92});
   const dark=new THREE.MeshStandardMaterial({color:'#16191e',roughness:.8});
   const skin=new THREE.MeshStandardMaterial({color:'#c78e69',roughness:.85});
   const hair=new THREE.MeshStandardMaterial({color:'#17120f',roughness:1});
   const trim=new THREE.MeshStandardMaterial({color:'#c3c5bc',roughness:.8});
   const glass=new THREE.MeshPhysicalMaterial({color:'#bfd5da',transparent:true,opacity:.12,roughness:.2,depthWrite:false});
   function mesh(parent,geometry,material,x=0,y=0,z=0){const part=new THREE.Mesh(geometry,material);part.position.set(x,y,z);parent.add(part);return part;}
   function box(parent,w,h,d,material,x,y,z){return mesh(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z);}
   function ball(parent,r,material,x,y,z,sx=1,sy=1,sz=1){const part=mesh(parent,new THREE.SphereGeometry(r,16,12),material,x,y,z);part.scale.set(sx,sy,sz);return part;}
   function attachment(name){
     const bone=joints.get(name)?.bone;if(!bone)return null;
     const group=new THREE.Group();bone.add(group);
     const size=bone.getWorldScale(new THREE.Vector3());group.scale.set(1/size.x,1/size.y,1/size.z);
     group.quaternion.copy(bone.getWorldQuaternion(new THREE.Quaternion()).invert()).multiply(avatar.getWorldQuaternion(new THREE.Quaternion()));
     return group;
   }
   const chest=attachment('Spine1');
   if(chest){
     box(chest,.44,.49,.075,white,0,-.12,-.13);
     for(const side of [-1,1]){
       box(chest,.17,.48,.095,white,side*.145,-.12,.135);
       const lapel=box(chest,.075,.2,.025,white,side*.067,.025,.202);lapel.rotation.z=side*-.28;
       box(chest,.105,.10,.018,white,side*.145,-.24,.194);
       box(chest,.105,.008,.02,trim,side*.145,-.19,.205);
     }
     const badgeCanvas=document.createElement('canvas');badgeCanvas.width=512;badgeCanvas.height=192;
     const ctx=badgeCanvas.getContext('2d');ctx.fillStyle='#fafaf4';ctx.fillRect(0,0,512,192);
     ctx.fillStyle='#17191c';ctx.font='bold 64px sans-serif';ctx.textAlign='center';ctx.fillText('GUEDESSEC',256,90);ctx.fillStyle='#d1af24';ctx.fillRect(40,118,432,10);
     const badgeTexture=new THREE.CanvasTexture(badgeCanvas);badgeTexture.colorSpace=THREE.SRGBColorSpace;
     mesh(chest,new THREE.PlaneGeometry(.14,.053),new THREE.MeshBasicMaterial({map:badgeTexture}),-.145,-.02,.19);
   }
   const coat=attachment('Hips');
   if(coat){for(const side of [-1,1]){box(coat,.19,.28,.09,white,side*.13,-.19,.13);box(coat,.19,.28,.07,white,side*.13,-.19,-.12);}}
   // Mangas presas ao proprio osso, acompanhando os bracos durante a animacao.
   for(const side of ['Left','Right']) {
     const joint=joints.get(side+'Arm');if(!joint)continue;
     const bone=joint.bone,child=bone.children.find(n=>n.isBone);if(!child)continue;
     const sleeve=new THREE.Group();bone.add(sleeve);
     const worldScale=bone.getWorldScale(new THREE.Vector3());sleeve.scale.set(1/worldScale.x,1/worldScale.y,1/worldScale.z);
     sleeve.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),child.position.clone().normalize());
     mesh(sleeve,new THREE.CylinderGeometry(.092,.078,.235,14),white,0,.117,0);
   }
   const head=attachment('Head');
   if(head){
     ball(head,.105,skin,0,.075,.055,.93,1.15,.82);
     for(const side of [-1,1]){
       ball(head,.022,skin,side*.103,.075,.045,.55,1,.7);
       ball(head,.017,dark,side*.042,.10,.132,.8,.65,.4);
       const frame=mesh(head,new THREE.TorusGeometry(.041,.005,6,24),dark,side*.047,.098,.151);frame.scale.y=.78;
       const lens=mesh(head,new THREE.CircleGeometry(.037,24),glass,side*.047,.098,.15);lens.scale.y=.78;
       box(head,.008,.009,.09,dark,side*.091,.10,.11);
       box(head,.038,.009,.008,hair,side*.045,.136,.135);
     }
     box(head,.023,.006,.008,dark,0,.10,.153);
     ball(head,.019,skin,0,.067,.144,.6,.8,.9);
     box(head,.044,.005,.006,dark,0,.025,.135);
     ball(head,.109,hair,0,.163,.038,1,.62,.88);
     for(let i=0;i<7;i++)ball(head,.031,hair,-.078+i*.026,.185+Math.sin(i)*.008,.055,1,.8,1);
   }
 }
 function aim(name,x,y,z,dt){
   const joint=joints.get(name);if(!joint)return;
   joint.bone.parent.getWorldQuaternion(parentRotation);
   desired.set(x,y,z).normalize().applyQuaternion(modelRotation).applyQuaternion(parentRotation.invert());
   delta.setFromUnitVectors(joint.direction,desired).multiply(joint.rest);
   joint.bone.quaternion.slerp(delta,1-Math.exp(-9*dt));joint.bone.updateWorldMatrix(false,false);
 }
 function offsetJoint(name,x,y,z,dt){
   const joint=joints.get(name);if(!joint)return;
   poseOffset.setFromEuler(poseEuler.set(x,y,z));delta.copy(joint.rest).multiply(poseOffset);
   joint.bone.quaternion.slerp(delta,1-Math.exp(-7*dt));joint.bone.updateWorldMatrix(false,false);
 }
 return {update(dt,pose,time){
   const moved=Math.hypot(avatar.position.x-previous.x,avatar.position.z-previous.z);previous.copy(avatar.position);
   if(!model||!enabled)return;
   const targetSpeed=pose||moved>.3?0:Math.min(1,moved/Math.max(dt,.001)/2.3);
   speed=THREE.MathUtils.damp(speed,targetSpeed,5,dt);
   sitBlend=THREE.MathUtils.damp(sitBlend,pose?1:0,5,dt);
   typeBlend=THREE.MathUtils.damp(typeBlend,pose==='typing'||pose==='mouse'?1:0,6,dt);
   phase+=dt*(7.3+speed*2)*speed;
   const angle=Math.atan2(Math.sin(avatar.rotation.y-visualYaw),Math.cos(avatar.rotation.y-visualYaw));
   visualYaw+=angle*(1-Math.exp(-8*dt));model.rotation.y=visualYaw-avatar.rotation.y;
   model.getWorldQuaternion(modelRotation);
   const breath=Math.sin(time*.0018),stride=Math.sin(phase)*.62*speed;
   model.position.y=THREE.MathUtils.damp(model.position.y,-.24*sitBlend+(1-Math.cos(phase*2))*.009*speed+breath*.0025*(1-speed),7,dt);
   model.position.x=Math.sin(phase)*.014*speed*(1-sitBlend);
   offsetJoint('Hips',-.035*speed,Math.sin(phase)*.045*speed,Math.sin(phase)*.025*speed,dt);
   offsetJoint('Spine',.025*typeBlend+breath*.008,-Math.sin(phase)*.035*speed,-Math.sin(phase)*.017*speed,dt);
   offsetJoint('Spine1',-.018*typeBlend,Math.sin(phase)*.018*speed,0,dt);
   offsetJoint('Head',.035*typeBlend+breath*.006,Math.sin(time*.0007)*.018*(1-speed),0,dt);
   for(const side of [-1,1]){
     const prefix=side<0?'Left':'Right',swing=stride*side;
     const kneeLift=Math.pow(Math.max(0,-Math.sin(phase)*side),1.6)*.95*speed;
     aim(prefix+'UpLeg',side*.055,-1+.9*sitBlend,swing*(1-sitBlend)+.95*sitBlend,dt);
     aim(prefix+'Leg',0,-1,-kneeLift*(1-sitBlend)+.06*sitBlend,dt);
     aim(prefix+'Foot',0,-.12-Math.max(0,swing)*.25*(1-sitBlend),1,dt);
     aim(prefix+'Arm',side*(.22+.06*speed-.025*typeBlend+.012*breath),-1,-swing*.78*(1-typeBlend)+.35*typeBlend,dt);
     aim(prefix+'ForeArm',side*(.045-.015*typeBlend),-1+.82*typeBlend,.18+Math.max(0,swing)*.18+.60*typeBlend+Math.sin(time*.013+side)*.018*typeBlend,dt);
     offsetJoint(prefix+'Hand',Math.sin(time*.015+side)*.025*typeBlend,0,side*.035,dt);
   }
 }};
}
