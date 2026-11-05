import {test} from 'node:test';
import assert from 'node:assert/strict';
import {supabaseProjectUrl} from '../backend/supabase-project.mjs';
import {createAccountAuth} from '../backend/account-auth.mjs';
test('URL REST do painel é normalizada antes de criar o cliente de autenticação',async()=>{
  for(const suffix of ['', '/', '/rest/v1', '/rest/v1/', '/auth/v1/'])assert.equal(supabaseProjectUrl(' https://example.supabase.co'+suffix+' '),'https://example.supabase.co');
  let destination;
  const auth=createAccountAuth({url:'https://example.supabase.co/rest/v1/',key:'public-test',fetchImpl:async url=>{destination=String(url);return {ok:true,json:async()=>({id:'account'})};}});
  assert.equal(auth.publicConfig().url,'https://example.supabase.co');
  await auth.verify('token');assert.equal(destination,'https://example.supabase.co/auth/v1/user');
  assert.equal(supabaseProjectUrl(''),'');
  assert.throws(()=>supabaseProjectUrl('https://example.supabase.co/dashboard'),/SUPABASE_URL/);
});
