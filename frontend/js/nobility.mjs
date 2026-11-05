const rows=[
  ['campones','Camponês',1,'#a5a8ae','medal','solid'],
  ['escudeiro','Escudeiro',10,'#bb8556','lily','double'],
  ['cavaleiro','Cavaleiro',20,'#cbd5e1','horse','ridge'],
  ['barao','Barão',30,'#35b888','leaf','groove'],
  ['visconde','Visconde',40,'#619cff','gem','double'],
  ['conde','Conde',50,'#b98aee','crown','ridge'],
  ['marques','Marquês',60,'#e77aab','ruby','double'],
  ['duque','Duque',70,'#e4bc61','ducal','groove'],
  ['principe','Príncipe',80,'#ee6574','princely','ridge'],
  ['rei','Rei',90,'#f5cc58','royal','double'],
  ['imperador','Imperador',100,'#fff0bd','imperial','double']
];
export const nobleTitles=Object.freeze(rows.map(([id,name,minLevel,color,symbol,border],index)=>Object.freeze({id,name,minLevel,maxLevel:rows[index+1]?.[2]-1||null,color,symbol,border,index})));
export function normalizeLevel(level){return Number.isSafeInteger(level)&&level>=1?level:1;}
export function nobleTitle(level){const value=normalizeLevel(level);return [...nobleTitles].reverse().find(title=>value>=title.minLevel);}
export function nobleLabel(level){const value=normalizeLevel(level);return `${nobleTitle(value).name} • Nível ${value}`;}
export function noblePromotion(previous,next){return normalizeLevel(next)>normalizeLevel(previous)&&nobleTitle(next).index>nobleTitle(previous).index;}

const lily='<path d="M60 34c-15 15-11 25-4 29-21-21-31-6-19 5l13-3-3 12h26l-3-12 13 3c12-11 2-26-19-5 7-4 11-14-4-29Z"/><path d="M49 70h22v5H49z"/>';
const crown='<path d="m33 49 9 24h36l9-24-17 10-10-22-10 22Z"/><path d="M42 77h36v6H42z"/>';
const motifs={
  medal:'<circle cx="60" cy="59" r="17"/><circle cx="60" cy="59" r="11" fill="#161925"/><path d="m50 75-4 17 14-8 14 8-4-17"/>',
  lily,
  horse:'<path d="m45 83 3-21-10-7 10-17 4-13 9 13 14 6 7 13-8 8-10-8-4 12 15 14Z"/><circle cx="64" cy="46" r="2" fill="#161925"/>',
  leaf:lily+'<path d="M28 76q-16-25 1-41M92 76q16-25-1-41" fill="none" stroke="currentColor" stroke-width="4"/>',
  gem:'<path d="m60 35 22 23-22 27-22-27Z"/><path d="m60 35-9 23 9 27 9-27Zm-22 23h44" stroke="#161925" stroke-width="2" fill="none"/>',
  crown,
  ruby:crown+'<path d="m60 54 6 9-6 9-6-9Z" fill="#731c43"/>',
  ducal:crown+'<circle cx="33" cy="46" r="4"/><circle cx="60" cy="34" r="4"/><circle cx="87" cy="46" r="4"/>',
  princely:crown+'<path d="M39 49q21-36 42 0M60 28v24" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="60" cy="25" r="4"/>',
  royal:crown+'<path d="M35 48q25-43 50 0M60 23v31" fill="none" stroke="currentColor" stroke-width="4"/><path d="M57 13h6v16h-6zM52 18h16v5H52z"/>',
  imperial:crown+'<path d="M33 49q0-28 27-24 27-4 27 24M45 48q-4-30 15-23 19-7 15 23" fill="none" stroke="currentColor" stroke-width="4"/><path d="M57 10h6v18h-6zM51 16h18v5H51z"/><circle cx="60" cy="62" r="6" fill="#fff"/>'
};
// Trusted vector paths only. No input names or user text are interpolated into SVG.
export function nobleCrestSvg(level){
  const title=nobleTitle(level),i=title.index;
  const outlines=[
    'M60 16a43 43 0 1 1 0 86 43 43 0 1 1 0-86',
    'M60 7 106 24 100 72Q88 94 60 108 32 94 20 72L14 24Z',
    'M22 15H98V64Q97 88 60 108 23 88 22 64Z',
    'M60 9 82 17 102 14 98 44 108 61 91 83 60 107 29 83 12 61 22 44 18 14 38 17Z',
    'M60 8 104 28 96 80 60 108 24 80 16 28Z',
    'M24 12 60 20 96 12 103 65Q92 98 60 108 28 98 17 65Z',
    'M60 6 108 36 98 74 60 108 22 74 12 36Z',
    'M19 18 41 24 60 10 79 24 101 18 98 72Q84 96 60 109 36 96 22 72Z',
    'M60 6 82 17 106 20 100 68 86 91 60 109 34 91 20 68 14 20 38 17Z',
    'M60 7 76 17 102 13 109 45 96 78 78 98 60 110 42 98 24 78 11 45 18 13 44 17Z',
    'M60 5 78 18 105 12 111 44 102 77 83 97 60 110 37 97 18 77 9 44 15 12 42 18Z'
  ];
  const ornament=i>=3?`<path d="M15 77Q0 55 12 28M105 77q15-22 3-49M26 91l-10 5m78-5 10 5" fill="none" stroke="${title.color}" stroke-width="3"/>`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 116" role="img" aria-label="Brasão ${title.name}"><defs><linearGradient id="noble-${title.id}" x2="1" y2="1"><stop stop-color="${title.color}"/><stop offset="1" stop-color="#272432"/></linearGradient></defs>${ornament}<path d="${outlines[i]}" fill="url(#noble-${title.id})" stroke="${title.color}" stroke-width="${i>=7?3:2}"/><path d="M60 23 88 34 84 71Q75 88 60 96 45 88 36 71L32 34Z" fill="#161925" stroke="${title.color}" stroke-width="1" ${i===0?'stroke-dasharray="3 3"':''}/><g fill="${title.color}" color="${title.color}">${motifs[title.symbol]}</g>${i>=4?`<circle cx="24" cy="29" r="3" fill="#fff"/><circle cx="96" cy="29" r="3" fill="#fff"/>`:''}</svg>`;
}
