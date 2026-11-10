# Otimização sem cortes de qualidade

Referência anterior: `b643598`. Resultados reproduzíveis em `performance-benchmark.json`, gerados com:

```powershell
node --expose-gc scripts/benchmark-three-performance.mjs --output docs/performance-benchmark.json
node --test
```

## Gargalos identificados

1. Os helpers criavam uma geometria nova para cada caixa, esfera e cilindro, mesmo com parâmetros idênticos. Os membros dos NPCs também repetiam a mesma cápsula.
2. A pose de digitação criava vetores/quaternions a cada braço e recalculava a transformação da raiz várias vezes. A verificação da bancada atualizava todos os descendentes a cada quadro, embora só precisasse da transformação da bancada.
3. Cada teste de colisão percorria todos os obstáculos. As buscas de caminho multiplicavam esse custo por milhares de pontos e criavam assinaturas textuais das portas repetidamente.
4. A saída de convidados e o descarte de prévias não liberavam todas as geometrias e materiais privados. A prévia inicial também precisava distinguir recursos próprios dos emprestados do mundo.

## Alterações internas

- Pool de até 1.024 geometrias primitivas imutáveis, com os mesmos parâmetros, vértices, índices e segmentos. Transformações e materiais continuam independentes. Geometrias compartilhadas só são descartadas pelo proprietário do pool.
- Instanciamento da decoração externa estática por pai, material, geometria, propriedades de renderização e células de 6 metros. Materiais transparentes, objetos com filhos, escalas negativas e materiais de sombra customizados são excluídos. O telhado continua independente; colisores são calculados antes do agrupamento. Os carros continuam animados separadamente.
- Índice espacial para colisões estáticas, reconstruído quando a lista de colisores muda. O teste final círculo/AABB mantém a fórmula anterior. Portas continuam dinâmicas e usam caixas reutilizadas, atualizadas quando seu ângulo muda.
- Solver de digitação com objetos temporários reutilizados e uma matriz inversa por chamada. Testes comparam as rotações com a implementação anterior, preservada somente como referência em `tools/legacy-typing-reference.mjs`.
- Descarte explícito de roupas, cabelos, geometrias de corpo e materiais privados ao remover um convidado. Prévia inicial libera seu próprio template; a prévia da sala preserva o template compartilhado. O contexto WebGL de uma prévia encerrada também é liberado.
- A aparência idêntica recebida pela rede não repete a validação e montagem de equipamentos.
- O pixel ratio inicial foi mantido fixo: a antiga redução automática de resolução por FPS foi retirada. Não houve redução de texturas, segmentos, luzes, sombras, personagens ou efeitos como estratégia de otimização. Os limites de iluminação e as configurações iniciais preexistentes foram preservados.

## Medições realizadas

Microbenchmarks de CPU em Node v24.18.0 / Windows, sem WebGL. Os tempos são medianas e podem variar em outra máquina.

| Trabalho medido | Antes | Depois |
| --- | ---: | ---: |
| Digitação: 5 NPCs × 2.000 quadros | 11,61 ms | 6,89 ms |
| 20.000 colisões, 278 caixas do exterior | 19,87 ms | 2,03 ms |
| Construção do exterior | 65,06 ms | 12,34 ms |
| Geometrias únicas do exterior | 709 | 75 |
| Buffers de geometria e instâncias do exterior | 6.332.600 bytes | 613.440 bytes |
| Submissões de malhas se tudo estivesse visível | 709 | 639 |
| Triângulos do exterior | 88.336 | 88.336 |
| Materiais únicos do exterior | 91 | 91 |

O índice produziu os mesmos resultados de colisão. O ensaio de construção/descarte completou 48 ciclos após aquecimento sem falhar, com aumento de heap JavaScript de 313.336 bytes após GC explícito. É um teste curto em Node; não comprova ausência de vazamentos no navegador. Buffers acima são arrays de CPU, não VRAM medida; submissões acima são contagens estruturais, não draw calls medidos por câmera.

## Validação real ainda necessária

Nenhum navegador estava conectado nesta sessão. Não foram medidos FPS, p95 do jogo completo, consumo real da GPU, RAM do navegador ou estabilidade prolongada com jogadores reais. Não há promessa de eliminar todas as travadas com base nos microbenchmarks.

Abra o jogo com `?perf=1`. O painel informa FPS, p95, tempo JavaScript, contagem de passes/draw calls, geometrias, texturas e heap quando a API do navegador está disponível. Agora também consulta o tempo de GPU de forma assíncrona quando `EXT_disjoint_timer_query_webgl2` é suportada. Não usa `gl.finish`, mantém no máximo quatro consultas pendentes e descarta resultados disjoint. VRAM continua indisponível; o diagnóstico desativado não consulta o renderer.

Compare a mesma câmera, pixel ratio, ambiente, duração e quantidade de jogadores: 60 segundos parado; 60 segundos caminhando/correndo; todas as danças e interações em dupla; leitura/teclado; portas e modo construção; vídeo/espelho; entradas e saídas repetidas; 15 minutos de sessão. Registre `homelabPerformance.snapshot()` e confira os encaixes visuais. Na referência antiga, anote qualquer redução automática de pixel ratio para não atribuir ganhos de resolução menor à otimização interna.
