import {test} from 'node:test';
import assert from 'node:assert/strict';
import {trackWorldAssets} from '../frontend/js/world-loading.mjs';
test('mundo aguarda o fim dos recursos reais antes de liberar entrada',async()=>{
  const manager={},progress=[];const tracker=trackWorldAssets(manager,(loaded,total)=>progress.push([loaded,total]));
  manager.onStart('avatar',0,2);let ready=false;const waiting=tracker.wait().then(()=>{ready=true;});
  manager.onProgress('avatar',1,2);await Promise.resolve();assert.equal(ready,false);
  manager.onProgress('texture',2,2);manager.onLoad();await waiting;
  assert.equal(ready,true);assert.deepEqual(progress,[[1,2],[2,2]]);tracker.dispose();
});
test('falha de recurso não sinaliza mundo pronto e preserva callbacks anteriores',async()=>{
  let prior=0;const previous=()=>prior++;const manager={onLoad:previous};const tracker=trackWorldAssets(manager);
  manager.onStart('texture',0,1);manager.onError('texture');manager.onLoad();
  await assert.rejects(()=>tracker.wait(),/recursos do mundo/);assert.equal(prior,1);
  tracker.dispose();assert.equal(manager.onLoad,previous);
});
test('mundo sem requisições pendentes pode aguardar seu primeiro quadro',async()=>{
  const tracker=trackWorldAssets({});await tracker.wait();tracker.dispose();
});
