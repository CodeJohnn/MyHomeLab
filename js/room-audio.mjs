// Ambientes sintetizados localmente: sem downloads ou sons externos.
export function createRoomAudio() {
  const storage='guedessec.room-audio.v1';
  let settings={enabled:true,volume:.25};
  try{const saved=JSON.parse(localStorage.getItem(storage)||'null');if(saved){settings.enabled=saved.enabled!==false;if(Number.isFinite(saved.volume))settings.volume=Math.max(0,Math.min(1,saved.volume));}}catch{}
  let ctx,master,noiseBuffer,channels={},room='',lastLevel=-1,nextNote=0,nextKey=0,failed=false;
  function save(){try{localStorage.setItem(storage,JSON.stringify(settings));}catch{}}
  function noiseChannel(name,frequency,type,gain) {
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
    noiseChannel('servers',650,'lowpass',channels.servers);noiseChannel('lab',250,'lowpass',channels.lab);noiseChannel('bath',1100,'bandpass',channels.bath);noiseChannel('office',320,'lowpass',channels.office);
    for(const name of ['speaker','ac']){const gain=ctx.createGain();gain.gain.value=0;gain.connect(master);channels[name]=gain;}
    noiseChannel('ac',800,'lowpass',channels.ac);
    const fan=ctx.createOscillator(),fanGain=ctx.createGain();fan.type='sine';fan.frequency.value=92;fanGain.gain.value=.065;fan.connect(fanGain);fanGain.connect(channels.servers);fan.start();
  }
  async function unlock(){if(!settings.enabled||failed)return;try{if(!ctx)initialize();if(ctx?.state==='suspended')await ctx.resume();}catch{failed=true;}}
  document.addEventListener('pointerdown',unlock,{passive:true});document.addEventListener('keydown',unlock);
  function note(frequency,when,duration,gain) {
    const osc=ctx.createOscillator(),amp=ctx.createGain();osc.type='sine';osc.frequency.value=frequency;
    amp.gain.setValueAtTime(0,when);amp.gain.linearRampToValueAtTime(gain,when+.15);amp.gain.exponentialRampToValueAtTime(.0001,when+duration);
    osc.connect(amp);amp.connect(channels.speaker);osc.start(when);osc.stop(when+duration+.02);osc.onended=()=>{osc.disconnect();amp.disconnect();};
  }
  function keyClick() {
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),amp=ctx.createGain();source.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.value=1700+Math.random()*800;
    amp.gain.setValueAtTime(.1,ctx.currentTime);amp.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.028);
    source.connect(filter);filter.connect(amp);amp.connect(channels.office);source.start();source.stop(ctx.currentTime+.035);source.onended=()=>{source.disconnect();filter.disconnect();amp.disconnect();};
  }
  // Rock instrumental original, em colcheias a 112 BPM.
  let rockStep=0;
  function rockTone(frequency,when,duration,volume,guitar=false){
    const osc=ctx.createOscillator(),filter=ctx.createBiquadFilter(),amp=ctx.createGain();
    osc.type=guitar?'sawtooth':'triangle';osc.frequency.value=frequency;
    filter.type='lowpass';filter.frequency.value=guitar?1900:500;
    amp.gain.setValueAtTime(.0001,when);amp.gain.exponentialRampToValueAtTime(volume,when+.008);amp.gain.exponentialRampToValueAtTime(.0001,when+duration);
    osc.connect(filter);filter.connect(amp);amp.connect(channels.speaker);
    osc.start(when);osc.stop(when+duration+.01);osc.onended=()=>{osc.disconnect();filter.disconnect();amp.disconnect();};
  }
  function rockDrum(kind,when){
    if(kind==='kick'){
      const osc=ctx.createOscillator(),amp=ctx.createGain();osc.frequency.setValueAtTime(135,when);osc.frequency.exponentialRampToValueAtTime(45,when+.13);
      amp.gain.setValueAtTime(.27,when);amp.gain.exponentialRampToValueAtTime(.0001,when+.20);
      osc.connect(amp);amp.connect(channels.speaker);osc.start(when);osc.stop(when+.21);osc.onended=()=>{osc.disconnect();amp.disconnect();};return;
    }
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),amp=ctx.createGain();source.buffer=noiseBuffer;
    const snare=kind==='snare',duration=snare?.13:.035;
    filter.type='highpass';filter.frequency.value=snare?1300:6500;
    amp.gain.setValueAtTime(snare?.13:.045,when);amp.gain.exponentialRampToValueAtTime(.0001,when+duration);
    source.connect(filter);filter.connect(amp);amp.connect(channels.speaker);source.start(when);source.stop(when+duration+.01);
    source.onended=()=>{source.disconnect();filter.disconnect();amp.disconnect();};
  }
  function rockBeat(when){
    const step=rockStep++%32,beat=step%8,root=[82.41,98,73.42,110][Math.floor(step/8)];
    const riff=[1,1,2,1,1,1.5,2,1.5][beat];
    rockTone(root*riff,when,.19,.055,true);rockTone(root*riff*1.5,when,.18,.03,true);
    if(beat%2===0)rockTone(root/2,when,.35,.13);
    rockDrum('hat',when);
    if(beat===0||beat===4||beat===7)rockDrum('kick',when);
    if(beat===2||beat===6)rockDrum('snare',when);
  }
  function update(position,mediaPlaying=false,typing=false,sources={}) {
    if(!ctx||ctx.state!=='running')return;
    const nextRoom=position.z>=3.5?'office':position.x>4.5?(position.z<0?'servers':'bath'):'lab';
    if(nextRoom!==room){room=nextRoom;for(const name of ['lab','servers','bath','office']){const gain=channels[name];gain.gain.cancelScheduledValues(ctx.currentTime);gain.gain.setTargetAtTime(name===room?({lab:.035,servers:.14,bath:.025,office:.055}[name]):0,ctx.currentTime,.45);}}
    const proximity=source=>source?1/(1+Math.hypot(position.x-source.x,position.z-source.z)*.55):0;
    channels.ac.gain.setTargetAtTime(.12*proximity(sources.ac),ctx.currentTime,.3);
    channels.speaker.gain.setTargetAtTime(proximity(sources.speaker),ctx.currentTime,.3);
    const level=settings.enabled&&!document.hidden?settings.volume*(mediaPlaying?.15:1):0;
    if(level!==lastLevel){master.gain.setTargetAtTime(level,ctx.currentTime,.25);lastLevel=level;}
    if(!settings.enabled||document.hidden)return;
    if(sources.speaker&&!mediaPlaying){
      if(nextNote<ctx.currentTime-.1)nextNote=ctx.currentTime+.02;
      while(nextNote<ctx.currentTime+.10){rockBeat(nextNote);nextNote+=60/112/2;}
    }else nextNote=ctx.currentTime;
    // Les touches proviennent uniquement du moteur des interactions.
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.1);lastLevel=-1;});
  window.addEventListener('pagehide',()=>{ctx?.close().catch(()=>{});});
  return {settings,update,setEnabled(value){settings.enabled=!!value;save();unlock();lastLevel=-1;},setVolume(value){settings.volume=Math.max(0,Math.min(1,value));save();lastLevel=-1;}};
}
