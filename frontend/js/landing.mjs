import {createLandingMatrix} from './landing-matrix.mjs?v=color-3';
import {showRoomLoading,hideRoomLoading} from './room-loading.mjs';
import {createUserHome} from './user-home.mjs?v=avatar3d-20';
const host=document.getElementById('landing'),matrix=createLandingMatrix(host);
let starting=false;
const home=createUserHome({host,onPlay:async()=>{
  if(starting)return;starting=true;
  try{await showRoomLoading();await import('./homelab.js?v=visibility-289');if(document.getElementById('error').textContent)throw new Error('Falha ao iniciar o laboratorio.');matrix.dispose();host.remove();document.body.classList.remove('landingActive');}
  catch(error){starting=false;throw error;}
  finally{hideRoomLoading();}
}});
document.querySelectorAll('[data-enter]').forEach(button=>button.addEventListener('click',()=>home.open()));
