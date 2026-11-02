import {defaultAvatar,validateAvatar} from '../backend/avatar.mjs';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import {createWorld,tickWorld,actOnWorld,leaveBilliards} from '../backend/room-world.mjs';

const rooms = new Map();
let lobbyKey=null;
const id = () => randomBytes(18).toString('hex');
const limit = 100 * 1024 * 1024;
function reply(res, code, data) { res.writeHead(code, {'Content-Type':'application/json','Cache-Control':'no-store'}); res.end(JSON.stringify(data)); }
async function body(req, max = 4096) {
  const chunks=[]; let size=0;
  for await (const chunk of req) { size+=chunk.length; if(size>max) throw Object.assign(new Error('Arquivo ou mensagem grande demais.'),{status:413}); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
function snapshot(room) { room.world||=createWorld();return {world:room.world,members:[...room.members.values()].map(m=>({id:m.id,name:m.name,pose:m.pose,avatar:m.avatar||defaultAvatar})),messages:room.messages||[],media:room.media,serverTime:Date.now()}; }
function broadcast(room) { const event=`data: ${JSON.stringify(snapshot(room))}\n\n`; for(const m of room.members.values()) m.stream?.write(event); }
function removeMember(room,token){
  const member=room.members.get(token);if(!member)return;
  if(room.world?.billiards&&leaveBilliards(room.world.billiards,member.id))room.world.revision++;
  room.members.delete(token);member.stream?.end();
  if(room.media?.kind==='peer'&&room.media.hostId===member.id)room.media=null;
  room.messages||=[];room.messages.push({id:id(),kind:'system',event:'leave',name:member.name,text:`${member.name} saiu da sala.`,time:Date.now()});room.messages=room.messages.slice(-40);
  broadcast(room);
}
export async function handleApi(req,res,url,{createRoomWorld=createWorld,serverRoomPassword=''}={}) {
      if(req.method==='POST' && url.pathname==='/api/lobby') {
        if(!lobbyKey||!rooms.has(lobbyKey)){lobbyKey=id();rooms.set(lobbyKey,{members:new Map(),media:null,files:new Map(),messages:[],touched:Date.now(),capacity:12});}
        return reply(res,200,{room:lobbyKey});
      }
      if(req.method==='POST' && url.pathname==='/api/rooms') {
        if(rooms.size>=100) return reply(res,503,{error:'Servidor cheio.'});
        const key=id(); rooms.set(key,{members:new Map(),media:null,files:new Map(),touched:Date.now(),world:createRoomWorld()}); return reply(res,201,{room:key});
      }
      const match=url.pathname.match(/^\/api\/rooms\/([a-f0-9]{36})(?:\/(join|events|state|upload|leave|media|share|signal|rtc))?$/);
      if(match) {
        const [,key,action]=match, room=rooms.get(key);
        if(!room) return reply(res,404,{error:'Sala não encontrada. Crie uma nova sala.'});
        room.touched=Date.now();
        if(action==='join' && req.method==='POST') {
          const input=JSON.parse((await body(req)).toString());
          const avatar=input.avatar===undefined?{...defaultAvatar}:validateAvatar(input.avatar);
          if(!avatar)return reply(res,400,{error:'Avatar invalido.'});
          if(input.token && room.members.has(input.token)) {const existing=room.members.get(input.token);existing.seen=Date.now();existing.avatar=input.avatar===undefined?(existing.avatar||{...defaultAvatar}):avatar;broadcast(room);return reply(res,200,{token:input.token,id:existing.id,pose:existing.pose,...snapshot(room)});}
          if(room.members.size>=(room.capacity||2)) return reply(res,409,{error:'Esta sala está cheia.'});
          const slot=Array.from({length:12},(_,i)=>i).find(i=>![...room.members.values()].some(m=>m.slot===i));
          const pose={x:-1.2+(slot%4)*.8,y:0,z:2.45-Math.floor(slot/4)*.8,r:0,joints:[]};
          const token=id(),publicId=id(); room.members.set(token,{id:publicId,slot,avatar,name:String(input.name||'Visitante').slice(0,30),seen:Date.now(),stream:null,pose}); broadcast(room); return reply(res,200,{token,id:publicId,pose,...snapshot(room)});
        }
        const token=req.headers.authorization?.replace(/^Bearer /,'') || url.searchParams.get('token');
        const member=room.members.get(token);
        if(!member) return reply(res,401,{error:'Entre na sala novamente.'});
        member.seen=Date.now();
        if(action==='rtc'&&req.method==='POST'){
          let iceServers=[{urls:'stun:stun.l.google.com:19302'}];
          if(process.env.WEBRTC_ICE_SERVERS){
            try{iceServers=JSON.parse(process.env.WEBRTC_ICE_SERVERS);if(!Array.isArray(iceServers))throw Error();}
            catch{return reply(res,503,{error:'Configuracao WEBRTC_ICE_SERVERS invalida.'});}
          }
          return reply(res,200,{iceServers});
        }
        if(action==='share'&&req.method==='POST'){
          const input=JSON.parse((await body(req)).toString());
          if(input.stop){
            if(room.media?.kind!=='peer'||room.media.hostId!==member.id)return reply(res,403,{error:'Somente quem transmite pode encerrar.'});
            room.media=null;broadcast(room);return reply(res,200,{ok:true});
          }
          if(room.media?.kind==='peer'&&room.media.hostId!==member.id)return reply(res,409,{error:'Outra pessoa esta transmitindo. Aguarde ela encerrar.'});
          if(!/^screen-\d{1,3}$/.test(input.screen||''))return reply(res,400,{error:'Tela invalida.'});
          room.files.clear();
          room.media={kind:'peer',hostId:member.id,streamId:id(),screen:input.screen,paused:false,time:0,updatedAt:Date.now()};
          broadcast(room);return reply(res,200,{media:room.media});
        }
        if(action==='signal'&&req.method==='POST'){
          const input=JSON.parse((await body(req,65536)).toString());
          const media=room.media;
          if(media?.kind!=='peer'||input.streamId!==media.streamId)return reply(res,409,{error:'Transmissao encerrada ou substituida.'});
          const target=[...room.members.values()].find(m=>m.id===input.to);
          if(!target||target===member)return reply(res,404,{error:'Participante indisponivel.'});
          if(member.id!==media.hostId&&target.id!==media.hostId)return reply(res,403,{error:'Destino de sinalizacao invalido.'});
          if(!['ready','offer','answer','candidate'].includes(input.type))return reply(res,400,{error:'Sinal invalido.'});
          if((input.type==='offer'&&member.id!==media.hostId)||(['ready','answer'].includes(input.type)&&target.id!==media.hostId))return reply(res,403,{error:'Sinal nao permitido.'});
          if(!target.stream)return reply(res,409,{error:'Participante reconectando.'});
          member.signalWindow||={time:Date.now(),count:0};
          if(Date.now()-member.signalWindow.time>10000)member.signalWindow={time:Date.now(),count:0};
          if(++member.signalWindow.count>240)return reply(res,429,{error:'Muitos sinais. Aguarde.'});
          target.stream.write(`event: peer-signal\ndata: ${JSON.stringify({from:member.id,streamId:media.streamId,type:input.type,data:input.data})}\n\n`);
          return reply(res,200,{ok:true});
        }
        if(action==='events' && req.method==='GET') {
          member.stream?.end(); res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','X-Accel-Buffering':'no'}); member.stream=res; broadcast(room);
          const timer=setInterval(()=>{member.seen=Date.now();res.write(': heartbeat\n\n');},15000);
          res.on('close',()=>{clearInterval(timer);if(member.stream===res)member.stream=null;}); return;
        }
        if(action==='leave' && req.method==='POST') {removeMember(room,token);return reply(res,200,{ok:true});}
        if(action==='upload' && req.method==='POST') {
          if(room.media?.kind==='peer')return reply(res,409,{error:'Encerre a transmissao direta antes de enviar outro video.'});
          const screen=url.searchParams.get('screen')||'screen-0';
          if(!/^screen-\d{1,3}$/.test(screen))return reply(res,400,{error:'Tela inválida.'});
          if(room.uploading) return reply(res,409,{error:'Aguarde o envio atual.'});
          const mime=(req.headers['content-type']||'').split(';')[0];
          if(!['video/mp4','video/webm','video/ogg'].includes(mime)) return reply(res,400,{error:'Use MP4, WebM ou Ogg.'});
          const reserved=[...rooms.values()].reduce((sum,r)=>sum+(r.uploading?limit:0)+[...r.files.values()].reduce((n,f)=>n+f.data.length,0),0);
          if(reserved+limit>300*1024*1024)return reply(res,503,{error:'Armazenamento temporário cheio. Tente mais tarde.'});
          room.uploading=true;
          try { const data=await body(req,limit); if(!data.length)return reply(res,400,{error:'Arquivo vazio.'}); const mediaId=id();room.files.clear();room.files.set(mediaId,{data,mime});room.media={url:`/api/rooms/${key}/media?id=${mediaId}`,screen,paused:true,time:0,updatedAt:Date.now()};broadcast(room);return reply(res,200,{ok:true,media:room.media}); }
          finally {room.uploading=false;}
        }
        if(action==='media' && req.method==='GET') {
          const file=room.files.get(url.searchParams.get('id')); if(!file)return reply(res,404,{error:'Vídeo indisponível.'});
          let start=0,end=file.data.length-1,code=200;
          if(req.headers.range) { const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!range)return res.writeHead(416,{'Content-Range':`bytes */${file.data.length}`}).end();start=Number(range[1]);end=range[2]?Number(range[2]):end; if(start>end||end>=file.data.length)return res.writeHead(416,{'Content-Range':`bytes */${file.data.length}`}).end();code=206; }
          const headers={'Content-Type':file.mime,'Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-store'};if(code===206)headers['Content-Range']=`bytes ${start}-${end}/${file.data.length}`;res.writeHead(code,headers);return res.end(file.data.subarray(start,end+1));
        }
        if(action==='state' && req.method==='POST') {
          const input=JSON.parse((await body(req)).toString());
          if(input.worldAction?.type==='door'&&input.worldAction.id==='restricted'&&input.worldAction.open===true){
            if(!serverRoomPassword)return reply(res,503,{error:'Configure SERVER_ROOM_PASSWORD no Render para abrir esta porta.'});
            if(member.doorAttempt&&Date.now()-member.doorAttempt<1000)return reply(res,429,{error:'Aguarde um instante antes de tentar novamente.'});
            member.doorAttempt=Date.now();
            const supplied=typeof input.worldAction.password==='string'?input.worldAction.password:'';
            if(!timingSafeEqual(createHash('sha256').update(supplied).digest(),createHash('sha256').update(serverRoomPassword).digest()))return reply(res,403,{error:'Senha incorreta.'});
          }
          if(input.worldAction){room.world||=createWorld();if(!actOnWorld(room.world,input.worldAction,Date.now(),Math.random,{id:member.id,name:member.name}))return reply(res,409,{error:'Ação inválida ou estado da sala já alterado.'});}
          if(input.avatar!==undefined){const avatar=validateAvatar(input.avatar);if(!avatar)return reply(res,400,{error:'Avatar invalido.'});member.avatar=avatar;}
          if(input.name!==undefined){
            if(typeof input.name!=='string'||!input.name.trim()||input.name.trim().length>30)return reply(res,400,{error:'Use um nome de 1 a 30 caracteres.'});
            member.name=input.name.trim();
          }
          if(input.pose) {const p=input.pose;if(![p.x,p.y,p.z,p.r].every(n=>Number.isFinite(n)&&Math.abs(n)<1000))return reply(res,400,{error:'Posição inválida.'});
            if(p.joints!==undefined&&(!Array.isArray(p.joints)||p.joints.length>8||!p.joints.every(j=>Array.isArray(j)&&j.length===3&&j.every(n=>Number.isFinite(n)&&Math.abs(n)<=7))))return reply(res,400,{error:'Pose inválida.'});
            member.pose={x:p.x,y:p.y,z:p.z,r:p.r,joints:p.joints||[]};}
          if(input.message!==undefined){
            if(typeof input.message!=='string'||!input.message.trim()||input.message.length>280)return reply(res,400,{error:'Mensagem inválida (máximo 280 caracteres).'});
            if(Date.now()-(member.lastMessage||0)<700)return reply(res,429,{error:'Aguarde um instante para enviar outra mensagem.'});
            member.lastMessage=Date.now();room.messages||=[];room.messages.push({id:id(),sender:member.id,name:member.name,text:input.message.trim(),time:Date.now()});room.messages=room.messages.slice(-40);
          }
          if(input.playback && room.media) {const p=input.playback;if(room.media.kind==='peer'&&member.id!==room.media.hostId)return reply(res,403,{error:'A reproducao e controlada por quem transmite.'});if(typeof p.paused!=='boolean'||!Number.isFinite(p.time)||p.time<0||p.time>604800)return reply(res,400,{error:'Reprodução inválida.'});room.media={...room.media,paused:p.paused,time:p.time,updatedAt:Date.now()};}
          broadcast(room);return reply(res,200,{ok:true});
        }
        return reply(res,405,{error:'Operação não permitida.'});
      }
      if(url.pathname.startsWith('/api/'))return reply(res,404,{error:'Rota não encontrada.'});
}
const cleanup=setInterval(()=>{for(const [key,room] of rooms){for(const [token,m]of room.members)if(!m.stream&&Date.now()-m.seen>45000)removeMember(room,token);if(!room.members.size&&Date.now()-room.touched>600000)rooms.delete(key);}},15000);cleanup.unref();
const worldClock=setInterval(()=>{for(const room of rooms.values()){if(!room.members.size)continue;room.world||=createWorld();if(tickWorld(room.world))broadcast(room);}},50);worldClock.unref();
