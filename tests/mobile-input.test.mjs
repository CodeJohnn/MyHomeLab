import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getEventListeners} from 'node:events';
import {joystickVector,createTouchControls,createTouchClickGuard,rotateMovement} from '../frontend/js/touch-controls.mjs';
import {createAdaptiveResolution} from '../frontend/js/adaptive-resolution.mjs';
import {visibleViewport,trackMobileViewport} from '../frontend/js/mobile-viewport.mjs';

const pointer=(type,id,x=60,y=60)=>Object.assign(new Event(type,{cancelable:true}),{pointerId:id,clientX:x,clientY:y,button:0});

test('tap não executa a interação duas vezes no click sintetizado e mantém mouse híbrido',()=>{
  let time=0;const guard=createTouchClickGuard(()=>time);
  assert.equal(guard.ignore({}),false);
  guard.recordTap();time=100;
  assert.equal(guard.ignore({}),true);assert.equal(guard.ignore({pointerType:'touch'}),true);
  assert.equal(guard.ignore({pointerType:'mouse'}),false);
  assert.equal(guard.ignore({sourceCapabilities:{firesTouchEvents:true}}),true);
  time=501;assert.equal(guard.ignore({}),false);
});

test('joystick analógico tem zona morta, oito direções e velocidade diagonal limitada',()=>{
  assert.deepEqual(joystickVector(0,0,40),{x:0,z:0});
  assert.deepEqual(joystickVector(3,0,40),{x:0,z:0});
  for(const [x,z] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
    const vector=joystickVector(x*100,z*100,40);
    assert.ok(Math.abs(Math.hypot(vector.x,vector.z)-1)<1e-10);
    assert.equal(Math.sign(vector.x),Math.sign(x));assert.equal(Math.sign(vector.z),Math.sign(z));
  }
  const slow=joystickVector(20,0,40);assert.ok(slow.x>0&&slow.x<.5);assert.equal(slow.z,0);
});

test('direção do joystick acompanha a câmera sem aumentar velocidade ou alocar buffers',()=>{
  const buffer={x:0,z:0};
  assert.equal(rotateMovement(0,-1,Math.PI/2,buffer),buffer);
  assert.ok(Math.abs(buffer.x+1)<1e-10);assert.ok(Math.abs(buffer.z)<1e-10);
  rotateMovement(1,0,Math.PI/2,buffer);assert.ok(Math.abs(buffer.z+1)<1e-10);
  for(const yaw of [0,.7,Math.PI,Math.PI*1.5]){
    rotateMovement(.3,.4,yaw,buffer);assert.ok(Math.abs(Math.hypot(buffer.x,buffer.z)-.5)<1e-10);
  }
});

test('joystick isola pointers, permite ação simultânea e libera captura em cancelamento/rotação',()=>{
  const document=Object.assign(new EventTarget(),{hidden:false}),win=Object.assign(new EventTarget(),{document});
  const pad=new EventTarget(),stick={style:{},getBoundingClientRect:()=>({width:40})},captured=new Set(),vectors=[],actions=[];
  pad.getBoundingClientRect=()=>({left:0,top:0,width:120,height:120});
  pad.setPointerCapture=id=>captured.add(id);pad.hasPointerCapture=id=>captured.has(id);pad.releasePointerCapture=id=>captured.delete(id);
  const root=Object.assign(new EventTarget(),{querySelector:selector=>selector==='.touchJoystick'?pad:stick,closest:()=>({dataset:{touchAction:'sit'}})});
  let allowed=true;
  const controls=createTouchControls({root,win,isEnabled:()=>allowed,onMove:v=>vectors.push(v),onAction:action=>actions.push(action)});
  try{
    pad.dispatchEvent(pointer('pointerdown',1,90,60));assert.ok(vectors.at(-1).x>0);assert.equal(captured.size,1);
    const before=vectors.length;pad.dispatchEvent(pointer('pointermove',2,0,60));assert.equal(vectors.length,before);
    root.dispatchEvent(new Event('click'));assert.deepEqual(actions,['sit']);assert.equal(captured.size,1);
    pad.dispatchEvent(pointer('pointercancel',2));assert.equal(captured.size,1);
    pad.dispatchEvent(pointer('pointercancel',1));assert.equal(captured.size,0);assert.deepEqual(vectors.at(-1),{x:0,z:0});
    pad.dispatchEvent(pointer('pointerdown',3,60,10));assert.ok(vectors.at(-1).z<0);
    const offset=Number(stick.style.transform.match(/,(-?[\d.]+)px/)[1]);assert.ok(Math.abs(offset)+20<=60);
    win.dispatchEvent(new Event('resize'));assert.equal(captured.size,0);assert.deepEqual(vectors.at(-1),{x:0,z:0});
    allowed=false;const count=vectors.length;pad.dispatchEvent(pointer('pointerdown',4,100,60));assert.equal(vectors.length,count);
    root.dispatchEvent(new Event('click'));assert.equal(actions.length,1);
    allowed=true;pad.dispatchEvent(pointer('pointerdown',5,90,60));controls.setEnabled(false);
    assert.equal(root.hidden,true);assert.equal(captured.size,0);
    controls.setEnabled(true);pad.dispatchEvent(pointer('pointerdown',6,90,60));
    document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));assert.equal(captured.size,0);
    document.hidden=false;pad.dispatchEvent(pointer('pointerdown',7,90,60));win.dispatchEvent(new Event('blur'));assert.equal(captured.size,0);
    controls.dispose();controls.dispose();
    assert.equal(getEventListeners(pad,'pointermove').length,0);assert.equal(getEventListeners(win,'resize').length,0);
    assert.equal(getEventListeners(document,'visibilitychange').length,0);
  }finally{controls.dispose();}
});

test('resolução só cai após lentidão sustentada e recupera sem ultrapassar limites',()=>{
  const changes=[],resolution=createAdaptiveResolution({enabled:true,initialRatio:1.6,onChange:value=>changes.push(value)});
  let time=0;
  for(let frame=0;frame<70;frame++){time+=50;resolution.sample(time);}
  assert.equal(changes.length,0);
  for(let frame=0;frame<2000;frame++){time+=50;resolution.sample(time);}
  assert.equal(resolution.ratio,.8);assert.ok(changes.length<=6);
  const low=changes.length;
  for(let frame=0;frame<4000;frame++){time+=1000/30;resolution.sample(time);}
  assert.equal(resolution.ratio,1.6);assert.ok(changes.length>low);
  assert.ok(changes.every(value=>value>=.8&&value<=1.6));
  const before=changes.length;resolution.reset();time+=60000;resolution.sample(time);
  assert.equal(changes.length,before);
});

test('30 FPS estáveis, desktop e pausas longas não acionam queda de qualidade',()=>{
  for(const enabled of [true,false]){
    const changes=[],resolution=createAdaptiveResolution({enabled,initialRatio:1.333333,onChange:ratio=>changes.push(ratio)});
    for(let frame=0;frame<1000;frame++)resolution.sample(frame*1000/30);
    resolution.sample(1000000);
    assert.deepEqual(changes,[]);assert.equal(resolution.ratio,1.333333);
  }
});

test('viewport acompanha teclado iOS/Android, rotação, pinch e remove listeners',()=>{
  for(const [width,height] of [[320,568],[390,844],[768,1024],[1024,768],[844,390]]){
    const values=new Map(),classes=new Set();
    const root={style:{setProperty:(key,value)=>values.set(key,value)},classList:{toggle:(key,value)=>value?classes.add(key):classes.delete(key),remove:key=>classes.delete(key)}};
    const document=Object.assign(new EventTarget(),{documentElement:root,activeElement:{matches:()=>false}});
    const viewport=Object.assign(new EventTarget(),{width,height,offsetLeft:0,offsetTop:0,scale:1});
    const win=Object.assign(new EventTarget(),{document,innerWidth:width,innerHeight:height,visualViewport:viewport});
    const tracker=trackMobileViewport(win);
    try{
      assert.equal(values.get('--app-height'),height+'px');assert.equal(values.get('--app-width'),width+'px');
      document.activeElement={matches:()=>true};document.dispatchEvent(new Event('focusin'));
      viewport.height=height-180;viewport.offsetTop=20;viewport.dispatchEvent(new Event('resize'));
      assert.ok(classes.has('keyboardOpen'));assert.equal(values.get('--app-top'),'20px');
      // Android may resize the layout viewport as well as the visual viewport.
      win.innerHeight=height-180;win.dispatchEvent(new Event('resize'));assert.ok(classes.has('keyboardOpen'));
      viewport.scale=2;viewport.dispatchEvent(new Event('resize'));assert.equal(classes.has('keyboardOpen'),false);
      viewport.scale=1;viewport.height=height;win.innerHeight=height;document.activeElement={matches:()=>false};document.dispatchEvent(new Event('focusout'));
      assert.equal(classes.has('keyboardOpen'),false);
      win.innerWidth=height;win.innerHeight=width;viewport.width=height;viewport.height=width;win.dispatchEvent(new Event('resize'));
      assert.equal(values.get('--app-width'),height+'px');assert.equal(values.get('--app-height'),width+'px');
      tracker.dispose();assert.equal(getEventListeners(viewport,'resize').length,0);assert.equal(getEventListeners(document,'focusin').length,0);
    }finally{tracker.dispose();}
  }
  assert.deepEqual(visibleViewport({innerWidth:1024,innerHeight:768}),{width:1024,height:768,left:0,top:0,scale:1});
});
