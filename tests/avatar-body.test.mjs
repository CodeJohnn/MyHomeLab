import {test} from 'node:test';
import assert from 'node:assert/strict';
import {feminineBustOffset,applyBodyShape} from '../frontend/js/avatar-body.mjs';
test('formato do torso e simetrico e volta exatamente a base ao trocar personagem',()=>{
  assert.equal(feminineBustOffset(.08,1.1),feminineBustOffset(-.08,1.1));
  const position={array:new Float32Array([.08,.315,.20,-.08,.315,-.20]),count:2,setXYZ(i,x,y,z){this.array.set([x,y,z],i*3);}};
  const geometry={attributes:{position},clone(){return this;},computeVertexNormals(){},computeBoundingSphere(){}};
  const node={userData:{avatarTorso:true},geometry,scale:{x:1}};const original=Array.from(position.array);
  applyBodyShape(node,'feminine');assert.ok(position.array[2]>original[2]);assert.equal(position.array[5],original[5]);
  applyBodyShape(node,'masculine');assert.deepEqual(Array.from(position.array),original);
});
