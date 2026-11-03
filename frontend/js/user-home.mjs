import {avatarModels} from './avatar-model-catalog.mjs?v=stable-6';
import {wardrobe,wardrobeDefaults} from './avatar-wardrobe.mjs';
export function createUserHome({host,onPlay}){
  const page=document.createElement('section');page.className='userHome';page.hidden=true;
  page.innerHTML='<header class="userHomeHeader"><button type="button" data-back>&#8592; Inicio</button><span>HOMELAB / GUEDESSEC</span><small>Perfil deste navegador</small></header><div class="userWelcome"><span>AREA DO USUARIO</span><h1>Bom te ver, <b data-user-name></b>.</h1><p>Seu perfil, seu avatar e a proxima entrada no laboratorio.</p></div><div class="userHomeGrid"><aside class="userCard"><div class="userPortrait userPortrait3d" aria-label="Seu avatar 3D"><span>Carregando avatar...</span></div><div class="userAvatarAngles"><button type="button" data-front>Frente</button><button type="button" data-back-view>Costas</button></div><h2 data-profile-name></h2><span class="userLevel">Nivel 1 &middot; Iniciante</span><div class="userXp"><span>0 XP</span><span>Progresso inicial</span></div><div class="userXpBar" role="progressbar" aria-label="Experiencia inicial" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div><small>A progressao de nivel ainda sera implementada.</small></aside><div class="userHomeMain"><section class="userPlayCard"><span>LABORATORIO</span><h2>Vamos entrar?</h2><p>Explore o ambiente e encontre o pessoal.</p><button type="button" data-play class="landingPlay">Jogar agora &#8594;</button><p data-loading role="status" hidden></p></section><section class="userEditor"><header><h2>Meu avatar</h2><small>As alteracoes ficam salvas neste navegador. <a href="./frontend/assets/credits.html" target="_blank" rel="noopener">Creditos das imagens</a></small></header><form><label class="userNameField">Nome de exibicao<input name="name" required maxlength="30" autocomplete="nickname"></label><label>Modelo<select name="model"><option value="default">Personalizado</option><option value="punk">Punk</option></select></label><p class="userNameField" data-model-note hidden>Este personagem usa o visual original do modelo.</p><label>Personagem<select name="gender"><option value="masculine">Masculino</option><option value="feminine">Feminino</option></select></label><label>Cabelo<select name="hairStyle"><option value="short">Curto</option><option value="fade">Degrade</option><option value="quiff">Topete</option><option value="curly">Cacheado</option><option value="long">Longo</option><option value="bob">Chanel</option><option value="ponytail">Rabo de cavalo</option></select></label><div data-clothes class="userClothes"></div><div data-colors class="userColors"></div><label class="userCheck"><input type="checkbox" name="glasses"> Usar oculos</label><button type="submit" class="userSave">Salvar perfil</button><p data-feedback role="status"></p></form></section></div></div>';
  host.append(page);const form=page.querySelector('form'),fields=['model','gender','hairStyle',...Object.keys(wardrobe),'skin','hair','shirt','pants','shoes','glasses'];
  form.elements.model.replaceChildren(...avatarModels.map(model=>new Option(model.label,model.id)));
  for(const [key,choices] of Object.entries(wardrobe)){
    const label=document.createElement('label');label.textContent={outfit:'Parte de cima',bottom:'Parte de baixo',footwear:'Calcado',hat:'Acessorio'}[key];
    const select=document.createElement('select');select.name=key;choices.forEach(([id,title])=>select.add(new Option(title,id)));label.append(select);page.querySelector('[data-clothes]').append(label);
  }
  for(const [key,title,value] of [['skin','Pele','#bd896c'],['hair','Cabelo','#292725'],['shirt','Camisa','#080808'],['pants','Calca','#17191e'],['shoes','Calcado','#20242b']]){
    const label=document.createElement('label');label.textContent=title;const input=document.createElement('input');input.type='color';input.name=key;input.value=value;label.append(input);page.querySelector('[data-colors]').append(label);
  }
  function read(){return Object.fromEntries(fields.map(key=>[key,key==='glasses'?form.elements[key].checked:form.elements[key].value]));}
  let avatarPreview=null,previewLoading=null,disposed=false;
  async function mountPreview(){
    if(avatarPreview){avatarPreview.update(read());avatarPreview.setVisible(true);return;}
    if(previewLoading)return previewLoading;
    const stage=page.querySelector('.userPortrait');
    previewLoading=(async()=>{
      try{
        const [THREE,{RoundedBoxGeometry},{createPlayerAvatar},{applyAvatarAppearance},{createAvatarEditorPreview}]=await Promise.all([import('three'),import('three/addons/geometries/RoundedBoxGeometry.js'),import('./player-avatar.mjs?v=underwear-5'),import('./avatar-appearance.mjs?v=avatar-stable-22'),import('./avatar-editor-preview.mjs?v=stable-8')]);
        if(disposed)return;
        const {avatar}=createPlayerAvatar({THREE,RoundedBoxGeometry,isMobile:matchMedia('(max-width:700px)').matches});
        stage.replaceChildren();avatarPreview=createAvatarEditorPreview({container:stage,THREE,template:avatar,applyAppearance:applyAvatarAppearance});
        avatarPreview.update(read());avatarPreview.setVisible(!page.hidden);
      }catch{stage.textContent='Nao foi possivel carregar a previa 3D.';}
      finally{previewLoading=null;}
    })();return previewLoading;
  }
  page.querySelector('[data-front]').onclick=()=>avatarPreview?.turn(0);
  page.querySelector('[data-back-view]').onclick=()=>avatarPreview?.turn(Math.PI);
  function preview(){const avatar=read();const definition=avatarModels.find(model=>model.id===avatar.model),note=page.querySelector('[data-model-note]');note.hidden=avatar.model==='default';note.textContent=definition?.motion==='rigid'?'Visual original. Sem animacoes de membros; movimento suave do corpo.':'Este personagem usa o visual original do modelo.';for(const key of fields)if(key!=='model')form.elements[key].disabled=avatar.model!=='default';avatarPreview?.update(avatar);const portrait=page.querySelector('.userPortrait');for(const key of ['skin','hair','shirt','pants'])portrait.style.setProperty('--'+key,avatar[key]);portrait.dataset.hair=avatar.hairStyle;portrait.dataset.glasses=String(avatar.glasses);page.querySelector('[data-feedback]').textContent='';}
  function save(){const name=form.elements.name.value.trim();if(!name){form.elements.name.focus();return false;}
    try{localStorage.setItem('homelab.name',name);localStorage.setItem('homelab.avatar',JSON.stringify(read()));page.querySelectorAll('[data-user-name],[data-profile-name]').forEach(n=>n.textContent=name);return true;}
    catch{page.querySelector('[data-feedback]').textContent='Nao foi possivel salvar neste navegador.';return false;}}
  form.addEventListener('input',preview);form.onsubmit=event=>{event.preventDefault();if(save())page.querySelector('[data-feedback]').textContent='Perfil salvo.';};
  page.querySelector('[data-play]').onclick=async()=>{if(!form.reportValidity()||!save())return;const button=page.querySelector('[data-play]'),status=page.querySelector('[data-loading]');button.disabled=true;status.hidden=false;status.textContent='Carregando laboratorio...';try{await onPlay();disposed=true;avatarPreview?.dispose();}catch{status.textContent='Nao foi possivel iniciar. Recarregue a pagina e tente novamente.';button.disabled=false;}};
  page.querySelector('[data-back]').onclick=()=>{page.hidden=true;avatarPreview?.setVisible(false);host.classList.remove('showUserHome');};
  return {open(){let avatar={...wardrobeDefaults,model:'default',gender:'masculine',hairStyle:'short',glasses:true};try{avatar={...avatar,...JSON.parse(localStorage.getItem('homelab.avatar')||'{}')};}catch{}
    for(const key of fields){const input=form.elements[key];if(key==='glasses')input.checked=avatar[key];else if(avatar[key]){input.value=avatar[key];if(input.options&&input.selectedIndex<0)input.selectedIndex=0;}}
    const name=localStorage.getItem('homelab.name')||'Visitante';form.elements.name.value=name;page.querySelectorAll('[data-user-name],[data-profile-name]').forEach(n=>n.textContent=name);preview();page.hidden=false;host.classList.add('showUserHome');void mountPreview();window.scrollTo(0,0);
  }};
}
