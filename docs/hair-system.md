# Cabelos procedurais

O cabelo do avatar personalizável é uma superfície esculpida, sem tubos independentes. `hair-geometry.mjs` constrói a cobertura, o volume e o relevo das mechas com coordenadas locais da cabeça. A coroa tem um vértice compartilhado; as laterais usam índices periódicos, sem uma costura aberta. Uma casca interna fecha a borda inferior.

Os cortes longos continuam a superfície até a nuca, com ondulações largas e variação suave no comprimento das pontas. O cacheado usa volumes arredondados sobre a mesma superfície; o rabo de cavalo tem um volume fechado adicional, dentro da mesma malha. Nada é recalculado durante a animação. Os buffers de posição e normais são reutilizados entre avatares; cores e recursos GPU são independentes e continuam descartáveis.

O material usa cores por vértice, rugosidade 0,82 e metalicidade zero. São mantidas as cores escolhidas pelo usuário, os sete penteados, o boné, o gorro e o elástico. A superfície usa uma chamada de desenho; o elástico e os acessórios mantêm suas chamadas adicionais. Rosto, corpo, roupas, rig, modelos importados e lógica multiplayer não foram modificados por esta reformulação.

## Orçamento de geometria

Contagem estrutural de triângulos, excluindo acessórios. Não representa medição de FPS.

| Corte | Antes | Agora |
| --- | ---: | ---: |
| Curto | 6.372 | 4.032 |
| Degradê | 4.212 | 3.072 |
| Topete | 4.572 | 4.480 |
| Cacheado | 12.492 | 5.120 |
| Chanel | 11.772 | 7.680 |
| Longo | 9.972 | 7.680 |
| Rabo de cavalo | 7.812 | 4.848 |

Antes: cobertura com 1.692 triângulos e 360 por mecha. Agora: buffers finais, incluindo a casca interna e a cauda.

## Validação

`node --test tests/hair-geometry.test.mjs tests/hair-profile.test.mjs` verifica topologia fechada, orientação consistente, ausência de faces degeneradas, normais finitas, cobertura do couro cabeludo, determinismo e orçamento de triângulos.

`node scripts/preview-hair.mjs` gera `artifacts/hair-preview.png` a partir dos buffers reais dos sete penteados, nas vistas frontal, três quartos, traseira e superior. A cabeça de contexto é uma aproximação geométrica das dimensões do avatar. O renderizador de prévia é CPU, sem dependências, e não reproduz exatamente o material WebGL. A prévia foi inspecionada nessas quatro vistas; a conferência do personagem completo, iluminação, cores, acessórios e movimentos no navegador ainda é necessária. Não há navegador conectado no ambiente de implementação e não foram medidos FPS ou consumo de GPU.

## Futuros cabelos GLB

O grupo de ligação continua sendo `customAvatarHair`, filho de `onlineAvatarHead`, com Y para cima e +Z para a frente. Um carregador futuro pode inserir uma malha GLB nesse mesmo grupo, normalizada para as dimensões locais existentes, sem alterar o esqueleto ou a sincronização. A seleção de penteado permanece separada da geração de geometria. Não foi adicionado um carregador GLB de cabelo nesta mudança.
