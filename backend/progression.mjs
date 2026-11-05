import {nobleTitle,normalizeLevel} from '../frontend/js/nobility.mjs';
// app_metadata is controlled by the auth server. Never read user_metadata or request XP.
// Adapter only: no award formula exists in this branch, so no XP is minted here.
export function accountProgression(account){
  const data=account?.app_metadata?.progression;
  const level=normalizeLevel(data?.level);
  const xp=Number.isSafeInteger(data?.xp)&&data.xp>=0?data.xp:0;
  return {level,xp,title:nobleTitle(level).id,source:account?'account':'guest'};
}
