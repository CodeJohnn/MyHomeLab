import {apiUrl} from './config.mjs';

export function createSharedRoom({getPose,onMembers,onVideo,onSpawn,onMessage,onWorld}) {
  const panel=document.createElement('details');
  panel.hidden=true;
  panel.style.cssText='position:fixed;right:14px;top:14px;z-index:20;background:#101b23;color:#e8f1ef;padding:12px;border:1px solid #35d99a;border-radius:10px;max-width:300px;font:14px Arial';
  panel.innerHTML='<summary>Assistir juntos</summary><div style="display:grid;gap:8px;margin-top:12px"><label>Seu nome <input data-name maxlength="30" value="Visitante"></label><button data-join>Criar sala</button><button data-copy hidden>Copiar convite</button><button data-leave hidden>Sair da sala</button><label data-upload hidden>Compartilhar vídeo (até 100 MB)<input data-file type="file" accept="video/mp4,video/webm,video/ogg"></label><video data-video controls playsinline hidden style="width:100%"></video><button data-resume hidden>Ativar reprodução</button><p data-status role="status" style="margin:0"></p></div>';
  document.body.append(panel);
  panel.className='onlineRoom';
  const nameInput=panel.querySelector('[data-name]');
  const nameForm=document.createElement('form');nameForm.className='onlineIdentity';
  nameInput.parentElement.replaceWith(nameForm);
  const nameLabel=document.createElement('label');nameLabel.textContent='COMO QUER SER CHAMADO?';nameForm.append(nameLabel);nameLabel.append(nameInput);
  const saveName=document.createElement('button');saveName.type='submit';saveName.textContent='Salvar nome';nameForm.append(saveName);
  const nameFeedback=document.createElement('small');nameFeedback.setAttribute('role','status');nameForm.append(nameFeedback);
  panel.querySelector('summary').textContent='Mundo online';
  const social=document.createElement('div');social.style.cssText='display:grid;gap:6px;margin-top:10px';
  social.innerHTML='<div data-chat role="log" aria-label="Chat da sala" style="max-height:150px;overflow:auto;overflow-wrap:anywhere"></div><form data-form style="display:flex;gap:4px"><input data-message maxlength="280" placeholder="Converse com as pessoas…" aria-label="Mensagem" style="min-width:0;width:100%"><button>Enviar</button></form><div><button type="button" data-wave>👋 Acenar</button> <button type="button" data-heart>❤️ Curtir</button></div>';
  panel.append(social);panel.open=true;
  panel.addEventListener('keydown',e=>e.stopPropagation());
  panel.addEventListener('keyup',e=>e.stopPropagation());
  const el=n=>panel.querySelector(`[data-${n}]`), video=el('video');
  let room=new URL(location.href).searchParams.get('sala'),token=null,selfId=null,events=null,offset=0,media=null,applying=false,lastPlayback='',closed=false;
  const seenMessages=new Set();
  const sessionKey=key=>`homelab.session.${key}`;
  el('name').value=localStorage.getItem('homelab.name')||`Visitante ${Math.floor(Math.random()*900+100)}`;
  async function sendMessage(text){if(!token)return status('Entre no mundo para conversar.');try{await api('state',{message:text});}catch(e){showError(e);}}
  el('form').onsubmit=e=>{e.preventDefault();const text=el('message').value.trim();if(text){sendMessage(text);el('message').value='';}};
  el('wave').onclick=()=>sendMessage('👋');el('heart').onclick=()=>sendMessage('❤️');
  if(room){el('join').textContent='Entrar na sala';panel.open=true;}
  const status=text=>{el('status').textContent=text;};
  async function api(action,data,raw=false){
    const response=await fetch(apiUrl(action==='lobby'?'/api/lobby':`/api/rooms${action==='create'?'':`/${room}/${action}`}`),{method:'POST',headers:{'Content-Type':raw?data.type:'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:raw?data:JSON.stringify(data)});
    if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('Backend indispon?vel. Confira o endere?o do Render em frontend/js/config.mjs.');
    const result=await response.json();if(!response.ok)throw new Error(result.error||'Falha de conexão.');return result;
  }
  const showError=e=>{status(e.message);checkAvailability();};
  nameForm.onsubmit=async e=>{
    e.preventDefault();const name=el('name').value.trim();
    if(!name){nameFeedback.textContent='Digite seu nome para continuar.';el('name').focus();return;}
    saveName.disabled=true;
    try{if(token)await api('state',{name});localStorage.setItem('homelab.name',name);el('name').value=name;nameFeedback.textContent=token?'Nome atualizado para todos na sala.':'Nome salvo para sua próxima entrada.';}
    catch(error){nameFeedback.textContent=error.message;}finally{saveName.disabled=false;}
  };
  function playback(){if(!token||!media||applying||video.readyState<1)return;api('state',{playback:{paused:video.paused,time:video.currentTime}}).catch(showError);}
  for(const event of ['play','pause','seeked'])video.addEventListener(event,playback);
  async function apply(){
    if(!media||video.readyState<1)return;
    const target=media.time+(media.paused?0:Math.max(0,(Date.now()+offset-media.updatedAt)/1000));
    applying=true;
    if(Math.abs(video.currentTime-target)>.8)video.currentTime=Math.min(target,Number.isFinite(video.duration)?video.duration:target);
    if(media.paused)video.pause();else if(video.paused)await video.play().catch(()=>{el('resume').hidden=false;});
    setTimeout(()=>{applying=false;},150);
  }
  video.addEventListener('loadedmetadata',()=>{apply();});
  function receiveMedia(next){
    const changed=JSON.stringify(next)!==lastPlayback;lastPlayback=JSON.stringify(next);media=next;
    const src=`${apiUrl(media.url)}&token=${token}`;
    if(video.getAttribute('src')!==src){applying=true;video.src=src;video.hidden=false;onVideo(video,media.screen||'screen-0');}
    if(changed)apply();
  }
  el('resume').onclick=()=>{video.play().then(()=>{el('resume').hidden=true;playback();}).catch(showError);};
  el('join').onclick=async()=>{
    el('join').disabled=true;
    try {
      if(!room)room=(await api('lobby',{})).room;
      const joined=await api('join',{name:el('name').value,token:sessionStorage.getItem(sessionKey(room))});token=joined.token;selfId=joined.id;closed=false;
      sessionStorage.setItem(sessionKey(room),token);localStorage.setItem('homelab.name',el('name').value);onSpawn?.(joined.pose);
      onWorld?.(joined.world);
      await api('state',{pose:getPose()});
      const address=new URL(location.href);address.searchParams.set('sala',room);history.replaceState(null,'',address);
      for(const name of ['copy','leave','upload'])el(name).hidden=false;
      el('join').hidden=true;
      events=new EventSource(apiUrl(`/api/rooms/${room}/events?token=${token}`));
      events.onmessage=e=>{
        const state=JSON.parse(e.data);offset=state.serverTime-Date.now();onMembers(state.members.filter(m=>m.id!==selfId));
        onWorld?.(state.world);
        status(`${state.members.map(m=>m.name).join(', ')} · ${state.members.length} pessoa(s) online`);
        for(const message of state.messages||[])if(!seenMessages.has(message.id)){
          if(message.kind==='system'){
            seenMessages.add(message.id);const notice=document.createElement('p');notice.className='onlineSystemMessage';notice.textContent=message.text;notice.setAttribute('role','status');el('chat').append(notice);
            while(el('chat').children.length>40)el('chat').firstChild.remove();el('chat').scrollTop=el('chat').scrollHeight;continue;
          }
          seenMessages.add(message.id);const line=document.createElement('div');line.className='onlineMessage'+(message.sender===selfId?' isOwn':'');
          const heading=document.createElement('div');heading.className='onlineMessageHeading';const name=document.createElement('strong');name.textContent=message.sender===selfId?'Você':message.name;const time=document.createElement('time');time.textContent=new Date(message.time).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});heading.append(name,time);
          const text=document.createElement('p');text.textContent=message.text;line.append(heading,text);el('chat').append(line);while(el('chat').children.length>40)el('chat').firstChild.remove();el('chat').scrollTop=el('chat').scrollHeight;
          if(Date.now()+offset-message.time<5000)onMessage?.({...message,self:message.sender===selfId});
        }
        if(state.media)receiveMedia(state.media);
      };
      events.onerror=()=>{status('Reconectando à sala… Se a sala expirou, saia e crie outra.');checkAvailability();};
    }catch(e){showError(e);}finally{el('join').disabled=false;}
  };
  el('copy').onclick=()=>navigator.clipboard.writeText(location.href).then(()=>status('Convite copiado!')).catch(()=>status(`Convite: ${location.href}`));
  async function uploadVideo(file,screen='screen-0'){
    if(!token)throw new Error('Entre na sala antes de compartilhar o vídeo.');
    if(file.size>100*1024*1024)throw new Error('O limite é 100 MB por vídeo.');
    status('Enviando vídeo para todos na sala…');
    const result=await api(`upload?screen=${encodeURIComponent(screen)}`,file,true);receiveMedia(result.media);status('Vídeo compartilhado. Aperte play.');
  }
  el('file').onchange=async()=>{
    const file=el('file').files[0];if(!file)return;
    if(file.size>100*1024*1024){status('O limite é 100 MB por vídeo.');return;}
    el('file').disabled=true;status('Enviando vídeo…');
    try{await uploadVideo(file);}catch(e){showError(e);}finally{el('file').disabled=false;el('file').value='';}
  };
  el('leave').onclick=async()=>{
    try{await api('leave',{});}catch(e){showError(e);return;}
    sessionStorage.removeItem(sessionKey(room));closed=true;events?.close();token=null;media=null;video.pause();video.removeAttribute('src');video.load();video.hidden=true;onMembers([]);
    for(const name of ['copy','leave','upload','resume'])el(name).hidden=true;
    room=null;el('join').hidden=false;el('join').textContent='Entrar no mundo';const address=new URL(location.href);address.searchParams.delete('sala');history.replaceState(null,'',address);status('Você saiu da sala.');
  };
  let sending=false;
  setInterval(async()=>{if(!token||closed||sending)return;sending=true;try{await api('state',{pose:getPose()});}catch(e){showError(e);}finally{sending=false;}},100);
  setInterval(()=>{if(token&&media)apply();},5000);
  addEventListener('pagehide',()=>{events?.close();});
  el('join').textContent='Entrar no mundo';
  let checkingAvailability=false,lastAvailabilityCheck=-Infinity,wasAvailable=false,autoJoinStarted=false;
  async function checkAvailability(force=false){
    if(checkingAvailability||(!force&&Date.now()-lastAvailabilityCheck<15000))return;
    checkingAvailability=true;lastAvailabilityCheck=Date.now();
    let available=false;
    try{
      if(navigator.onLine){
        const response=await fetch(apiUrl('/health'),{cache:'no-store',signal:AbortSignal.timeout(8000)});
        available=response.ok&&(await response.json()).ok===true;
      }
    }catch{}
    finally{checkingAvailability=false;}
    panel.hidden=!available;
    if(!available&&wasAvailable)onMembers([]);
    wasAvailable=available;
    if(available&&!autoJoinStarted){autoJoinStarted=true;el('join').click();}
  }
  addEventListener('offline',()=>{panel.hidden=true;wasAvailable=false;onMembers([]);});
  addEventListener('online',()=>checkAvailability(true));
  addEventListener('focus',()=>checkAvailability());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkAvailability();});
  // Sem ping continuo: permite que o Render gratuito repouse sem jogadores.
  checkAvailability(true);
  return {isOnline:()=>Boolean(token&&!closed&&!panel.hidden&&navigator.onLine),uploadVideo,sendWorldAction:async action=>{if(!token)throw new Error('Entre na sala para interagir.');try{return await api('state',{worldAction:action});}catch(e){showError(e);throw e;}}};
}
