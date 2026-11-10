import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import * as THREE from 'three';
import {encodeRgbaPng} from '../scripts/lib/png.mjs';
import {createTerminalScreen} from '../frontend/js/terminal-screen.mjs';
import {createAvatarPortraits} from '../frontend/js/avatar-portraits.mjs';
import {createCharacterHover} from '../frontend/js/character-hover.mjs';
import {createRoomAudio} from '../frontend/js/room-audio.mjs';
import {saoPauloTime} from '../frontend/js/daylight.mjs';
import {createLightBudget} from '../frontend/js/light-budget.mjs';
import {createMobileContactShadows} from '../frontend/js/mobile-contact-shadows.mjs';

function replaceGlobals(values){
  const previous=Object.fromEntries(Object.keys(values).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  Object.assign(globalThis,values);
  return ()=>{for(const [key,descriptor] of Object.entries(previous)){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}};
}

test('terminal preserva dimensões, texto, cores, cursor e cadência desktop/mobile',()=>{
  for(const isMobile of [false,true]){
    const calls=[],ctx={fillRect(...args){calls.push(['rect',this.fillStyle,...args]);},fillText(...args){calls.push(['text',this.fillStyle,...args]);}};
    const canvas={getContext:()=>ctx};
    const restore=replaceGlobals({document:{createElement:()=>canvas}});
    try{
      const terminal=createTerminalScreen({THREE,isMobile});
      assert.equal(canvas.width,900);assert.equal(canvas.height,510);
      assert.equal(terminal.material.map.colorSpace,THREE.SRGBColorSpace);
      assert.equal(terminal.material.toneMapped,false);
      terminal.paint(0);
      assert.equal(calls.filter(call=>call[0]==='text').length,14);
      assert.ok(calls.some(call=>call[0]==='text'&&call[2]==='\u25cf  \u25cf  \u25cf   ubuntu@bibliotecadealexandria: ~'));
      assert.deepEqual(calls[0],['rect','#07120f',0,0,900,510]);
      assert.ok(calls.some(call=>call[0]==='text'&&call[1]==='#70ffad'&&call[2]==='$ npm run dev'));
      assert.deepEqual(calls.at(-1),['rect','#42e29a',24,500,6,3]);
      const count=calls.length;
      terminal.paint(isMobile?99:49);assert.equal(calls.length,count);
      terminal.paint(isMobile?100:50);assert.equal(calls.length,count*2);
      assert.deepEqual(calls.at(-1),['rect','#42e29a',24,500,12,3]);
      let disposed=0;
      terminal.material.addEventListener('dispose',()=>disposed++);
      terminal.material.map.addEventListener('dispose',()=>disposed++);
      terminal.dispose();terminal.dispose();terminal.paint(500);
      assert.equal(disposed,2);assert.equal(calls.length,count*2);
    }finally{restore();}
  }
});

test('encoder PNG compartilha RGBA sem mudar pixels, canais ou ordem das linhas',()=>{
  const pixels=Buffer.from([255,0,0,255,0,255,0,128,0,0,255,255,255,255,255,0]);
  const png=encodeRgbaPng(2,2,pixels),chunks=[];
  assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  for(let offset=8;offset<png.length;){
    const size=png.readUInt32BE(offset),type=png.toString('ascii',offset+4,offset+8);
    chunks.push({type,data:png.subarray(offset+8,offset+8+size)});offset+=size+12;
  }
  assert.deepEqual(chunks.map(chunk=>chunk.type),['IHDR','IDAT','IEND']);
  assert.equal(chunks[0].data.readUInt32BE(0),2);assert.equal(chunks[0].data.readUInt32BE(4),2);
  assert.deepEqual([...chunks[0].data.subarray(8)],[8,6,0,0,0]);
  assert.deepEqual(inflateSync(chunks[1].data),Buffer.concat([Buffer.from([0]),pixels.subarray(0,8),Buffer.from([0]),pixels.subarray(8)]));
});

test('retratos cancelam frames pendentes e resolvem promessas ao descartar',async()=>{
  const frames=new Map();let next=0,captures=0,disposed=0;
  const restore=replaceGlobals({requestAnimationFrame:fn=>{frames.set(++next,fn);return next;},cancelAnimationFrame:id=>frames.delete(id)});
  class Target extends THREE.WebGLRenderTarget{constructor(...args){super(...args);this.addEventListener('dispose',()=>disposed++);}}
  try{
    const portraits=createAvatarPortraits({THREE:{...THREE,WebGLRenderTarget:Target},renderer:{},getCharacter(){captures++;}});
    const first=portraits.get({avatar:{shirt:'#123'}}),same=portraits.get({avatar:{shirt:'#123'}});
    const second=portraits.get({avatar:{shirt:'#456'}});
    assert.equal(first,same);assert.equal(frames.size,2);
    portraits.dispose();portraits.dispose();
    assert.deepEqual(await Promise.all([first,second]),[null,null]);
    assert.equal(frames.size,0);assert.equal(captures,0);assert.equal(disposed,1);
    assert.equal(await portraits.get({avatar:{}}),null);assert.equal(frames.size,0);
  }finally{restore();}
});

test('retratos concluídos reutilizam cache e restauram o estado compartilhado do renderer',async()=>{
  const frames=[],source=new THREE.Group();
  const geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial();source.add(new THREE.Mesh(geometry,material));
  let renders=0,firstPixel;
  const ctx={createImageData:()=>({data:new Uint8ClampedArray(96*96*4)}),putImageData(pixels){firstPixel=pixels.data[0];}};
  const restore=replaceGlobals({requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},cancelAnimationFrame(){},document:{createElement:()=>({getContext:()=>ctx,toDataURL:()=> 'data:image/png;base64,portrait'})}});
  const originalTarget={},renderer={
    target:originalTarget,clearColor:new THREE.Color('#336699'),alpha:.3,
    shadowMap:{enabled:true},toneMappingExposure:1.7,autoClear:false,
    getRenderTarget(){return this.target;},setRenderTarget(target){this.target=target;},
    getClearColor(color){return color.copy(this.clearColor);},getClearAlpha(){return this.alpha;},
    setClearColor(color,alpha){this.clearColor.set(color);this.alpha=alpha;},
    render(){renders++;},readRenderTargetPixels(target,x,y,width,height,bytes){
      for(let row=0;row<height;row++)bytes.fill(row,row*width*4,(row+1)*width*4);
    }
  };
  try{
    const portraits=createAvatarPortraits({THREE,renderer,getCharacter:()=>source}),member={avatar:{hairStyle:'short'}};
    const pending=portraits.get(member);frames.shift()(0);
    assert.equal(await pending,'data:image/png;base64,portrait');assert.equal(firstPixel,95);
    assert.equal(await portraits.get(member),'data:image/png;base64,portrait');assert.equal(renders,1);assert.equal(frames.length,0);
    assert.equal(renderer.target,originalTarget);assert.equal(renderer.clearColor.getHexString(),'336699');
    assert.equal(renderer.alpha,.3);assert.equal(renderer.shadowMap.enabled,true);
    assert.equal(renderer.toneMappingExposure,1.7);assert.equal(renderer.autoClear,false);
    portraits.dispose();
  }finally{geometry.dispose();material.dispose();restore();}
});

test('sair do canvas cancela o tooltip pendente e não o reabre depois',()=>{
  const frames=new Map(),window=new EventTarget(),canvas=new EventTarget();
  const card={hidden:false,setAttribute(){},remove(){this.removed=true;}};
  const restore=replaceGlobals({
    document:{createElement:()=>card,body:{append(){}}},
    addEventListener:window.addEventListener.bind(window),removeEventListener:window.removeEventListener.bind(window),
    setTimeout:fn=>{frames.set(1,fn);return 1;},clearTimeout:id=>frames.delete(id)
  });
  try{
    const hover=createCharacterHover({THREE,canvas,isEnabled:()=>true});
    canvas.dispatchEvent(Object.assign(new Event('pointermove'),{pointerType:'mouse',buttons:0,clientX:5,clientY:5}));
    assert.equal(frames.size,1);
    canvas.dispatchEvent(new Event('pointerleave'));
    assert.equal(frames.size,0);assert.equal(card.hidden,true);
    hover.dispose();assert.equal(card.removed,true);
  }finally{restore();}
});

test('áudio mantém rádio, cinco ruídos ambiente e ventoinha sem sintetizador duplicado',async()=>{
  const listeners=[],document=Object.assign(new EventTarget(),{hidden:false}),window=new EventTarget();
  const originalAdd=document.addEventListener.bind(document);
  document.addEventListener=(type,callback,options)=>{listeners.push(type);originalAdd(type,callback,options);};
  let radio,context;
  class Radio extends EventTarget{
    constructor(){super();radio=this;this.paused=true;this.readyState=4;this.volume=0;}
    async play(){this.paused=false;}
    pause(){this.paused=true;}
  }
  const param=()=>({value:0,setTargetAtTime(){},cancelScheduledValues(){}});
  const node=()=>({connect(){},start(){},gain:param(),frequency:param(),Q:{value:0}});
  window.AudioContext=class{
    constructor(){context=this;this.sampleRate=100;this.state='running';this.currentTime=0;this.sources=0;this.oscillators=[];}
    createGain(){return node();}
    createBuffer(){return {getChannelData:()=>new Float32Array(300)};}
    createBufferSource(){this.sources++;return node();}
    createBiquadFilter(){return node();}
    createOscillator(){const oscillator=node();this.oscillators.push(oscillator);return oscillator;}
    async close(){this.state='closed';}
  };
  const restore=replaceGlobals({document,window,Audio:Radio,localStorage:{getItem:()=>null,setItem(){}}});
  try{
    const audio=createRoomAudio();await Promise.resolve();await Promise.resolve();
    assert.equal(listeners.filter(type=>type==='pointerdown').length,1);
    assert.equal(listeners.filter(type=>type==='keydown').length,1);
    document.dispatchEvent(new Event('pointerdown'));
    assert.equal(context.sources,5);assert.equal(context.oscillators.length,1);
    assert.equal(context.oscillators[0].frequency.value,92);
    audio.update({x:0,z:0},false,false,{speaker:{x:0,z:0}});
    assert.equal(radio.volume,.25);assert.equal(audio.playing,true);
    audio.update({x:0,z:0},true,false,{speaker:{x:0,z:0}});assert.equal(radio.volume,.25*.15);
    await audio.toggleRadio();assert.equal(radio.paused,true);
    await audio.toggleRadio();assert.equal(radio.paused,false);
    document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));assert.equal(radio.volume,0);
    window.dispatchEvent(new Event('pagehide'));assert.equal(context.state,'closed');assert.equal(radio.paused,true);
  }finally{restore();}
});

test('relógio reutilizado preserva fuso brasileiro e mudança de dia',()=>{
  assert.deepEqual(saoPauloTime(new Date('2026-11-09T02:59:30Z')),{hour:23+59/60+30/3600,label:'23:59'});
  assert.deepEqual(saoPauloTime(new Date('2026-11-09T03:00:00Z')),{hour:0,label:'00:00'});
});

test('orçamento de luzes mantém seleção, limites, desempates e intervalo originais',()=>{
  for(const isMobile of [false,true]){
    const scene=new THREE.Scene(),lights=[];
    for(let index=0;index<26;index++){
      const light=index<16?new THREE.PointLight('#fff',1):new THREE.SpotLight('#fff',1);
      light.position.set(index%5,0,Math.floor(index/5));scene.add(light);lights.push(light);
    }
    let vectors=0;
    class Vector extends THREE.Vector3{constructor(...args){super(...args);vectors++;}}
    const budget=createLightBudget({THREE:{...THREE,Vector3:Vector},scene,isMobile});
    const allocated=vectors;
    for(const [step,focus] of [new THREE.Vector3(5,0,4),new THREE.Vector3(-5,0,0),new THREE.Vector3()].entries()){
      if(step===2)for(const light of lights)light.intensity=0;
      budget.update(step*250,focus);
      const expected=new Set();
      for(const spot of [false,true]){
        const ranked=lights.filter(light=>!!light.isSpotLight===spot).map(light=>({light,score:light.intensity/(1+light.getWorldPosition(new THREE.Vector3()).distanceToSquared(focus))}));
        ranked.sort((a,b)=>b.score-a.score);
        for(const {light} of ranked.slice(0,spot?8:isMobile?2:4))expected.add(light);
      }
      assert.deepEqual(lights.map(light=>light.visible),lights.map(light=>expected.has(light)));
      const before=lights.map(light=>light.visible);
      budget.update(step*250+249,new THREE.Vector3(100,100,100));
      assert.deepEqual(lights.map(light=>light.visible),before);
    }
    assert.equal(vectors,allocated);
  }
});

test('sombras móveis preservam geometria e acompanham movimento sem alocações de vetores por atualização',()=>{
  const restore=replaceGlobals({document:{createElement:()=>({getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})}});
  try{
    const scene=new THREE.Scene();
    const object=new THREE.Mesh(new THREE.BoxGeometry(2,.1,1),new THREE.MeshBasicMaterial());
    object.position.y=0;scene.add(object);
    let allocations=0;
    class Vector extends THREE.Vector3{constructor(...args){super(...args);allocations++;}}
    class Box extends THREE.Box3{constructor(...args){super(...args);allocations++;}}
    const shadows=createMobileContactShadows({THREE:{...THREE,Vector3:Vector,Box3:Box},scene,objects:[{kind:'floor',g:object},{kind:'wall',g:object}]});
    const mesh=scene.children.find(child=>child!==object),allocated=allocations;
    assert.equal(scene.children.length,2);
    for(let step=0;step<5;step++){
      object.position.set(step*.1,step===2?.5:0,step*-.2);object.rotation.y=step*.17;object.scale.x=1+step*.1;
      shadows.update(step*200);
      assert.equal(mesh.visible,object.position.y<.25);
      if(mesh.visible){
        const bounds=new THREE.Box3().setFromObject(object),center=bounds.getCenter(new THREE.Vector3());
        assert.deepEqual(mesh.position.toArray(),[center.x,.038,center.z]);
        assert.deepEqual(mesh.scale.toArray(),[Math.min(5,bounds.max.x-bounds.min.x+.35),Math.min(3,bounds.max.z-bounds.min.z+.35),1]);
      }
    }
    assert.equal(allocations,allocated);
    assert.equal(mesh.geometry.parameters.width,1);assert.equal(mesh.material.depthWrite,false);
    let disposed=0;
    for(const resource of [mesh.geometry,mesh.material,mesh.material.map])resource.addEventListener('dispose',()=>disposed++);
    shadows.dispose();shadows.dispose();shadows.update(2000);
    assert.equal(disposed,3);assert.equal(scene.children.length,1);
    object.geometry.dispose();object.material.dispose();
  }finally{restore();}
});
