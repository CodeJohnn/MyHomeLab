# Uniformes GuedesSEC dos NPCs

Cinco combinações por ordem de criação: Vitória (moletom cinza), Xandy (camiseta preta), Alex (esportivo branco e preto), Snot (jaqueta preta), Luiza (camisa social cinza). A imagem oficial `frontend/assets/guedessec.png` é aplicada ao atlas do tronco, no peito e nas costas, sem planos sobrepostos. Fundos escuros mantêm contraste. UVs verticais seguem a altura física, evitando esticar a logo entre anéis irregulares do tronco.

As roupas são as superfícies dos próprios membros procedurais; mangas, calças e tênis herdam as articulações existentes. Foram retiradas as camadas rígidas de jaleco e saia que atravessavam a região dos quadris nas poses sentadas. Materiais e atlas são reutilizados por combinação. Nenhuma dependência nova ou alteração do avatar dos jogadores.

## Verificação

- Testes automatizados usam o construtor real dos NPCs e exercitam 60 quadros em cada uma de oito poses por NPC: parado, caminhada, corrida, sentado, dança, movimento dos membros, giro e digitação. Verificam hierarquia, visibilidade e matrizes finitas; não detectam interseções visuais.
- Corrida, dança e movimento amplo são poses de esforço na ferramenta de revisão, pois o laço autônomo atual dos NPCs oferece caminhada e tarefas sentadas/em pé. Não foram adicionadas novas ações ao jogo.
- `tools/npc-uniform-preview.html` carrega o construtor de produção e permite selecionar pose e vista. Sirva a raiz do projeto com um servidor estático que disponibilize também `node_modules/three`, e abra `/tools/npc-uniform-preview.html`.
- A revisão visual em WebGL está **pendente**: o ambiente de execução não disponibilizou navegador conectado. Antes de considerar a validação visual concluída, revisar todas as poses de frente, costas e ambos os lados, inclusive no jogo com cadeiras e bancadas. FPS e comportamento em celulares também não foram medidos.

## Correção das junções dos membros

Causa identificada: a cápsula de raio 1 e trecho central 6 era escalada por `width/2`, `length/8` e `depth/2`. Isso comprimía as tampas em Y independentemente da largura. As extremidades visuais não coincidiam com os pivôs; dobrar joelhos e cotovelos expunha pontas afuniladas e espaços nas junções.

Agora `fittedNpcLimb` cria cápsulas com raio físico e distância entre centros das tampas igual à distância entre articulações: coxa 0,30, canela 0,32, braço 0,22 e antebraço 0,25. A translação posiciona os centros nos pivôs sem escala axial. Foram removidas as esferas redundantes de ombro/cotovelo. A cintura usa uma elipsoide com dimensões próprias, encaixada sob a barra do tronco; a abertura do pescoço acompanha o raio do pescoço. Punhos de mangas longas usam cilindros curtos reutilizados, e a camiseta não recebe anéis cor de pele. As medidas dos pivôs, mãos, pés e solucionador de digitação permanecem iguais.

Os testes adicionais verificam os raios nas tampas, os centros nos pivôs sob 100 rotações por dimensão de segmento, e a ausência de escala axial. Isso verifica as causas geométricas, mas não substitui revisão visual do jogo. Nenhuma imagem de referência foi disponibilizada no chat desta revisão e o inventário de navegadores conectados permaneceu vazio.
