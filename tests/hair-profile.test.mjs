import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hairScalpPoint} from '../frontend/js/hair-profile.mjs';
test('cortes possuem silhuetas distintas sem perder cobertura do topo',()=>{
  const styles=['short','fade','quiff','curly','bob','long','ponytail'];
  for(const style of styles){const p=hairScalpPoint(Math.PI/2,0,style);assert.ok(p.every(Number.isFinite));assert.ok(p[1]>.2034);}
  assert.ok(hairScalpPoint(Math.PI/2,.4,'quiff')[1]>hairScalpPoint(Math.PI/2,.4,'short')[1]+.06);
  const signatures=styles.map(style=>JSON.stringify([hairScalpPoint(0,.9,style),hairScalpPoint(2,.3,style)]));
  assert.ok(new Set(signatures).size>=6);
});
