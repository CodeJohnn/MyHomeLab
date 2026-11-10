import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {getEventListeners} from 'node:events';
import * as THREE from 'three';
import {nobleTitles,nobleCrestSvg} from '../frontend/js/nobility.mjs';
import {nobleEffects} from '../frontend/js/nobility-effects.mjs';
import {createNobleSpriteEffects} from '../frontend/js/nobility-sprite-effects.mjs';

const hashes=JSON.parse(await readFile(new URL('./fixtures/nobility-artwork-hashes.json',import.meta.url),'utf8'));

test('onze SVGs animados mantêm todos os traçados originais sem inventar títulos',async()=>{
  assert.deepEqual(Object.keys(nobleEffects),nobleTitles.map(title=>title.id));
  assert.equal(nobleEffects.arquiduque,undefined);
  let previousPulse=0;
  for(const title of nobleTitles){
    const original=nobleCrestSvg(title.minLevel,{animated:false});
    assert.equal(createHash('sha256').update(original).digest('hex'),hashes[title.id]);
    const svg=await readFile(new URL(`../frontend/assets/nobility/${title.id}.svg`,import.meta.url),'utf8');
    assert.equal(svg,nobleCrestSvg(title.minLevel));
    for(const shape of original.match(/<(?:path|circle|g)\b[^>]*>/g))assert.ok(svg.includes(shape),`${title.id}: forma original preservada`);
    assert.match(svg,/<animate attributeName="x"/);
    assert.match(svg,/prefers-reduced-motion:reduce/);
    assert.doesNotMatch(svg,/<filter|feGaussianBlur|<script|foreignObject/);
    const effect=nobleEffects[title.id];
    assert.ok(Object.isFrozen(effect));assert.ok(effect.pulse>previousPulse);previousPulse=effect.pulse;
    assert.equal((svg.match(/attributeName="cy"/g)||[]).length,effect.particles);
    assert.ok(effect.period>=4);assert.ok(effect.particles<=5);
  }
  assert.equal(nobleEffects.barao.color,'#d79a62');
  assert.equal(nobleEffects.conde.color,'#e4edff');
  assert.ok(nobleEffects.imperador.aura>nobleEffects.rei.aura);
});

function compile(effects,level,width=384){
  const material=new THREE.SpriteMaterial({map:new THREE.Texture()});
  effects.attach(material,level,width);
  const shader={uniforms:{},fragmentShader:THREE.ShaderLib.sprite.fragmentShader};
  material.onBeforeCompile(shader);
  return {material,shader};
}

test('sprites compartilham relógio e programa e limitam efeitos à região do brasão',()=>{
  const motion=Object.assign(new EventTarget(),{matches:false});
  const effects=createNobleSpriteEffects({THREE,motion});
  const entries=nobleTitles.map(title=>compile(effects,title.minLevel));
  try{
    effects.update(2500);
    for(const {material,shader} of entries){
      assert.equal(shader.uniforms.nobleTime,entries[0].shader.uniforms.nobleTime);
      assert.equal(shader.uniforms.nobleTime.value,2.5);
      assert.equal(material.customProgramCacheKey(),'noble-nameplate-v1');
      assert.equal(shader.fragmentShader,entries[0].shader.fragmentShader);
      assert.match(shader.fragmentShader,/vMapUv - nobleRegion.xy/);
      assert.equal((shader.fragmentShader.match(/#include <map_fragment>/g)||[]).length,1);
      const region=shader.uniforms.nobleRegion.value;
      assert.deepEqual(region.toArray(),[8/384,11/112,94/384,91/112]);
      // The animated area ends before the name starts at pixel 116.
      assert.ok((region.x+region.z*1.08)*384<116);
      assert.equal(material.map.version,0);
      assert.equal(material.type,'SpriteMaterial');
    }
    assert.equal(entries[0].shader.uniforms.nobleStyle.value.w,0);
    assert.equal(entries.at(-1).shader.uniforms.nobleStyle.value.w,5);
    assert.equal(getEventListeners(motion,'change').length,1);
    motion.matches=true;motion.dispatchEvent(new Event('change'));
    effects.update(9000);
    assert.equal(entries[0].shader.uniforms.nobleMotion.value,0);
    assert.equal(entries[0].shader.uniforms.nobleTime.value,2.5);
    motion.matches=false;motion.dispatchEvent(new Event('change'));effects.update(10000);
    assert.equal(entries[0].shader.uniforms.nobleMotion.value,1);
    assert.equal(entries[0].shader.uniforms.nobleTime.value,10);
    effects.dispose();effects.dispose();effects.update(12000);
    assert.equal(getEventListeners(motion,'change').length,0);
    assert.equal(entries[0].shader.uniforms.nobleMotion.value,0);
  }finally{effects.dispose();for(const {material} of entries){material.map.dispose();material.dispose();}}
});

test('novo título atualiza perfil e partículas móveis ficam limitadas sem novas texturas',()=>{
  const motion=Object.assign(new EventTarget(),{matches:false});
  const effects=createNobleSpriteEffects({THREE,isMobile:true,motion});
  const {material,shader}=compile(effects,1);
  try{
    const texture=material.map;
    assert.equal(shader.uniforms.nobleStyle.value.w,0);
    effects.attach(material,100,512);
    const next={uniforms:{},fragmentShader:THREE.ShaderLib.sprite.fragmentShader};material.onBeforeCompile(next);
    assert.equal(next.uniforms.nobleStyle.value.w,3);
    assert.equal(next.uniforms.nobleExtra.value.x,nobleEffects.imperador.aura);
    assert.equal(next.uniforms.nobleTime,shader.uniforms.nobleTime);
    assert.equal(material.map,texture);assert.equal(texture.version,0);
    effects.update(60000);assert.equal(next.uniforms.nobleTime.value,60);
  }finally{effects.dispose();material.map.dispose();material.dispose();}
});
