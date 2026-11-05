import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authErrorMessage} from '../frontend/js/auth-errors.mjs';
test('cadastro distingue configuração de SMTP, limites e senha sem expor dados internos',()=>{
  assert.match(authErrorMessage({code:'email_address_not_authorized'},true),/SMTP/);
  assert.match(authErrorMessage({code:'signup_disabled'},true),/desativado/);
  assert.match(authErrorMessage({code:'over_email_send_rate_limit'},true),/limite/);
  assert.match(authErrorMessage({code:'weak_password'},true),/senha/);
  assert.doesNotMatch(authErrorMessage({message:'private-token-123'},true),/private-token/);
});
