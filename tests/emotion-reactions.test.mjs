import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {characterReactions,reactionFromMessage} from '../frontend/js/emotion-reactions.mjs';

test('reacoes de riso e raiva associam emoji e audio existente',()=>{
  assert.equal(reactionFromMessage('😂'),'laugh');
  assert.equal(reactionFromMessage('😡'),'anger');
  assert.equal(reactionFromMessage('mensagem comum'),null);
  assert.ok(characterReactions.laugh.audio);assert.ok(characterReactions.anger.audio);
  for(const reaction of Object.values(characterReactions)){
    if(!reaction.audio)continue;
    const appModule=new URL('../frontend/js/homelab.js',import.meta.url);
    const audio=new URL(reaction.audio,appModule);
    assert.equal(existsSync(fileURLToPath(audio)),true);
  }
});

test('novos emotes usam as nove imagens existentes e mensagens distintas no multiplayer',()=>{
  const messages=new Set();let images=0;
  for(const [type,reaction] of Object.entries(characterReactions)){
    assert.ok(reaction.label);assert.ok(reaction.emoji);
    assert.equal(reactionFromMessage(reaction.message),type);
    assert.ok(!messages.has(reaction.message));messages.add(reaction.message);
    if(reaction.image){images++;assert.ok(existsSync(fileURLToPath(new URL(reaction.image,new URL('../frontend/js/homelab.js',import.meta.url)))));}
    if(!['laugh','anger'].includes(type))assert.equal(reaction.audio,null);
  }
  assert.equal(images,9);assert.equal(Object.keys(characterReactions).length,10);
});
