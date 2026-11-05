let overlay;
let completed=false,progress=0;
let completionWaiters=[];
export async function waitForWorldEntry(){
  if(overlay?.open&&!completed)await new Promise(resolve=>completionWaiters.push(resolve));
  return completed;
}
export function updateRoomLoading(value,message){
  if(!overlay||completed)return;
  progress=Math.max(progress,Math.min(99,Math.max(0,value)));
  overlay.querySelector('.roomLoadingFill').style.width=progress+'%';
  overlay.querySelector('[role="progressbar"]').setAttribute('aria-valuenow',String(progress));
  overlay.querySelector('[data-percentage]').textContent=Math.round(progress)+'%';
  if(message)overlay.querySelector('[role="status"]').textContent=message;
}

export async function showRoomLoading(message='Preparando o laboratório...'){
  if(completed)return;
  if(!overlay){
    overlay=document.createElement('dialog');
    overlay.className='roomLoading';
    overlay.setAttribute('aria-label','Carregando sala');
    overlay.innerHTML='<div class="roomLoadingContent"><span class="roomLoadingBrand">GUEDESSEC / HOMELAB</span><h2>Carregando mundo</h2><span class="roomLoadingRoom">Laboratório virtual</span><div class="roomLoadingTip"><img src="./frontend/assets/guedessec.png" alt="" width="90" height="98"><strong>Seu próximo projeto começa aqui.</strong><span>Use WASD ou as setas para andar e E para interagir.<br>No celular, use os controles na tela.</span></div><div class="roomLoadingTrack" role="progressbar" aria-label="Carregamento do mundo"><span class="roomLoadingFill"></span></div><p role="status" aria-live="polite"></p><small>Estamos preparando seu espaço.</small></div>';
    overlay.addEventListener('cancel',event=>event.preventDefault());
    document.body.append(overlay);
    const percentage=document.createElement('span');percentage.dataset.percentage='';percentage.className='roomLoadingPercentage';
    overlay.querySelector('.roomLoadingTrack').after(percentage);
    const track=overlay.querySelector('[role="progressbar"]');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');
  }
  progress=0;updateRoomLoading(5,message);
  overlay.querySelector('[role="status"]').textContent=message;
  if(!overlay.open)overlay.showModal();
  // Let the browser paint the loading screen before initializing the 3D scene.
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
}

export async function completeRoomLoading(){
  if(!overlay||completed)return;
  completed=true;overlay.querySelector('.roomLoadingFill').style.width='100%';
  overlay.querySelector('[role="progressbar"]').setAttribute('aria-valuenow','100');
  overlay.querySelector('[data-percentage]').textContent='100%';
  overlay.querySelector('[role="status"]').textContent='Mundo pronto. Pode entrar!';
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  overlay.close();
  for(const resolve of completionWaiters.splice(0))resolve();
}

export function hideRoomLoading(){
  if(overlay?.open)overlay.close();
  for(const resolve of completionWaiters.splice(0))resolve();
}
