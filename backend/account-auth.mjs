export function createAccountAuth({url='',key='',fetchImpl=fetch}={}){
  const configured=Boolean(url&&key);
  return {configured,publicConfig:()=>({url:configured?url:'',key:configured?key:''}),async verify(token){
    if(!configured)return null;
    if(!token||typeof token!=='string'||token.length>8192)throw Object.assign(new Error('Entre na sua conta para acessar o laboratorio.'),{status:401});
    let response;
    try{response=await fetchImpl(new URL('/auth/v1/user',url),{headers:{apikey:key,Authorization:'Bearer '+token},signal:AbortSignal.timeout(10000)});}
    catch{throw Object.assign(new Error('Nao foi possivel verificar sua conta. Tente novamente.'),{status:503});}
    if(!response.ok)throw Object.assign(new Error('Sua sessao expirou. Entre novamente.'),{status:response.status===401||response.status===403?401:503});
    const user=await response.json();if(!user.id)throw Object.assign(new Error('Conta invalida.'),{status:401});return user;
  }};
}
