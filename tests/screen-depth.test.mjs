import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createScreenDepth} from '../frontend/js/screen-depth.mjs';

class Mesh {
  constructor(geometry,material){this.geometry=geometry;this.material=material;this.position={z:0};this.children=[];}
  add(child){child.parent=this;this.children.push(child);}
  removeFromParent(){this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}
}
class Material {
  constructor(options){Object.assign(this,options);this.disposed=false;}
  dispose(){this.disposed=true;}
}
const THREE={Mesh,MeshBasicMaterial:Material,NoBlending:0,DoubleSide:2};

test('máscara preserva material do player e reutiliza geometria sem participar de cliques',()=>{
  const geometry={},playerMaterial={map:{video:true}},screen=new Mesh(geometry,playerMaterial);
  const depth=createScreenDepth(THREE);
  depth.setVisible(screen,false);assert.equal(screen.children.length,0);
  depth.setVisible(screen,true);const mask=screen.children[0];
  assert.equal(screen.material,playerMaterial);assert.equal(mask.geometry,geometry);
  assert.equal(mask.material.opacity,0);assert.equal(mask.material.blending,THREE.NoBlending);
  assert.equal(mask.material.depthTest,true);assert.equal(mask.material.depthWrite,true);
  assert.equal(mask.material.transparent,true);assert.equal(mask.material.forceSinglePass,true);
  assert.ok(mask.renderOrder<0);assert.equal(mask.castShadow,false);
  const hits=[];mask.raycast(null,hits);assert.deepEqual(hits,[]);
  for(let i=0;i<20;i++){depth.setVisible(screen,false);assert.equal(mask.visible,false);depth.setVisible(screen,true);}
  assert.equal(screen.children.length,1);assert.equal(mask.visible,true);
  depth.dispose();assert.equal(screen.children.length,0);assert.equal(mask.material.disposed,true);
  assert.equal(screen.material,playerMaterial);
});

test('trocar conteúdo ou expandir uma tela não modifica outras telas nem libera recursos dos players',()=>{
  const depth=createScreenDepth(THREE),a=new Mesh({},{}),b=new Mesh({},{});
  depth.setVisible(a,true);depth.setVisible(b,true);
  const aMask=a.children[0],bMask=b.children[0];
  assert.equal(aMask.material,bMask.material);
  const replacement={map:{newVideo:true}};a.material=replacement;
  depth.setVisible(a,false);
  assert.equal(a.material,replacement);assert.equal(aMask.visible,false);assert.equal(bMask.visible,true);
  depth.setVisible(a,true);assert.equal(a.material,replacement);assert.equal(a.children[0],aMask);
  depth.dispose();assert.equal(a.children.length,0);assert.equal(b.children.length,0);
});
