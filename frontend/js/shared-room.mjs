import {avatarModels} from './avatar-model-catalog.mjs?v=stable-6';
import {wardrobe} from './avatar-wardrobe.mjs';
import {createPeerVideo} from './peer-video.mjs';
import {apiUrl} from './config.mjs';
import {characterReactions} from './emotion-reactions.mjs';
import {renderNobility,showNoblePromotion,progressionAccountHeaders} from './nobility-ui.mjs';
import {claimDailyReward} from './daily-rewards.mjs';

export function createSharedRoom({getPose,onMembers,onVideo,onSpawn,onMessage,onWorld,onAvatar,onReaction,mountAvatarPreview,onSelfProgression}) {
  let selfProgression={level:1,xp:0},previousSelfLevel=null,selfProgressionSignature='';
  const onlineDock=document.createElement('details');
  onlineDock.className='roomOnlineDock';onlineDock.hidden=true;onlineDock.open=true;
  onlineDock.innerHTML='<summary>Pessoas online <span data-total>0</span><span aria-hidden="true">⌄</span></summary><div class="roomOnlineMembers" aria-label="Pessoas na sala"></div>';
  document.body.append(onlineDock);
  let dockSignature='';
  const initials=name=>(name||'Visitante').trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toLocaleUpperCase('pt-BR');
  function updateOnlineDock(members){
    const signature=JSON.stringify(members.map(member=>[member.id,member.name,member.progression?.level]));
    if(signature===dockSignature)return;dockSignature=signature;
    onlineDock.querySelector('[data-total]').textContent=members.length;
    onlineDock.querySelector('.roomOnlineMembers').replaceChildren(...members.map(member=>{
      const tile=document.createElement('div');tile.className='roomOnlineMember';
      const portrait=document.createElement('span');portrait.className='roomMemberPortrait';portrait.textContent=initials(member.name);portrait.setAttribute('aria-hidden','true');
      const name=document.createElement('span');name.textContent=member.name+(member.id===selfId?' (você)':'');
      const rank=document.createElement('span');renderNobility(rank,member.progression);
      tile.title=name.textContent;tile.append(portrait,name,rank);return tile;
    }));
    const ranking=onlineDock.querySelector('.nobleRanking ol');
    ranking.replaceChildren(...[...members].sort((a,b)=>(b.progression?.level||1)-(a.progression?.level||1)||(b.progression?.xp||0)-(a.progression?.xp||0)||a.name.localeCompare(b.name)).map(member=>{
      const row=document.createElement('li'),name=document.createElement('strong'),rank=document.createElement('span');name.textContent=member.name;renderNobility(rank,member.progression);row.append(name,rank);return row;
    }));
  }
  const presenceNotices=document.createElement('div');
  presenceNotices.className='roomPresenceNotices';
  presenceNotices.setAttribute('role','status');
  presenceNotices.setAttribute('aria-live','polite');
  document.body.append(presenceNotices);
  let previousMembers=null;
  function notifyPresence(name,joined){
    const notice=document.createElement('div');
    notice.className='roomPresenceNotice';
    const icon=document.createElement('span');icon.textContent=joined?'↳':'↗';icon.setAttribute('aria-hidden','true');
    const text=document.createElement('span');
    const username=document.createElement('strong');username.textContent=name||'Visitante';
    text.append(username,document.createTextNode(joined?' entrou na sala':' saiu da sala'));
    notice.append(icon,text);presenceNotices.append(notice);
    while(presenceNotices.children.length>3)presenceNotices.firstChild.remove();
    setTimeout(()=>notice.remove(),5000);
  }
  function updatePresence(members){
    const current=new Map(members.map(member=>[member.id,member.name]));
    if(previousMembers){
      for(const [id,name] of current)if(!previousMembers.has(id))notifyPresence(name,true);
      for(const [id,name] of previousMembers)if(!current.has(id))notifyPresence(name,false);
    }
    previousMembers=current;
  }
  const panel=document.createElement('details');
  panel.hidden=true;
  panel.innerHTML=`<summary><span class="onlineHeading"><span class="onlineIndicator"></span>Conversa</span><span class="onlineCount" data-count>Conectando</span><button type="button" class="onlineOptions" aria-label="Opcoes da sala">&#8943;</button><span class="onlineChevron" aria-hidden="true">&#8964;</span></summary>
  <div class="onlineBody"><nav class="onlineTabs" role="tablist" aria-label="Painel online"><button type="button" id="online-tab-room" role="tab" aria-controls="online-page-room" aria-selected="true" data-tab="room">Sala</button><button type="button" id="online-tab-chat" role="tab" aria-controls="online-page-chat" aria-selected="false" tabindex="-1" data-tab="chat">Conversa</button><button type="button" id="online-tab-profile" role="tab" aria-controls="online-page-profile" aria-selected="false" tabindex="-1" data-tab="profile">Perfil</button><button type="button" id="online-tab-media" role="tab" aria-controls="online-page-media" aria-selected="false" tabindex="-1" data-tab="media">Tela</button></nav>
  <div class="onlineTabPages">
    <section id="online-page-room" role="tabpanel" aria-labelledby="online-tab-room" data-page="room"><div class="onlineWelcome"><span class="onlineWelcomeIcon" aria-hidden="true">&#9672;</span><h3>Um espaço para jogar junto</h3><p>Crie uma sala e convide seus amigos para o laboratório.</p></div><div class="onlineRoomEntry"><button data-join>Entrar na sala publica</button></div><div class="onlinePeople"><div class="onlineSectionTitle">PARTICIPANTES</div><div data-people class="onlinePeopleList"></div></div><div class="onlineActions"><button data-leave class="onlineLeave" hidden>Sair da sala</button></div></section>
    <section id="online-page-chat" role="tabpanel" aria-labelledby="online-tab-chat" data-page="chat" hidden><div class="onlineChatSlot"></div></section>
    <section id="online-page-profile" role="tabpanel" aria-labelledby="online-tab-profile" data-page="profile" hidden><div class="onlinePageHeading"><h3>Seu perfil</h3><p>Escolha como aparecer para o pessoal.</p></div><section class="onlineProfile"><label>Seu nome <input data-name maxlength="30" value="Visitante"></label></section></section>
    <section id="online-page-media" role="tabpanel" aria-labelledby="online-tab-media" data-page="media" hidden><div class="onlinePageHeading"><h3>Uma sessao de cinema</h3><p>Escolha um filme do seu computador para assistir com os amigos.</p></div><section class="onlineMedia"><p class="onlineMediaHint" data-no-session>Entre em uma sala para compartilhar.</p><label data-upload hidden class="onlineUpload"><span>Escolher um video</span><input data-file type="file" accept="video/mp4,video/webm,video/ogg"><small>Transmissao direta. Mantenha esta pagina aberta.</small></label><video data-video controls playsinline hidden></video><button data-stop hidden>Encerrar transmissao</button><button data-resume hidden>Ativar som / reproduzir</button></section></section>
  </div><p data-status role="status" class="onlineStatus"></p></div>`;
  document.body.append(panel);
  panel.className='onlineRoom';panel.dataset.menu='false';
  const visibilityControls=document.createElement('nav');
  visibilityControls.className='roomSocialVisibility';visibilityControls.hidden=true;
  visibilityControls.setAttribute('aria-label','Visibilidade dos painéis');
  panel.id='roomChatPanel';onlineDock.id='roomOnlinePanel';

  for(const [key,label,target] of [['chat','Conversa',panel],['online','Online',onlineDock]]){
    let visible=false;
    try{visible=localStorage.getItem('homelab.panel.compact.'+key)==='visible';}catch{}
    const button=document.createElement('button');button.type='button';
    button.setAttribute('aria-controls',target.id);
    const apply=()=>{
      target.classList.toggle('socialPanelHidden',!visible);
      button.textContent=key==='chat'?'Chat':'Online';
      button.title=(visible?'Ocultar ':'Mostrar ')+label;
      button.setAttribute('aria-label',button.title);
      button.setAttribute('aria-pressed',String(visible));
    };
    button.onclick=()=>{visible=!visible;if(visible){target.open=true;if(key==='chat')selectOnlineTab('chat');}apply();try{localStorage.setItem('homelab.panel.compact.'+key,visible?'visible':'hidden');}catch{}};
    apply();visibilityControls.append(button);
  }
  document.body.append(visibilityControls);
  const ranking=document.createElement('details');ranking.className='nobleRanking';ranking.innerHTML='<summary>Prestígio • nesta sala</summary><ol></ol>';onlineDock.append(ranking);
  const profilePrestige=document.createElement('div');renderNobility(profilePrestige);panel.querySelector('[data-page="profile"]').prepend(profilePrestige);
  const profileDialog=document.createElement('dialog');profileDialog.className='onlineProfileDialog';
  profileDialog.innerHTML='<header><div><small>SEU LUGAR NO LABORATORIO</small><h2>Como voce quer aparecer?</h2><p>Escolha seu nome e personalize seu avatar antes de entrar.</p></div><button type="button" data-profile-close aria-label="Fechar">&#10005;</button></header><div class="onlineProfileLayout"><aside class="onlineAvatarPreview"><div class="onlineAvatarPreviewHeading"><span>SEU AVATAR</span><span class="onlineAvatarLive">AO VIVO</span></div><div class="onlineAvatarPreviewStage"></div><div class="onlineAvatarPreviewAngles"><button type="button" data-preview-front>Frente</button><button type="button" data-preview-back>Costas</button></div><small>Arraste o personagem para girar</small></aside><div class="onlineProfileContent"></div></div>';
  document.body.append(profileDialog);
  const avatarPreview=mountAvatarPreview?.(profileDialog.querySelector('.onlineAvatarPreviewStage'));
  profileDialog.querySelector('[data-preview-front]').onclick=()=>avatarPreview?.turn(0);
  profileDialog.querySelector('[data-preview-back]').onclick=()=>avatarPreview?.turn(Math.PI);
  let profileResolve=null,profileConfirmed=false;
  function openOnlineProfile(required=false){
    avatarEditor.querySelector('button.onlinePrimary').textContent=required?'Salvar e entrar no mundo':'Salvar perfil';
    if(!profileDialog.open)profileDialog.showModal();avatarPreview?.update(readAvatar());avatarPreview?.setVisible(true);nameInput.focus();
    if(required)return new Promise(resolve=>{profileResolve=resolve;});
  }
  function closeOnlineProfile(){profileDialog.close();}
  profileDialog.querySelector('[data-profile-close]').onclick=closeOnlineProfile;
  profileDialog.addEventListener('close',()=>{avatarPreview?.setVisible(false);if(profileResolve){profileResolve(false);profileResolve=null;}});
  for(const type of ['keydown','keyup','pointerdown','pointerup'])profileDialog.addEventListener(type,e=>e.stopPropagation());
  panel.querySelector('.onlineOptions').onclick=event=>{event.preventDefault();event.stopPropagation();panel.dataset.menu=panel.dataset.menu==='true'?'false':'true';panel.open=true;selectOnlineTab(panel.dataset.menu==='true'?'room':'chat');};
  function selectOnlineTab(name,focus=false){
    if(name==='profile'){openOnlineProfile();return;}
    for(const button of panel.querySelectorAll('[data-tab]')){const active=button.dataset.tab===name;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;if(active&&focus)button.focus();}
    for(const page of panel.querySelectorAll('[data-page]'))page.hidden=page.dataset.page!==name;
  }
  const onlineTabs=[...panel.querySelectorAll('[data-tab]')];
  for(const button of onlineTabs){
    button.onclick=()=>selectOnlineTab(button.dataset.tab);
    button.onkeydown=event=>{
      const index=onlineTabs.indexOf(button);let next;
      if(event.key==='ArrowRight')next=(index+1)%onlineTabs.length;
      else if(event.key==='ArrowLeft')next=(index+onlineTabs.length-1)%onlineTabs.length;
      else if(event.key==='Home')next=0;else if(event.key==='End')next=onlineTabs.length-1;
      if(next!==undefined){event.preventDefault();selectOnlineTab(onlineTabs[next].dataset.tab,true);}
    };
  }
  selectOnlineTab('chat');
  const nameInput=panel.querySelector('[data-name]');
  const nameForm=document.createElement('form');nameForm.className='onlineIdentity';
  nameInput.parentElement.replaceWith(nameForm);
  const nameLabel=document.createElement('label');nameLabel.textContent='Nome de exibicao';nameForm.append(nameLabel);nameLabel.append(nameInput);
  const saveName=document.createElement('button');saveName.type='submit';saveName.textContent='Salvar';nameForm.append(saveName);
  const nameFeedback=document.createElement('small');nameFeedback.setAttribute('role','status');nameForm.append(nameFeedback);
  const avatarEditor=document.createElement('form');avatarEditor.className='onlineAvatarEditor';
  avatarEditor.innerHTML='<strong>Seu avatar</strong><label>Modelo<select name="model"><option value="default">Personalizado</option><option value="punk">Punk</option></select></label><small data-model-note hidden>Este personagem usa suas roupas e cabelo originais.</small><a href="./frontend/assets/credits.html" target="_blank" rel="noopener" style="font-size:10px;color:#9bc790">Creditos das imagens</a><label>Personagem<select name="gender"><option value="masculine">Masculino</option><option value="feminine">Feminino</option></select></label><label>Cabelo<select name="hairStyle"><option value="short">Curto</option><option value="long">Longo</option><option value="curly">Cacheado</option></select></label><div class="onlineWardrobe"><label>Parte de cima<select name="outfit"></select></label><label>Parte de baixo<select name="bottom"></select></label><label>Calcados<select name="footwear"></select></label><label>Acessorio<select name="hat"></select></label></div><div class="onlineAvatarColors"><label>Pele<input name="skin" type="color" value="#bd896c"></label><label>Cabelo<input name="hair" type="color" value="#292725"></label><label>Camisa<input name="shirt" type="color" value="#080808"></label><label>Calcado<input name="shoes" type="color" value="#20242b"></label><label>Calca<input name="pants" type="color" value="#17191e"></label></div><label><input name="glasses" type="checkbox" checked> Usar oculos</label><button class="onlinePrimary">Salvar avatar</button><small role="status" data-avatar-feedback></small>';
  panel.querySelector('.onlineProfile').append(avatarEditor);
  profileDialog.querySelector('.onlineProfileContent').append(panel.querySelector('.onlineProfile'));
  const avatarInput=name=>avatarEditor.elements.namedItem(name);
  function updateStyleOptions(reset=false){
    const feminine=avatarInput('gender').value==='feminine';
    const hairs=feminine?[['long','Longo'],['bob','Chanel'],['ponytail','Rabo de cavalo'],['curly','Cacheado']]:[['short','Curto'],['fade','Degrade'],['quiff','Topete'],['curly','Cacheado']];
    for(const [key,choices] of [['hairStyle',hairs],['outfit',wardrobe.outfit],['bottom',wardrobe.bottom],['footwear',wardrobe.footwear],['hat',wardrobe.hat]]){
      const previous=avatarInput(key).value;
      avatarInput(key).replaceChildren(...choices.map(([value,label])=>new Option(label,value)));
      avatarInput(key).value=!reset&&choices.some(([value])=>value===previous)?previous:choices[0][0];
    }
  }
  updateStyleOptions();
  avatarInput('model').replaceChildren(...avatarModels.map(model=>new Option(model.label,model.id)));
  const readAvatar=()=>Object.fromEntries(['model','gender','hairStyle','outfit','bottom','footwear','hat','shoes','skin','hair','shirt','pants','glasses'].map(key=>[key,key==='glasses'?avatarInput(key).checked:avatarInput(key).value]));
  try{const saved=JSON.parse(localStorage.getItem('homelab.avatar')||'null');if(saved){avatarInput('gender').value=saved.gender||'masculine';updateStyleOptions(true);}if(saved)for(const key of ['model','gender','hairStyle','outfit','bottom','footwear','hat','shoes','skin','hair','shirt','pants','glasses']){if(key==='glasses')avatarInput(key).checked=saved[key]!==false;else if(typeof saved[key]==='string'){avatarInput(key).value=saved[key];if(!avatarInput(key).value&&avatarInput(key).options)avatarInput(key).selectedIndex=0;}}}catch{}
  const avatarPresets=document.createElement('div');avatarPresets.className='onlineAvatarPresets';
  for(const [label,shirt,pants,hair]of [['Neutro','#c9c6ba','#343b43','#302923'],['Azul','#416580','#29333f','#382b25'],['Verde','#597969','#38413a','#242323']]){
    const button=document.createElement('button');button.type='button';button.textContent=label;button.style.setProperty('--preset-color',shirt);
    button.onclick=()=>{avatarInput('shirt').value=shirt;avatarInput('pants').value=pants;avatarInput('hair').value=hair;previewAvatar();};avatarPresets.append(button);
  }
  avatarEditor.querySelector('strong').after(avatarPresets);
  function syncModelControls(){const punk=avatarInput('model').value!=='default';const definition=avatarModels.find(model=>model.id===avatarInput('model').value);const note=avatarEditor.querySelector('[data-model-note]');note.hidden=!punk;note.textContent=definition?.motion==='rigid'?'Visual original. Este modelo nao tem animacoes de membros; usamos apenas movimento suave do corpo.':'Este personagem usa suas roupas e cabelo originais.';for(const name of ['gender','hairStyle','outfit','bottom','footwear','hat','skin','hair','shirt','pants','shoes','glasses'])avatarInput(name).disabled=punk;}
  function previewAvatar(){const appearance=readAvatar();syncModelControls();onAvatar?.(appearance);avatarPreview?.update(appearance);avatarEditor.querySelector('[data-avatar-feedback]').textContent='Previa no personagem. Salve para atualizar na sala.';}
  avatarEditor.addEventListener('input',previewAvatar);
  avatarInput('gender').onchange=()=>{updateStyleOptions(false);previewAvatar();};
  avatarEditor.onsubmit=async event=>{
    event.preventDefault();const appearance=readAvatar(),name=nameInput.value.trim(),button=avatarEditor.querySelector('button.onlinePrimary');
    if(!name){nameFeedback.textContent='Digite um nome para continuar.';nameInput.focus();return;}
    button.disabled=true;
    try{
      if(token)await api('state',{avatar:appearance,name});
      localStorage.setItem('homelab.avatar',JSON.stringify(appearance));localStorage.setItem('homelab.name',name);nameInput.value=name;onAvatar?.(appearance);
      profileConfirmed=true;
      const resolve=profileResolve;profileResolve=null;profileDialog.close();resolve?.(true);
      panel.dataset.menu='false';selectOnlineTab('chat');panel.open=!matchMedia('(max-width:600px)').matches;
    }catch(error){avatarEditor.querySelector('[data-avatar-feedback]').textContent=error.message;}finally{button.disabled=false;}
  };
  syncModelControls();
  profileConfirmed=Boolean(localStorage.getItem('homelab.name')?.trim()&&localStorage.getItem('homelab.avatar'));
  onAvatar?.(readAvatar());
  const social=document.createElement('div');social.className='onlineSocial';
  social.innerHTML='<div class="onlineSectionTitle">CONVERSA</div><div data-chat role="log" aria-live="polite" aria-label="Conversa da sala"></div><form data-form><input data-message maxlength="280" placeholder="Escreva uma mensagem..." aria-label="Mensagem" autocomplete="off"><button class="onlinePrimary" aria-label="Enviar mensagem">Enviar</button></form><div class="onlineReactions"><button type="button" data-wave>&#128075; Acenar</button><button type="button" data-heart>&#9825; Curtir</button><button type="button" data-laugh>&#128514; Rir</button><button type="button" data-anger>😡 Raiva</button></div>';
  panel.querySelector('.onlineChatSlot').append(social);panel.open=!matchMedia('(max-width: 600px)').matches;
  panel.addEventListener('keydown',e=>e.stopPropagation());
  panel.addEventListener('keyup',e=>e.stopPropagation());
  const el=n=>panel.querySelector(`[data-${n}]`)||profileDialog.querySelector(`[data-${n}]`), video=el('video');
  function setOnlineConnected(value){
    onlineDock.hidden=!value;
    if(!value){updateOnlineDock([]);previousMembers=null;}
    panel.dataset.connected=String(value);
    for(const input of social.querySelectorAll('input,button'))input.disabled=!value;
    el('no-session').hidden=value;
  }
  setOnlineConnected(false);
  let room=null,token=null,selfId=null,events=null,offset=0,media=null,applying=false,lastPlayback='',closed=false;
  let reconnectTimer=null;
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
    if(token)void sendMessage(message);
  }
  el('laugh').onclick=()=>sendReaction('laugh');el('anger').onclick=()=>sendReaction('anger');
  social.querySelector('.onlineReactions').remove();
  if(room){el('join').textContent='Entrar na sala';panel.open=true;}
  const status=text=>{if(el('status').textContent!==text)el('status').textContent=text;};
  async function api(action,data,raw=false){
    const accountHeaders=['join','lobby','create','prestige'].includes(action)?await progressionAccountHeaders():{};

    const response=await fetch(apiUrl(action==='lobby'?'/api/lobby':`/api/rooms${action==='create'?'':`/${room}/${action}`}`),{method:'POST',headers:{...accountHeaders,'Content-Type':raw?data.type:'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:raw?data:JSON.stringify(data)});
    if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('N?o foi poss?vel conectar. Tente novamente em instantes.');
    const result=await response.json();if(!response.ok)throw Object.assign(new Error(result.error||'Falha de conexao.'),{status:response.status});return result;
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
      if(!profileConfirmed&&!(await openOnlineProfile(true)))return;
      previousMembers=null;
      previousSelfLevel=null;selfProgressionSignature='';
      status('Conectando à sala pública...');
      el('count').textContent='Entrando';
      if(!room)room=(await api('lobby',{})).room;
      const joined=await api('join',{name:el('name').value,avatar:readAvatar(),token:sessionStorage.getItem(sessionKey(room))});token=joined.token;selfId=joined.id;closed=false;setOnlineConnected(true);
      sessionStorage.setItem(sessionKey(room),token);localStorage.setItem('homelab.name',el('name').value);onSpawn?.(joined.pose);
      onWorld?.(joined.world);
      await api('state',{pose:getPose()});
      const address=new URL(location.href);address.searchParams.delete('sala');history.replaceState(null,'',address);
      for(const name of ['leave','upload'])el(name).hidden=false;
      el('join').hidden=true;
      events=new EventSource(apiUrl(`/api/rooms/${room}/events?token=${token}`));
      events.addEventListener('peer-signal',event=>{try{peer.signal(JSON.parse(event.data));}catch(error){showError(error);}});
      events.onopen=()=>{clearTimeout(reconnectTimer);reconnectTimer=null;};
      void claimDailyReward({showPanel:true,award:joined.dailyReward}).catch(error=>status(error.message));
      events.onmessage=e=>{
        const state=JSON.parse(e.data);
        const self=state.members.find(member=>member.id===selfId);
        if(self&&JSON.stringify([self.id,self.name,self.progression])!==selfProgressionSignature){
          selfProgressionSignature=JSON.stringify([self.id,self.name,self.progression]);
          const next=self.progression||{level:1,xp:0};
          if(previousSelfLevel!==null)showNoblePromotion({level:previousSelfLevel},next);
          previousSelfLevel=next.level;selfProgression=next;
          renderNobility(profilePrestige,next);onSelfProgression?.({...self,progression:next});
        }
        onlineDock.hidden=panel.hidden;
        updateOnlineDock(state.members);
        updatePresence(state.members);
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
          line.dataset.initials=initials(message.name);const text=document.createElement('p');text.textContent=message.text;line.append(heading,text);el('chat').append(line);while(el('chat').children.length>40)el('chat').firstChild.remove();el('chat').scrollTop=el('chat').scrollHeight;
          if(Date.now()+offset-message.time<5000)onMessage?.({...message,self:message.sender===selfId});
        }
        const hadMedia=Boolean(media);
        peer.update(state.media,state.members);
        if(state.media)receiveMedia(state.media);
        else if(hadMedia){media=null;video.hidden=true;el('stop').hidden=true;onVideo(null,null);}
      };
      events.onerror=()=>{
        status('Reconectando a sala publica...');
        if(reconnectTimer||closed)return;
        reconnectTimer=setTimeout(()=>{
          reconnectTimer=null;if(closed)return;events?.close();token=null;room=null;selfId=null;
          peer.update(null,[]);onMembers([]);setOnlineConnected(false);
          if(navigator.onLine)void el('join').onclick();
        },3000);
      };
    }catch(e){if(e.status===404){if(room)sessionStorage.removeItem(sessionKey(room));room=null;token=null;el('join').hidden=false;el('join').textContent='Reconectar a sala publica';status('O servidor reiniciou. Entre novamente na sala publica.');}else showError(e);}finally{el('join').disabled=false;if(!token)el('count').textContent='Disponivel';}
  };
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
    clearTimeout(reconnectTimer);reconnectTimer=null;
    try{await api('leave',{});}catch(e){showError(e);return;}
    setOnlineConnected(false);peer.update(null,[]);onVideo(null,null);onWorld?.(null);
    sessionStorage.removeItem(sessionKey(room));closed=true;events?.close();token=null;media=null;video.pause();video.removeAttribute('src');video.load();video.hidden=true;onMembers([]);
    for(const name of ['leave','upload','resume','stop'])el(name).hidden=true;
    el('count').textContent='Dispon\u00edvel';el('people').replaceChildren();
    room=null;el('join').hidden=false;el('join').textContent='Entrar no mundo';const address=new URL(location.href);address.searchParams.delete('sala');history.replaceState(null,'',address);status('Você saiu da sala.');
  };
  let sending=false;
  setInterval(async()=>{if(!token||closed||sending)return;sending=true;try{await api('state',{pose:getPose()});}catch(e){showError(e);}finally{sending=false;}},100);
  setInterval(()=>{if(token&&media)apply();},5000);
  setInterval(()=>{if(token&&!closed&&!document.hidden)void api('prestige',{}).catch(()=>{});},60000);
  addEventListener('pagehide',()=>{events?.close();peer.close();avatarPreview?.dispose();});
  el('join').textContent='Entrar no mundo';
  let checkingAvailability=false,lastAvailabilityCheck=-Infinity,wasAvailable=false,autoJoinStarted=false,availabilityAttempts=0;
  async function checkAvailability(force=false){
    if(checkingAvailability||(!force&&Date.now()-lastAvailabilityCheck<15000))return;
    checkingAvailability=true;lastAvailabilityCheck=Date.now();availabilityAttempts++;
    let available=false;
    try{
      if(navigator.onLine){
        const response=await fetch(apiUrl('/health'),{cache:'no-store',signal:AbortSignal.timeout(25000)});
        available=response.ok&&(await response.json()).ok===true;
      }
    }catch{}
    finally{checkingAvailability=false;}
    panel.hidden=!available;
    visibilityControls.hidden=!available;
    onlineDock.hidden=!available||!token;
    if(!available&&navigator.onLine&&availabilityAttempts<3)setTimeout(()=>checkAvailability(true),5000);
    if(!available&&wasAvailable)onMembers([]);
    wasAvailable=available;
    if(available&&!token)el('count').textContent='Disponivel';
    if(available&&!autoJoinStarted){autoJoinStarted=true;el('join').click();}
  }
  addEventListener('offline',()=>{panel.hidden=true;onlineDock.hidden=true;visibilityControls.hidden=true;wasAvailable=false;onMembers([]);});
  addEventListener('online',()=>{checkAvailability(true);if(autoJoinStarted&&!token&&!closed)void el('join').onclick();});
  addEventListener('focus',()=>checkAvailability());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkAvailability();});
  // Sem ping continuo: permite que o Render gratuito repouse sem jogadores.
  checkAvailability(true);
  return {editProfile:()=>openOnlineProfile(),getProfile:()=>({name:nameInput.value,avatar:readAvatar(),level:selfProgression.level,progression:selfProgression}),react:sendReaction,sendSocialReaction:type=>{if(token)void sendMessage(type==='wave'?'\u{1f44b}':'\u2764\ufe0f');},isOnline:()=>Boolean(token&&!closed&&!panel.hidden&&navigator.onLine),getSelfId:()=>selfId,uploadVideo,notify:status,sendWorldAction:async action=>{if(!token)throw new Error('Entre na sala para interagir.');try{return await api('state',{worldAction:action});}catch(e){showError(e);throw e;}}};
}
