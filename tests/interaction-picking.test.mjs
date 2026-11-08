import {test} from 'node:test';
import assert from 'node:assert/strict';
import {closestInteraction,canActivateHit,interactionRoots,interactionHitsFor} from '../frontend/js/interaction-picking.mjs';

const node=(parent=null,extra={})=>({parent,isMesh:true,visible:true,material:{visible:true,opacity:1},...extra});
const visible=object=>{for(let n=object;n;n=n.parent)if(!n.visible)return false;return true;};

test('personagem mais próximo recebe clique antes de cadeiras, teclados e telas atrás dele',()=>{
  for(const kind of ['self','npc','guest']){
    const root=node(null,{isMesh:false}),body=node(root),screen=node(),chair=node();
    const characters=new Map([[root,{kind}]]),hits=[{object:screen,distance:6},{object:body,distance:2},{object:chair,distance:4}];
    const selection=closestInteraction(hits,characters,visible);
    assert.equal(selection.character.kind,kind);assert.equal(selection.hit.object,body);
    assert.equal(canActivateHit(hits[0],selection.hit),false);assert.equal(canActivateHit(hits[2],selection.hit),false);
  }
});

test('parede ou objeto na frente bloqueia personagem e ações atrás da superfície',()=>{
  const root=node(),wall=node(),characters=new Map([[root,{kind:'npc'}]]);
  const selection=closestInteraction([{object:root,distance:4},{object:wall,distance:1}],characters,visible);
  assert.equal(selection.character,null);assert.equal(selection.hit.object,wall);
  assert.equal(canActivateHit({distance:4},selection.hit),false);
});

test('balões, etiquetas, máscaras e malhas de avatar ocultas não capturam cliques',()=>{
  const hidden=node(null,{visible:false}),body=node(hidden),chair=node(),sprite=node(null,{isMesh:false,isSprite:true});
  const mask=node(null,{material:{opacity:0}}),invisibleMaterial=node(null,{material:{visible:false}});
  const selection=closestInteraction([{object:sprite,distance:.1},{object:mask,distance:.2},{object:invisibleMaterial,distance:.3},{object:body,distance:1},{object:chair,distance:3}],new Map([[hidden,{kind:'self'}]]),visible);
  assert.equal(selection.hit.object,chair);assert.equal(selection.character,null);
  assert.equal(closestInteraction([],new Map(),visible),null);
});

test('alvos no mesmo plano mantêm tolerância sem liberar objetos distantes',()=>{
  assert.equal(canActivateHit({distance:2.02},{distance:2}),true);
  assert.equal(canActivateHit({distance:2.03},{distance:2}),false);
  assert.equal(canActivateHit(null,{distance:2}),false);
});

test('um único conjunto de interseções atende filhos sem repetir raycasts de suas raízes',()=>{
  const desk=node(),keyboard=node(desk),key=node(keyboard),character=node(),body=node(character);
  assert.deepEqual(interactionRoots([key,desk,keyboard,desk,character]),[desk,character]);
  const hits=[{object:body,distance:1},{object:key,distance:2},{object:keyboard,distance:2.01},{object:desk,distance:3}];
  assert.deepEqual(interactionHitsFor(hits,[keyboard]),[hits[1],hits[2]]);
  assert.deepEqual(interactionHitsFor(hits,[keyboard],false),[hits[2]]);
  assert.deepEqual(interactionHitsFor(hits,[character]),[hits[0]]);
});
