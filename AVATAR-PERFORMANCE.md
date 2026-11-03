# Modelos 3D: otimizacao

O catalogo usa copias otimizadas; os GLBs originais foram preservados.

| Modelo | Original | Em uso | Triangulos originais | Triangulos em uso |
| --- | --- | --- | --- | --- |
| Feminina | 6.93 MB | 1.32 MB | 185984 | 46496 |
| Jessica | 27.51 MB | 6.67 MB | 179031 | 50521 |
| Loira | 79.80 MB | 11.30 MB | 1978166 | 284154 |
| Plus size | 13.37 MB | 0.67 MB | 44188 | 15152 |

As copias usam texturas WebP de ate 1024 px. Loira e Plus size usam quantizacao glTF nativa e exigem suporte a `KHR_mesh_quantization`, incluso no GLTFLoader do Three.js. Simplificacao com glTF Transform 4.5.1: ratio 0.25 para Feminina/Jessica/Plus size e 0.1 para Loira, error 0.003, preservando a hierarquia. As modificacoes visuais ainda precisam de comparacao no navegador.

O carregador prepara cada modelo uma vez e compartilha geometria e texturas entre instancias. Modelos sem clipes preservam a malha e os pesos originais, usando somente deslocamento e inclinacao leves do corpo inteiro. A articulacao automatica por posicao de vertices foi retirada do carregamento para evitar deformacoes. A cache mantem ate tres modelos preparados quando nao estao em uso; modelos em uso nao sao descartados.

A previa so redimensiona o canvas quando seu tamanho muda, limita a animacao a cerca de 30 atualizacoes por segundo e pausa quando fica oculta. O cenario ao fundo nao e renderizado enquanto o editor de avatar esta aberto. Os modelos maiores nao projetam sombras adicionais. Materiais e formas principais foram mantidos, mas resolucao de textura e detalhe geometrico foram reduzidos.

Validacao: testes verificam integridade dos GLBs, preservacao de skins/creditos, reducao de tamanho e triangulos, catalogo e sincronizacao online. Nao foi medida a taxa de quadros no navegador nem em celular.
