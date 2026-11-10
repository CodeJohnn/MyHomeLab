import {nobleTitle} from './nobility.mjs';
import {nobleEffects} from './nobility-effects.mjs';

const uniforms=`
uniform float nobleTime;
uniform float nobleMotion;
uniform vec3 nobleColor;
uniform vec4 nobleStyle;
uniform vec3 nobleExtra;
uniform vec4 nobleRegion;
`;
const fragment=`
#ifdef USE_MAP
if (nobleMotion > 0.5) {
  vec2 crest = (vMapUv - nobleRegion.xy) / nobleRegion.zw;
  if (crest.x > -0.08 && crest.x < 1.08 && crest.y > -0.10 && crest.y < 1.10) {
    float phase = nobleTime / nobleStyle.y;
    float pulse = 0.5 + 0.5 * sin(phase * 6.2831853);
    float sweep = abs(crest.x + crest.y * 0.3 - (fract(phase) * 3.0 - 1.0));
    float reflection = (1.0 - smoothstep(0.0, 0.13, sweep)) * nobleStyle.z;
    diffuseColor.rgb += nobleColor * (reflection + pulse * nobleStyle.x) * diffuseColor.a;
    float halo = 0.0;
    if (nobleExtra.x > 0.0) {
      float radius = length((crest - 0.5) * vec2(1.0, 1.04));
      halo = (1.0 - smoothstep(0.04, 0.20, abs(radius - 0.44))) * nobleExtra.x * (0.10 + 0.10 * pulse);
      if (nobleExtra.z > 0.0) {
        float ring = 1.0 - smoothstep(0.01, 0.035, abs(radius - (0.40 + 0.025 * sin(nobleTime * 0.6))));
        halo += ring * nobleExtra.z * 0.035;
      }
    }
    float sparkle = 0.0;
    if (nobleStyle.w > 0.5) for (int i = 0; i < 5; i++) {
      if (float(i) < nobleStyle.w) {
        float angle = float(i) * 2.399963 + phase * 0.45;
        vec2 point = vec2(0.5) + vec2(cos(angle), sin(angle)) * 0.46;
        vec2 delta = abs(crest - point);
        float star = max(1.0 - length(delta) / 0.035, 0.0);
        star += max(1.0 - delta.x / 0.009, 0.0) * max(1.0 - delta.y / 0.060, 0.0) * 0.4;
        sparkle += star * (0.35 + 0.65 * pow(0.5 + 0.5 * sin(nobleTime * 2.0 + float(i) * 1.7), 2.0));
      }
    }
    float edge = smoothstep(-0.08, 0.02, crest.x) * (1.0 - smoothstep(0.98, 1.08, crest.x));
    edge *= smoothstep(-0.10, 0.0, crest.y) * (1.0 - smoothstep(1.0, 1.10, crest.y));
    float light = clamp(halo + sparkle * nobleExtra.y, 0.0, 0.85) * edge;
    float alpha = diffuseColor.a + (1.0 - diffuseColor.a) * light;
    diffuseColor.rgb = (diffuseColor.rgb * diffuseColor.a + nobleColor * light * (1.0 - diffuseColor.a)) / max(alpha, 0.0001);
    diffuseColor.a = alpha;
  }
}
#endif
`;

// Reuses the existing nameplate draw call and texture. One clock for all players.
export function createNobleSpriteEffects({THREE,isMobile=false,motion=globalThis.matchMedia('(prefers-reduced-motion: reduce)')}){
  const time={value:0},enabled={value:motion.matches?0:1};
  const changed=()=>{enabled.value=motion.matches?0:1;};
  motion.addEventListener('change',changed);
  let disposed=false;
  return {
    attach(material,level,width){
      const effect=nobleEffects[nobleTitle(level).id];
      material.onBeforeCompile=shader=>{
        Object.assign(shader.uniforms,{
          nobleTime:time,nobleMotion:enabled,nobleColor:{value:new THREE.Color(effect.color)},
          nobleStyle:{value:new THREE.Vector4(effect.pulse,effect.period,effect.shine,Math.min(effect.particles,isMobile?3:5))},
          nobleExtra:{value:new THREE.Vector3(effect.aura,.75,effect.rings)},
          nobleRegion:{value:new THREE.Vector4(8/width,11/112,94/width,91/112)}
        });
        shader.fragmentShader=uniforms+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>\n${fragment}`);
      };
      material.customProgramCacheKey=()=> 'noble-nameplate-v1';
      material.needsUpdate=true;
    },
    update(milliseconds){if(!disposed&&enabled.value)time.value=milliseconds/1000;},
    dispose(){if(disposed)return;disposed=true;enabled.value=0;motion.removeEventListener('change',changed);}
  };
}
