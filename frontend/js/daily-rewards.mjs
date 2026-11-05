import {apiUrl} from './config.mjs';
import {progressionAccountHeaders,renderNobility,showNoblePromotion} from './nobility-ui.mjs';
let inFlight=null,pendingAward=null,welcomeKey='';
export async function claimDailyReward({showPanel=false,award=null}={}){
  if(!inFlight)inFlight=(async()=>{
    const headers=await progressionAccountHeaders();if(!headers['X-Account-Token'])return null;
    const response=await fetch(apiUrl('/api/daily-reward'),{method:'POST',headers,cache:'no-store'});
    if(!response.ok)throw new Error('Recompensa diária indisponível. O acesso ao mundo continua liberado.');
    const result=await response.json();
    if(pendingAward?.progression.userId!==result.progression.userId)pendingAward=null;
    if(result.awardedXp>0)pendingAward=result;
    window.dispatchEvent(new CustomEvent('daily-xp-updated',{detail:result.progression}));
    return result;
  })().finally(()=>{inFlight=null;});
  const result=await inFlight;
  if(award?.awardedXp>0&&award.progression.userId===result?.progression.userId)pendingAward=award;
  const key=result?result.progression.userId+':'+result.progression.today:'';
  if(showPanel&&result&&welcomeKey!==key){welcomeKey=key;showDailyWelcome(result,pendingAward);pendingAward=null;}
  return result;
}
export function renderLevelProgress(element,progression){
  const amount=progression.levelProgress||0,required=progression.levelRequiredXp||100;
  element.setAttribute('role','progressbar');element.setAttribute('aria-label','Progresso do nível');
  element.setAttribute('aria-valuemin','0');element.setAttribute('aria-valuemax',String(required));element.setAttribute('aria-valuenow',String(amount));
  element.style.setProperty('--xp-progress',`${Math.min(100,amount/required*100)}%`);
  element.replaceChildren(document.createElement('span'));
}
function showDailyWelcome(result,award){
  const p=result.progression,dialog=document.createElement('dialog');dialog.className='dailyWelcome';
  dialog.setAttribute('aria-labelledby','dailyWelcomeTitle');
  dialog.innerHTML='<header><div><small>SEU PRESTÍGIO NO HOMELAB</small><h2 id="dailyWelcomeTitle">Bom te ver por aqui.</h2></div><button type="button" aria-label="Fechar recompensa diária">×</button></header><div data-daily-title></div><p class="dailyXp"></p><p class="dailyStreak"></p><ol class="dailyWeek"></ol><p class="dailyNext"></p><div class="dailyLevelBar"></div><p class="dailyLevelText"></p><button type="button" class="dailyContinue">Continuar no mundo</button>';
  renderNobility(dialog.querySelector('[data-daily-title]'),p);
  dialog.querySelector('.dailyXp').textContent=`+${p.todayXp} XP ${result.awardedXp>0||award?'recebidos hoje':'já recebidos hoje'}`;
  dialog.querySelector('.dailyStreak').textContent=`${p.loginStreak} ${p.loginStreak===1?'dia consecutivo':'dias consecutivos'} • ${p.totalDailyRewardsClaimed} recompensas recebidas`;
  for(const [index,xp] of p.rewards.entries()){
    const day=document.createElement('li');day.classList.toggle('isToday',index+1===p.rewardDay);
    const label=document.createElement('span');label.textContent=`Dia ${index+1}`;
    const value=document.createElement('strong');value.textContent=`+${xp}`;
    const unit=document.createElement('small');unit.textContent='XP';day.append(label,value,unit);dialog.querySelector('.dailyWeek').append(day);
  }
  const when=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(p.availableAt));
  dialog.querySelector('.dailyNext').textContent=`Próxima: +${p.nextRewardXp} XP • ${when} (São Paulo). Se perder um dia, o ciclo reinicia.`;
  renderLevelProgress(dialog.querySelector('.dailyLevelBar'),p);
  dialog.querySelector('.dailyLevelText').textContent=`${p.levelProgress}/${p.levelRequiredXp} XP neste nível • ${p.totalXp} XP no total`;
  dialog.querySelectorAll('button').forEach(button=>{button.onclick=()=>dialog.close();});
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
  if(award){
    dialog.querySelector('.dailyXp').classList.add('dailyXpAwarded');
    if(p.level>award.previousLevel){
      const notice=document.createElement('p');notice.className='dailyLevelUp';notice.textContent=`Você alcançou o nível ${p.level}!`;dialog.querySelector('.dailyXp').after(notice);
      showNoblePromotion({level:award.previousLevel},p);
    }
  }
}
