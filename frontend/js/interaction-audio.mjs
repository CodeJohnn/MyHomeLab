export function createInteractionAudio(){
  let settings={enabled:true,volume:.45};try{const s=JSON.parse(localStorage.getItem('guedessec.effects')||'null');if(s){settings.enabled=s.enabled!==false;if(Number.isFinite(s.volume))settings.volume=Math.max(0,Math.min(1,s.volume));}}catch{}
  let ctx,master,buffer,active=0;const last={};
  function save(){try{localStorage.setItem('guedessec.effects',JSON.stringify(settings));}catch{}}
  function unlock(){if(!settings.enabled)return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;try{if(!ctx){ctx=new Audio();master=ctx.createGain();master.gain.value=settings.volume;master.connect(ctx.destination);buffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}if(ctx.state==='suspended')ctx.resume().catch(()=>{});}catch{}}
  document.addEventListener('pointerdown',unlock,{capture:true,passive:true});document.addEventListener('keydown',unlock,{capture:true});
  function noise(frequency,duration,volume,delay=0,type='bandpass'){
    if(active>=10)return;active++;const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;filter.type=type;filter.frequency.value=frequency;filter.Q.value=1;
    const t=ctx.currentTime+delay;gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(volume,t+.005);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    source.connect(filter);filter.connect(gain);gain.connect(master);source.start(t);source.stop(t+duration+.01);source.onended=()=>{active--;source.disconnect();filter.disconnect();gain.disconnect();};
  }
  function tone(frequency,duration,volume,delay=0){const osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime+delay;osc.frequency.setValueAtTime(frequency,t);osc.frequency.exponentialRampToValueAtTime(frequency*.65,t+duration);gain.gain.setValueAtTime(volume,t);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(gain);gain.connect(master);osc.start(t);osc.stop(t+duration);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
  function play(kind,distance=0){
    if(!settings.enabled||document.hidden||!ctx||ctx.state!=='running')return;
    const now=ctx.currentTime,cooldown={typing:.075,step:.32,mouse:.2,coffee:1.8,fridge:.5,solder:.65,tool:1.1,equipment:2}[kind]||.1;
    if(now-(last[kind]??-100)<cooldown)return;last[kind]=now;const attenuation=Math.max(0,1-distance/5);if(!attenuation)return;
    if(kind==='solder')noise(3200,.08,.018*attenuation);
    if(kind==='tool'){noise(1800,.035,.035*attenuation);tone(380,.045,.012*attenuation);}
    if(kind==='equipment'){tone(1150,.055,.025*attenuation);tone(1450,.07,.018*attenuation,.09);}
    if(kind==='typing'){
      const variation=.85+Math.random()*.3;
      noise(1100*variation,.014,.05*attenuation,0,'lowpass');
      noise(2400*variation,.009,.018*attenuation,.025+Math.random()*.012,'lowpass');
    }
    if(kind==='mouse'){noise(2600,.022,.08);noise(1800,.025,.045,.06);}
    if(kind==='step'){noise(240,.11,.16*attenuation,0,'lowpass');tone(100,.075,.025*attenuation);}
    if(kind==='fart'){for(let i=0;i<6;i++){noise(90+i%2*50,.12,.16,i*.065,'lowpass');tone(65+i%3*12,.09,.08,i*.065);}}
    if(kind==='kiss'){noise(750,.12,.13,0,'bandpass');noise(1800,.055,.16,.105,'bandpass');tone(660,.11,.04,.13);}
    if(kind==='coffee'){noise(800,.38,.075,0,'bandpass');noise(1200,.16,.045,.25);tone(1300,.09,.035,.65);}
    if(kind==='phoneRing'){tone(820,.12,.07*attenuation);tone(1050,.12,.06*attenuation,.16);}
    if(kind==='serverAlert'){tone(880,.22,.13);tone(660,.28,.11,.3);}
    if(kind==='fridge'){noise(380,.16,.09,0,'lowpass');tone(130,.16,.035,.12);}
  }
  const typists=new Map();
  function updateTyping(sources){
    const activeIds=new Set(sources.map(source=>source.id));
    for(const id of typists.keys())if(!activeIds.has(id))typists.delete(id);
    if(!ctx||ctx.state!=='running'||!settings.enabled||document.hidden)return;
    const now=ctx.currentTime;
    for(const source of sources){
      let state=typists.get(source.id);
      if(!state){state={next:now+.12+Math.random()*.3,left:3+Math.floor(Math.random()*4)};typists.set(source.id,state);}
      if(now<state.next)continue;
      play('typing',source.distance||0);state.left--;
      if(state.left<=0){state.next=now+.45+Math.random()*1.1;state.left=3+Math.floor(Math.random()*5);}
      else state.next=now+.095+Math.random()*.13;
    }
  }
  window.addEventListener('pagehide',()=>ctx?.close().catch(()=>{}));
  return{settings,play,updateTyping,setEnabled(value){settings.enabled=!!value;save();if(master)master.gain.setTargetAtTime(settings.enabled?settings.volume:0,ctx.currentTime,.05);if(settings.enabled)unlock();},setVolume(value){settings.volume=Math.max(0,Math.min(1,value));save();if(master)master.gain.setTargetAtTime(settings.enabled?settings.volume:0,ctx.currentTime,.05);}};
}
