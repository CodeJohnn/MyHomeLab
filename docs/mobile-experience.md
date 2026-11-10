# Experiência mobile

## Alterações

| Arquivo | Responsabilidade |
| --- | --- |
| `frontend/js/touch-controls.mjs` | Joystick analógico com zona morta e captura por pointer; atalhos de interação, cadeira/sofá, danças, emotes e avatar; cancelamento de gesto e proteção contra click sintetizado duplicado. |
| `frontend/js/mobile-viewport.mjs` | Acompanha `VisualViewport`, rotação e foco; informa área visível e teclado por variáveis CSS, com fallback para `innerWidth/innerHeight`. |
| `frontend/js/adaptive-resolution.mjs` | Ajusta gradualmente o pixel ratio móvel após lentidão sustentada; mantém memória constante e não usa timers. |
| `frontend/css/responsive-game.css` | Camada final de layout para toque: HUD, safe areas, chat recolhível, lista online, menu do avatar em grade, roupas/acessórios, perfis, livros, terminal, IDE, recompensas e sinuca. |
| `frontend/js/homelab.js` | Integra controles e resolução ao loop existente; compartilha a ação de E e transformações de direção; trata pinça em terceira pessoa e cancela câmera em interrupções. |
| `frontend/react/main.jsx` | Inicia o observador de viewport desde login/entrada e preserva seu funcionamento ao retornar pelo cache de navegação. |
| `frontend/js/landing.mjs`, `index.html` | Carregam a integração e os estilos novos; substituem o direcional antigo pelo joystick e atualizam versões de cache. |
| `frontend/js/logic-ide.mjs` | Editor de código em 16 px para evitar ampliação automática ao focar no iOS. |
| `tests/mobile-input.test.mjs` | Sete testes novos de matemática de movimento, multitouch, cancelamento, teclado, rotação e resolução adaptativa. |

## Controles

O joystick usa movimento proporcional e limita a velocidade diagonal. No modo
de visão geral, a direção do toque acompanha a câmera; em primeira/terceira pessoa,
usa a mesma transformação dos controles existentes. WASD/setas, Shift, mouse,
roda e atalhos de teclado permanecem disponíveis.

O joystick captura apenas seu próprio pointer: outro dedo pode arrastar a câmera
no canvas ou pressionar uma ação. Arrastar o canvas gira a câmera; dois dedos
mantêm a pinça/pan da visão geral, e a pinça ajusta a distância da terceira pessoa.
Toques simples continuam acionando objetos. O click sintetizado depois de um tap
não executa a ação uma segunda vez; mouse real em aparelhos híbridos continua aceito.

Interagir/parar reaproveita a ação de E. Sentar chama o seletor existente de
cadeiras/sofás próximos. Danças, emotes e avatar abrem os menus existentes,
incluindo as demais ações e personalizações. Mover o joystick permite encerrar
uma pose. Abrir menus/janelas ou expandir o chat pausa o movimento e esconde o
controle virtual. Cancelar pointer, perder foco, girar ou ocultar a página zera
o joystick; os gestos de câmera também são cancelados.

## Layout e teclado

A camada de toque atende telas até 900 px e aparelhos com `pointer:coarse`.
Os estilos originais continuam definindo o HUD desktop. Em mobile, um seletor
com os três modos de câmera ocupa o lugar do botão redundante de alternância.

Em retrato, os participantes ficam no topo, o chat recolhido fica acima dos
controles e as ações ficam ao alcance do polegar direito. Em paisagem baixa,
controles e HUD são reorganizados horizontalmente. O menu orbital vira uma
grade rolável, sem posições absolutas que cortem os submenus.

Painéis têm rolagem interna quando necessária. A página do jogo não rola;
login, página inicial e perfil inicial continuam com rolagem normal.
Campos de texto usam 16 px e os principais alvos de toque têm pelo menos 44 px.
Safe areas respeitam recortes e a barra de navegação do dispositivo.

`VisualViewport` informa altura e deslocamento realmente visíveis. Ao abrir o
teclado no chat, os controles e o dock saem de cena e o painel se adapta à região
disponível. O rastreamento considera tanto redução apenas do viewport visual
quanto redução conjunta do viewport de layout, sem confundir pinch zoom com teclado.

## Desempenho

- Preserva o limite móvel existente de 30 FPS e o limite/resolução inicial
  anteriores; não remove luzes, personagens, roupas, animações ou insígnias.
- Em mobile, espera quatro segundos antes de avaliar médias de 90 frames.
  Acima de 44 ms/frame, reduz o pixel ratio em até 0,15 por ajuste, respeitando
  intervalos de três segundos. A recuperação exige média abaixo de 35 ms e
  intervalo de dez segundos, em passos de 0,10.
- O piso é 0,8 ou o DPR inicial, caso ele seja menor; o teto é o DPR inicial
  configurado pelo jogo. Desktop não recebe ajuste automático de resolução.
- Pausas e frames muito longos reiniciam a amostragem; rotação não restaura
  acidentalmente a resolução máxima móvel. DPR fracionário estável é preservado.
- A renderização principal da cena deixa de ser executada sob o leitor e a
  janela de sinuca; a simulação e os sistemas existentes continuam funcionando.
- Reutiliza buffers de movimento, frustum culling, pools e carregamento sob
  demanda já existentes. Não introduz troca automática de geometria/LOD que
  pudesse alterar personagens ou acessórios sem validação visual.
- O controlador adaptativo é chamado no loop existente: nenhum timer ou loop
  extra por jogador. Os novos listeners possuem encerramento explícito.

## Validação e limites

Validações automatizadas realizadas:

- Suíte completa: **133 testes aprovados**.
- Auditoria de código: zero achados nas regras configuradas e zero referências
  literais ausentes.
- Compilação React concluída; CSS novo analisado pelo esbuild com alvos
  Safari 15.4/Chrome 100, sem avisos de sintaxe.
- Testes de viewport simulam 320×568, 390×844, 768×1024, 1024×768 e 844×390,
  com rotação, teclado do tipo iOS/Android, foco e pinch.
- Testes de pointer verificam toque secundário, ação simultânea, cancelamento,
  perda de foco/visibilidade e remoção dos listeners.
- HTTP local: entrada, bundle React, stylesheet e três módulos novos responderam 200.

Não havia navegador conectado. Esses resultados não são testes de layout
renderizado nem certificação em Android Chrome, iPhone Safari, iPad, Windows
ou Linux. Ainda é necessária a conferência visual nesses aparelhos, inclusive
teclados reais, notch, menus nativos de seleção, pinça e sessões multiplayer.
Não foram medidos FPS, GPU, temperatura, RAM ou bateria em smartphone real;
não há garantia de FPS estável em todo aparelho intermediário.

Para conferência manual, abrir em retrato/paisagem, caminhar e girar a câmera
com dedos diferentes, testar cadeiras/danças/emotes, escrever no chat e fechar
o teclado, editar roupas/acessórios, abrir livros/IDE/sinuca, retornar de outra
aba e testar WASD/mouse no desktop. O painel `?perf=1` permite observar FPS e
pixel ratio durante uma sessão real.
