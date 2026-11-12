import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createPrimitivePool} from '../frontend/js/primitive-pool.mjs';
import {mergeNpcHair} from '../frontend/js/npc-visuals.mjs';
import {createNpcWardrobe,uniformTorsoGeometry,fittedNpcLimb,NPC_UNIFORMS,drawUniform} from '../frontend/js/npc-uniforms.mjs';
import {createTypingPoseSolver} from '../frontend/js/npc-typing-pose.mjs';
const canvas=()=>({width:0,height:0,getContext(){return {canvas:this,fillRect(){},drawImage(){},save(){},restore(){},translate(){}};}});
test('NPC wardrobe caches five looks and uses the official asset',()=>{
  const image={};const wardrobe=createNpcWardrobe(THREE,{canvasFactory:canvas,imageFactory:()=>image});
  assert.ok(image.src.endsWith('/frontend/assets/guedessec.png'));
  assert.equal(new Set(NPC_UNIFORMS.map(x=>x.id)).size,5);
  for(let i=0;i<5;i++){assert.equal(wardrobe(i),wardrobe(i+5));assert.equal(wardrobe(i).torso.map.colorSpace,THREE.SRGBColorSpace);}
  image.naturalWidth=490;image.naturalHeight=531;image.onload();
});
test('official print preserves its physical aspect on both sides of the UV seam',()=>{
  const calls=[];const c=canvas();c.width=1024;c.height=512;const ctx=c.getContext();ctx.drawImage=(...a)=>calls.push(a);
  drawUniform(ctx,NPC_UNIFORMS[0],{naturalWidth:490,naturalHeight:531});
  assert.equal(calls.length,3);
  for(const [,x,y,w,h] of calls){assert.ok(Number.isFinite(x+y));assert.ok(Math.abs((w/1024*.94)/(h/512*.47)-490/531)<1e-12);}
});
test('production NPC surfaces remain attached and finite through locomotion, seating, typing and stress poses',()=>{
  const source=readFileSync(new URL('../frontend/js/homelab.js',import.meta.url),'utf8');
  const start=source.indexOf('      function createNpc('),end=source.indexOf("      createNpc('",start);
  const helperStart=source.indexOf('      function box('),helperEnd=source.indexOf('\n',helperStart);
  const scene=new THREE.Scene(),npcs=[],pool=createPrimitivePool(THREE,RoundedBoxGeometry);
  const M=color=>new THREE.MeshStandardMaterial({color});
  const wardrobe=createNpcWardrobe(THREE,{canvasFactory:canvas,imageFactory:()=>({})});
  const build=new Function('THREE','scene','npcs','primitivePool','isMobile','M','eyeMat','white','metal','npcWardrobe','mergeNpcHair','uniformTorsoGeometry','fittedNpcLimb',source.slice(helperStart,helperEnd)+source.slice(start,end)+';return createNpc;');
  const create=build(THREE,scene,npcs,pool,false,M,M('#111111'),M('#ffffff'),M('#888888'),wardrobe,mergeNpcHair,uniformTorsoGeometry,fittedNpcLimb);
  ['curly','casual','military','technician','curly'].forEach((style,i)=>create('NPC '+i,'#ba9988','#ff00ff',i,0,style));
  const solver=createTypingPoseSolver(THREE);
  for(const npc of npcs){
    assert.equal(npc.root.getObjectByName('npcCoat'),undefined);
    const parents=new Map();npc.root.traverse(n=>{if(n.isMesh)parents.set(n,n.parent);});
    for(const pose of ['idle','walk','run','sit','dance','limbs','turn','typing'])for(let frame=0;frame<60;frame++){
      const t=frame/10;for(const j of [...npc.arms,...npc.forearms,...npc.legs,...npc.knees])j.rotation.set(0,0,0);
      npc.root.rotation.y=pose==='turn'?t:0;
      if(pose==='sit'||pose==='typing'){npc.legs.forEach(j=>j.rotation.x=-Math.PI/2);npc.knees.forEach(j=>j.rotation.x=Math.PI/2);}
      if(['walk','run','dance','limbs'].includes(pose)){const amp=pose==='walk'?.35:.8;npc.legs.forEach((j,i)=>j.rotation.x=Math.sin(t*8+i*Math.PI)*amp);npc.arms.forEach((j,i)=>{j.rotation.x=-Math.sin(t*8+i*Math.PI)*amp;j.rotation.z=pose==='dance'?Math.sin(t)*.8:0;});}
      if(pose==='typing'){const keyboard=new THREE.Object3D();keyboard.position.set(npc.root.position.x,.98,.3);scene.add(keyboard);solver(npc,{userData:{keyboard}},frame*16);keyboard.removeFromParent();}
      npc.root.updateMatrixWorld(true);
      for(const [mesh,parent] of parents){assert.equal(mesh.parent,parent);assert.equal(mesh.visible,true);assert.ok(mesh.matrixWorld.elements.every(Number.isFinite));}
    }
  }
});

test('torso UV height follows physical position instead of uneven profile ring indices',()=>{
  const profile=[[.145,0],[.155,.04],[.174,.27],[.09,.47]].map(([r,y])=>new THREE.Vector2(r,y));
  const g=uniformTorsoGeometry(THREE,profile),p=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++)assert.ok(Math.abs(uv.getY(i)-p.getY(i)/.47)<1e-7);
  g.dispose();
});

test('fitted segments keep full joint radii at both animation pivots without axial flattening',()=>{
  const pool=createPrimitivePool(THREE,RoundedBoxGeometry);
  for(const [width,depth,span] of [[.14,.155,.3],[.137,.15,.32],[.13,.145,.22],[.102,.115,.25]]){
    const parent=new THREE.Group();const mesh=fittedNpcLimb(THREE,pool,parent,new THREE.MeshBasicMaterial(),{width,depth,span,name:'segment'});
    mesh.geometry.computeBoundingBox();const bounds=mesh.geometry.boundingBox;
    assert.ok(Math.abs(bounds.max.y-span/2-width/2)<1e-6);
    assert.ok(Math.abs(bounds.min.y+span/2+width/2)<1e-6);
    assert.equal(mesh.scale.y,1);
    const upper=new THREE.Vector3(0,span/2,0),lower=new THREE.Vector3(0,-span/2,0);
    mesh.updateMatrix();upper.applyMatrix4(mesh.matrix);lower.applyMatrix4(mesh.matrix);
    assert.ok(upper.length()<1e-8);assert.ok(lower.distanceTo(new THREE.Vector3(0,-span,0))<1e-8);
    for(let i=0;i<100;i++){
      parent.rotation.set(Math.sin(i)*1.5,Math.cos(i)*2,Math.sin(i*.4));parent.updateMatrixWorld(true);
      const a=parent.localToWorld(new THREE.Vector3()),b=mesh.localToWorld(new THREE.Vector3(0,span/2,0));
      assert.ok(a.distanceTo(b)<1e-8);
    }
  }
  pool.dispose();
});
