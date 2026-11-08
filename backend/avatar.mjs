import {findAvatarModel} from '../frontend/js/avatar-model-catalog.mjs';
import {wardrobe,wardrobeDefaults} from '../frontend/js/avatar-wardrobe.mjs';
import {validateEquipment,articulatedAccessoryModels} from '../frontend/js/accessory-catalog.mjs';
export const defaultAvatar={gender:'masculine',skin:'#bd896c',hair:'#292725',shirt:'#080808',pants:'#17191e',hairStyle:'short',glasses:true,model:'default',accessories:{},...wardrobeDefaults};
export function validateAvatar(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  if(!['masculine','feminine'].includes(value.gender)||!['short','long','curly','bob','ponytail','fade','quiff'].includes(value.hairStyle)||typeof value.glasses!=='boolean')return null;
  if(value.model!==undefined&&!findAvatarModel(value.model))return null;
  for(const key of ['skin','hair','shirt','pants'])if(typeof value[key]!=='string'||!/^#[0-9a-f]{6}$/i.test(value[key]))return null;
  for(const [key,choices] of Object.entries(wardrobe))if(value[key]!==undefined&&!choices.some(([id])=>id===value[key])&&!({outfit:['dress'],bottom:['cargo','skirt']}[key]||[]).includes(value[key]))return null;
  if(value.shoes!==undefined&&(typeof value.shoes!=='string'||!/^#[0-9a-f]{6}$/i.test(value.shoes)))return null;
  const accessories=validateEquipment(value.accessories);if(!accessories)return null;
  if(!articulatedAccessoryModels.has(value.model||'default')&&(accessories.LeftHand||accessories.RightHand))return null;
  value={model:'default',...wardrobeDefaults,...value,accessories,...(accessories.Head?{hat:'none'}:{}),...(accessories.Face?{glasses:false}:{})};
  return Object.fromEntries(Object.keys(defaultAvatar).map(key=>[key,value[key]]));
}
