import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {characterReactions,reactionFromMessage} from '../frontend/js/emotion-reactions.mjs';

test('reacoes associam mensagens a emoticons reconhecidos',()=>{
  assert.equal(reactionFromMessage('😂'),'laugh');
  assert.equal(reactionFromMessage('😡'),'anger');
  assert.equal(reactionFromMessage('😢'),'sad');
  assert.equal(reactionFromMessage('😮'),'surprise');
  assert.equal(reactionFromMessage('mensagem comum'),null);
  for(const reaction of Object.values(characterReactions).filter(value=>value.audio)){
    const appModule=new URL('../frontend/js/homelab.js',import.meta.url);
    const audio=new URL(reaction.audio,appModule);
    assert.equal(existsSync(fileURLToPath(audio)),true);
  }
});
