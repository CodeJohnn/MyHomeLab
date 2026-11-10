# Limpeza conservadora do jogo — 9 de novembro de 2026

## Restauração e escopo

Antes de alterar o código, foi criado o ponto de restauração
`backup/pre-cleanup-20261109`, commit `4e083503b309c9c8c6df7db2e583a830f62d77b4`.
Ele inclui as alterações locais que já existiam e os arquivos novos de otimização.
Essas melhorias preexistentes também foram registradas separadamente na `main`
em `a624039`, antes desta limpeza. Os ganhos descritos em
`performance-optimization.md` pertencem àquela etapa anterior.

A auditoria final percorreu 134 arquivos JavaScript/JSX/MJS do frontend,
backend, API, scripts, ferramentas e testes; inventariou 43 arquivos de assets;
e verificou 378 referências literais de imports, URLs de assets e HTML.
Onze referências dinâmicas foram registradas e preservadas. Os arquivos de
configuração, publicação, estilos e dados foram conferidos conforme suas
dependências; não foram reescritos indiscriminadamente.

Resultados estruturados: [antes](cleanup-audit-before.json) e
[depois](cleanup-audit.json). A contagem ignora o bundle React gerado.

## Arquivos da refatoração

| Arquivo | Alteração |
| --- | --- |
| `frontend/js/homelab.js` | Remove declarações e funções locais sem uso; delega terminal, luzes e sombras móveis a módulos específicos. Mantém as chamadas que constroem malhas visíveis. |
| `frontend/js/terminal-screen.mjs` | Extrai a pintura do terminal com dimensões, texto, cores e cadência anteriores; compartilha a lista constante de linhas e descarta material/textura. |
| `frontend/js/light-budget.mjs` | Reutiliza vetor e registros de classificação, preservando frequência, limites e desempates das luzes. |
| `frontend/js/mobile-contact-shadows.mjs` | Reutiliza vetores/caixa e compara transformações sem montar arrays e strings; preserva desenho e intervalo; descarta recursos próprios. |
| `frontend/js/avatar-portraits.mjs` | Cancela frames pendentes, resolve promessas e evita novas capturas após descarte; mantém cache, inversão de pixels e restauração do renderer. |
| `frontend/js/character-hover.mjs` | Remove estado sem leitura e cancela o tooltip pendente ao esconder/sair do canvas. |
| `frontend/js/daylight.mjs` | Reutiliza o formatador do horário de São Paulo. |
| `frontend/js/nobility-ui.mjs` | Remove apenas o import sem uso de `nobleCrestSvg`. O gerador e os brasões continuam disponíveis. |
| `frontend/js/peer-video.mjs` | Remove o listener `ended` ao fechar o controlador WebRTC. |
| `frontend/js/player-avatar.mjs` | Remove material sem uso e o nome de uma variável de boca; a malha da boca continua sendo criada. |
| `frontend/js/room-audio.mjs` | Remove sintetizador sem chamadas, canal silencioso e estado obsoleto; reúne dois handlers de cada gesto. Rádio, ambientes, ventoinha e efeitos de interação permanecem. |
| `scripts/lib/png.mjs` | Unifica encoder PNG, montagem de chunks e CRC usados pelas duas prévias. |
| `scripts/preview-accessories.mjs`, `scripts/preview-hair.mjs` | Usam o encoder compartilhado; saída comparada byte a byte. |
| `scripts/audit-code.mjs` | Verificação reproduzível de código sem uso, referências e corpos repetidos; não exclui nada automaticamente. |
| `scripts/prepare-frontend.mjs` | Compila JSX antes da execução local; `SERVE_FRONTEND=false` não carrega ferramentas de frontend no serviço de API do Render. |
| `tests/cleanup-regressions.test.mjs`, `tests/peer-video.test.mjs` | Dez regressões adicionais de comportamento, desenho, seleção de luzes e ciclo de vida. |
| `package.json`, `package-lock.json` | Comando `audit:code`, ferramenta de desenvolvimento e dependência de glob corrigida por overrides restritos ao analisador. |
| `.github/workflows/pages.yml` | Executa auditoria e testes antes de compilar/publicar. |
| `README.md`, arquivos `docs/cleanup-*` e este relatório | Corrige instruções de inicialização e registra evidências/limites. |

## Duplicações e código removido

- Unificados `chunk`, `crc32` e a montagem PNG dos dois scripts de prévia.
- Eliminados `ethernetCable` e seus materiais privados sem qualquer chamada.
  O sistema ativo de cabos configuráveis foi preservado.
- Eliminado `setMatrix`, que não era ligado a eventos. O botão ativo de
  restauração continua usando `playableScreens`, inclusive outras telas.
- Eliminados `note`, `keyClick`, `rockBeat`, `rockTone`, `rockDrum` e `rockStep`:
  esse conjunto não tinha entrada executável. A rádio e o motor de efeitos
  de teclado/mouse/passos/interações continuam em seus caminhos ativos.
- Eliminado o canvas Matrix interno de 1024 × 576, sua textura/material e o
  loop de 65 colunas: nenhum monitor utilizava esse material. Isso não afeta
  o canvas dos binários da página inicial, em `landing-matrix.mjs`.
- Removidos materiais sem uso (`wood`, `blue`, `glass`, `grout`, `metal` local
  do avatar e materiais antigos de sites), estado antigo de conversas, caixa
  de colisão sem leitura, import e variáveis locais sem uso. Criações de
  ventoinha, bomba, componente de montagem e boca foram mantidas como chamadas.
- Removido o bloco comentado do terminal anterior e comentários referentes
  ao sintetizador desativado.

Nenhum arquivo de funcionalidade ou asset foi excluído. O grupo repetido
restante identificado pelo comparador de tokens pertence a callbacks de
testes independentes de servidor/desconexão; foi preservado. APIs exportadas,
parâmetros públicos, fixtures históricas, migração SQL e upload antigo foram
mantidos porque referências literais, isoladamente, não provam desuso.

## Desempenho e memória

- Deixa de pintar 65 caracteres por atualização de uma textura não exibida,
  até 20 atualizações/s no desktop e 10 no celular segundo os intervalos já
  existentes. Deixa também de criar aquele canvas e materiais sem uso.
- Sombras de contato não criam vetores/caixas por atualização nem strings
  de assinatura por objeto. Mantêm a verificação a cada 200 ms.
- Classificação de luzes reutiliza vetor e registros; mantém atualização a
  cada 250 ms e os mesmos limites por plataforma. Não aumenta/reduz qualidade.
- Elimina um canal de áudio sem fontes e o agendamento do seu ganho a cada
  atualização. Gestos de áudio passam de dois listeners por tipo para um.
- Capturas pendentes deixam de reter seus jobs após descarte; listener de
  vídeo e recursos próprios dos módulos extraídos têm encerramento explícito.

São reduções de trabalho/alocação verificadas estruturalmente e em testes;
não representam medição de FPS ou VRAM. Nenhum corte de texturas, segmentos,
sombras, personagens, animações ou pixel ratio foi utilizado nesta limpeza.

## Validação

| Verificação | Resultado |
| --- | --- |
| Baseline antes da limpeza | 113 testes aprovados. |
| Testes entre etapas | Suíte original aprovada após as duas etapas de remoção; regressões novas aprovadas após modularização. |
| Instalação limpa (`npm ci`) | Concluída usando o lockfile e os overrides. |
| Suíte final (`npm test`) | 123 testes aprovados, zero falhas. |
| `npm run audit:code` | 40 achados estáticos iniciais → zero; zero referências literais ausentes. |
| `npm run build` | Bundle React compilado com sucesso. |
| `npm audit` | Zero vulnerabilidades conhecidas na consulta realizada. |
| Comparação do terminal com `a624039` | Mesmas chamadas de desenho, incluindo cores, texto, posições, fontes e cursor, nos mesmos instantes em desktop/mobile. |
| Prévia de acessórios antes/depois | PNG idêntico; SHA-256 `d6be96d88da9aee55c6fe9a124f0a0a56bb1b0db7ff10ed5af669d98cf61da6c`. |
| Prévia de cabelos antes/depois | PNG idêntico; SHA-256 `dfdce70ae121b52bca124316b400568e179ce4060069e2655e877a56b0897d15`. |
| HTTP local | Página, bundle e três módulos novos responderam 200; `/health` respondeu 200. |
| Modo API-only | Preparação não compila React; `/health` 200 e `/` 404, conforme configuração do Render. |

## Limites e pendências

Não havia navegador conectado. Não foram conferidos visualmente o jogo completo,
encaixes de roupas/cabelos, todas as animações, dispositivos móveis reais ou
sessões prolongadas de WebGL/WebRTC com usuários. Os testes não permitem
garantir ausência absoluta de regressões, vazamentos ou igualdade visual de
todas as combinações possíveis. Não foi feita medição de FPS/GPU do jogo completo.

O auditor detecta usos lexicais e repetições por tokens, não equivalência
semântica geral, código ativado externamente ou todo asset construído em runtime.
As onze referências dinâmicas exigem conhecimento dos catálogos e testes;
não são autorização para excluir arquivos.

`homelab.js` continua grande. A construção do cenário e handlers de entrada
com dependências compartilhadas foram mantidos nesta passagem para evitar
alterar o comportamento sem validação visual. Handlers com a mesma categoria
de evento, mas finalidades distintas, também foram preservados.

O Render está configurado com deploy automático desativado; o envio ao GitHub
não confirma uma atualização do serviço de backend. O workflow Pages foi
configurado, mas sua conclusão deve ser consultada no GitHub Actions.
