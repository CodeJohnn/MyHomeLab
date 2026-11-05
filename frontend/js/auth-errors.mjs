const messages={
  signup_disabled:'O cadastro de novas contas está desativado no Supabase. O administrador precisa habilitar os cadastros.',
  email_provider_disabled:'O login por e-mail está desativado no Supabase.',
  email_address_not_authorized:'O serviço de e-mail do Supabase não está autorizado a enviar confirmação para esse endereço. O administrador precisa configurar o SMTP.',
  over_email_send_rate_limit:'O limite de e-mails de confirmação foi atingido. Aguarde antes de tentar novamente.',
  over_request_rate_limit:'Muitas tentativas em pouco tempo. Aguarde e tente novamente.',
  weak_password:'A senha não atende aos requisitos de segurança do projeto. Use uma senha mais forte.',
  email_address_invalid:'Confira o endereço de e-mail informado.',
  email_exists:'Não foi possível criar a conta. Se você já se cadastrou, use “Já tenho uma conta”.',
  user_already_exists:'Não foi possível criar a conta. Se você já se cadastrou, use “Já tenho uma conta”.',
  email_not_confirmed:'Confirme seu e-mail pelo link recebido antes de entrar.',
  invalid_credentials:'E-mail ou senha inválidos.',
  captcha_failed:'A verificação de segurança falhou. O administrador precisa conferir a configuração do CAPTCHA.',
  unexpected_failure:'O Supabase não conseguiu concluir o cadastro. O administrador precisa conferir os logs de autenticação.'
};
export function authErrorMessage(error,signup=false){
  if(messages[error?.code])return messages[error.code];
  if(error?.status===429)return messages.over_request_rate_limit;
  const code=typeof error?.code==='string'&&/^[a-z_]{1,80}$/.test(error.code)?` Código: ${error.code}.`:'';
  return (signup?'Não foi possível criar sua conta.':'Não foi possível entrar na conta.')+code+' Tente novamente; se persistir, informe esta mensagem ao administrador.';
}
