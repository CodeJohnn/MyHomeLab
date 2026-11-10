# Insígnias animadas

Os onze títulos existentes usam `frontend/js/nobility-effects.mjs` como
configuração central de cor do efeito, pulsação, período, reflexo, aura,
partículas e anéis reais. A identidade e os traçados originais não mudam.
O arquivo inicial é `campones.svg`; não existe Arquiduque neste sistema.

| Título | Efeito |
| --- | --- |
| Camponês | Reflexo discreto e pulsação fria suave. |
| Escudeiro | Pequenos reflexos em tom de cobre claro. |
| Cavaleiro | Reflexo metálico frio e pulsação suave. |
| Barão | Brilho de bronze sobre a identidade original. |
| Visconde | Reflexo metálico discreto. |
| Conde | Pulsação prateada. |
| Marquês | Reflexos dourados suaves. |
| Duque | Dourado, aura e duas partículas. |
| Príncipe | Reflexo real, aura e três partículas. |
| Rei | Aura dourada, quatro partículas e um anel luminoso. |
| Imperador | Aura mais intensa, cinco partículas e dois anéis luminosos. |

## SVGs e interface

`node scripts/generate-nobility.mjs` aplica camadas animadas aos SVGs existentes
a partir do gerador original. Clipping mantém o reflexo dentro do escudo;
gradientes, opacidade e pequenas transformações produzem a aura e partículas.
Não há filtros de blur, scripts internos ou imagens externas.
`nobleCrestSvg(level,{animated:false})` permite verificar a arte original.

As telas de perfil, recompensa, ranking e posto usam os próprios SVGs animados.
`nobleCrestUrl` centraliza os caminhos e a versão de cache.
`frontend/assets/nobility/preview.html` mostra os onze arquivos em conjunto.
As camadas animadas e o movimento CSS respeitam `prefers-reduced-motion`.

## Mundo 3D

Uma imagem SVG desenhada uma vez em canvas não mantém a animação do arquivo
na textura do avatar. Por isso, `nobility-sprite-effects.mjs` acrescenta os
efeitos ao shader do `SpriteMaterial` já usado pelo nome do jogador.

- Um relógio/uniform compartilhado é atualizado pelo loop existente do jogo.
- Nenhum objeto de partículas, textura ou draw call adicional por insígnia.
- Nenhum redesenho/upload contínuo do canvas com o nome.
- A região animada termina antes do texto do nome e não altera a posição ou
  escala do sprite acima da cabeça.
- Há no máximo cinco partículas calculadas por fragmento; no celular, três.
  Os títulos iniciais não executam o bloco de partículas nem de aura.
- A promoção já recria o nome/brasão com o novo nível; o novo material recebe
  automaticamente o perfil correspondente. As faixas de XP não mudaram.
- Um listener global acompanha movimento reduzido e é removido em `pagehide`.
  O gerenciador não mantém listas/referências aos materiais dos jogadores.

## Verificação

`tests/nobility-effects.test.mjs` compara os hashes dos onze desenhos originais,
confere os SVGs publicados, perfis, hierarquia, região do shader, relógio e
programa compartilhados, troca de título, limite móvel e encerramento do listener.

Validação realizada: 126 testes aprovados, auditoria de código sem achados,
build React concluído e onze SVGs aceitos pelo parser XML.
Não havia navegador conectado: a compilação real do shader em WebGL, a aparência
em celulares e o FPS com vários jogadores ainda precisam de conferência visual.
Os testes do shader exercitam a integração com o código Three.js instalado,
mas não substituem execução em uma GPU.
