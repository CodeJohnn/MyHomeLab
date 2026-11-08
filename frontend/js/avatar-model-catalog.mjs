export const avatarModels=[
  {id:'default',label:'Personalizado'},
  {id:'punk',label:'Punk',file:'punk.glb',height:1.95},
  {id:'female_punk',label:'Punk feminino',file:'female punkl.glb',height:1.95},
  {id:'android',motion:'rigid',label:'Android',file:'android.glb',height:1.9},
  {id:'caveirata',label:'Caveirata',file:'caveirata.glb',height:1.95},
  {id:'perseu',motion:'rigid',label:'Perseu',file:'perseu.glb',height:1.95},
];
export function findAvatarModel(id){return avatarModels.find(model=>model.id===id);}
export function findModelAnimation(clips,key){return clips.find(clip=>clip.name.split('|').some(token=>token.toLowerCase()===key.toLowerCase()));}
