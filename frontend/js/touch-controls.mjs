export function joystickVector(dx,dy,radius,deadZone=.12){
  const distance=Math.hypot(dx,dy),amount=Math.min(1,distance/Math.max(1,radius));
  if(amount<=deadZone)return {x:0,z:0};
  const speed=(amount-deadZone)/(1-deadZone);
  return {x:dx/distance*speed,z:dy/distance*speed};
}

export function createTouchClickGuard(now=()=>performance.now()){
  let lastTap=-Infinity;
  return {recordTap(){lastTap=now();},ignore(event){
    return event.pointerType==='touch'||event.pointerType==='pen'||event.sourceCapabilities?.firesTouchEvents===true||(!event.pointerType&&now()-lastTap<500);
  }};
}

export function rotateMovement(x,z,yaw,out){
  const sine=Math.sin(yaw),cosine=Math.cos(yaw);
  out.x=x*cosine+z*sine;out.z=-x*sine+z*cosine;
  return out;
}

export function createTouchControls({root,onMove,onAction,isEnabled,win=globalThis}){
  root.className='touchControls';
  root.innerHTML='<div class="touchJoystick" role="group" aria-label="Controle de movimento"><span class="touchStick" aria-hidden="true"></span><span class="touchJoystickLabel">Mover</span></div><div class="touchActions"><button type="button" data-touch-action="interact">Interagir / parar</button><button type="button" data-touch-action="sit">Sentar</button><button type="button" data-touch-action="dance">Danças</button><button type="button" data-touch-action="emotions">Emotes</button><button type="button" data-touch-action="menu">Avatar</button></div>';
  const pad=root.querySelector('.touchJoystick'),stick=root.querySelector('.touchStick');
  let pointer=null,centerX=0,centerY=0,radius=1,enabled=true,disposed=false;
  function reset(){
    const previous=pointer;pointer=null;onMove({x:0,z:0});stick.style.transform='translate(0px,0px)';
    if(previous!==null&&pad.hasPointerCapture?.(previous))pad.releasePointerCapture(previous);
  }
  function move(event){
    if(pointer!==event.pointerId)return;
    if(!enabled||!isEnabled()){reset();return;}
    event.preventDefault();
    const dx=event.clientX-centerX,dy=event.clientY-centerY,distance=Math.hypot(dx,dy),scale=Math.min(1,radius/(distance||1));
    stick.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;
    onMove(joystickVector(dx,dy,radius));
  }
  function down(event){
    if(disposed||pointer!==null||!enabled||!isEnabled()||(event.button!==undefined&&event.button!==0))return;
    event.preventDefault();
    const rect=pad.getBoundingClientRect(),thumbWidth=stick.getBoundingClientRect?.().width||rect.width*.42;
    centerX=rect.left+rect.width/2;centerY=rect.top+rect.height/2;radius=Math.max(1,(rect.width-thumbWidth)/2-2);
    pointer=event.pointerId;pad.setPointerCapture(pointer);move(event);
  }
  const up=event=>{if(event.pointerId===pointer)reset();};
  const action=event=>{const button=event.target.closest('[data-touch-action]');if(button&&enabled&&isEnabled())onAction(button.dataset.touchAction);};
  const hide=()=>{if(win.document.hidden)reset();};
  pad.addEventListener('pointerdown',down);pad.addEventListener('pointermove',move);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(type,up);
  root.addEventListener('click',action);
  win.addEventListener('blur',reset);win.addEventListener('resize',reset);win.document.addEventListener('visibilitychange',hide);
  return {reset,setEnabled(value){if(enabled===value)return;enabled=value;root.hidden=!value;if(!value)reset();},dispose(){
    if(disposed)return;disposed=true;reset();
    pad.removeEventListener('pointerdown',down);pad.removeEventListener('pointermove',move);
    for(const type of ['pointerup','pointercancel','lostpointercapture'])pad.removeEventListener(type,up);
    root.removeEventListener('click',action);win.removeEventListener('blur',reset);win.removeEventListener('resize',reset);win.document.removeEventListener('visibilitychange',hide);
  }};
}
