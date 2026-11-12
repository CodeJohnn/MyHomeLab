import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSolderWorkshop,solderCycle} from '../frontend/js/solder-workshop.mjs';
import {createTypingPoseSolver} from '../frontend/js/npc-typing-pose.mjs';
test('solder cycle gates contact and completes pickup, approach, solder, inspection and return',()=>{
  assert.deepEqual([.5,2,5,8,11].map(t=>solderCycle(t).stage),['pickup','approach','solder','inspect','return']);
  for(let i=0;i<1200;i++){
    const t=i/100,c=solderCycle(t);assert.equal(c.contact,t>=3&&t<7.5);
    if(c.contact){assert.equal(c.held,true);assert.equal(c.lift,0);}
    assert.ok(c.reach>=0&&c.reach<=1);
  }
  assert.deepEqual(solderCycle(12),solderCycle(0));
});
test('workshop effects reuse buffers, reset on interruption, and release private resources',()=>{
  const bench=new THREE.Group(),board=new THREE.Group();bench.add(board);
  const M=(color,metalness=0,roughness=.8)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
  const box=(parent,w,h,d,mat,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m;};
  const cyl=(parent,r,h,mat,x,y,z,n=12)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,n),mat);m.position.set(x,y,z);parent.add(m);return m;};
  for(const mobile of [false,true]){
    const fx=createSolderWorkshop({THREE,bench,board,box,cyl,M,isMobile:mobile});
    const particles=fx.effects.children.filter(n=>n.isPoints),arrays=particles.map(p=>p.geometry.attributes.position.array);
    assert.equal(arrays[0].length,(mobile?6:10)*3);assert.equal(fx.light.castShadow,false);
    let geometries=0,materials=0;
    for(const p of particles){p.geometry.addEventListener('dispose',()=>geometries++);p.material.addEventListener('dispose',()=>materials++);}
    for(let frame=0;frame<600;frame++){
      fx.reset(frame/60);assert.equal(fx.effects.visible,false);assert.equal(fx.light.intensity,0);
      fx.contact.set(.2,1.117,-.3);fx.update(frame/60,true);assert.equal(fx.effects.visible,true);
      particles.forEach((p,i)=>{assert.equal(p.geometry.attributes.position.array,arrays[i]);assert.ok(arrays[i].every(Number.isFinite));});
    }
    fx.reset(10);assert.equal(fx.effects.visible,false);
    fx.dispose();fx.dispose();assert.equal(geometries,2);assert.equal(materials,2);assert.equal(fx.effects.parent,null);
  }
});
test('right-arm IK places the iron tip on the board from every existing work position and rotated benches',()=>{
  const solver=createTypingPoseSolver(THREE);
  const candidates=[[-.18,.84,-.18,.30,Math.PI],[-.12,-.82,-.12,-.27,0],[-1.55,.02,-1,.02,Math.PI/2],[1.54,1.1,1.04,1.1,-Math.PI/2],[.74,2.09,.74,1.59,Math.PI]];
  for(const rotation of [0,.7,2.1])for(const [x,z,tx,tz,angle] of candidates){
    const scene=new THREE.Group(),bench=new THREE.Group(),root=new THREE.Group(),arm=new THREE.Group(),forearm=new THREE.Group(),keyboard=new THREE.Group();
    bench.position.set(3.1,0,-2.2);bench.rotation.y=rotation;scene.add(bench,root);bench.add(keyboard);
    root.position.copy(bench.localToWorld(new THREE.Vector3(x,-.12,z)));root.rotation.y=rotation+angle;
    arm.position.set(.184,1.2,0);root.add(arm);forearm.position.y=-.22;arm.add(forearm);
    const contact=new THREE.Vector3(tx+.035,1.117,tz+.02);
    keyboard.position.copy(contact).sub(new THREE.Vector3(.145,.063,.02));
    solver({root,arms:[arm],forearms:[forearm],upperLength:.22,lowerLength:.4075},{userData:{keyboard}},0);
    const tip=forearm.localToWorld(new THREE.Vector3(0,-.4075,0));const target=bench.localToWorld(contact);
    assert.ok(tip.distanceTo(target)<.012,`tip gap ${tip.distanceTo(target)}`);
  }
});
