import {createPeerVideo} from './peer-video.mjs';
import {apiUrl} from './config.mjs';
import {characterReactions} from './emotion-reactions.mjs';

export function createSharedRoom({getPose,onMembers,onVideo,onSpawn,onMessage,onWorld,onAvatar,onReaction}) {
  const panel=document.createElement('details');
  panel.hidden=true;
  panel.innerHTML=`<summary><span class="onlineHeading"><span class="onlineIndicator"></span>Mundo online</span><span class="onlineCount" data-count>Conectando</span><span class="onlineChevron" aria-hidden="true">&#8964;</span></summary>
  <div class="onlineBody"><section class="onlinePeople"><div class="onlineSectionTitle">NA SALA</div><div data-people class="onlinePeopleList"></div></section>
  <details class="onlineProfile"><summary>Meu perfil <span aria-hidden="true">+</span></summary><label>Seu nome <input data-name maxlength="30" value="Visitante"></label></details>
  <button data-join class="onlinePrimary">Entrar no mundo</button>
  <div class="onlineActions"><button data-copy hidden>Copiar convite</button><button data-leave class="onlineLeave" hidden>Sair</button></div>
  <p data-status role="status" class="onlineStatus"></p>
  <div class="onlineChatSlot"></div>
  <details class="onlineMedia"><summary>Compartilhar uma tela <span aria-hidden="true">+</span></summary><label data-upload hidden class="onlineUpload">Escolher v&iacute;deo<input data-file type="file" accept="video/mp4,video/webm,video/ogg"><small>Transmissao direta &middot; mantenha esta pagina aberta</small></label><video data-video controls playsinline hidden></video><button data-stop hidden>Encerrar transmissao</button><button data-resume hidden>Ativar reprodu&ccedil;&atilde;o</button></details>
  </div>`;
  document.body.append(panel);
  panel.className='onlineRoom';
  const nameInput=panel.querySelector('[data-name]');
  const nameForm=document.createElement('form');nameForm.className='onlineIdentity';
  nameInput.parentElement.replaceWith(nameForm);
  const nameLabel=document.createElement('label');nameLabel.textContent='Como quer ser chamado?';nameForm.append(nameLabel);nameLabel.append(nameInput);
  const saveName=document.createElement('button');saveName.type='submit';saveName.textContent='Salvar';nameForm.append(saveName);
  const nameFeedback=document.createElement('small');nameFeedback.setAttribute('role','status');nameForm.append(nameFeedback);
  const avatarEditor=document.createElement('form');avatarEditor.className='onlineAvatarEditor';
  avatarEditor.innerHTML='<strong>Seu avatar</strong><label>Personagem<select name="gender"><option value="masculine">Masculino</option><option value="feminine">Feminino</option></select></label><label>Cabelo<select name="hairStyle"><option value="short">Curto</option><option value="long">Longo</option><option value="curly">Cacheado</option></select></label><div class="onlineAvatarColors"><label>Pele<input name="skin" type="color" value="#bd896c"></label><label>Cabelo<input name="hair" type="color" value="#292725"></label><label>Camisa<input name="shirt" type="color" value="#080808"></label><label>Calca<input name="pants" type="color" value="#17191e"></label></div><label><input name="glasses" type="checkbox" checked> Usar oculos</label><button class="onlinePrimary">Salvar avatar</button><small role="status" data-avatar-feedback></small>';
  panel.querySelector('.onlineProfile').append(avatarEditor);
  const avatarInput=name=>avatarEditor.elements.namedItem(name);
  const readAvatar=()=>Object.fromEntries(['gender','hairStyle','skin','hair','shirt','pants','glasses'].map(key=>[key,key==='glasses'?avatarInput(key).checked:avatarInput(key).value]));
  try{const saved=JSON.parse(localStorage.getItem('homelab.avatar')||'null');if(saved)for(const key of ['gender','hairStyle','skin','hair','shirt','pants','glasses']){if(key==='glasses')avatarInput(key).checked=saved[key]!==false;else if(typeof saved[key]==='string')avatarInput(key).value=saved[key];}}catch{}
  avatarInput('gender').onchange=()=>{avatarInput('hairStyle').value=avatarInput('gender').value==='feminine'?'long':'short';};
  avatarEditor.onsubmit=async event=>{
    event.preventDefault();const appearance=readAvatar(),button=avatarEditor.querySelector('button');button.disabled=true;
    try{if(token)await api('state',{avatar:appearance});localStorage.setItem('homelab.avatar',JSON.stringify(appearance));onAvatar?.(appearance);avatarEditor.querySelector('[data-avatar-feedback]').textContent='Avatar salvo.';}
    catch(error){avatarEditor.querySelector('[data-avatar-feedback]').textContent=error.message;}finally{button.disabled=false;}
  };
  onAvatar?.(readAvatar());
  const social=document.createElement('div');social.className='onlineSocial';
  social.innerHTML='<div class="onlineSectionTitle">CONVERSA</div><div data-chat role="log" aria-live="polite" aria-label="Conversa da sala"></div><form data-form><input data-message maxlength="280" placeholder="Escreva uma mensagem..." aria-label="Mensagem" autocomplete="off"><button class="onlinePrimary" aria-label="Enviar mensagem">Enviar</button></form><div class="onlineReactions"><button type="button" data-wave>&#128075; Acenar</button><button type="button" data-heart>&#9825; Curtir</button><button type="button" data-laugh>&#128514; Rir</button><button type="button" data-anger>😡 Raiva</button></div>';
  panel.querySelector('.onlineChatSlot').append(social);panel.open=!matchMedia('(max-width: 600px)').matches;
  panel.addEventListener('keydown',e=>e.stopPropagation());
  panel.addEventListener('keyup',e=>e.stopPropagation());
  const el=n=>panel.querySelector(`[data-${n}]`), video=el('video');
  let room=new URL(location.href).searchParams.get('sala'),token=null,selfId=null,events=null,offset=0,media=null,applying=false,lastPlayback='',closed=false;
  const peer=createPeerVideo({video,api,getSelfId:()=>selfId,onDisplay:(player,screen)=>{player.hidden=false;onVideo(player,screen);},onStatus:text=>status(text),onResume:()=>{el('resume').hidden=false;el('resume').textContent='Ativar som / reproduzir';}});
  el('stop').onclick=()=>peer.stop().catch(showError);
  const seenMessages=new Set();
  const sessionKey=key=>`homelab.session.${key}`;
  el('name').value=localStorage.getItem('homelab.name')||`Visitante ${Math.floor(Math.random()*900+100)}`;
  async function sendMessage(text){if(!token)return status('Entre no mundo para conversar.');try{await api('state',{message:text});}catch(e){showError(e);}}
  el('form').onsubmit=e=>{e.preventDefault();const text=el('message').value.trim();if(text){sendMessage(text);el('message').value='';}};
  el('wave').onclick=()=>sendMessage('👋');el('heart').onclick=()=>sendMessage('❤️');
  function sendReaction(type){
    const message=characterReactions[type]?.message;
    if(!message)return;
    onReaction?.(type);
    void sendMessage(message);
  }
  el('laugh').onclick=()=>sendReaction('laugh');el('anger').onclick=()=>sendReaction('anger');
  if(room){el('join').textContent='Entrar na sala';panel.open=true;}
  const status=text=>{el('status').textContent=text;};
  async function api(action,data,raw=false){
    const response=await fetch(apiUrl(action==='lobby'?'/api/lobby':`/api/rooms${action==='create'?'':`/${room}/${action}`}`),{method:'POST',headers:{'Content-Type':raw?data.type:'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:raw?data:JSON.stringify(data)});
    if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('N?o foi poss?vel conectar. Tente novamente em instantes.');
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
  function playback(){if(!token||!media||applying||video.readyState<1||(media.kind==='peer'&&!peer.isHost()))return;api('state',{playback:{paused:video.paused,time:video.currentTime}}).catch(showError);}
  for(const event of ['play','pause','seeked'])video.addEventListener(event,playback);
  async function apply(){
    if(!media||media.kind==='peer'||video.readyState<1)return;
    const target=media.time+(media.paused?0:Math.max(0,(Date.now()+offset-media.updatedAt)/1000));
    applying=true;
    if(Math.abs(video.currentTime-target)>.8)video.currentTime=Math.min(target,Number.isFinite(video.duration)?video.duration:target);
    if(media.paused)video.pause();else if(video.paused)await video.play().catch(()=>{el('resume').hidden=false;});
    setTimeout(()=>{applying=false;},150);
  }
  video.addEventListener('loadedmetadata',()=>{apply();});
  function receiveMedia(next){
    if(next.kind==='peer'){media=next;el('stop').hidden=next.hostId!==selfId;return;}
    el('stop').hidden=true;
    const changed=JSON.stringify(next)!==lastPlayback;lastPlayback=JSON.stringify(next);media=next;
    const src=`${apiUrl(media.url)}&token=${token}`;
    if(video.getAttribute('src')!==src){applying=true;video.src=src;video.hidden=false;onVideo(video,media.screen||'screen-0');}
    if(changed)apply();
  }
  el('resume').onclick=()=>{video.muted=false;video.volume=1;video.play().then(()=>{el('resume').hidden=true;playback();}).catch(showError);};
  el('join').onclick=async()=>{
    el('join').disabled=true;
    try {
      if(!room)room=(await api('lobby',{})).room;
      const joined=await api('join',{name:el('name').value,avatar:readAvatar(),token:sessionStorage.getItem(sessionKey(room))});token=joined.token;selfId=joined.id;closed=false;
      sessionStorage.setItem(sessionKey(room),token);localStorage.setItem('homelab.name',el('name').value);onSpawn?.(joined.pose);
      onWorld?.(joined.world);
      await api('state',{pose:getPose()});
      const address=new URL(location.href);address.searchParams.set('sala',room);history.replaceState(null,'',address);
      for(const name of ['copy','leave','upload'])el(name).hidden=false;
      el('join').hidden=true;
      events=new EventSource(apiUrl(`/api/rooms/${room}/events?token=${token}`));
      events.addEventListener('peer-signal',event=>{try{peer.signal(JSON.parse(event.data));}catch(error){showError(error);}});
      events.onmessage=e=>{
        const state=JSON.parse(e.data);
        el('count').textContent=state.members.length+' online';
        el('people').replaceChildren(...state.members.map(member=>{
          const chip=document.createElement('span');chip.className='onlinePerson'+(member.id===selfId?' isSelf':'');
          chip.textContent=member.name+(member.id===selfId?' (voc\u00ea)':'');return chip;
        }));
        offset=state.serverTime-Date.now();onMembers(state.members.filter(m=>m.id!==selfId));
        onWorld?.(state.world);
        if(!state.media)status('Conectado a sala');
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
        const hadMedia=Boolean(media);
        peer.update(state.media,state.members);
        if(state.media)receiveMedia(state.media);
        else if(hadMedia){media=null;video.hidden=true;el('stop').hidden=true;onVideo(null,null);}
      };
      events.onerror=()=>{status('Reconectando à sala… Se a sala expirou, saia e crie outra.');checkAvailability();};
    }catch(e){showError(e);}finally{el('join').disabled=false;}
  };
  el('copy').onclick=()=>navigator.clipboard.writeText(location.href).then(()=>status('Convite copiado!')).catch(()=>status(`Convite: ${location.href}`));
  async function uploadVideo(file,screen='screen-0'){
    if(!token)throw new Error('Entre na sala antes de compartilhar o vídeo.');
    const next=await peer.start(file,screen);media=next;el('stop').hidden=false;
  }
  el('file').onchange=async()=>{
    const file=el('file').files[0];if(!file)return;
    el('file').disabled=true;status('Preparando vídeo…');
    try{await uploadVideo(file);}catch(e){showError(e);}finally{el('file').disabled=false;el('file').value='';}
  };
  el('leave').onclick=async()=>{
    try{await api('leave',{});}catch(e){showError(e);return;}
    peer.update(null,[]);onVideo(null,null);onWorld?.(null);
    sessionStorage.removeItem(sessionKey(room));closed=true;events?.close();token=null;media=null;video.pause();video.removeAttribute('src');video.load();video.hidden=true;onMembers([]);
    for(const name of ['copy','leave','upload','resume','stop'])el(name).hidden=true;
    el('count').textContent='Dispon\u00edvel';el('people').replaceChildren();
    room=null;el('join').hidden=false;el('join').textContent='Entrar no mundo';const address=new URL(location.href);address.searchParams.delete('sala');history.replaceState(null,'',address);status('Você saiu da sala.');
  };
  let sending=false;
  setInterval(async()=>{if(!token||closed||sending)return;sending=true;try{await api('state',{pose:getPose()});}catch(e){showError(e);}finally{sending=false;}},100);
  setInterval(()=>{if(token&&media)apply();},5000);
  addEventListener('pagehide',()=>{events?.close();peer.close();});
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
  return {isOnline:()=>Boolean(token&&!closed&&!panel.hidden&&navigator.onLine),getSelfId:()=>selfId,uploadVideo,notify:status,sendWorldAction:async action=>{if(!token)throw new Error('Entre na sala para interagir.');try{return await api('state',{worldAction:action});}catch(e){showError(e);throw e;}}};
}
