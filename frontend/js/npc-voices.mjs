import { spokenNpcText } from './npc-portuguese.mjs';
export function splitNpcSpeech(text,limit=110) {
  const sentences=String(text).replace(/\s+/g,' ').trim().match(/[^.!?;]+[.!?;]*/g)||[];
  const chunks=[];
  for(const sentence of sentences){let line='';for(const word of sentence.trim().split(' ')){if(line&&line.length+word.length+1>limit){chunks.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)chunks.push(line);}
  return chunks;
}
export function createNpcVoices(getProximityGain=()=>1,getCharacterName=()=>'') {
  const supported='speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const synth=supported?window.speechSynthesis:null;
  let settings={enabled:true,volume:.6,voiceNames:[]};try{const saved=JSON.parse(localStorage.getItem('guedessec.npc-voices')||'null');if(saved){settings.voiceNames=Array.isArray(saved.voiceNames)?saved.voiceNames.slice(0,16):[];settings.enabled=saved.enabled!==false;settings.volume=Math.max(0,Math.min(1,Number(saved.volume)||0));}}catch{}
  let unlocked=false,current=null,available=[],pending=[];
  function refreshVoices(){available=synth?.getVoices()||[];}
  refreshVoices();synth?.addEventListener('voiceschanged',refreshVoices);
  const masculineVoice=voice=>/\b(antonio|antônio|daniel|duarte|ricardo|fabio|fábio|felipe|francisco|henrique|joao|joão|jose|josé|jovanni|male|masculin[oa])\b/i.test(voice.name);
  const feminineVoice=voice=>/\b(francisca|thalita|maria|helena|heloisa|luciana|fernanda|raquel|joana|ines|in[e?]s|female|feminin[oa])\b/i.test(voice.name);
  function selectVoice(index,localOnly=false){
    const brazil=available.filter(v=>/^pt[-_]BR$/i.test(v.lang));
    let portuguese=brazil.length?brazil:available.filter(v=>/^pt/i.test(v.lang));
    // Índices 1, 2 e 3: Xandy, Alex e Snot. Não há campo de gênero na API.
    if([1,2,3].includes(index)){
      const masculine=available.filter(v=>/^pt/i.test(v.lang)&&masculineVoice(v));
      const brazilian=masculine.filter(v=>/^pt[-_]BR$/i.test(v.lang));
      if(masculine.length)portuguese=brazilian.length?brazilian:masculine;
    }
    if(getCharacterName(index)==='Luiza') {
      const feminine=available.filter(v=>/^pt/i.test(v.lang)&&feminineVoice(v));
      const brazilian=feminine.filter(v=>/^pt[-_]BR$/i.test(v.lang));
      portuguese=brazilian.length?brazilian:feminine;
      if(!portuguese.length)return null;
    }
    if(localOnly){const local=portuguese.filter(v=>v.localService);if(!local.length)return;portuguese=local;}
    const custom=portuguese.find(v=>v.voiceURI===settings.voiceNames[index]);if(custom)return custom;
    const fastNatural=portuguese.filter(v=>v.localService&&/natural|neural/i.test(v.name));
    if(fastNatural.length)return fastNatural[index%fastNatural.length];
    const natural=portuguese.filter(v=>/natural|neural/i.test(v.name));
    if(natural.length)return natural[index%natural.length];
    const local=portuguese.filter(v=>v.localService);
    const pool=local.length?local:portuguese;
    return pool[index%pool.length];
  }
  function save(){try{localStorage.setItem('guedessec.npc-voices',JSON.stringify(settings));}catch{}}
  const unlock=()=>{unlocked=true;refreshVoices();};document.addEventListener('pointerdown',unlock,{capture:true,passive:true});document.addEventListener('keydown',unlock,{capture:true});
  function stop(){const job=current;current=null;const waiting=pending;pending=[];if(job){clearTimeout(job.timer);job.resolve();}waiting.forEach(item=>item.resolve());synth?.cancel();}
  function voiceVolume(index){
    const gain=Number(getProximityGain(index));
    return settings.volume*Math.max(0,Math.min(1,Number.isFinite(gain)?gain:0));
  }
  function updateProximity(){if(current?.utterance)current.utterance.volume=voiceVolume(current.index);}
  function speak(text,index=0,priority=false,reason='ambient') {
    if(!priority && !['phone','alert'].includes(reason))return Promise.resolve();
    if(!supported||!unlocked||!settings.enabled||document.hidden)return Promise.resolve();
    if(current){
      if(!priority)return Promise.resolve();
      // A direct reply starts immediately rather than waiting behind an older response.
      stop();
    }
    // Retira apresentacoes repetidas do audio, preservando o texto da conversa.
    const spoken=String(text).replace(/^Gosto de (?:observar os detalhes e organizar as ideias com calma|testar ideias na pratica e descobrir possibilidades novas|planejar as etapas e conferir os resultados com cuidado)\.\s*/,'');
    const chunks=splitNpcSpeech(spokenNpcText(spoken));if(!chunks.length)return Promise.resolve();
    return new Promise(resolve=>{
      const job={resolve,index,timer:null,position:0,utterance:null,retrying:false};current=job;
      function finish(){
        if(current!==job)return;clearTimeout(job.timer);current=null;resolve();
        const waiting=pending.shift();if(waiting)speak(waiting.text,waiting.index,false,'alert').then(waiting.resolve);
      }
      function next(){
        if(current!==job)return;
        if(job.position>=chunks.length){finish();return;}
        const utterance=new SpeechSynthesisUtterance(chunks[job.position++]);
        utterance.lang='pt-BR';utterance.volume=voiceVolume(index);utterance.rate=[1.08,1.1,1.06][index%3];utterance.pitch=[1.06,.95,.90,.97][index%4];
        const fallback=selectVoice(index,true);
        const voice=job.retrying&&fallback?fallback:selectVoice(index);if(getCharacterName(index)==='Luiza'&&!voice){finish();return;}if(voice)utterance.voice=voice;
        job.utterance=utterance;
        utterance.onend=()=>{if(current!==job||job.utterance!==utterance)return;clearTimeout(job.timer);job.retrying=false;job.timer=setTimeout(next,/[!?]$/.test(utterance.text)?50:20);};
        utterance.onerror=event=>{
          if(current!==job||job.utterance!==utterance)return;
          clearTimeout(job.timer);
          if(!job.retrying && !['canceled','interrupted','not-allowed'].includes(event.error)) {
            job.retrying=true;job.position--;job.timer=setTimeout(next,180);return;
          }
          window.dispatchEvent(new CustomEvent('npc-speech-error',{detail:{message:'A voz do navegador falhou. Escolha outra voz em Ambiente. O texto completo permanece na conversa.'}}));
          finish();
        };
        // Limite de seguranca somente para um sintetizador que deixou de responder.
        job.timer=setTimeout(()=>{if(current===job){stop();}},30000);
        synth.resume();synth.speak(utterance);
      }
      next();
    });
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
  return {supported,settings,speak,stop,updateProximity,getVoices(){refreshVoices();return available.filter(v=>/^pt/i.test(v.lang));},setVoice(index,uri){settings.voiceNames[index]=uri;save();stop();},get speaking(){return !!current;},setEnabled(value){settings.enabled=!!value;save();if(!settings.enabled)stop();},setVolume(value){settings.volume=Math.max(0,Math.min(1,value));save();updateProximity();}};
}
