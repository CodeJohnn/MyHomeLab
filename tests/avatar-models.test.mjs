import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {avatarModels,findModelAnimation} from '../frontend/js/avatar-model-catalog.mjs';
import {defaultAvatar,validateAvatar} from '../backend/avatar.mjs';
test('modelos do catalogo existem, sao GLB autocontidos e sao aceitos no perfil',async()=>{
  assert.equal(new Set(avatarModels.map(m=>m.id)).size,avatarModels.length);
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

test('modelos removidos nao podem ser selecionados no perfil',()=>{
  for(const model of ["gnomo","mini","negao","noia","female_bikini","jessica","blonde_woman","plus_size","hinata","sakura","n18"]){
    assert.equal(avatarModels.find(item=>item.id===model),undefined);
    assert.equal(validateAvatar({...defaultAvatar,model}),null);
  }
});
