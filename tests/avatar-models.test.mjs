import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {avatarModels,findModelAnimation} from '../frontend/js/avatar-model-catalog.mjs';
import {defaultAvatar,validateAvatar} from '../backend/avatar.mjs';
test('modelos do catalogo existem, sao GLB autocontidos e sao aceitos no perfil',async()=>{
  assert.equal(new Set(avatarModels.map(m=>m.id)).size,avatarModels.length);
  assert.equal(avatarModels.find(model=>model.id==='jessica')?.label,'Gostosa');
  assert.equal(avatarModels.find(model=>model.id==='plus_size')?.label,'Gostosa porte grande');
  for(const model of avatarModels){
    assert.equal(validateAvatar({...defaultAvatar,model:model.id}).model,model.id);
    if(!model.file)continue;
    assert.ok(model.height>0&&model.height<3);
    const buffer=await readFile(new URL('../frontend/assets/personagens/'+model.file,import.meta.url));
    assert.equal(buffer.readUInt32LE(0),0x46546c67);assert.equal(buffer.readUInt32LE(4),2);assert.equal(buffer.readUInt32LE(8),buffer.length);
    const length=buffer.readUInt32LE(12),json=JSON.parse(buffer.subarray(20,20+length).toString());
    assert.ok(json.meshes.length);assert.ok([...(json.images||[]),...(json.buffers||[])].every(item=>!item.uri||item.uri.startsWith('data:')));
    if(json.animations?.length)assert.ok(findModelAnimation(json.animations,'Idle'),model.label+' tem animacao parada');
  }
});
test('animacoes com prefixos repetidos sao reconhecidas sem confundir Walk_Gun com Walk',()=>{
  const clips=[{name:'Rig|Walk_Gun'},{name:'Rig|Rig|Walk|Rig|Walk'},{name:'Rig|Idle_Neutral'},{name:'Rig|Idle'}];
  assert.equal(findModelAnimation(clips,'Walk'),clips[1]);assert.equal(findModelAnimation(clips,'Idle'),clips[3]);assert.equal(findModelAnimation(clips,'Wave'),undefined);
});

test('copias otimizadas reduzem triangulos e tamanho preservando os modelos originais',async()=>{
  async function metrics(file){const buffer=await readFile(new URL('../frontend/assets/personagens/'+file,import.meta.url)),json=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString());let triangles=0;for(const mesh of json.meshes)for(const primitive of mesh.primitives)triangles+=json.accessors[primitive.indices??primitive.attributes.POSITION].count/3;return {bytes:buffer.length,triangles,skins:json.skins?.length||0,extras:json.asset.extras};}
  for(const [original,optimized] of [['femalesex.glb','feminina-optimized.glb'],['gostosa.glb','jessica-optimized.glb'],['blonde_woman_black_bikini_blue_eyes.glb','blonde-woman-optimized.glb'],['gostosa porte grande.glb','plus-size-optimized.glb']]){
    const before=await metrics(original),after=await metrics(optimized);assert.ok(after.triangles<before.triangles*.4);assert.ok(after.bytes<before.bytes*.3);if(optimized!=='plus-size-optimized.glb')assert.equal(after.skins,before.skins);if(before.extras)assert.deepEqual(after.extras,before.extras);
    if(optimized==='blonde-woman-optimized.glb'){assert.ok(after.bytes<12*1024*1024);assert.equal(after.extras.author,'Pigcraft (https://sketchfab.com/s8819296)');assert.match(after.extras.license,/CC-BY-4\.0/);assert.ok(after.extras.source.includes('sketchfab.com/3d-models/'));}
    if(optimized==='plus-size-optimized.glb'){assert.ok(after.bytes<2*1024*1024);assert.equal(after.extras.author,'HN Studio (https://sketchfab.com/mehtabdeveloper)');assert.match(after.extras.license,/CC-BY-4\.0/);assert.ok(after.extras.source.includes('sketchfab.com/3d-models/'));}
  }
});
