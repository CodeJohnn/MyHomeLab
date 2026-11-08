import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSocialActions} from '../frontend/js/social-actions-ui.mjs';

function documentStub(){
  const children=new Map();
  const node=()=>({textContent:'',value:'b',dataset:{},hidden:false,disabled:false,open:false,
    setAttribute(){},addEventListener(){},replaceChildren(){},remove(){},showModal(){this.open=true;},close(){this.open=false;},
    querySelector(selector){if(!children.has(selector))children.set(selector,node());return children.get(selector);}});
  const dialog=node();
  return {dialog,createElement:()=>dialog,body:{append(){}},querySelector:()=>dialog.open?dialog:null};
}

test('UI descarta snapshots antigos e cancela convite mesmo se a requisicao ainda nao terminou',async()=>{
  const prior={document:globalThis.document,Option:globalThis.Option,addEventListener:globalThis.addEventListener};
  const document=documentStub();globalThis.document=document;globalThis.Option=class{};globalThis.addEventListener=()=>{};
  const members=[{id:'a',name:'A',pose:{x:0,y:0,z:0,r:0}},{id:'b',name:'B',pose:{x:1,y:0,z:0,r:0}}];
  const pending={id:'invite',from:'a',to:'b',kind:'hug',state:'pending',expires:30000};
  const active={...pending,state:'active',origins:members.map(member=>member.pose),anchors:members.map(member=>member.pose),startsAt:1000,approach:1500};
  const sent=[];let releaseInvite,started=0,ended=0;
  const ui=createSocialActions({getSelfId:()=> 'a',getTime:()=>1000,getPose:()=>members[0].pose,canJoin:()=>true,clearPath:()=>true,onStart:()=>started++,onEnd:()=>ended++,notify(){},
    send:async input=>{sent.push(input);if(input.type==='invite')return new Promise(resolve=>releaseInvite=resolve);return {social:[],members,socialVersion:4};}});
  try{
    ui.update([active],members,2);assert.equal(started,1);
    ui.update([pending],members,1);assert.equal(ui.get('a').state,'active');assert.equal(ended,0);
    ui.update([],members,3);assert.equal(ended,1);assert.equal(ui.get('a'),null);
    ui.open('hug');document.dialog.querySelector('[data-confirm]').onclick();
    assert.equal(sent[0].type,'invite');ui.cancel();
    releaseInvite({social:[pending],members,socialVersion:4});
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(sent[1].type,'cancel');assert.equal(sent[1].id,'invite');
  }finally{ui.dispose();Object.assign(globalThis,prior);}
});
