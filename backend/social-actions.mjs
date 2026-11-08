import {pairActions,pairPlacement,actionDuration} from '../frontend/js/social-action-catalog.mjs';
const fail=(message,status=409)=>{throw Object.assign(new Error(message),{status});};
export function socialSnapshot(room,now=Date.now()){
  room.social||=new Map();
  const members=new Set([...room.members.values()].map(member=>member.id));
  for(const [id,session] of room.social)if(session.expires<=now||!members.has(session.from)||!members.has(session.to)){room.social.delete(id);room.socialVersion=(room.socialVersion||0)+1;}
  return [...room.social.values()];
}
export function socialAction(room,member,input,now=Date.now(),makeId=()=>String(now)){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('Solicitação inválida.',400);
  const sessions=socialSnapshot(room,now),members=[...room.members.values()];
  if(input.type==='invite'){
    if(!pairActions.some(([id])=>id===input.kind))fail('Interação desconhecida.',400);
    const target=members.find(other=>other.id===input.target);
    if(!target||target===member)fail('Escolha outro jogador conectado.',400);
    if(sessions.some(session=>[session.from,session.to].some(id=>id===member.id||id===target.id)))fail('Um dos jogadores já tem um convite ou interação.');
    if(now-(member.lastSocialInvite??-Infinity)<3000)fail('Aguarde antes de convidar novamente.',429);
    if(!available(member,target))fail('Os dois jogadores precisam estar livres, próximos e no mesmo piso.');
    member.lastSocialInvite=now;
    const session={id:makeId(),from:member.id,to:target.id,kind:input.kind,state:'pending',expires:now+20000};
    room.social.set(session.id,session);room.socialVersion=(room.socialVersion||0)+1;return session;
  }
  const session=room.social.get(input.id);
  if(!session||![session.from,session.to].includes(member.id))fail('Convite encerrado ou não pertence a você.',403);
  if(input.type==='cancel'||input.type==='decline'){
    if(input.type==='decline'&&(member.id!==session.to||session.state!=='pending'))fail('Não é possível recusar este convite.',403);
    room.social.delete(session.id);room.socialVersion=(room.socialVersion||0)+1;return {ended:true};
  }
  if(input.type!=='accept'||member.id!==session.to||session.state!=='pending')fail('Apenas o destinatário pode aceitar um convite pendente.',403);
  const source=members.find(other=>other.id===session.from);
  if(!source||!available(source,member))fail('O outro jogador se afastou ou está ocupado.');
  session.state='active';session.startsAt=now+750;session.approach=1500;
  session.origins=[source,member].map(other=>({x:other.pose.x,y:other.pose.y,z:other.pose.z,r:other.pose.r}));
  session.anchors=pairPlacement(source.pose,member.pose,session.kind);
  session.expires=session.startsAt+session.approach+actionDuration(session.kind)*1000;
  room.socialVersion=(room.socialVersion||0)+1;
  return session;
}
function available(a,b){
  return [a,b].every(member=>member.pose&&member.pose.equipmentActive!==false&&!member.pose.action)&&Math.hypot(a.pose.x-b.pose.x,a.pose.z-b.pose.z)<=3&&Math.abs(a.pose.y-b.pose.y)<.2;
}
