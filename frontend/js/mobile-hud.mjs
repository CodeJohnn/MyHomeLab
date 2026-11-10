import {visibleViewport} from './mobile-viewport.mjs';

// The same rectangles drive CSS and the layout regression tests.
export function mobileHudLayout({width,height,insets={},keyboard=false}){
  const left=Math.max(8,insets.left||0),right=Math.max(8,insets.right||0);
  const top=Math.max(6,insets.top||0),bottom=Math.max(8,insets.bottom||0);
  const landscape=width>height,available=width-left-right;
  const joystickSize=landscape?88:96,actionsWidth=Math.min(landscape?192:152,available-joystickSize-16);
  const actionsHeight=landscape?92:140;
  const bar={x:left,y:top,width:available,height:44};
  const joystick={x:left,y:height-bottom-joystickSize,width:joystickSize,height:joystickSize};
  const actions={x:width-right-actionsWidth,y:height-bottom-actionsHeight,width:actionsWidth,height:actionsHeight};
  const contentTop=top+bar.height+8;
  const panelTop=contentTop+(!landscape&&!keyboard?36:0);
  const panelWidth=keyboard?available:Math.min(landscape?292:320,landscape?width*.36:available);
  const panelBottom=keyboard?height-bottom:Math.min(panelTop+320,landscape?Math.min(joystick.y,actions.y)-12:Math.min(height*.40,actions.y-12));
  const panel={x:width-right-panelWidth,y:panelTop,width:panelWidth,height:Math.max(0,panelBottom-panelTop)};
  const noticeX=landscape?joystick.x+joystick.width+12:left;
  const noticeTop=landscape?panelTop:contentTop;
  const notices={x:noticeX,y:noticeTop,width:Math.max(0,(landscape?panel.x-12:width-right)-noticeX),height:keyboard?0:landscape?Math.min(64,Math.max(0,joystick.y-noticeTop-8)):28};
  const status={x:joystick.x+joystick.width+12,y:height-bottom-44,width:Math.max(0,actions.x-joystick.x-joystick.width-24),height:44};
  return {landscape,bar,joystick,actions,panel,notices,status};
}

export function createMobileHud({entries,panel,visibilityControls,openChat,win=globalThis}){
  const document=win.document,root=document.documentElement;
  const media=win.matchMedia('(max-width:960px), (pointer:coarse)');
  const bar=document.createElement('header');bar.className='mobileGameBar';bar.setAttribute('aria-label','Controles do jogo');bar.hidden=true;
  const probe=document.createElement('div');probe.setAttribute('aria-hidden','true');
  probe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.append(bar,probe);
  const originals=[document.getElementById('cameraViewMode'),visibilityControls,document.getElementById('showToolbar')].filter(Boolean).map(node=>{
    const anchor=document.createComment('mobile HUD original position');node.parentNode.insertBefore(anchor,node);return {node,anchor};
  });
  let active=null,frame=null,disposed=false,wasMobile=false,savedPanel=null;
  function layout(){
    if(frame!==null)win.cancelAnimationFrame(frame);frame=null;if(disposed||!media.matches)return;
    const view=visibleViewport(win),style=win.getComputedStyle(probe);
    const insets={left:parseFloat(style.paddingLeft)||0,right:parseFloat(style.paddingRight)||0,top:parseFloat(style.paddingTop)||0,bottom:parseFloat(style.paddingBottom)||0};
    const geometry=mobileHudLayout({...view,insets,keyboard:root.classList.contains('keyboardOpen')});
    for(const [name,rect] of Object.entries(geometry)){
      if(typeof rect!=='object')continue;
      for(const [axis,value] of Object.entries(rect))root.style.setProperty(`--hud-${name}-${axis}`,`${value+((axis==='x')?view.left:(axis==='y')?view.top:0)}px`);
    }
    root.dataset.hudOrientation=geometry.landscape?'landscape':'portrait';
  }
  function requestLayout(){if(frame===null&&!disposed)frame=win.requestAnimationFrame(layout);}
  function apply(){
    root.classList.toggle('compactGameHud',media.matches);
    bar.hidden=!media.matches;
    if(media.matches){
      if(!wasMobile)savedPanel={history:panel.dataset.history,menu:panel.dataset.menu,open:panel.open};
      wasMobile=true;
      for(const {node} of originals)bar.append(node);
      for(const entry of entries){
        const visible=active===entry.key;
        entry.target.classList.toggle('socialPanelHidden',!visible);
        entry.button.setAttribute('aria-pressed',String(visible));entry.button.setAttribute('aria-expanded',String(visible));
        entry.button.title=`${visible?'Fechar':'Abrir'} ${entry.key==='chat'?'conversa':'jogadores online'}`;
        entry.button.setAttribute('aria-label',entry.button.title);
      }
      layout();
    }else{
      if(wasMobile&&savedPanel){panel.dataset.history=savedPanel.history;panel.dataset.menu=savedPanel.menu;panel.open=savedPanel.open;}
      wasMobile=false;
      for(const {node,anchor} of originals)anchor.parentNode.insertBefore(node,anchor.nextSibling);
      for(const entry of entries){entry.button.removeAttribute('aria-expanded');entry.apply();}
      active=null;
    }
    summary.setAttribute('aria-expanded',String(panel.dataset.history==='open'));
  }
  function choose(key){
    active=active===key?null:key;
    if(active)win.dispatchEvent(new Event('game-social-panel-open'));
    if(active==='chat'){openChat();panel.dataset.history='open';panel.dataset.menu='false';panel.open=true;}
    apply();
    if(active==='chat'){const history=panel.querySelector('[data-chat]');if(history)history.scrollTop=history.scrollHeight;}
  }
  function toggle(event){
    if(!media.matches)return;
    const entry=entries.find(entry=>entry.button.contains(event.target));if(!entry)return;
    event.preventDefault();event.stopImmediatePropagation();choose(entry.key);
  }
  function closeSummary(event){
    if(!media.matches||event.target.closest('button'))return;
    event.preventDefault();event.stopImmediatePropagation();active=null;apply();
  }
  function closeForModal(){if(media.matches&&active!==null){active=null;apply();}}
  const summary=panel.querySelector('summary');
  const capture={capture:true};
  visibilityControls.addEventListener('click',toggle,capture);summary.addEventListener('click',closeSummary,capture);
  media.addEventListener('change',apply);win.addEventListener('resize',requestLayout);win.visualViewport?.addEventListener('resize',requestLayout);win.visualViewport?.addEventListener('scroll',requestLayout);
  win.addEventListener('game-hud-modal-open',closeForModal);
  document.addEventListener('focusin',requestLayout);document.addEventListener('focusout',requestLayout);apply();
  return {dispose(){
    if(disposed)return;disposed=true;if(frame!==null)win.cancelAnimationFrame(frame);
    visibilityControls.removeEventListener('click',toggle,capture);summary.removeEventListener('click',closeSummary,capture);media.removeEventListener('change',apply);win.removeEventListener('resize',requestLayout);
    win.removeEventListener('game-hud-modal-open',closeForModal);
    win.visualViewport?.removeEventListener('resize',requestLayout);win.visualViewport?.removeEventListener('scroll',requestLayout);document.removeEventListener('focusin',requestLayout);document.removeEventListener('focusout',requestLayout);
    for(const {node,anchor} of originals){anchor.parentNode.insertBefore(node,anchor);anchor.remove();}
    if(wasMobile&&savedPanel){panel.dataset.history=savedPanel.history;panel.dataset.menu=savedPanel.menu;panel.open=savedPanel.open;}
    summary.setAttribute('aria-expanded',String(panel.dataset.history==='open'));
    for(const entry of entries){entry.button.removeAttribute('aria-expanded');entry.apply();}
    root.classList.remove('compactGameHud');delete root.dataset.hudOrientation;bar.remove();probe.remove();
  }};
}
