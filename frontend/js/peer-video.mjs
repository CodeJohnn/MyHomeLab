// O arquivo fica no navegador do anfitriao. Somente audio/video codificados vao aos pares.
export function createPeerVideo({video,api,getSelfId,onDisplay,onStatus,onResume}){
  const peers=new Map(),signalJobs=new Map();
  let media=null,localStream=null,objectUrl=null,iceServers=null,starting=false,lastReady=0,closed=false;
  const isHost=()=>media?.hostId===getSelfId();
  async function settings(){
    if(!iceServers)iceServers=(await api('rtc',{})).iceServers;
    return {iceServers};
  }
  function removePeer(id){const peer=peers.get(id);if(peer){clearTimeout(peer.timeout);peer.pc.close();peers.delete(id);}}
  function clear(){
    for(const id of peers.keys())removePeer(id);
    signalJobs.clear();localStream?.getTracks().forEach(track=>track.stop());localStream=null;
    if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
    video.pause();video.srcObject=null;video.removeAttribute('src');video.load();delete video.dataset.peerRole;
    media=null;
  }
  function send(to,type,data){
    if(!media)return Promise.resolve();
    return api('signal',{to,type,data,streamId:media.streamId});
  }
  async function makePeer(id){
    if(peers.has(id))return peers.get(id);
    const pc=new RTCPeerConnection(await settings());
    const peer={pc,candidates:[],timeout:null};peers.set(id,peer);
    pc.onicecandidate=event=>{if(event.candidate)send(id,'candidate',event.candidate.toJSON()).catch(()=>{});};
    pc.onconnectionstatechange=()=>{
      if(pc.connectionState==='connected'){
        clearTimeout(peer.timeout);onStatus(isHost()?'Transmitindo direto para seu amigo. Mantenha esta pagina aberta.':'Recebendo o filme diretamente do anfitriao.');
      }else if(pc.connectionState==='failed'){
        removePeer(id);onStatus('Nao foi possivel conectar estas redes. Configure um servidor TURN para permitir retransmissao.');
      }
    };
    peer.timeout=setTimeout(()=>{
      if(pc.connectionState!=='connected'){removePeer(id);onStatus('A conexao direta nao respondeu. Algumas redes precisam de um servidor TURN.');}
    },30000);
    pc.ontrack=event=>{
      if(isHost()||!media)return;
      const stream=event.streams[0];if(!stream)return;
      if(video.srcObject===stream)return;
      video.dataset.peerRole='guest';video.srcObject=stream;video.muted=true;video.controls=false;video.playsInline=true;
      onDisplay(video,media.screen);video.play().then(()=>onResume()).catch(()=>onResume());
    };
    return peer;
  }
  async function flush(peer){
    if(!peer.pc.remoteDescription)return;
    for(const candidate of peer.candidates.splice(0))await peer.pc.addIceCandidate(candidate);
  }
  async function processSignal(message){
    if(!media||message.streamId!==media.streamId||message.from===getSelfId())return;
    if(message.type==='ready'){
      if(!isHost()||!localStream)return;
      const existing=peers.get(message.from);
      if(existing&&!['failed','closed'].includes(existing.pc.connectionState))return;
      removePeer(message.from);
      const peer=await makePeer(message.from);
      for(const track of localStream.getTracks())peer.pc.addTrack(track,localStream);
      const offer=await peer.pc.createOffer();await peer.pc.setLocalDescription(offer);
      await send(message.from,'offer',{type:offer.type,sdp:offer.sdp});
      return;
    }
    if(!isHost()&&message.from!==media.hostId)return;
    const peer=await makePeer(message.from);
    if(message.type==='candidate'){
      if(message.data){peer.candidates.push(message.data);await flush(peer);}return;
    }
    if(message.type==='offer'&&!isHost()){
      await peer.pc.setRemoteDescription(message.data);await flush(peer);
      const answer=await peer.pc.createAnswer();await peer.pc.setLocalDescription(answer);
      await send(message.from,'answer',{type:answer.type,sdp:answer.sdp});
    }else if(message.type==='answer'&&isHost()){
      await peer.pc.setRemoteDescription(message.data);await flush(peer);
    }
  }
  function signal(message){
    const job=(signalJobs.get(message.from)||Promise.resolve()).then(()=>processSignal(message)).catch(error=>onStatus('Falha ao conectar o video: '+error.message));
    signalJobs.set(message.from,job);
  }
  async function ready(){
    if(!media||isHost()||closed)return;
    const existing=peers.get(media.hostId);if(existing&&existing.pc.connectionState==='connected')return;
    const now=Date.now();if(now-lastReady<5000)return;lastReady=now;
    await send(media.hostId,'ready',null).catch(()=>{});
  }
  function update(next,members=[]){
    if(next?.kind!=='peer'){
      if(media&&!starting)clear();return;
    }
    if(media&&media.streamId!==next.streamId&&!starting)clear();
    media=next;
    const present=new Set(members.map(m=>m.id));
    for(const id of peers.keys())if(!present.has(id))removePeer(id);
    if(isHost()){
      if(localStream)video.dataset.peerRole='host';
      else onStatus('A transmissao foi interrompida. Selecione o arquivo novamente para transmitir.');
    }else ready();
  }
  async function start(file,screen){
    if(starting)throw new Error('Aguarde a abertura do video.');
    if(!globalThis.RTCPeerConnection)throw new Error('Este navegador nao suporta transmissao direta.');
    const capture=video.captureStream||video.mozCaptureStream;
    if(!capture)throw new Error('Para transmitir um arquivo, use Chrome, Edge ou Firefox no computador. Este navegador pode assistir, mas nao capturar o video.');
    if(media&&!isHost())throw new Error('Outra pessoa esta transmitindo. Aguarde ela encerrar.');
    starting=true;closed=false;clear();
    try{
      await settings();
      objectUrl=URL.createObjectURL(file);video.dataset.peerRole='host';video.src=objectUrl;
      video.playsInline=true;video.loop=false;video.muted=true;video.controls=true;
      onStatus('Abrindo arquivo local para transmissao direta...');
      await video.play();
      localStream=capture.call(video);
      if(!localStream.getVideoTracks().length)throw new Error('Nao foi possivel capturar este video. Teste MP4 H.264/AAC ou WebM.');
      const result=await api('share',{screen});media=result.media;
      onDisplay(video,screen);onResume();
      onStatus('Filme pronto. Seu amigo deve entrar na mesma sala. O arquivo nao sera enviado ao Render.');
      return media;
    }catch(error){clear();throw error;}finally{starting=false;}
  }
  async function stop(){
    if(media&&isHost())await api('share',{stop:true});
    clear();
  }
  const timer=setInterval(()=>ready(),6000);
  video.addEventListener('ended',()=>{if(isHost())stop().catch(error=>onStatus(error.message));});
  return {start,stop,update,signal,isHost,get active(){return media?.kind==='peer';},close(){closed=true;clear();clearInterval(timer);}};
}
