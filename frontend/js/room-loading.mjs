let overlay;

export async function showRoomLoading(message='Preparando o laboratório...'){
  if(!overlay){
    overlay=document.createElement('dialog');
    overlay.className='roomLoading';
    overlay.setAttribute('aria-label','Carregando sala');
    overlay.innerHTML='<div class="roomLoadingContent"><span class="roomLoadingBrand">GUEDESSEC / HOMELAB</span><h2>Carregando mundo</h2><span class="roomLoadingRoom">Laboratório virtual</span><div class="roomLoadingTip"><img src="./frontend/assets/guedessec.png" alt="" width="90" height="98"><strong>Seu próximo projeto começa aqui.</strong><span>Use WASD ou as setas para andar e E para interagir.<br>No celular, use os controles na tela.</span></div><progress class="roomLoadingProgress" aria-label="Carregamento do mundo"></progress><p role="status" aria-live="polite"></p><small>Estamos preparando seu espaço.</small></div>';
    overlay.addEventListener('cancel',event=>event.preventDefault());
    document.body.append(overlay);
  }
  overlay.querySelector('[role="status"]').textContent=message;
  if(!overlay.open)overlay.showModal();
  // Let the browser paint the loading screen before initializing the 3D scene.
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
}

export function hideRoomLoading(){
  if(overlay?.open)overlay.close();
}
