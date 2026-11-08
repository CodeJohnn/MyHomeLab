# Acessórios 3D

O inventário fica em **Meu avatar → Acessórios**, tanto na página de perfil quanto em **Aparência**, no menu do personagem dentro da sala. O catálogo tem 26 itens, com miniatura vetorial, nome, descrição, prévia no avatar, escolha de mão, cor, equipamento e remoção sem recarregar a página.

## Itens disponíveis

- Cabeça: boné clássico, boné de aba reta, gorro canelado, fedora e bucket.
- Fones: headset gamer com microfone e fone Bluetooth.
- Rosto: óculos de sol, óculos de grau, máscara e estrela decorativa.
- Costas: mochila escolar, gamer e com compartimentos.
- Bolsas: transversal, feminina e de ombro.
- Eletrônicos: notebook aberto, notebook fechado, celular, tablet e câmera.
- Mãos: café, livro aberto, guarda-chuva e maleta executiva.

## Como testar

1. Entre no perfil, escolha **Personalizado**, abra **Acessórios** e clique em **Experimentar**.
2. Gire a prévia para ver o encaixe. Ajuste a cor do último item escolhido e experimente combinações, como boné + headset + óculos + mochila + celular.
3. Escolha o notebook aberto, tablet ou livro: as duas mãos devem se posicionar nas bordas. Café, celular e câmera têm poses de sustentação; maleta e notebook fechado usam uma pose de transporte.
4. Selecione uma bolsa depois da mochila: a mochila é removida para evitar sobreposição. Chapéus largos também substituem os fones. A máscara pode coexistir com óculos.
5. Salve o perfil, entre na sala com outro navegador e confira os acessórios do primeiro jogador. Troque o equipamento e salve novamente: o outro jogador recebe IDs e cores, sem arquivos de geometria.
6. Recarregue ou saia e entre novamente. Os itens e cores permanecem no perfil deste navegador.
7. Experimente sentar, digitar e executar ações: objetos de mão são suspensos durante essas interações e reaparecem depois. Os demais acessórios continuam fixados.

## Persistência e compatibilidade

O sistema reutiliza `homelab.avatar`, a persistência de aparência existente no navegador. Não altera as tabelas de XP nem cria uma persistência de inventário em nuvem. A aparência normalizada é validada pelo backend e sincronizada pelo mesmo fluxo de avatares da sala.

Os pontos anatômicos são cabeça, rosto, tronco/costas, ombro e mãos. O equipamento possui oito slots lógicos: `Head`, `Ears`, `Face`, `FaceDetail`, `Back`, `Shoulder`, `LeftHand` e `RightHand`. Isso permite óculos + máscara, boné + headset e diferentes objetos em cada mão. Objetos de duas mãos reservam ambas. Óculos e chapéus antigos continuam disponíveis e não se sobrepõem aos equivalentes novos.

Os objetos de mão são habilitados no Personalizado, Punk, Punk feminino, Caveirata, Noia, Jessica e Porte grande, que possuem articulações compatíveis. Nos demais modelos, o inventário mantém acessórios de cabeça, rosto, costas e bolsas, mas desabilita objetos de mão e explica a restrição. Não são criados objetos flutuantes para simular uma mão inexistente. O ajuste fino de modelos e penteados importados ainda precisa de conferência visual no navegador.

## Implementação

- `accessory-catalog.mjs`: IDs, categorias, descrições, cores, slots e regras de compatibilidade, compartilhados entre cliente e backend.
- `accessory-models.mjs`: modelagem procedural com bordas arredondadas, perfis moldados, alças curvas, bolsos, zíperes, costuras, microfone, teclas e outros detalhes. Geometrias são agrupadas por acabamento para reduzir chamadas de desenho. Cópias iguais compartilham recursos com contagem de referências e descarte ao remover a última cópia.
- `avatar-equipment.mjs`: fixação no avatar padrão e nos ossos dos GLBs, compensação de escala, enquadramento da cabeça, IK de dois segmentos, alinhamento das mãos, suspensão durante outras ações e descarte.
- `accessory-inventory.mjs` e `accessories.css`: interface reutilizada nos dois editores.
- Integrações em `avatar-appearance.mjs`, `avatar-models.mjs`, `player-avatar.mjs`, `avatar-editor-preview.mjs`, `shared-room.mjs`, `user-home.mjs`, `homelab.js`, `backend/avatar.mjs` e `api/rooms.mjs`.

Não há cálculos de equipamento por quadro quando nenhum objeto de mão está equipado. As malhas têm entre 76 e 2.992 triângulos por item e entre 1 e 7 grupos de acabamento; não usam texturas de alta resolução nem novos contextos WebGL durante o jogo. Os objetos de mão têm poses leves; os demais seguem a hierarquia do personagem. A frequência de sincronização da sala foi preservada. Esses números são contagens de geometria, não medições de FPS.

## Validação

`npm.cmd test` executa a suíte geral. `node --test tests/accessories.test.mjs` verifica os 26 modelos com o Three.js 0.160.1 real, orçamento de geometria, descarte e compartilhamento de recursos, validação do inventário, compatibilidade, fixação, IK, escala de ossos, configuração recebida por outro jogador e reconexão. Também carrega os GLBs articulados reais para testar fixação de cabeça e mãos; a decodificação de texturas é substituída apenas nesses testes Node.

`node scripts/preview-accessories.mjs` gera `artifacts/accessory-preview.png` a partir das geometrias reais. A galeria foi inspecionada por renderização CPU; ela não reproduz exatamente o material PBR no navegador. A prévia 3D interativa usa o renderizador existente do editor, com enquadramento ajustado para incluir acessórios altos, como o guarda-chuva. Não havia navegador conectado no ambiente de implementação para verificar o personagem completo e suas animações em WebGL. Não foram medidos FPS ou consumo de GPU.

Three.js foi adicionado somente às dependências de desenvolvimento, na mesma versão usada pelo import map do site, para executar esses testes sem depender de Blender. O backend continua sem depender do Three.js para servir a API.
