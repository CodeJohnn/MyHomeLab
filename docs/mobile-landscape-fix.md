# Correção do HUD mobile

## Causas encontradas antes da alteração

- O dock online permanecia expandido e usava offsets independentes da câmera,
  dos botões de visibilidade e das ações. Em landscape, as larguras fixas
  disputavam o mesmo espaço superior.
- Mesmo recolhido, o chat ocupava uma caixa larga e mantinha posições herdadas
  de outras folhas de estilo.
- Abrir o histórico do chat desabilitava o controle virtual, em vez de reservar
  uma área própria para o painel social.
- Perfil de participante, ranking e seletor de emojis podiam escapar do painel
  compacto por usarem posicionamento relativo a outro elemento.
- O limite do knob do joystick não considerava o tamanho real do próprio knob.

Não foi recebida imagem anexada nesta solicitação. A análise partiu do código
existente e das dimensões de viewport informadas.

## Implementação

`mobile-hud.mjs` calcula áreas reservadas para barra superior, joystick, ações,
painel social, notificações e status. Os mesmos retângulos alimentam variáveis
CSS e os testes de geometria, incluindo safe areas e `VisualViewport`.

A câmera, os dois botões sociais e o botão de edição existentes são movidos
para uma barra Flex de 44 px. Não são clonados; IDs, handlers e referências
continuam sendo os mesmos. No desktop, voltam aos pais originais e recuperam
as preferências de visibilidade anteriores.

Em mobile, Chat e Online começam recolhidos, mostrando apenas seus pequenos
botões na barra. Abrir um fecha o outro. Em landscape, o painel fica à direita,
abaixo da barra e acima das ações, com histórico/lista roláveis. Apenas a faixa
de avatares recebe rolagem horizontal; ranking, perfil e emojis ficam contidos
no painel. Notificações têm uma faixa separada na parte superior central.

O joystick mede 88 px em landscape e 96 px em retrato. Ações mantêm alvos de
44 px em uma grade compacta no canto inferior direito. O knob fica inteiramente
dentro da base. O chat aberto não bloqueia movimento; foco em um campo de texto
ainda pausa o controle para evitar movimentação acidental durante digitação.

Menu do avatar e editor fecham os painéis sociais ao abrir. Abrir um painel
social fecha o menu do avatar. Editor e modais continuam pausando o controle
virtual quando precisam ocupar a área de interação.

O modo compacto atende viewports até 960 px ou dispositivos com pointer coarse.
Tablets maiores por toque continuam contemplados; desktop amplo mantém o HUD
original. A câmera conserva a atualização de proporção já existente em resize;
FOV, modelos, renderização e gráficos não foram alterados nesta correção.

## Arquivos alterados

| Arquivo | Alteração |
| --- | --- |
| `frontend/js/mobile-hud.mjs` | Geometria central, barra reutilizando os elementos existentes, recolhimento exclusivo dos painéis, atualização por viewport e restauração do desktop. |
| `frontend/css/responsive-game.css` | Layout compacto, áreas reservadas, alvos de toque, conteúdo rolável e contenção de emojis/perfis/ranking. |
| `frontend/js/shared-room.mjs` | Conecta o HUD aos botões existentes; preserva preferências desktop e encerra listeners no pagehide. |
| `frontend/js/homelab.js` | Remove bloqueio por chat aberto e coordena menus/editor com o painel social. |
| `frontend/js/touch-controls.mjs` | Limita o deslocamento do knob pelo tamanho real da base e do knob. |
| `frontend/js/landing.mjs`, `frontend/react/main.jsx`, `index.html` | Atualizam versões de cache dos módulos/bundle/estilos. |
| `tests/mobile-hud.test.mjs` | Geometria sem colisões nas dimensões solicitadas, recolhimento, troca de painel, restauração do desktop e encerramento de listeners. |
| `tests/mobile-input.test.mjs` | Verifica que o knob permanece dentro da base. |
| Este relatório | Registra causas, mudanças, resultados e limites. |

## Validação

- Suíte completa: **136 testes aprovados**.
- Retângulos sem interseção e dentro da viewport em **844×390, 667×375,
  812×375 e 932×430**, com margens laterais de 0, 44 e 59 px e inferior de 21 px.
- Os testes também reservam uma área livre no centro da viewport e verificam
  retrato/tablet em 320×568, 390×844, 768×1024 e 1024×768.
- Testes do controlador confirmam estados recolhidos, alternância exclusiva,
  fechamento ao abrir menu, elementos únicos, atributos acessíveis, preferências
  e posições restauradas no desktop e listeners removidos.
- Auditoria de código sem achados e sem referências literais ausentes.
- Build React concluído e CSS analisado sem avisos de sintaxe para os alvos
  Safari 15.4/Chrome 100.

Não havia navegador conectado. Esses testes validam geometria e comportamento
de estado/DOM simulado, não o layout efetivamente renderizado, screenshots ou
toques em aparelhos reais. Ainda é necessária conferência visual em Safari/Chrome,
inclusive tamanho de fontes do sistema, teclado real, posição projetada do
personagem e conteúdo longo nos painéis. Não houve medição de FPS neste trabalho.
