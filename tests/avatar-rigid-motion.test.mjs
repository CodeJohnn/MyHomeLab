import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rigidAvatarMotion} from '../frontend/js/avatar-rigid-motion.mjs';
import {avatarModels} from '../frontend/js/avatar-model-catalog.mjs';
import {readFile} from 'node:fs/promises';
test('movimento seguro de modelos estaticos e limitado e nao altera a malha',()=>{
  for(let time=0;time<100;time+=.07)for(const moving of [true,false]){const motion=rigidAvatarMotion(time,moving);assert.ok(Number.isFinite(motion.y)&&Number.isFinite(motion.z));assert.ok(Math.abs(motion.y)<=.012);assert.ok(Math.abs(motion.z)<=.009);}
  assert.ok(Object.values(rigidAvatarMotion(NaN,false)).every(Number.isFinite));
});
test('modelos sem animacao usam movimento rigido e os animados preservam os clipes',async()=>{
  for(const model of avatarModels){if(!model.file)continue;const buffer=await readFile(new URL('../frontend/assets/personagens/'+model.file,import.meta.url)),json=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString());assert.equal(model.motion==='rigid',!json.animations?.length,model.id);}
});
