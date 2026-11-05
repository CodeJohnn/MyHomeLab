# Reformulação dos personagens — preparação técnica, substituição visual pendente

## Diagnóstico

O projeto usa Three.js puro 0.160.1, sem React/R3F. O cenário não precisa ser refeito.

| Responsabilidade | Arquivo |
| --- | --- |
| Jogador procedural, membros e materiais | `frontend/js/player-avatar.mjs` |
| NPCs, movimento, cadeiras, IK, colisão, câmera e interações | `frontend/js/homelab.js` (`createNpc`, `updateNpcs`, `poseNpcTyping`) |
| Aplicação do perfil/roupas | `frontend/js/avatar-appearance.mjs` |
| GLTFLoader, cache, SkeletonUtils, animações existentes | `frontend/js/avatar-models.mjs` |
| Catálogo de modelos atuais | `frontend/js/avatar-model-catalog.mjs` |
| Prévia do avatar | `frontend/js/avatar-editor-preview.mjs` |
| Validação online de perfis | `backend/avatar.mjs` |

O carregador atual trata modelos sem animação com oscilação rígida, que não substitui
caminhada com esqueleto. Os modelos importados também não acompanham automaticamente
as poses de cadeiras e teclado aplicadas aos membros procedurais. Trocar só o arquivo
GLB ou esconder o avatar antigo não preservaria todas as funcionalidades pedidas.

## Plano de substituição

1. Obter os GLBs autorais/licenciados descritos em `frontend/assets/characters/README.md`.
2. Validar arquivo, licença, skeleton, clipes, orientação e escala.
3. Usar `createOfficeCharacterLoader(THREE)` uma vez por cena. `prepare(url)` faz
   download assíncrono compartilhado; `attach(root, options)` clona o skeleton,
   compartilha geometria/texturas e cria mixer independente por instância.
4. Preservar os roots que já movem e colidem. Ocultar apenas as malhas antigas após
   o novo modelo estar carregado. Os proxies de interação devem continuar funcionais.
5. Em cada quadro, chamar `controller.update(dt, {pose, moving, waving})` **depois**
   da simulação. Para NPC sentado digitando, pose=`typing`; cadeira sem trabalho,
   pose=`sit`. Para jogador, mapear `interactionPose`; não deixar modelos diferentes
   simultaneamente ativos nos carregadores antigo e novo.
6. Ajustar altura e `seatOffset` por rig. Root motion deve estar removido na arte.
7. Migrar preview, catálogo, escolha de perfil e guests online juntos; manter os IDs
   compatíveis no backend. Remover o visual procedural padrão apenas depois disso.
8. Medir em celular real antes de ativar todos os NPCs, comparando mesmos ângulos,
   quantidade de jogadores e monitores. Registrar FPS, picos e memória.

## Implementado nesta etapa

- `office-character.mjs`: módulo reutilizável, clonagem de skeleton, cache de carga,
  normalização de altura, mixer por instância, crossfade de 200 ms e descarte.
- `office-character-state.mjs`: prioridades explícitas; sentar/digitar prevalece
  sobre deslocamento, sem fingir que Idle é uma animação de interação.
- `scripts/validate-office-character.mjs`: GLB, skin, clipes, recursos incorporados,
  contagem de triângulos e avisos de orçamento.
- Exportador Blender de um personagem já modelado/rigado e brief de arte.
- Testes de prioridade de poses e rejeição de arquivo/clipes insuficientes.

O módulo novo **não está conectado ao loop de produção**, pois faltam os arquivos de
arte e a validação visual/funcional. A aparência dos personagens ainda não mudou;
essa tarefa não está concluída. Não foram substituídos os modelos por outros assets
que não atendem ao pedido, nem adicionados arquivos extraídos de jogos.

## Fontes avaliadas

- https://quaternius.com/packs/universalbasecharacters.html — base humanoide;
  exige roupas/acabamento e animações retargeteadas para este projeto.
- https://quaternius.com/license.html — licença atual QAL, atualizada em 28/08/2026;
  revisar termos do download e distribuição, sem assumir CC0 por páginas antigas.
- https://quaternius.itch.io/universal-animation-library — biblioteca de animação;
  verificar licença do pacote efetivamente obtido e compatibilidade do rig.

Nenhum desses recursos foi baixado ou incorporado. Não há Blender disponível no PATH
desta sessão; não houve render Blender nem teste visual dos futuros GLBs.
