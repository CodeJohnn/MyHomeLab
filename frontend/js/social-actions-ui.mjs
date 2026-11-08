import {pairActions,pairPlacement,smoothAction} from './social-action-catalog.mjs';
export function createSocialActions({send,getSelfId,getTime,getPose,canJoin,clearPath,onStart,onEnd,notify}){
  let sessions=[],members=[],current=null,signature='',pendingKind=null,busy=false,queuedCancel=null,lastVersion=-1,stopAfterRequest=false;
  const byMember=new Map(),dialog=document.createElement('dialog');dialog.className='socialActionDialog';dialog.setAttribute('aria-label','Interações em dupla');
  dialog.innerHTML='<h2>Interação em dupla</h2><p></p><label>Jogador<select></select></label><div><button type="button" data-confirm>Convidar</button><button type="button" data-cancel>Cancelar</button></div><small role="status"></small>';
  document.body.append(dialog);
  const message=dialog.querySelector('p'),select=dialog.querySelector('select'),label=dialog.querySelector('label'),confirm=dialog.querySelector('[data-confirm]'),cancel=dialog.querySelector('[data-cancel]'),status=dialog.querySelector('small');
  const mine=()=>sessions.find(session=>[session.from,session.to].includes(getSelfId())&&session.expires>getTime());
  async function request(input){
    if(busy){if(input.type==='cancel'||input.type==='decline')queuedCancel={...input,type:'cancel'};return;}busy=true;confirm.disabled=cancel.disabled=true;
    try{const state=await send(input);update(state.social,state.members,state.socialVersion);pendingKind=null;}
    catch(error){status.textContent=error.message;notify(error.message);}
    finally{busy=false;confirm.disabled=cancel.disabled=false;render();if(queuedCancel){const next=queuedCancel;queuedCancel=null;void request(next);}else if(stopAfterRequest){stopAfterRequest=false;stop();}}
  }
  function safeSession(session){
    return session.anchors.every((anchor,i)=>clearPath(session.origins[i],anchor,[session.from,session.to]));
  }
  function render(){
    const session=mine();
    if(session?.state==='active'){if(dialog.open)dialog.close();return;}
    if(session){
      const incoming=session.to===getSelfId(),other=members.find(member=>member.id===(incoming?session.from:session.to));
      const action=(pairActions.find(([id])=>id===session.kind)?.[1]||session.kind).toLowerCase();
      message.textContent=(incoming?(other?.name||'Jogador')+' quer '+action+' com você.':'Aguardando '+(other?.name||'jogador')+' aceitar: '+action+'.')+' '+Math.max(0,Math.ceil((session.expires-getTime())/1000))+' s';
      label.hidden=true;confirm.hidden=!incoming;confirm.textContent='Aceitar';cancel.textContent=incoming?'Recusar':'Cancelar convite';
    }else if(pendingKind){
      message.textContent=pairActions.find(([id])=>id===pendingKind)[1]+': escolha alguém próximo. A outra pessoa precisa aceitar.';
      label.hidden=false;confirm.hidden=false;confirm.textContent='Convidar';cancel.textContent='Voltar';
      const peers=members.filter(member=>member.id!==getSelfId()&&member.pose&&Math.hypot(member.pose.x-getPose().x,member.pose.z-getPose().z)<=3);
      const ids=peers.map(member=>member.id).join(':');
      if(select.dataset.people!==ids){select.dataset.people=ids;select.replaceChildren(...peers.map(member=>new Option(member.name,member.id)));}
      confirm.disabled=busy||!peers.length;
      if(!peers.length)status.textContent='Aproxime-se de outro jogador conectado.';
    }else{if(dialog.open)dialog.close();return;}
    if(!dialog.open&&!document.querySelector('dialog[open]'))dialog.showModal();
  }
  confirm.onclick=()=>{
    if(!canJoin()){status.textContent='Pare sua ação atual e fique de pé antes de aceitar.';return;}
    const session=mine(),source=session?members.find(member=>member.id===session.from):null;
    const a=source?.pose||getPose(),b=session?getPose():members.find(member=>member.id===select.value)?.pose;
    const anchors=b&&pairPlacement(a,b,session?.kind||pendingKind);
    const participants=session?[session.from,session.to]:[getSelfId(),select.value];
    if(!anchors||!clearPath(a,anchors[0],participants)||!clearPath(b,anchors[1],participants)){status.textContent='Não há espaço livre para a aproximação. Escolham outro lugar.';return;}
    void request(session?{type:'accept',id:session.id}:{type:'invite',kind:pendingKind,target:select.value});
  };
  const stop=()=>{const session=mine();pendingKind=null;if(busy&&!session){stopAfterRequest=true;if(dialog.open)dialog.close();return;}if(session)void request({type:session.state==='pending'&&session.to===getSelfId()?'decline':'cancel',id:session.id});else render();};
  cancel.onclick=stop;dialog.addEventListener('cancel',event=>{event.preventDefault();stop();});
  function update(next=[],people=[],version){
    if(Number.isFinite(version)){if(version<lastVersion)return;lastVersion=version;}
    if(!people.length)lastVersion=-1;
    sessions=next;members=people;byMember.clear();
    for(const session of sessions)if(session.state==='active'&&session.expires>getTime()){byMember.set(session.from,session);byMember.set(session.to,session);}
    const active=byMember.get(getSelfId())||null;
    if(active?.id!==current?.id){
      if(current)onEnd();current=active;
      if(active){
        if(!canJoin()||!safeSession(active)){notify('A interação foi cancelada: espaço ocupado ou personagem indisponível.');void request({type:'cancel',id:active.id});current=null;byMember.delete(getSelfId());}
        else onStart(active);
      }
    }
    const nextSignature=JSON.stringify([sessions,members.map(member=>[member.id,member.name])]);
    if(nextSignature!==signature){signature=nextSignature;status.textContent='';render();}
  }
  const timer=setInterval(()=>{const now=getTime();if(sessions.some(session=>session.expires<=now))update(sessions.filter(session=>session.expires>now),members);if(dialog.open)render();},500);
  const dispose=()=>{clearInterval(timer);if(dialog.open)dialog.close();dialog.remove();};
  addEventListener('pagehide',dispose,{once:true});
  return {update,open(kind){pendingKind=kind;status.textContent='';render();},cancel(){stop();},get(id){const session=byMember.get(id);return session&&session.expires>getTime()?session:null;},dispose};
}
export function poseSocialSession(session,id,now,rig,poseAction){
  const index=session.from===id?0:1,origin=session.origins[index],anchor=session.anchors[index];
  const elapsed=Math.max(0,now-session.startsAt),blend=smoothAction(elapsed/session.approach);
  const {avatar}=rig;
  avatar.position.x=origin.x+(anchor.x-origin.x)*blend;avatar.position.z=origin.z+(anchor.z-origin.z)*blend;
  const turn=Math.atan2(Math.sin(anchor.r-origin.r),Math.cos(anchor.r-origin.r));avatar.rotation.y=origin.r+turn*blend;
  const time=Math.max(0,(elapsed-session.approach)/1000);
  if(blend<1){
    const movement=Math.sin(blend*Math.PI),phase=elapsed*.009;
    rig.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(phase+i*Math.PI)*.3*movement);
    rig.arms.forEach((arm,i)=>arm.rotation.x=-Math.sin(phase+i*Math.PI)*.2*movement);
    avatar.position.y=origin.y+(anchor.y-origin.y)*blend;return;
  }
  poseAction(session.kind,time,{...rig,baseY:anchor.y});
}
