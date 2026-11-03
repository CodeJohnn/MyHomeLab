import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {characterReactions,reactionFromMessage} from '../frontend/js/emotion-reactions.mjs';

test('reacoes de riso e raiva associam emoji e audio existente',()=>{
  assert.equal(reactionFromMessage('😂'),'laugh');
  assert.equal(reactionFromMessage('😡'),'anger');
  assert.equal(reactionFromMessage('mensagem comum'),null);
  for(const reaction of Object.values(characterReactions)){
    const appModule=new URL('../frontend/js/homelab.js',import.meta.url);
    const audio=new URL(reaction.audio,appModule);
    assert.equal(existsSync(fileURLToPath(audio)),true);
  }
});
