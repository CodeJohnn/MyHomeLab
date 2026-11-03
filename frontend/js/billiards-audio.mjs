// Sons sintetizados localmente: nenhum arquivo externo ou download.
export function createBilliardsAudio(){
  let context=null,last=0,initialized=false,enabled=true;
  const unlock=()=>{if(!enabled)return;const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;context||=new Audio();context.resume().catch(()=>{});};
  function play(event){
    if(!enabled||!context||context.state!=='running')return;
    const t=context.currentTime,volume=Math.min(.3,.025+event.speed*.055);
    const duration=event.type==='pocket'?.24:event.type==='rail'?.09:.055;
    const gain=context.createGain(),osc=context.createOscillator();
    gain.gain.setValueAtTime(volume,t);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    const frequency={cue:900,ball:1700,rail:240,pocket:110}[event.type]||600;
    osc.frequency.setValueAtTime(frequency,t);osc.frequency.exponentialRampToValueAtTime(frequency*.35,t+duration);osc.type='triangle';
    const pan=context.createStereoPanner();pan.pan.value=Math.max(-1,Math.min(1,event.x/1.1));
    osc.connect(gain);gain.connect(pan);pan.connect(context.destination);osc.start(t);osc.stop(t+duration);
    const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(data.length*.12));
    const noise=context.createBufferSource(),filter=context.createBiquadFilter();noise.buffer=buffer;filter.type='lowpass';filter.frequency.value=event.type==='pocket'?600:3500;noise.connect(filter);filter.connect(gain);noise.start(t);noise.stop(t+duration);
  }
  return {unlock,setEnabled(value){enabled=value;if(value)unlock();},update(state){
    const sequence=state?.soundSequence||0;
    if(!initialized||sequence<last){last=sequence;initialized=true;return;}
    for(const event of state?.soundEvents||[])if(event.id>last)play(event);
    last=sequence;
  },dispose(){context?.close();}};
}
