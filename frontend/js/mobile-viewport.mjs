export function visibleViewport(win){
  const viewport=win.visualViewport;
  return {width:viewport?.width||win.innerWidth,height:viewport?.height||win.innerHeight,left:viewport?.offsetLeft||0,top:viewport?.offsetTop||0,scale:viewport?.scale||1};
}

export function trackMobileViewport(win=globalThis){
  const document=win.document,root=document.documentElement;
  let baselineHeight=win.innerHeight,baselineWidth=win.innerWidth;
  function update(){
    const view=visibleViewport(win);
    if(Math.abs(win.innerWidth-baselineWidth)>80){baselineWidth=win.innerWidth;baselineHeight=win.innerHeight;}
    const editing=document.activeElement?.matches?.('input:not([type=range]):not([type=color]),textarea,[contenteditable=true]');
    if(!editing)baselineHeight=win.innerHeight;
    const keyboard=!!editing&&view.scale===1&&Math.max(baselineHeight,win.innerHeight)-view.height>120;
    root.style.setProperty('--app-height',`${Math.round(view.height)}px`);
    root.style.setProperty('--app-width',`${Math.round(view.width)}px`);
    root.style.setProperty('--app-top',`${Math.round(view.top)}px`);
    root.style.setProperty('--app-left',`${Math.round(view.left)}px`);
    root.classList.toggle('keyboardOpen',keyboard);
  }
  const viewport=win.visualViewport;
  win.addEventListener('resize',update);win.addEventListener('pageshow',update);viewport?.addEventListener('resize',update);viewport?.addEventListener('scroll',update);
  document.addEventListener('focusin',update);document.addEventListener('focusout',update);update();
  return {dispose(){win.removeEventListener('resize',update);win.removeEventListener('pageshow',update);viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);document.removeEventListener('focusin',update);document.removeEventListener('focusout',update);root.classList.remove('keyboardOpen');}};
}
