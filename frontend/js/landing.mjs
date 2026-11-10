import {createLandingMatrix} from './landing-matrix.mjs?v=color-3';
import {showRoomLoading,hideRoomLoading,completeRoomLoading} from './room-loading.mjs';
import {createUserHome} from './user-home.mjs?v=equipment-26';
import {createAccountDialog,verifiedAccount,accountClient} from './account-auth.mjs?v=errors-3';
export function initializeLanding({host,onStatus,onWorldEntry}){
const matrix=createLandingMatrix(host);
let starting=false,entering=false;
let currentAccount=null;
const login=createAccountDialog(host,async user=>{currentAccount=user;if(user.user_metadata?.display_name)localStorage.setItem('homelab.name',user.user_metadata.display_name);logout.hidden=!(await home.open());});
const logout=document.createElement('button');logout.type='button';logout.className='accountLogout';logout.textContent='Sair da conta';logout.hidden=true;
const home=createUserHome({host,onRequireLogin:()=>login.open({signup:true}),onPlay:async()=>{
  if(starting)return;starting=true;
  try{currentAccount=await verifiedAccount();if(!currentAccount){login.open({signup:true});throw new Error('Entre na sua conta para continuar.');}await showRoomLoading();await import('./homelab.js?v=equipment-307');if(document.getElementById('error').textContent)throw new Error('Falha ao iniciar o laboratorio.');matrix.dispose();onWorldEntry();host.remove();document.body.classList.remove('landingActive');await completeRoomLoading();}
  catch(error){hideRoomLoading();starting=false;throw error;}
}});
host.querySelector('.userHomeHeader').append(logout);
logout.onclick=async()=>{logout.disabled=true;try{const client=await accountClient();const {error}=await client.auth.signOut();if(error)throw error;location.reload();}catch{logout.disabled=false;logout.textContent='Tentar sair novamente';}};
return {async enter(){
  if(entering)return;
  entering=true;
  onStatus({busy:true,message:'Verificando sua conta...'});
  try{
    currentAccount=await verifiedAccount();
    if(currentAccount){logout.hidden=!(await home.open());}else login.open({signup:true});
    onStatus({busy:false,message:''});
  }catch(error){onStatus({busy:false,message:error.message});}
  finally{entering=false;}
}};
}
