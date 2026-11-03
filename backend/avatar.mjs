import {findAvatarModel} from '../frontend/js/avatar-model-catalog.mjs';
import {wardrobe,wardrobeDefaults} from '../frontend/js/avatar-wardrobe.mjs';
export const defaultAvatar={gender:'masculine',skin:'#bd896c',hair:'#292725',shirt:'#080808',pants:'#17191e',hairStyle:'short',glasses:true,model:'default',...wardrobeDefaults};
export function validateAvatar(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  if(!['masculine','feminine'].includes(value.gender)||!['short','long','curly','bob','ponytail','fade','quiff'].includes(value.hairStyle)||typeof value.glasses!=='boolean')return null;
  if(value.model!==undefined&&!findAvatarModel(value.model))return null;
  for(const key of ['skin','hair','shirt','pants'])if(typeof value[key]!=='string'||!/^#[0-9a-f]{6}$/i.test(value[key]))return null;
  for(const [key,choices] of Object.entries(wardrobe))if(value[key]!==undefined&&!choices.some(([id])=>id===value[key])&&!({outfit:['dress'],bottom:['cargo','skirt']}[key]||[]).includes(value[key]))return null;
  if(value.shoes!==undefined&&(typeof value.shoes!=='string'||!/^#[0-9a-f]{6}$/i.test(value.shoes)))return null;
  value={model:'default',...wardrobeDefaults,...value};
  return Object.fromEntries(Object.keys(defaultAvatar).map(key=>[key,value[key]]));
}
