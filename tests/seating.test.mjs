import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chairPoseProfile,seatedLegAngles} from '../frontend/js/seating.mjs';

test('quadril fica sobre cada assento e coxas ficam horizontais',()=>{
  for(const [id,top] of [['cadeira',.84],['setupVitoria-chair',.84],['cadeiraLeitura',.555],['cadeiraSolda',.64],['cadeiraAdminTI',.575],['cadeiraManutencaoTI',.575]]){
    const {offset}=chairPoseProfile(id);
    assert.ok(Math.abs(offset.y+.68-.085-top)<1e-10,id);
    assert.ok(Math.abs(offset.z)<.1,id);
  }
  assert.ok(Math.abs(Math.cos(seatedLegAngles.hip))<1e-10);
  assert.equal(seatedLegAngles.hip+seatedLegAngles.knee,0);
  assert.equal(chairPoseProfile('cadeiraLeitura').facing,Math.PI);
  assert.equal(chairPoseProfile('cadeira').facing,0);
});
