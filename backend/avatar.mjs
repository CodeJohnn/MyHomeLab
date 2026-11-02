export const defaultAvatar={gender:'masculine',skin:'#bd896c',hair:'#292725',shirt:'#080808',pants:'#17191e',hairStyle:'short',glasses:true};
export function validateAvatar(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  if(!['masculine','feminine'].includes(value.gender)||!['short','long','curly'].includes(value.hairStyle)||typeof value.glasses!=='boolean')return null;
  for(const key of ['skin','hair','shirt','pants'])if(typeof value[key]!=='string'||!/^#[0-9a-f]{6}$/i.test(value[key]))return null;
  return Object.fromEntries(Object.keys(defaultAvatar).map(key=>[key,value[key]]));
}
