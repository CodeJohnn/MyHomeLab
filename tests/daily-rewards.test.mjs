import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {createServer} from '../backend/server.mjs';
import {createDailyRewards} from '../backend/daily-rewards.mjs';

test('recompensas diárias executam SQL PostgreSQL com persistência e autorização',async t=>{
  const db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create schema auth;
    create table auth.users(id uuid primary key,raw_app_meta_data jsonb default '{}'::jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid(),auth.jwt() to authenticated;`);
  await db.exec(await readFile(new URL('../supabase/migrations/202611050001_daily_xp.sql',import.meta.url),'utf8'));
  const user=async(meta={})=>{const id=randomUUID();await db.query('insert into auth.users values($1,$2)',[id,meta]);return id;};
  const claim=async(id,now)=>{const result=await db.query('select homelab_private.claim_daily($1,$2) as result',[id,now]);return result.rows[0].result;};
  const receiptCount=async id=>Number((await db.query('select count(*) as n from public.xp_reward_history where user_id=$1',[id])).rows[0].n);
  try{
    await t.test('primeiro login concede 50 XP e registra todos os campos',async()=>{
      const id=await user(),r=await claim(id,'2026-11-05T12:00:00Z');
      assert.equal(r.awardedXp,50);assert.equal(r.progression.totalXp,50);assert.equal(r.progression.currentLevel,1);
      assert.equal(r.progression.loginStreak,1);assert.equal(r.progression.lastDailyRewardDate,'2026-11-05');assert.equal(r.progression.totalDailyRewardsClaimed,1);
      assert.ok(r.rewardId);assert.equal(await receiptCount(id),1);
    });
    await t.test('login repetido, logout e nova sessão no mesmo dia não repetem XP',async()=>{
      const id=await user();await claim(id,'2026-11-05T12:00Z');const r=await claim(id,'2026-11-05T23:00Z');
      assert.equal(r.awardedXp,0);assert.equal(r.progression.totalXp,50);assert.equal(r.progression.totalDailyRewardsClaimed,1);assert.equal(await receiptCount(id),1);
    });
    await t.test('ontem avança e falta de um dia reinicia',async()=>{
      const id=await user();await claim(id,'2026-11-05T12:00Z');const next=await claim(id,'2026-11-06T12:00Z');
      assert.equal(next.awardedXp,75);assert.equal(next.progression.loginStreak,2);
      const missed=await claim(id,'2026-11-08T12:00Z');assert.equal(missed.awardedXp,50);assert.equal(missed.progression.loginStreak,1);assert.equal(missed.progression.totalXp,175);
    });
    await t.test('dia sete concede 350 e dia oito começa outro ciclo sem perder totais',async()=>{
      const id=await user();let r;for(let day=1;day<=7;day++)r=await claim(id,`2026-11-${String(day).padStart(2,'0')}T12:00Z`);
      assert.equal(r.awardedXp,350);assert.equal(r.progression.totalXp,1050);assert.equal(r.progression.currentLevel,11);
      assert.equal(r.progression.rewardDay,7);assert.equal(r.progression.nextRewardDay,1);
      r=await claim(id,'2026-11-08T12:00Z');assert.equal(r.awardedXp,50);assert.equal(r.progression.loginStreak,8);assert.equal(r.progression.rewardDay,1);assert.equal(r.progression.totalXp,1100);
    });
    await t.test('duas solicitações simultâneas têm um único recibo no banco',async()=>{
      const id=await user(),results=await Promise.all([claim(id,'2026-11-05T12:00Z'),claim(id,'2026-11-05T12:00Z')]);
      assert.equal(results.reduce((sum,r)=>sum+r.awardedXp,0),50);assert.equal(await receiptCount(id),1);
    });
    await t.test('data brasileira muda às 03 UTC e respeita horário de verão histórico',async()=>{
      const id=await user();const before=await claim(id,'2026-11-06T02:59:00Z'),after=await claim(id,'2026-11-06T03:00:00Z');
      assert.equal(before.progression.today,'2026-11-05');assert.equal(after.progression.today,'2026-11-06');assert.equal(after.awardedXp,75);
      const historical=await user();await claim(historical,'2018-11-04T02:30Z');const dst=await claim(historical,'2018-11-04T03:30Z');
      assert.equal(dst.progression.today,'2018-11-04');assert.equal(dst.progression.loginStreak,2);
    });
    await t.test('XP sobe de nível e ultrapassa faixa de nobreza',async()=>{
      const id=await user({progression:{xp:875,level:9}}),r=await claim(id,'2026-11-05T12:00Z');
      assert.equal(r.previousLevel,9);assert.equal(r.progression.level,10);assert.equal(r.progression.levelProgress,25);assert.equal(r.progression.totalXp,925);
    });
    await t.test('falha no meio da transação desfaz histórico e recompensa',async()=>{
      const id=await user();await db.query('select homelab_private.ensure_player($1)',[id]);
      await db.exec(`create function public.fail_reward_test() returns trigger language plpgsql as $$begin raise exception 'forced rollback';end$$;
        create trigger fail_reward before update on public.player_progression for each row execute function public.fail_reward_test();`);
      await assert.rejects(()=>claim(id,'2026-11-05T12:00Z'),/forced rollback/);
      await db.exec('drop trigger fail_reward on public.player_progression;drop function public.fail_reward_test();');
      assert.equal(await receiptCount(id),0);const retry=await claim(id,'2026-11-05T12:00Z');assert.equal(retry.awardedXp,50);
    });
    await t.test('RLS isola contas e clientes não podem escrever ou fornecer datas à RPC',async()=>{
      const a=await user(),b=await user();await claim(a,'2026-11-05T12:00Z');await claim(b,'2026-11-05T12:00Z');
      await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);await db.exec('set role authenticated');
      assert.equal((await db.query('select * from public.player_progression')).rows.length,1);
      await assert.rejects(()=>db.exec('update public.player_progression set total_xp=9999'),/permission denied/);
      await assert.rejects(()=>db.query('select homelab_private.claim_daily($1,$2)',[a,'2030-01-01']),/permission denied/);
      await assert.rejects(()=>db.exec("select public.claim_daily_login('2030-01-01')"),/does not exist/);
      await db.exec('reset role');
    });
    await t.test('logout remove identidade; novo login recupera os mesmos totais persistidos',async()=>{
      const id=await user();await claim(id,'2026-11-05T12:00Z');
      await db.query("select set_config('request.jwt.claim.sub','',false)");await db.exec('set role authenticated');
      await assert.rejects(()=>db.exec('select public.claim_daily_login()'),/Authenticated account required/);
      await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
      const snapshot=(await db.query('select public.get_player_progression() as p')).rows[0].p;
      assert.equal(snapshot.totalXp,50);assert.equal(snapshot.loginStreak,1);assert.equal(snapshot.totalDailyRewardsClaimed,1);
      await db.exec('reset role');
    });
    await t.test('API autentica e não repassa campos de data, XP ou usuário do cliente',async()=>{
      const id=await user(),calls=[];
      const dailyRewards={configured:true,call:async(method,token)=>{calls.push([method,token]);return claim(id,'2026-11-05T12:00Z');}};
      const accountAuth={configured:true,publicConfig:()=>({url:'',key:''}),verify:async token=>{if(token!=='valid')throw Object.assign(new Error('Login necessário'),{status:401});return {id};}};
      const server=createServer({accountAuth,dailyRewards});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
      const url='http://127.0.0.1:'+server.address().port+'/api/daily-reward';
      try{
        assert.equal((await fetch(url,{method:'POST'})).status,401);
        const requests=await Promise.all([1,2].map(()=>fetch(url,{method:'POST',headers:{'X-Account-Token':'valid','Content-Type':'application/json'},body:JSON.stringify({xp:99999,date:'2030-01-01',userId:randomUUID()})}).then(r=>r.json())));
        assert.equal(requests.reduce((sum,r)=>sum+r.awardedXp,0),50);assert.deepEqual(calls,[['claim_daily_login','valid'],['claim_daily_login','valid']]);
      }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    });
  }finally{await db.close();}
});
test('adaptador Supabase envia somente token e corpo vazio para RPC',async()=>{
  let captured;
  const store=createDailyRewards({url:'https://example.supabase.co',key:'publishable-test',fetchImpl:async(url,options)=>{captured={url:String(url),...options};return {ok:true,json:async()=>({level:10,xp:925})};}});
  const r=await store.call('get_player_progression','session-token');assert.equal(r.title,'escudeiro');assert.equal(captured.body,'{}');assert.equal(captured.headers.Authorization,'Bearer session-token');
});
