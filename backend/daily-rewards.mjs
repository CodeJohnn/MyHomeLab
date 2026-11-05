import {nobleTitle} from '../frontend/js/nobility.mjs';
import {supabaseProjectUrl} from './supabase-project.mjs';
export function createDailyRewards({url='',key='',fetchImpl=fetch}={}){
  url=supabaseProjectUrl(url);
  return {configured:Boolean(url&&key),async call(method,token){
    if(!url||!key)throw Object.assign(new Error('Recompensas diárias aguardam configuração do Supabase.'),{status:503});
    if(!token)throw Object.assign(new Error('Entre na conta para receber XP.'),{status:401});
    let response;
    try{response=await fetchImpl(new URL('/rest/v1/rpc/'+method,url),{method:'POST',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(15000)});}
    catch{throw Object.assign(new Error('Não foi possível consultar suas recompensas.'),{status:503});}
    if(!response.ok)throw Object.assign(new Error(response.status===401||response.status===403?'Sessão inválida para recompensas.':'Recompensas indisponíveis. Confira a migração do banco.'),{status:response.status===401||response.status===403?401:503});
    const result=await response.json(),progression=result.progression||result;
    if(!Number.isSafeInteger(progression.level)||!Number.isSafeInteger(progression.xp))throw Object.assign(new Error('Resposta de progressão inválida.'),{status:503});
    progression.title=nobleTitle(progression.level).id;
    return result;
  }};
}
