import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {mergeNpcHair} from '../frontend/js/npc-visuals.mjs';

test('cabelo agrupado preserva forma, material e pivôs de expressao com menos meshes',()=>{
  const head=new THREE.Group(),material=new THREE.MeshStandardMaterial();
  let vertices=0;
  for(let i=0;i<36;i++){
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(.057,12,8),material);
    mesh.position.set(Math.cos(i)*.19,.16-i%5*.05,Math.sin(i)*.19);
    mesh.scale.set(.8,1.1,.55);mesh.rotation.z=i*.1;
    vertices+=mesh.geometry.index.count;head.add(mesh);
  }
  const eye=new THREE.Group(),eyelash=new THREE.Mesh(new THREE.SphereGeometry(.01,8,6),material);
  eye.add(eyelash);head.add(eye);
  const before=new THREE.Box3().setFromObject(head,true);
  mergeNpcHair(THREE,head,material);
  const hair=head.getObjectByName('npcHair'),after=new THREE.Box3().setFromObject(head,true);
  assert.equal(head.children.length,2);assert.equal(eyelash.parent,eye);
  assert.equal(hair.material,material);assert.equal(hair.geometry.attributes.position.count,vertices);
  assert.ok(before.min.distanceTo(after.min)<1e-6&&before.max.distanceTo(after.max)<1e-6);
  assert.ok(hair.geometry.attributes.normal.array.every(Number.isFinite));
  assert.equal(hair.castShadow,true);
  head.rotation.y=.6;eye.scale.y=.1;
  assert.equal(eyelash.parent,eye);assert.equal(hair.parent,head);
  hair.geometry.dispose();eyelash.geometry.dispose();material.dispose();
});
