import {test} from 'node:test';
import assert from 'node:assert/strict';

function loadingDocument(){
  const make=()=>({style:{},dataset:{},attributes:{},open:false,textContent:'',
    setAttribute(key,value){this.attributes[key]=value;},addEventListener(){},
    append(){},before(){},after(){},showModal(){this.open=true;},close(){this.open=false;},
    classList:{values:new Set(),add(value){this.values.add(value);},remove(value){this.values.delete(value);},contains(value){return this.values.has(value);}}
  });
  const nodes=new Map();let overlay;
  return {get overlay(){return overlay;},body:{append(){}},createElement(tag){
    const element=make();if(tag==='dialog'){
      overlay=element;
      element.querySelector=selector=>{if(!nodes.has(selector))nodes.set(selector,make());return nodes.get(selector);};
    }return element;
  }};
}

test('corredor acompanha progresso real e entrada espera a comemoracao sem duplicar conclusao',async()=>{
  const prior={document:globalThis.document,requestAnimationFrame:globalThis.requestAnimationFrame,matchMedia:globalThis.matchMedia};
  const document=loadingDocument();globalThis.document=document;
  globalThis.requestAnimationFrame=callback=>{queueMicrotask(callback);return 1;};
  globalThis.matchMedia=()=>({matches:false});
  try{
    const loading=await import('../frontend/js/room-loading.mjs?runner-normal');
    await loading.showRoomLoading();
    const overlay=document.overlay,runner=overlay.querySelector('.roomLoadingRunner');
    assert.equal(runner.style.left,'0%');
    loading.updateRoomLoading(42,'Texturas');assert.equal(runner.style.left,'42%');
    loading.updateRoomLoading(10);assert.equal(runner.style.left,'42%');
    loading.updateRoomLoading(NaN);assert.equal(runner.style.left,'42%');
    loading.updateRoomLoading(100);assert.equal(runner.style.left,'99%','world readiness owns 100%');
    const completion=loading.completeRoomLoading();
    assert.equal(loading.completeRoomLoading(),completion);
    assert.equal(runner.style.left,'100%');assert.equal(overlay.open,true);
    assert.equal(overlay.classList.contains('isComplete'),true);
    let entered=false;const entry=loading.waitForWorldEntry().then(ready=>{entered=ready;});
    await Promise.resolve();assert.equal(entered,false);
    await completion;await entry;
    assert.equal(entered,true);assert.equal(overlay.open,false);
  }finally{Object.assign(globalThis,prior);}
});

test('cancelamento interrompe comemoracao e permite nova tentativa com movimento reduzido',async()=>{
  const prior={document:globalThis.document,requestAnimationFrame:globalThis.requestAnimationFrame,matchMedia:globalThis.matchMedia};
  const document=loadingDocument();globalThis.document=document;
  globalThis.requestAnimationFrame=callback=>{queueMicrotask(callback);return 1;};globalThis.matchMedia=()=>({matches:true});
  try{
    const loading=await import('../frontend/js/room-loading.mjs?runner-retry');
    await loading.showRoomLoading();const cancelled=loading.completeRoomLoading();
    loading.hideRoomLoading();await cancelled;
    assert.equal(document.overlay.open,false);
    await loading.showRoomLoading();
    assert.equal(document.overlay.querySelector('.roomLoadingRunner').style.left,'0%');
    assert.equal(document.overlay.classList.contains('isComplete'),false);
    await loading.completeRoomLoading();assert.equal(document.overlay.open,false);
  }finally{Object.assign(globalThis,prior);}
});
