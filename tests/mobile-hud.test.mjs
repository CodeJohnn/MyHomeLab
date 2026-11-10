import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getEventListeners} from 'node:events';
import {mobileHudLayout,createMobileHud} from '../frontend/js/mobile-hud.mjs';

function overlaps(a,b){return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;}

test('HUD reserva áreas sem colisão em todas as resoluções horizontais solicitadas',()=>{
  for(const [width,height] of [[844,390],[667,375],[812,375],[932,430]]){
    for(const insets of [{},{left:44,right:44,bottom:21},{left:59,right:59,bottom:21}]){
      const layout=mobileHudLayout({width,height,insets});
      const rectangles=Object.entries(layout).filter(([,value])=>typeof value==='object');
      for(const [name,rect] of rectangles){
        assert.ok(rect.width>0&&rect.height>0,`${width}: ${name} tem espaço`);
        assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width+.001&&rect.y+rect.height<=height+.001,`${width}: ${name} dentro da viewport`);
        assert.equal(overlaps(rect,{x:width/2-16,y:height/2-16,width:32,height:32}),false,`${width}: ${name} preserva centro da câmera`);
      }
      for(let i=0;i<rectangles.length;i++)for(let j=i+1;j<rectangles.length;j++){
        assert.equal(overlaps(rectangles[i][1],rectangles[j][1]),false,`${width}: ${rectangles[i][0]} / ${rectangles[j][0]}`);
      }
      assert.ok(layout.joystick.width<=96);assert.equal(layout.actions.height,92);
    }
  }
});

test('retratos e tablets limitam painéis, e teclado ganha espaço sem deslocar controles ativos',()=>{
  for(const [width,height] of [[320,568],[390,844],[768,1024],[1024,768]]){
    const layout=mobileHudLayout({width,height});
    assert.ok(layout.panel.height<=320);
    assert.ok(layout.panel.y+layout.panel.height<layout.actions.y);
    assert.equal(overlaps(layout.joystick,layout.actions),false);
    const keyboard=mobileHudLayout({width,height:300,keyboard:true});
    assert.ok(keyboard.panel.x>=8&&keyboard.panel.y+keyboard.panel.height<=292);
    assert.equal(keyboard.notices.height,0);
  }
});

class Element extends EventTarget{
  constructor(tag='div'){
    super();this.tag=tag;this.children=[];this.dataset={};this.attributes=new Map();this.hidden=false;
    const classes=new Set();this.classList={contains:value=>classes.has(value),remove:value=>classes.delete(value),toggle:(value,on)=>on?classes.add(value):classes.delete(value)};
    this.style={values:new Map(),setProperty:(name,value)=>this.style.values.set(name,value)};
  }
  setAttribute(name,value){this.attributes.set(name,value);}
  removeAttribute(name){this.attributes.delete(name);}
  append(...nodes){for(const node of nodes){node.remove();node.parentNode=this;this.children.push(node);}}
  insertBefore(node,before){node.remove();node.parentNode=this;const index=before?this.children.indexOf(before):-1;this.children.splice(index<0?this.children.length:index,0,node);}
  remove(){if(this.parentNode){const parent=this.parentNode;parent.children.splice(parent.children.indexOf(this),1);this.parentNode=null;}}
  get nextSibling(){return this.parentNode?.children[this.parentNode.children.indexOf(this)+1]||null;}
  contains(node){return node===this||this.children.some(child=>child.contains(node));}
  closest(selector){return selector==='button'&&this.tag==='button'?this:null;}
  querySelector(selector){return selector==='summary'?this.children.find(child=>child.tag==='summary'):null;}
}

test('painéis iniciam recolhidos, usam os mesmos botões e restauram estado/DOM do desktop',()=>{
  const body=new Element('body'),root=new Element('html'),document=Object.assign(new EventTarget(),{body,documentElement:root});
  const camera=new Element('select'),toolbar=new Element('button'),visibility=new Element('nav'),panel=new Element('details'),dock=new Element('section'),summary=new Element('summary');
  panel.dataset={history:'closed',menu:'false'};panel.open=true;panel.append(summary);
  const cameraParent=new Element(),toolbarParent=new Element();cameraParent.append(camera);toolbarParent.append(toolbar);body.append(cameraParent,panel,visibility,dock,toolbarParent);
  document.getElementById=id=>id==='cameraViewMode'?camera:id==='showToolbar'?toolbar:null;
  document.createElement=tag=>new Element(tag);document.createComment=()=>new Element('comment');
  const media=Object.assign(new EventTarget(),{matches:true}),viewport=Object.assign(new EventTarget(),{width:844,height:390,scale:1});
  const frames=new Map();let frame=0,opened=0;
  const win=Object.assign(new EventTarget(),{document,visualViewport:viewport,innerWidth:844,innerHeight:390,
    matchMedia:()=>media,getComputedStyle:()=>({paddingLeft:'0',paddingRight:'0',paddingTop:'0',paddingBottom:'0'}),
    requestAnimationFrame:fn=>{frames.set(++frame,fn);return frame;},cancelAnimationFrame:id=>frames.delete(id)});
  const entries=[['chat',panel,true],['online',dock,false]].map(([key,target,desktopVisible])=>{
    const button=new Element('button');visibility.append(button);
    return {key,target,button,apply(){target.classList.toggle('socialPanelHidden',!desktopVisible);button.setAttribute('aria-pressed',String(desktopVisible));}};
  });
  const hud=createMobileHud({entries,panel,visibilityControls:visibility,openChat:()=>opened++,win});
  function click(target,host=visibility){const event=new Event('click',{cancelable:true});Object.defineProperty(event,'target',{value:target});host.dispatchEvent(event);}
  try{
    const bar=camera.parentNode;assert.equal(bar.className,'mobileGameBar');assert.equal(visibility.parentNode,bar);assert.equal(toolbar.parentNode,bar);
    assert.ok(entries.every(entry=>entry.target.classList.contains('socialPanelHidden')));
    click(entries[0].button);assert.equal(opened,1);assert.equal(panel.dataset.history,'open');assert.equal(panel.classList.contains('socialPanelHidden'),false);
    click(entries[1].button);assert.equal(panel.classList.contains('socialPanelHidden'),true);assert.equal(dock.classList.contains('socialPanelHidden'),false);
    click(entries[0].button);click(summary,summary);assert.ok(entries.every(entry=>entry.target.classList.contains('socialPanelHidden')));
    click(entries[0].button);win.dispatchEvent(new Event('game-hud-modal-open'));assert.ok(entries.every(entry=>entry.target.classList.contains('socialPanelHidden')));
    win.dispatchEvent(new Event('resize'));win.dispatchEvent(new Event('resize'));assert.equal(frames.size,1);
    for(const fn of frames.values())fn();frames.clear();
    assert.equal(root.style.values.get('--hud-joystick-width'),'88px');
    media.matches=false;media.dispatchEvent(new Event('change'));
    assert.equal(camera.parentNode,cameraParent);assert.equal(toolbar.parentNode,toolbarParent);assert.equal(visibility.parentNode,body);
    assert.equal(panel.dataset.history,'closed');assert.equal(panel.dataset.menu,'false');
    assert.equal(summary.attributes.get('aria-expanded'),'false');
    assert.equal(panel.classList.contains('socialPanelHidden'),false);assert.equal(dock.classList.contains('socialPanelHidden'),true);
    assert.equal(entries[0].button.attributes.has('aria-expanded'),false);
    media.matches=true;media.dispatchEvent(new Event('change'));assert.ok(entries.every(entry=>entry.target.classList.contains('socialPanelHidden')));
    hud.dispose();hud.dispose();
    assert.equal(camera.parentNode,cameraParent);assert.equal(visibility.parentNode,body);
    assert.equal(getEventListeners(media,'change').length,0);assert.equal(getEventListeners(viewport,'resize').length,0);assert.equal(getEventListeners(visibility,'click').length,0);
    assert.ok(body.children.every(node=>node.tag!=='comment'&&node.className!=='mobileGameBar'));
  }finally{hud.dispose();}
});
