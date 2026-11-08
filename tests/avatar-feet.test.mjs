import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createPlayerAvatar} from '../frontend/js/player-avatar.mjs';

test('solas do avatar padrao ficam acima do piso',()=>{
  const previousDocument=globalThis.document;
  globalThis.document={createElementNS(){return {addEventListener(){},removeEventListener(){},set src(value){this._src=value;}}}};
  try{
    const {avatar}=createPlayerAvatar({THREE,RoundedBoxGeometry});
    const bounds=new THREE.Box3().setFromObject(avatar);
    assert.ok(bounds.min.y>=0&&bounds.min.y<.01,'altura minima: '+bounds.min.y);
  }finally{
    if(previousDocument===undefined)delete globalThis.document;
    else globalThis.document=previousDocument;
  }
});
