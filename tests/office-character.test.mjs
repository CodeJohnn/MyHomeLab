import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectOfficeClip,validateOfficeClips,requiredOfficeClips} from '../frontend/js/office-character-state.mjs';
import {inspectOfficeGlb} from '../scripts/validate-office-character.mjs';

test('personagem sentado ou digitando não muda para caminhada por deslocamento da cadeira',()=>{
  assert.equal(selectOfficeClip({pose:'sit',moving:true}),'Sit');
  assert.equal(selectOfficeClip({pose:'typing',moving:true}),'Typing');
  assert.equal(selectOfficeClip({pose:'mouse'}),'Typing');
  assert.equal(selectOfficeClip({pose:'toilet'}),'Sit');
  assert.equal(selectOfficeClip({moving:true}),'Walk');
  assert.equal(selectOfficeClip({waving:true}),'Wave');
  assert.equal(selectOfficeClip(),'Idle');
});
test('modelo sem clipes de interação é rejeitado, sem fallback falso para Idle',()=>{
  assert.throws(()=>validateOfficeClips([{name:'Idle'},{name:'Walk'}]),/Sit, Typing, Wave/);
  assert.doesNotThrow(()=>validateOfficeClips(requiredOfficeClips.map(name=>({name}))));
  assert.throws(()=>inspectOfficeGlb(Buffer.from('invalid')),/GLB/);
});
