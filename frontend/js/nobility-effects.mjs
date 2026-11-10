// Effect colors are independent of the original heraldry and level thresholds.
const rows=[
  ['campones','#c9d1da',.06,7.2,.10,0,0],
  ['escudeiro','#e4b78b',.09,6.8,.16,0,0],
  ['cavaleiro','#d7e7fa',.12,6.4,.22,0,0],
  ['barao','#d79a62',.16,6.0,.25,0,0],
  ['visconde','#b8d9f5',.19,5.8,.30,0,0],
  ['conde','#e4edff',.23,5.6,.34,0,0],
  ['marques','#f5d58a',.27,5.4,.38,0,0],
  ['duque','#ffd979',.32,5.2,.42,2,.25],
  ['principe','#ffe4a6',.37,5.0,.48,3,.40],
  ['rei','#ffdc69',.44,4.8,.56,4,.58],
  ['imperador','#fff0bd',.52,4.6,.65,5,.80]
];
export const nobleEffects=Object.freeze(Object.fromEntries(rows.map(([id,color,pulse,period,shine,particles,aura])=>[
  id,Object.freeze({color,pulse,period,shine,particles,aura,rings:Math.max(0,particles-3)})
])));

export function nobleCrestUrl(id){
  if(!nobleEffects[id])throw new Error(`Brasão desconhecido: ${id}`);
  return new URL(`../assets/nobility/${id}.svg?v=animated-1`,import.meta.url).href;
}

export function animateNobleSvg(svg,id){
  const effect=nobleEffects[id];
  if(!effect)throw new Error(`Efeito de nobreza desconhecido: ${id}`);
  const surface=svg.match(/<path d="([^"]+)" fill="url\(#noble-/)?.[1];
  if(!surface)throw new Error(`Superfície do brasão ausente: ${id}`);
  const key=`motion-${id}`,{color,pulse,period,shine,particles,aura}=effect;
  const definitions=`<style>@media(prefers-reduced-motion:reduce){.nobleMotion{display:none}}</style><clipPath id="${key}-clip"><path d="${surface}"/></clipPath><linearGradient id="${key}-shine"><stop stop-color="${color}" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="${shine}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient><radialGradient id="${key}-aura"><stop offset=".48" stop-color="${color}" stop-opacity="0"/><stop offset=".76" stop-color="${color}" stop-opacity="${aura}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
  const rings=Array.from({length:effect.rings},(_,index)=>`<ellipse cx="60" cy="58" rx="${58-index*3}" ry="${53+index*3}" fill="none" stroke="${color}" stroke-width=".6" stroke-dasharray="1 9" opacity=".35"><animateTransform attributeName="transform" type="rotate" from="${index?360:0} 60 58" to="${index?0:360} 60 58" dur="${period*3}s" repeatCount="indefinite"/></ellipse>`).join('');
  const glow=aura>0?`<g class="nobleMotion" aria-hidden="true"><ellipse cx="60" cy="58" rx="60" ry="58" fill="url(#${key}-aura)" opacity=".55"><animate attributeName="opacity" values=".55;.95;.55" dur="${period}s" repeatCount="indefinite"/></ellipse>${rings}</g>`:'';
  const positions=[[18,32],[100,70],[30,94],[87,20],[61,10]];
  const sparks=positions.slice(0,particles).map(([x,y],index)=>`<circle cx="${x}" cy="${y}" r="${index%2?1:1.4}" fill="${color}" opacity=".15"><animate attributeName="opacity" values=".15;1;.15" dur="${period*.55}s" begin="-${index*.61}s" repeatCount="indefinite"/><animate attributeName="cy" values="${y+1.5};${y-1.5};${y+1.5}" dur="${period*.8}s" begin="-${index*.43}s" repeatCount="indefinite"/></circle>`).join('');
  const overlay=`<g class="nobleMotion" aria-hidden="true"><path d="${surface}" fill="${color}" opacity=".02"><animate attributeName="opacity" values=".02;${pulse*.40};.02" dur="${period}s" repeatCount="indefinite"/></path><g clip-path="url(#${key}-clip)"><rect x="-120" y="-20" width="42" height="160" fill="url(#${key}-shine)" transform="rotate(-18 60 58)"><animate attributeName="x" values="-120;160;160" keyTimes="0;.48;1" dur="${period}s" repeatCount="indefinite"/></rect></g>${sparks}</g>`;
  return svg.replace('<defs>',`<defs>${definitions}`).replace('</defs>',`</defs>${glow}`).replace('</svg>',`${overlay}</svg>`);
}
