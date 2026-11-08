let overlay;
let completed=false,progress=0;
let completionWaiters=[];
let completionTask=null,finishAnimation=null,cycle=0;
export async function waitForWorldEntry(){
  if(overlay?.open)await new Promise(resolve=>completionWaiters.push(resolve));
  return completed;
}
export function updateRoomLoading(value,message){
  if(!overlay||completed||completionTask||!Number.isFinite(value))return;
  progress=Math.max(progress,Math.min(99,Math.max(0,value)));
  overlay.querySelector('.roomLoadingFill').style.width=progress+'%';
  overlay.querySelector('[role="progressbar"]').setAttribute('aria-valuenow',String(progress));
  overlay.querySelector('[data-percentage]').textContent=Math.round(progress)+'%';
  overlay.querySelector('.roomLoadingRunner').style.left=progress+'%';
  if(message)overlay.querySelector('[role="status"]').textContent=message;
}

export async function showRoomLoading(message='Preparando o laboratório...'){
  if(completed)return;
  if(completionTask)return completionTask;
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
    const runway=document.createElement('div');runway.className='roomLoadingRunway';runway.setAttribute('aria-hidden','true');
    runway.innerHTML='<div class="roomLoadingRunner"><div class="runnerSprite"><span class="runnerArm runnerArmBack"><i></i></span><span class="runnerLeg runnerLegBack"><i></i></span><span class="runnerBody"></span><span class="runnerHead"></span><span class="runnerLeg runnerLegFront"><i></i></span><span class="runnerArm runnerArmFront"><i></i></span></div></div>';
    track.before(runway);
  }
  cycle++;overlay.classList.remove('isComplete');
  progress=0;updateRoomLoading(0,message);
  overlay.querySelector('[role="status"]').textContent=message;
  if(!overlay.open)overlay.showModal();
  // Let the browser paint the loading screen before initializing the 3D scene.
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
}

export function completeRoomLoading(){
  if(completionTask)return completionTask;
  if(!overlay||completed||!overlay.open)return Promise.resolve();
  const currentCycle=cycle;
  completionTask=(async()=>{
  overlay.querySelector('.roomLoadingFill').style.width='100%';
  overlay.querySelector('[role="progressbar"]').setAttribute('aria-valuenow','100');
  overlay.querySelector('[data-percentage]').textContent='100%';
  overlay.querySelector('[role="status"]').textContent='Mundo pronto. Pode entrar!';
  overlay.querySelector('.roomLoadingRunner').style.left='100%';
  overlay.classList.add('isComplete');
  const reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  await new Promise(resolve=>{
    const timer=setTimeout(()=>{finishAnimation=null;resolve();},reducedMotion?80:1150);
    finishAnimation=()=>{clearTimeout(timer);finishAnimation=null;resolve();};
  });
  if(currentCycle!==cycle)return;
  completed=true;
  overlay.close();
  for(const resolve of completionWaiters.splice(0))resolve();
  })();
  return completionTask;
}

export function hideRoomLoading(){
  cycle++;finishAnimation?.();completionTask=null;
  if(overlay?.open)overlay.close();
  for(const resolve of completionWaiters.splice(0))resolve();
}
