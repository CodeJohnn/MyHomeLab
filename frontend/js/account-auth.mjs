import {apiUrl} from './config.mjs';
import {authErrorMessage} from './auth-errors.mjs';
let clientPromise;
export async function accountClient(){
  if(!clientPromise)clientPromise=(async()=>{
    const response=await fetch(apiUrl('/api/auth/config'),{signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw new Error('Nao foi possivel conectar ao login. Tente novamente.');
    const config=await response.json();
    if(!config.url||!config.key)throw new Error('O login ainda nao foi configurado pelo administrador.');
    const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    return createClient(config.url,config.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  })().catch(error=>{clientPromise=null;throw error;});
  return clientPromise;
}
export async function verifiedAccount(){
  const client=await accountClient();const {data:session,error:sessionError}=await client.auth.getSession();
  if(sessionError||!session.session)return null;
  const {data,error}=await client.auth.getUser();
  if(error){if(error.status===401||error.status===403)return null;throw new Error('Nao foi possivel verificar sua conta. Tente novamente.');}
  return data.user;
}
export async function accountToken(){
  const client=await accountClient();const {data,error}=await client.auth.getSession();
  if(error||!data.session)throw new Error('Sua sessao expirou. Entre novamente pela pagina inicial.');
  return data.session.access_token;
}
export function createAccountDialog(host,onAuthenticated){
  const dialog=document.createElement('dialog');dialog.className='accountDialog';
  dialog.innerHTML='<button type="button" class="accountClose" aria-label="Fechar">&#10005;</button><small>HOMELAB / GUEDESSEC</small><h2>Entre na sua conta</h2><p data-intro>Use seu e-mail e senha para entrar no laboratorio.</p><form><label data-name-label hidden>Nome de exibicao<input name="name" maxlength="30" autocomplete="nickname"></label><label>E-mail<input name="email" type="email" autocomplete="email" required maxlength="254"></label><label>Senha<input name="password" type="password" autocomplete="current-password" required maxlength="128"></label><p data-feedback role="status"></p><button class="landingPlay" type="submit">Entrar</button></form><button type="button" data-mode>Ainda nao tem conta? Criar conta</button>';
  host.append(dialog);let signup=false,busy=false;
  const form=dialog.querySelector('form'),feedback=dialog.querySelector('[data-feedback]'),submit=form.querySelector('button');
  dialog.querySelector('.accountClose').onclick=()=>dialog.close();
  function setMode(value){
    if(busy)return;signup=value;feedback.textContent='';form.elements.password.value='';
    dialog.querySelector('h2').textContent=signup?'Crie sua conta':'Entre na sua conta';
    dialog.querySelector('[data-intro]').textContent=signup?'Cadastre seu e-mail para participar do HomeLab.':'Use seu e-mail e senha para entrar no laboratorio.';
    dialog.querySelector('[data-name-label]').hidden=!signup;form.elements.name.required=signup;form.elements.password.minLength=signup?8:1;
    form.elements.password.autocomplete=signup?'new-password':'current-password';submit.textContent=signup?'Criar conta':'Entrar';
    dialog.querySelector('[data-mode]').textContent=signup?'Ja tenho uma conta':'Ainda nao tem conta? Criar conta';
  }
  dialog.querySelector('[data-mode]').onclick=()=>setMode(!signup);
  form.onsubmit=async event=>{
    event.preventDefault();if(busy)return;busy=true;submit.disabled=true;feedback.textContent='Verificando...';
    try{
      const client=await accountClient(),email=form.elements.email.value.trim(),password=form.elements.password.value;
      const result=signup?await client.auth.signUp({email,password,options:{data:{display_name:form.elements.name.value.trim()},emailRedirectTo:location.origin+location.pathname}}):await client.auth.signInWithPassword({email,password});
      if(result.error){feedback.textContent=authErrorMessage(result.error,signup);return;}
      form.elements.password.value='';
      if(!result.data.session){feedback.textContent='Confira seu e-mail para confirmar o cadastro. Depois, entre com sua senha.';return;}
      const user=await verifiedAccount();if(!user)throw new Error('Confirme seu e-mail antes de entrar.');
      try{const {claimDailyReward}=await import('./daily-rewards.mjs?v=auth-2');await claimDailyReward();}catch{}
      dialog.close();await onAuthenticated(user);
    }catch(error){feedback.textContent=error.message||'Falha ao conectar. Tente novamente.';}
    finally{busy=false;submit.disabled=false;}
  };
  dialog.addEventListener('close',()=>{form.elements.password.value='';});
  return {open({signup:register=false}={}){setMode(register);feedback.textContent='';if(!dialog.open)dialog.showModal();form.elements.email.focus();}};
}
