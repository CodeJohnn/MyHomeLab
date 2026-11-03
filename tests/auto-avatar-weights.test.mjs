import {test} from 'node:test';
import assert from 'node:assert/strict';
import {autoAvatarWeights} from '../frontend/js/auto-avatar-weights.mjs';
test('articulacao automatica distribui pesos normalizados, finitos e simetricos',()=>{
  for(const profile of [{},{hips:.30,shoulder:.53,head:.66,armEdge:.15},{hips:.36,shoulder:.63,head:.72,armEdge:.16}]){
    for(let y=0;y<=2;y+=.03)for(let x=-.8;x<=.8;x+=.04){
      const {indices,weights}=autoAvatarWeights(x,y,2,profile);
      assert.equal(indices.length,4);assert.equal(weights.length,4);assert.ok(indices.every(i=>Number.isInteger(i)&&i>=0&&i<11));
      assert.ok(weights.every(w=>Number.isFinite(w)&&w>=0&&w<=1));assert.ok(Math.abs(weights.reduce((a,b)=>a+b,0)-1)<1e-8);
    }
  }
  const left=autoAvatarWeights(-.18,.3,2),right=autoAvatarWeights(.18,.3,2);
  assert.deepEqual(left.weights,right.weights);assert.equal(right.indices[0],left.indices[0]+1);
  assert.equal(autoAvatarWeights(0,1.9,2).indices[0],2);
});
