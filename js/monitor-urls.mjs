export function normalizeMonitorUrl(input) {
  let value=String(input??'').trim();
  const markdown=value.match(/^\[[^\]]*\]\(([^)]+)\)$/);if(markdown)value=markdown[1].trim();
  if(!value)throw new Error('Informe um site, IP ou link de video.');
  if(value.startsWith('//'))value='https:'+value;
  if(!/^https?:\/\//i.test(value)) {
    const local=/^(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|\[[0-9a-f:]+\])(?=[:/?#]|$)/i.test(value);
    if(/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[^/:]+:\d+(?:[/?#]|$)/.test(value))throw new Error('Use um endereco HTTP ou HTTPS.');
    value=(local?'http://':'https://')+value;
  }
  let url;try{url=new URL(value);}catch{throw new Error('Endereco invalido. Exemplo: github.com/CodeJohnn ou 192.168.1.10:8080.');}
  if(!['http:','https:'].includes(url.protocol)||!url.hostname||/\s/.test(url.hostname))throw new Error('Endereco invalido.');
  return url;
}
export function embeddedMonitorUrl(value, options = {}) {
  const url=normalizeMonitorUrl(value),host=url.hostname.toLowerCase().replace(/^www\./,'');
  const youtube=['youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','youtu.be'].includes(host);
  if(!youtube)return url.href;
  const id=host==='youtu.be'?url.pathname.split('/')[1]:url.searchParams.get('v')||url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1];
  const list=url.searchParams.get('list');
  if(!id&&!list)return url.href;
  if(id&&!/^[a-zA-Z0-9_-]{11}$/.test(id))throw new Error('Link do YouTube invalido. Copie o link do video pelo botao Compartilhar.');
  const embed=new URL('https://www.youtube-nocookie.com/embed/'+(id||'videoseries'));
  const origin=options.origin || (typeof location!=='undefined'?location.origin:'');
  if(/^https?:\/\//.test(origin)){embed.searchParams.set('origin',origin);embed.searchParams.set('enablejsapi','1');}
  embed.searchParams.set('playsinline','1');embed.searchParams.set('rel','0');
  if(list&&/^[a-zA-Z0-9_-]+$/.test(list))embed.searchParams.set('list',list);
  const time=url.searchParams.get('start')||url.searchParams.get('t')||url.hash.match(/t=([^&]+)/)?.[1];
  if(time){const match=time.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);const seconds=/^\d+$/.test(time)?Number(time):match?Number(match[1]||0)*3600+Number(match[2]||0)*60+Number(match[3]||0):0;if(seconds>0)embed.searchParams.set('start',String(seconds));}
  if(options.autoplay)embed.searchParams.set('autoplay','1');
  if(options.muted)embed.searchParams.set('mute','1');
  return embed.href;
}
