import {createAccountAuth} from './account-auth.mjs';
import http from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {createWorld} from './room-world.mjs';
import {handleApi} from '../api/rooms.mjs';

// Variaveis do ambiente da hospedagem tem prioridade sobre o arquivo local.
try { process.loadEnvFile(fileURLToPath(new URL('../.env',import.meta.url))); }
catch(error) { if(error.code!=='ENOENT')throw error; }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.glb':'model/gltf-binary','.woff2':'font/woff2'};
function reply(res, code, data) { res.writeHead(code, {'Content-Type':'application/json','Cache-Control':'no-store'}); res.end(JSON.stringify(data)); }
export function createServer({privateRooms=false,createRoomWorld=createWorld,serverRoomPassword=process.env.SERVER_ROOM_PASSWORD||'',allowedOrigins=(process.env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean),accountAuth=createAccountAuth({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_PUBLISHABLE_KEY}),serveFrontend=process.env.SERVE_FRONTEND!=='false'}={}) {
  return http.createServer(async (req,res)=>{
    try {
      const url=new URL(req.url,'http://localhost');
      const origin=req.headers.origin;
      if(origin && origin!==`http://${req.headers.host}` && origin!==`https://${req.headers.host}` && !allowedOrigins.includes(origin)) return reply(res,403,{error:'Origem não permitida.'});
      if(origin){
        res.setHeader('Access-Control-Allow-Origin',origin);
        res.setHeader('Vary','Origin');
        res.setHeader('Access-Control-Expose-Headers','Content-Range, Accept-Ranges');
      }
      if(req.method==='OPTIONS'){
        res.writeHead(204,{'Access-Control-Allow-Methods':'GET, HEAD, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization, Range, X-Account-Token','Access-Control-Max-Age':'600'});
        return res.end();
      }
      if(url.pathname==='/health' && ['GET','HEAD'].includes(req.method))return reply(res,200,{ok:true});
      if(url.pathname==='/api/auth/config'&&req.method==='GET')return reply(res,200,accountAuth.publicConfig());
      if(accountAuth.configured&&req.method==='POST'&&(url.pathname==='/api/rooms'||url.pathname==='/api/lobby'||/^\/api\/rooms\/[a-f0-9]{36}\/join$/.test(url.pathname)))await accountAuth.verify(req.headers['x-account-token']);
      if(url.pathname.startsWith('/api/'))return await handleApi(req,res,url,{createRoomWorld,serverRoomPassword,privateRooms});
      if(!serveFrontend)return reply(res,404,{error:'Não encontrado.'});
      if(!['GET','HEAD'].includes(req.method))return reply(res,405,{error:'Método não permitido.'});
      const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
      if(relative!=='index.html' && !/^frontend\/(?:ambiente\.json$|(?:js|css|assets)\/)/.test(relative))return reply(res,404,{error:'Não encontrado.'});
      const target=path.resolve(root,relative);if(!target.startsWith(root+path.sep))return reply(res,403,{error:'Acesso negado.'});
      const info=await stat(target);if(!info.isFile())return reply(res,404,{error:'Não encontrado.'});
      res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Content-Length':info.size,'X-Content-Type-Options':'nosniff'});if(req.method==='HEAD')return res.end();createReadStream(target).pipe(res);
    } catch(error) {if(!res.headersSent)reply(res,error.status|| (error instanceof SyntaxError?400:500),{error:error.code==='ENOENT'?'Não encontrado.':error.status?error.message:'Não foi possível concluir a solicitação.'});else res.end();}
  });
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))createServer().listen(Number(process.env.PORT)||3000,process.env.HOST||'0.0.0.0',()=>console.log('Home Lab: http://localhost:'+ (process.env.PORT||3000)));
