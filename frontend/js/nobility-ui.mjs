import {nobleTitle,nobleLabel,nobleCrestSvg,noblePromotion} from './nobility.mjs';
import {apiUrl} from './config.mjs';
let configuration;
export async function progressionAccountHeaders(){
  if(!configuration)configuration=fetch(apiUrl('/api/auth/config')).then(async response=>{if(!response.ok)throw new Error('Falha ao consultar conta.');return response.json();}).catch(error=>{configuration=null;throw error;});
  const settings=await configuration;
  if(!settings.url||!settings.key)return {};
  const {accountToken}=await import('./account-auth.mjs?v=errors-3');return {'X-Account-Token':await accountToken()};
}
export function renderNobility(container,progression={level:1}){
  const title=nobleTitle(progression.level);container.classList.add('nobleIdentity');
  container.style.setProperty('--noble-color',title.color);container.style.setProperty('--noble-border',title.border);
  const crest=document.createElement('img');crest.src=new URL(`../assets/nobility/${title.id}.svg`,import.meta.url).href;crest.alt='';
  const text=document.createElement('span');text.textContent=nobleLabel(progression.level);container.replaceChildren(crest,text);
}
export function showNoblePromotion(previous,next){
  if(!noblePromotion(previous.level,next.level))return;
  const toast=document.createElement('aside');toast.className='noblePromotion';toast.setAttribute('role','status');
  const heading=document.createElement('small');heading.textContent='NOVO TÍTULO CONQUISTADO';
  const identity=document.createElement('div');renderNobility(identity,next);toast.append(heading,identity);document.body.append(toast);
  setTimeout(()=>toast.remove(),6500);
}
export async function fetchAccountProgression(){
  const config=await fetch(apiUrl('/api/auth/config'));if(!config.ok)throw new Error('Não foi possível consultar sua conta.');
  const settings=await config.json();
  if(!settings.url||!settings.key)return {level:1,xp:0,source:'guest'};
  const {accountToken}=await import('./account-auth.mjs?v=errors-3');
  const response=await fetch(apiUrl('/api/progression'),{headers:{'X-Account-Token':await accountToken()},cache:'no-store'});
  if(!response.ok)throw new Error('Não foi possível carregar seu prestígio.');
  return response.json();
}
