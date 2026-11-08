// Shared data; durations in seconds, 0 means a looping action.
export const soloActions=Object.freeze([
  ['dance','Dança livre',0],['funk','Funk',0],['hiphop','Hip-hop',0],['romantic','Dança romântica',0],['funny','Dança engraçada',0],
  ['wave','Dar tchau',3],['floor','Sentar no chão',0],['kneel','Ajoelhar',0],['clap','Aplaudir',4],['laugh','Rir',4],['cry','Chorar',6],['sleep','Deitar e dormir',0],['blowkiss','Mandar beijo',3],['celebrate','Comemorar',4],
  ['fart','Peidar',3],['finger','Dedo do meio',3],['point','Apontar',3],['cross','Cruzar os braços',0]
]);
export const pairActions=Object.freeze([['hug','Abraçar',4,.64],['kiss','Beijar',3.5,.64],['handshake','Cumprimentar',3,.94],['duet','Dançar em dupla',12,1.18]]);
const durations=new Map([...soloActions,...pairActions].map(([id,,duration])=>[id,duration]));
export const actionDuration=id=>durations.get(id)||0;
export const smoothAction=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
export function pairPlacement(a,b,kind){
  const distance=pairActions.find(action=>action[0]===kind)?.[3];if(!distance)return null;
  const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
  const ux=length>.01?dx/length:1,uz=length>.01?dz/length:0;
  const x=(a.x+b.x)/2,z=(a.z+b.z)/2,y=(a.y+b.y)/2;
  return [{x:x-ux*distance/2,y,z:z-uz*distance/2,r:Math.atan2(ux,uz)},
    {x:x+ux*distance/2,y,z:z+uz*distance/2,r:Math.atan2(-ux,-uz)}];
}
export function validActionPose(p){
  if(p.action!==undefined&&p.action!==null&&!soloActions.some(action=>action[0]===p.action))return false;
  return ['actionTime','actionBaseY','pitch','roll'].every(key=>p[key]===undefined||(Number.isFinite(p[key])&&Math.abs(p[key])<=(key==='actionTime'?3600:key==='actionBaseY'?1000:Math.PI)));
}
