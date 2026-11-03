export const avatarModels=[
  {id:'default',label:'Personalizado'},
  {id:'punk',label:'Punk',file:'punk.glb',height:1.95},
  {id:'female_punk',label:'Punk feminino',file:'female punkl.glb',height:1.95},
  {id:'android',motion:'rigid',label:'Android',file:'android.glb',height:1.9},
  {id:'caveirata',label:'Caveirata',file:'caveirata.glb',height:1.95},
  {id:'gnomo',motion:'rigid',label:'Gnomo',file:'gnomo.glb',height:1.3},
  {id:'mini',label:'Mini',file:'mini.glb',height:1.35},
  {id:'negao',motion:'rigid',label:'Negao',file:'negao.glb',height:1.95},
  {id:'noia',label:'Noia',file:'noia.glb',height:1.95},
  {id:'perseu',motion:'rigid',label:'Perseu',file:'perseu.glb',height:1.95},
  {id:'female_bikini',motion:'rigid',label:'Feminina',file:'feminina-optimized.glb',height:1.85},
  {id:'jessica',motion:'rigid',label:'Gostosa',file:'jessica-optimized.glb',height:1.8},
  {id:'blonde_woman',motion:'rigid',label:'Loira',file:'blonde-woman-optimized.glb',height:1.85},
  {id:'plus_size',motion:'rigid',label:'Gostosa porte grande',file:'plus-size-optimized.glb',height:1.85},
  {id:'hinata',motion:'rigid',label:'Hinata',file:'hinata.glb',height:1.85},
  {id:'sakura',motion:'rigid',label:'Sakura',file:'sakura.glb',height:1.85},
  {id:'n18',motion:'rigid',label:'N18',file:'N18.glb',height:1.85}
];
export function findAvatarModel(id){return avatarModels.find(model=>model.id===id);}
export function findModelAnimation(clips,key){return clips.find(clip=>clip.name.split('|').some(token=>token.toLowerCase()===key.toLowerCase()));}
