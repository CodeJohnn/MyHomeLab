// Ambientes sintetizados localmente e r?dio transmitida pela caixa de som.
export function createRoomAudio() {
  const storage='guedessec.room-audio.v1';
  const radio=new Audio();radio.preload='none';
  radio.src='https://streams.radiobob.de/bob-classicrock/mp3-128/streams.radiobob.de/';
  let radioWanted=true,autoplayPending=true,radioAttempt=0,radioStarting=false;
  function radioStatus(text){window.dispatchEvent(new CustomEvent('speaker-radio-status',{detail:{text,playing:radioWanted&&!radio.paused}}));}
  async function startRadio(automatic=false){
    if(radioStarting||!radioWanted)return;
    radioStarting=true;const attempt=++radioAttempt;
    radio.volume=automatic?settings.volume*.25:radio.volume;
    radioStatus('Conectando a radio de rock classico...');
    try{
      await radio.play();
      if(attempt!==radioAttempt||!radioWanted)return;
      autoplayPending=false;radioStatus('RADIO BOB! Classic Rock ao vivo.');
    }catch(error){
      if(attempt!==radioAttempt)return;
      if(error.name==='NotAllowedError'){
        autoplayPending=true;radioStatus('A radio comeca no primeiro clique ou tecla.');
      }else{autoplayPending=false;radioWanted=false;radioStatus('Nao foi possivel tocar a radio. Tente novamente.');}
    }finally{if(attempt===radioAttempt)radioStarting=false;}
  }
  async function toggleRadio(){
    if(radioWanted){radioWanted=false;autoplayPending=false;radioAttempt++;radioStarting=false;radio.pause();radioStatus('Rock classico pausado.');return;}
    radioWanted=true;settings.enabled=true;save();unlock();await startRadio();
  }
  function tryAutoplayOnGesture(){if(autoplayPending&&radioWanted&&!document.hidden)startRadio(true);}

  radio.addEventListener('error',()=>{autoplayPending=false;radioWanted=false;radioStatus('Radio indisponivel. Tente novamente mais tarde.');});
  let settings={enabled:true,volume:.25};
  try{const saved=JSON.parse(localStorage.getItem(storage)||'null');if(saved){settings.enabled=saved.enabled!==false;if(Number.isFinite(saved.volume))settings.volume=Math.max(0,Math.min(1,saved.volume));}}catch{}
  settings.enabled=true;
  queueMicrotask(()=>startRadio(true));
  let ctx,master,noiseBuffer,channels={},room='',lastLevel=-1,failed=false;
  function save(){try{localStorage.setItem(storage,JSON.stringify(settings));}catch{}}
  function noiseChannel(frequency,type,gain) {
    const source=ctx.createBufferSource();source.buffer=noiseBuffer;source.loop=true;
    const filter=ctx.createBiquadFilter();filter.type=type;filter.frequency.value=frequency;filter.Q.value=.5;
    source.connect(filter);filter.connect(gain);source.start();
  }
  function initialize() {
    const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext){failed=true;return;}
    ctx=new AudioContext();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
    noiseBuffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate);const data=noiseBuffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
    for(const name of ['lab','servers','bath','office']){const gain=ctx.createGain();gain.gain.value=0;gain.connect(master);channels[name]=gain;}
    noiseChannel(650,'lowpass',channels.servers);noiseChannel(250,'lowpass',channels.lab);noiseChannel(1100,'bandpass',channels.bath);noiseChannel(320,'lowpass',channels.office);
    for(const name of ['ac']){const gain=ctx.createGain();gain.gain.value=0;gain.connect(master);channels[name]=gain;}
    noiseChannel(800,'lowpass',channels.ac);
    const fan=ctx.createOscillator(),fanGain=ctx.createGain();fan.type='sine';fan.frequency.value=92;fanGain.gain.value=.065;fan.connect(fanGain);fanGain.connect(channels.servers);fan.start();
  }
  async function unlock(){if(!settings.enabled||failed)return;try{if(!ctx)initialize();if(ctx?.state==='suspended')await ctx.resume();}catch{failed=true;}}
  function onGesture(){tryAutoplayOnGesture();void unlock();}
  document.addEventListener('pointerdown',onGesture,{passive:true});
  document.addEventListener('keydown',onGesture);
  function update(position,mediaPlaying=false,typing=false,sources={}) {
    const radioDistance=sources.speaker?Math.hypot(position.x-sources.speaker.x,position.z-sources.speaker.z):Infinity;
    radio.volume=settings.enabled&&!document.hidden?Math.min(1,settings.volume/(1+radioDistance*.55)*(mediaPlaying?.15:1)):0;
    if(!ctx||ctx.state!=='running')return;
    const nextRoom=position.z>=3.5?'office':position.x>4.5?(position.z<1?'servers':'bath'):'lab';
    if(nextRoom!==room){room=nextRoom;for(const name of ['lab','servers','bath','office']){const gain=channels[name];gain.gain.cancelScheduledValues(ctx.currentTime);gain.gain.setTargetAtTime(name===room?({lab:.035,servers:.14,bath:.025,office:.055}[name]):0,ctx.currentTime,.45);}}
    const proximity=source=>source?1/(1+Math.hypot(position.x-source.x,position.z-source.z)*.55):0;
    channels.ac.gain.setTargetAtTime(.12*proximity(sources.ac),ctx.currentTime,.3);
    const level=settings.enabled&&!document.hidden?settings.volume*(mediaPlaying?.15:1):0;
    if(level!==lastLevel){master.gain.setTargetAtTime(level,ctx.currentTime,.25);lastLevel=level;}
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)radio.volume=0;if(document.hidden&&ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.1);lastLevel=-1;});
  window.addEventListener('pagehide',()=>{radio.pause();ctx?.close().catch(()=>{});});
  return {settings,update,toggleRadio,get playing(){return radioWanted&&!radio.paused&&!radio.ended&&radio.readyState>=2&&settings.enabled&&radio.volume>0&&!document.hidden;},setEnabled(value){settings.enabled=!!value;save();unlock();lastLevel=-1;},setVolume(value){settings.volume=Math.max(0,Math.min(1,value));save();lastLevel=-1;}};
}
