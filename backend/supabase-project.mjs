export function supabaseProjectUrl(value=''){
  const raw=value.trim();if(!raw)return '';
  const url=new URL(raw);
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error('SUPABASE_URL deve conter somente a URL do projeto.');
  // The dashboard also displays the REST API URL. The SDK needs the project root.
  if(url.pathname!=='/'&&!/^\/(rest|auth)\/v1\/?$/.test(url.pathname))throw new Error('SUPABASE_URL inválida. Use https://SEU-PROJETO.supabase.co, sem caminho.');
  return url.origin;
}
