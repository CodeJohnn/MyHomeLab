let overlay;

export async function showRoomLoading(message='Preparando o laboratório...'){
  if(!overlay){
    overlay=document.createElement('dialog');
    overlay.className='roomLoading';
    overlay.setAttribute('aria-label','Carregando sala');
    overlay.innerHTML='<div class="roomLoadingContent"><span class="roomLoadingBrand">GUEDESSEC / HOMELAB</span><span class="roomLoadingSpinner" aria-hidden="true"></span><h2>Entrando na sala</h2><p role="status" aria-live="polite"></p><small>Seu espaço está quase pronto.</small></div>';
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
