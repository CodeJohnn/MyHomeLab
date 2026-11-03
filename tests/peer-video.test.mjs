import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPeerVideo} from '../frontend/js/peer-video.mjs';

test('arquivo grande permanece local e inicia negociacao de midia sem upload',async()=>{
  const original=globalThis.RTCPeerConnection;
  const calls=[],tracks=[{kind:'video',stop(){}},{kind:'audio',stop(){}}];
  let connection;
  globalThis.RTCPeerConnection=class{
    constructor(){connection=this;this.connectionState='new';this.sent=[];}
    addTrack(track){this.sent.push(track);}
    async createOffer(){return {type:'offer',sdp:'offer'};}
    async setLocalDescription(value){this.localDescription=value;}
    close(){this.connectionState='closed';}
  };
  const video=Object.assign(new EventTarget(),{dataset:{},srcObject:null,async play(){},pause(){},load(){},removeAttribute(){},captureStream(){return {getTracks:()=>tracks,getVideoTracks:()=>[tracks[0]]};}});
  const api=async(action,data)=>{calls.push({action,data});if(action==='rtc')return {iceServers:[]};if(action==='share')return {media:{kind:'peer',hostId:'host',streamId:'stream',screen:data.screen}};return {ok:true};};
  const player=createPeerVideo({video,api,getSelfId:()=> 'host',onDisplay(){},onStatus(){},onResume(){}});
  try{
    // Blob pequeno com tamanho declarado grande: o controlador nao le nem envia seus bytes.
    const file=new Blob(['video'],{type:'video/mp4'});Object.defineProperty(file,'size',{value:3*1024**3});
    await player.start(file,'screen-2');
    assert.equal(player.active,true);assert.match(video.src,/^blob:/);
    player.signal({from:'guest',streamId:'stream',type:'ready'});
    await new Promise(r=>setTimeout(r,0));
    assert.equal(connection.sent.length,2);
    assert.ok(calls.some(c=>c.action==='signal'&&c.data.type==='offer'));
    assert.ok(!calls.some(c=>c.action.startsWith('upload')));
    await player.stop();assert.equal(player.active,false);
  }finally{player.close();globalThis.RTCPeerConnection=original;}
});

test('espectador recebe video e aceita candidatos que chegam antes da oferta',async()=>{
  const original=globalThis.RTCPeerConnection,calls=[],order=[];let connection,displayed=null;
  globalThis.RTCPeerConnection=class{
    constructor(){connection=this;this.connectionState='new';}
    async setRemoteDescription(value){this.remoteDescription=value;order.push('remote');}
    async addIceCandidate(){assert.ok(this.remoteDescription);order.push('candidate');}
    async createAnswer(){return {type:'answer',sdp:'answer'};}
    async setLocalDescription(value){this.localDescription=value;}
    close(){}
  };
  const video=Object.assign(new EventTarget(),{dataset:{},srcObject:null,async play(){},pause(){},load(){},removeAttribute(){}});
  const api=async(action,data)=>{calls.push({action,data});return action==='rtc'?{iceServers:[]}:{ok:true};};
  const player=createPeerVideo({video,api,getSelfId:()=> 'guest',onDisplay(v,screen){displayed={v,screen};},onStatus(){},onResume(){}});
  try{
    player.update({kind:'peer',hostId:'host',streamId:'stream',screen:'screen-3'},[{id:'guest'},{id:'host'}]);
    player.signal({from:'host',streamId:'stream',type:'candidate',data:{candidate:'test'}});
    player.signal({from:'host',streamId:'stream',type:'offer',data:{type:'offer',sdp:'offer'}});
    await new Promise(r=>setTimeout(r,0));
    assert.deepEqual(order,['remote','candidate']);
    assert.ok(calls.some(c=>c.action==='signal'&&c.data.type==='answer'));
    const stream={};connection.ontrack({streams:[stream]});
    assert.equal(video.srcObject,stream);assert.equal(video.dataset.peerRole,'guest');
    assert.equal(displayed.screen,'screen-3');assert.equal(video.controls,false);
    player.update(null,[]);assert.equal(player.active,false);assert.equal(video.srcObject,null);
  }finally{player.close();globalThis.RTCPeerConnection=original;}
});
