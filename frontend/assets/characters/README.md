# Personagens do escritório — arquivos de arte pendentes

Esta pasta está publicada pelo servidor existente. O projeto não usa `public/`;
`backend/server.mjs` serve `frontend/assets/`. Não foram adicionados GLBs fictícios.

## Arquivos a produzir

- `john.glb`: personagem principal, cabelo castanho-escuro, barba curta, camiseta
  preta com dobras, jeans, tênis, dedos e pálpebras modelados. Altura alvo 1,80 m.
- `vitoria.glb`, `xandy.glb`, `alex.glb`, `snot.glb`, `luiza.glb`: NPCs com o
  mesmo padrão de rig, preservando as identidades e roupas de cada personagem.
- Os `.blend` editáveis correspondentes (fora da pasta servida, em `art/characters/`).
- `LICENSE.txt` e `sources.json` com autor, URL original, licença, permissão de
  redistribuição no repositório/jogo e alterações realizadas para cada arquivo.

## Contrato de exportação

- GLB 2.0 autocontido, PBR metallic/roughness, esqueleto humanoide e pesos revisados.
- Metros, pés no chão em Y=0, frente em +Z, transformações aplicadas no Blender.
- Cinco actions exportadas com nomes exatos: `Idle`, `Walk`, `Sit`, `Typing`, `Wave`.
- Animações **in-place**, sem translação horizontal do root. O jogo controla posição,
  colisão, giro e câmera. Ciclos de Idle/Walk/Typing sem saltos nas emendas.
- Sit/Typing devem ser poses sentadas sustentadas, sem deslocamento do root;
  conferir altura do quadril e alinhamento dos pés em cadeira real do escritório.
  Ajustar `seatOffset` na integração, sem alterar colisores.
- 20–40 mil triângulos como meta inicial por personagem, 1 atlas de 1024 px quando
  possível, até 5 MiB. Validar qualidade de rosto/mãos antes de simplificar.
- Cabelo/barba em malha esculpida ou cards econômicos; sem sistemas de partículas
  de cabelo que não sejam exportáveis para glTF. Normal map para detalhes menores.
- Manter shape keys faciais se houver; o controlador inicial não anima expressões.

## Blender

1. Modelar/retopologizar rosto, pálpebras, mãos, cabelo, barba e roupas; não converter
   as esferas antigas em GLB como substituto do trabalho artístico.
2. Fazer UVs, bake de normal/AO e materiais compatíveis com glTF.
3. Skinning e revisão de ombros, quadril, joelhos e dedos em pose sentada.
4. Produzir/retargetear as cinco actions para o mesmo esqueleto; revisar cada clip.
5. Exportar com Blender 4.4+:

   `blender art/characters/john.blend --background --python tools/blender/export_office_character.py -- frontend/assets/characters/john.glb`

6. Validar: `node scripts/validate-office-character.mjs frontend/assets/characters/john.glb`.
   O script Blender ainda precisa ser executado num Blender instalado.
7. Comparar no navegador desktop e em celular: frente/perfil/costas, caminhada,
   cadeira, teclado, interação, paredes, múltiplos usuários, FPS e tempo de carga.

Não ativar um modelo somente porque o validador passa. Ele não comprova licença,
qualidade visual, orientação, root motion, emendas de animação ou encaixe na cadeira.
