## Insígnias animadas

Os onze SVGs e os brasões acima dos jogadores têm efeitos graduais por título.
Configuração, integração e limites de validação: [docs/nobility-animation.md](docs/nobility-animation.md).

## Atualização: XP diário

O sistema de XP diário foi implementado em uma migração PostgreSQL. Consulte DAILY-REWARDS.md para ativar. Após a migração, a tabela player_progression substitui os metadados administrativos como fonte de progressão. O texto abaixo registra a arquitetura anterior.

# Nobreza e integração de progressão

Configuração única: `frontend/js/nobility.mjs`, importada no frontend e backend.
Onze brasões vetoriais autorais em `frontend/assets/nobility/`; regenerar com
`node scripts/generate-nobility.mjs`. O SVG fornecido foi referência visual, não código executado.

## Limitação encontrada neste branch

Não existe motor de XP, tabela de níveis, ranking global nem regras de premiação.
Antes da alteração, o nível era fixo em 1 e o perfil dizia que a progressão seria
implementada. Não foi inventada uma fórmula, criada uma concessão de XP por cliente
ou substituída a persistência de um sistema externo não fornecido.

O adaptador `backend/progression.mjs` lê `app_metadata.progression` da conta
verificada pelo servidor de autenticação:

```json
{"progression":{"level":75,"xp":12000}}
```

Esse objeto deve ser gravado pelo sistema de XP confiável/administrativo já existente,
quando sua localização e regras forem disponibilizadas. **Não** usar `user_metadata`,
localStorage ou valores enviados pelo navegador para autorizar níveis. Este código
não expõe endpoints para conceder XP nem chaves administrativas.

Sem dados válidos, a exibição começa em Camponês, nível 1, 0 XP. Dados administrativos
continuam persistidos no provedor da conta; o servidor de salas apenas mantém uma
cópia de leitura durante a sessão. Não há migração de banco nesta etapa.

## Exibição e sincronização

- Perfil e interface de XP consultam `/api/progression` autenticado.
- A entrada na sala associa o membro à identidade verificada e lê a mesma fonte.
- `/api/rooms/:id/prestige` atualiza a cópia a cada 60 segundos enquanto a página
  está ativa; requer token da sala e a mesma conta. SSE sincroniza o resultado.
- Título e nível acima do nome do jogador e dos convidados, sem mudar movimento,
  personagens, colisão ou cenário.
- Faixa de online com brasão/título e ranking recolhível **dos presentes na sala**.
  Ranking global depende da fonte persistente de XP; não é simulado com localStorage.
- Promoção apenas ao subir de faixa durante a sessão. Entrada/reconexão não dispara
  comemoração retroativa. Movimento reduzido desativa animação.

## Para concluir a progressão solicitada

É necessário identificar a tabela/serviço original de XP e as regras de ganho.
Então substituir o adaptador de leitura por essa fonte, implementar consulta global
do ranking e integrar promoção ao evento real de XP, mantendo autorização e atomicidade
no servidor. Sem isso, títulos e apresentação estão implementados, mas o ganho de XP
e o ranking global continuam pendentes.

Validação: limites das 11 faixas, entradas inválidas, brasões distintos, promoções,
metadados não confiáveis ignorados e API autenticada contra forjamento de nível e
troca de conta na sessão. Conferência visual em navegador/celular ainda necessária.
