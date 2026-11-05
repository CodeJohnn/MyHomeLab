# XP diário — ativação e testes

## Ativar no Supabase existente

1. No SQL Editor do projeto de autenticação, executar integralmente
   `supabase/migrations/202611050001_daily_xp.sql` uma vez. A migração usa uma transação.
   Ela cria tabelas novas; não altera usuários, senhas ou regras de outros sistemas.
2. Configurar `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` no backend Render e redeployar.
   Usar a chave pública publishable/anon, **nunca** a service_role no frontend.
   Os mesmos campos estão documentados em `.env.example` e no blueprint `render.yaml`.
3. Publicar o frontend atualizado e autenticar uma conta real. O visitante anônimo
   não recebe XP. Esta sessão de desenvolvimento não tem credenciais/conexão de
   banco: a migração **não foi aplicada em produção**.

## Regras e persistência

- Tabela `player_progression`: user_id, total_xp, current_level, login_streak,
  last_daily_reward_date, total_daily_rewards_claimed.
- Tabela `xp_reward_history`: UUID, usuário, data brasileira, tipo, XP e timestamp.
- Quantidades: 50, 75, 100, 125, 150, 200, 350 XP. login_streak conta dias
  consecutivos; o dia da recompensa usa módulo 7 (dia 8 da sequência = dia 1 do ciclo).
- Último acesso hoje não concede nada; ontem avança; intervalo maior reinicia.
- A data vem do relógio do PostgreSQL, após obter o lock, convertida pelo fuso IANA
  America/Sao_Paulo. Não depende do timezone do Node, data do cliente ou 24 horas fixas.
- Resgate público não recebe parâmetros. auth.uid() identifica o usuário.
- `SELECT ... FOR UPDATE` serializa os resgates por conta. A restrição UNIQUE em
  (user_id, reward_type, reward_date) e a mesma transação protegem recibo e totais.
- Tabelas só permitem leitura da própria conta via RLS. Clientes não podem escrever.
  Os helpers de concessão/data de teste estão em schema privado sem permissão cliente.
- Os níveis usam **100 XP por nível**, pois nenhuma fórmula anterior existia no branch.
  Função única `homelab_private.level_for_xp`. Títulos continuam centralizados em
  `frontend/js/nobility.mjs`, sem escolha manual. Níveis administrativos anteriores
  maiores são preservados na importação e não rebaixados.
- Na primeira leitura/resgate, importa XP/nível administrativos válidos de
  auth.users.raw_app_meta_data.progression. Depois a tabela passa a ser a fonte única;
  alterações futuras nos metadados não sobrescrevem os totais do banco.
- Se um nível legado for maior que o calculado pelos pontos, a barra fica em zero
  até os pontos alcançarem sua faixa; não são criados XP artificiais na migração.

## Integração

`POST /api/daily-reward` verifica a conta no Node e chama claim_daily_login via RPC
usando o JWT do próprio jogador, sem valores de XP/data fornecidos pelo navegador.
O mesmo resgate idempotente também acontece na entrada autenticada da sala. Login,
restauração da sessão na área do usuário e entrada no mundo usam esse fluxo.
Não há dados de recompensa em localStorage. Um painel é mostrado uma vez por
conta/data na memória da aba; a unicidade real é sempre garantida no banco.

GET /api/progression e a sincronização de prestígio da sala leem a tabela por RPC.
O endpoint de prestígio reconsulta a cada 60 s quando a página está ativa. Ao entrar
ou reconectar, o nível já é lido novamente. O ranking continua sendo dos presentes.
Se o serviço de XP estiver indisponível, a entrada social continua liberada; não
se promete recompensa sem recibo. O usuário pode recarregar para tentar novamente.

## Verificar no site

1. Login: conferir +50 XP, dia 1, brasão atual, histórico e barra.
2. Recarregar/abrir duas abas/sair e entrar: total permanece igual; painel informa
   que a recompensa do dia já foi recebida.
3. Login no próximo dia brasileiro: +75 XP, sequência 2.
4. Até o sétimo dia: total do ciclo 1050 XP, nível 11 para conta nova.
5. Oitavo dia consecutivo: +50 XP, total 1100, sequência 8, ciclo 1.
6. Perder um dia: próximo login começa com +50 XP, mantendo todos os totais.
7. Não alterar a data do computador para testar: o relógio utilizado é do banco.
8. No SQL Editor, conferir as duas tabelas e a unicidade dos recibos.

## Testes automatizados

`npm ci` e `node --test` (ou `npm test`). PGlite é apenas dependência de desenvolvimento.
Executa a migração real em PostgreSQL/WASM com fixtures de auth e testa primeiro acesso,
repetição, dia seguinte, intervalo, dias 7/8, chamadas simultâneas, fronteira de meia-noite,
horário de verão histórico de 2018, nível/título, logout/login, RLS e rollback completo.
Os testes HTTP verificam autenticação e tentativas de enviar XP/data/usuário forjados.

Limitação: PGlite usa uma conexão e enfileira queries. As requisições simultâneas são
testadas contra o mesmo banco, mas contenção entre múltiplas conexões PostgreSQL de
produção ainda precisa de teste de integração após aplicar a migração. A interface
também precisa de conferência visual em navegador/celular real.

Referências: https://supabase.com/docs/guides/database/functions e
https://supabase.com/docs/guides/database/postgres/row-level-security.
