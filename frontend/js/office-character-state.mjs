export const requiredOfficeClips=['Idle','Walk','Sit','Typing','Wave'];

export function selectOfficeClip({pose=null,moving=false,waving=false}={}){
  if(pose==='typing'||pose==='mouse')return 'Typing';
  if(pose==='sit'||pose==='toilet')return 'Sit';
  if(waving||pose==='emote:wave')return 'Wave';
  return moving?'Walk':'Idle';
}

export function validateOfficeClips(clips){
  const names=new Set(clips.map(clip=>clip.name));
  const missing=requiredOfficeClips.filter(name=>!names.has(name));
  if(missing.length)throw new Error('Clipes obrigatórios ausentes: '+missing.join(', '));
}
