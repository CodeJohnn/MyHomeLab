import {nobleTitle,normalizeLevel} from '../frontend/js/nobility.mjs';
// app_metadata is controlled by the auth server. Never read user_metadata or request XP.
// Database progression takes precedence after the daily-XP migration.
export function accountProgression(account){
  if(account?.serverProgression)return {...account.serverProgression,title:nobleTitle(account.serverProgression.level).id};
  const data=account?.app_metadata?.progression;
  const level=normalizeLevel(data?.level);
  const xp=Number.isSafeInteger(data?.xp)&&data.xp>=0?data.xp:0;
  return {level,xp,title:nobleTitle(level).id,source:account?'account':'guest'};
}
export function publicProgression(progression){
  const level=normalizeLevel(progression?.level);
  return {level,xp:progression?.xp||0,title:nobleTitle(level).id};
}
