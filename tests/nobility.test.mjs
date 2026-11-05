import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {nobleTitles,nobleTitle,nobleLabel,noblePromotion,nobleCrestSvg} from '../frontend/js/nobility.mjs';
import {accountProgression} from '../backend/progression.mjs';
import {createServer} from '../backend/server.mjs';

test('onze títulos respeitam todos os limites e não promovem em reconexão',()=>{
  assert.equal(nobleTitles.length,11);
  for(const [i,title] of nobleTitles.entries()){
    assert.equal(nobleTitle(title.minLevel).id,title.id);
    if(title.maxLevel)assert.equal(nobleTitle(title.maxLevel).id,title.id);
    if(i)assert.equal(nobleTitle(title.minLevel-1).id,nobleTitles[i-1].id);
  }
  assert.equal(nobleLabel(75),'Duque • Nível 75');
  assert.equal(nobleTitle(1000).id,'imperador');
  for(const invalid of [0,-1,NaN,Infinity,1.5,'90',null])assert.equal(nobleTitle(invalid).id,'campones');
  assert.equal(noblePromotion(9,10),true);assert.equal(noblePromotion(1,75),true);
  assert.equal(noblePromotion(75,76),false);assert.equal(noblePromotion(75,75),false);assert.equal(noblePromotion(90,10),false);
});
test('brasões publicados são distintos, vetoriais e correspondem à configuração',async()=>{
  const svgs=[];
  for(const title of nobleTitles){
    const expected=nobleCrestSvg(title.minLevel),svg=await readFile(new URL(`../frontend/assets/nobility/${title.id}.svg`,import.meta.url),'utf8');
    assert.equal(svg,expected);assert.match(svg,/<svg/);assert.doesNotMatch(svg,/<script|<text|https?:\/\/(?!www.w3.org)/);svgs.push(svg);
  }
  assert.equal(new Set(svgs).size,11);
});
test('progressão só usa metadados administrativos da conta',()=>{
  assert.equal(accountProgression({user_metadata:{progression:{level:100,xp:9999}}}).level,1);
  assert.equal(accountProgression({app_metadata:{progression:{level:75,xp:12000}}}).title,'duque');
  assert.equal(accountProgression({app_metadata:{progression:{level:'75',xp:-1}}}).xp,0);
});
test('API sincroniza prestígio da conta e ignora nível enviado pelo navegador',async()=>{
  let level=10;
  const accountAuth={configured:true,publicConfig:()=>({url:'',key:''}),verify:async token=>{
    if(token!=='valid'&&token!=='other')throw Object.assign(new Error('Não autenticado'),{status:401});
    return {id:token,app_metadata:{progression:{level,xp:900}}};
  }};
  const server=createServer({accountAuth});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const post=async(path,data={},token=null,account='valid')=>{
    const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json','X-Account-Token':account,...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});
    return {status:response.status,data:await response.json()};
  };
  try{
    const lobby=await post('/api/lobby'),route='/api/rooms/'+lobby.data.room;
    const joined=await post(route+'/join',{name:'CodeJOHN',level:100,xp:999999});
    assert.equal(joined.status,200);assert.equal(joined.data.members[0].progression.level,10);
    const token=joined.data.token;
    assert.equal((await post(route+'/prestige',{},token,'other')).status,403);
    assert.equal((await post(route+'/join',{token},null,'other')).status,403);
    level=20;const refreshed=await post(route+'/prestige',{level:100},token);
    assert.equal(refreshed.data.title,'cavaleiro');assert.equal(refreshed.data.level,20);
    const invalid=await post(route+'/prestige',{},token,'invalid');assert.equal(invalid.status,401);
    await post(route+'/leave',{},token);
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
