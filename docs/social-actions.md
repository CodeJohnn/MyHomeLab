# Animações e interações sociais

Abra o menu do próprio personagem (ou pressione R) e entre em **Danças** ou **Sobre mim → Ações do personagem**. O menu reúne dança livre, funk, hip-hop, dança romântica, dança engraçada, tchau, chão, ajoelhar, aplaudir, rir, chorar, dormir, mandar beijo e comemorar. As ações antigas continuam disponíveis. Shift aumenta a velocidade de corrida; E, Esc, movimento ou **Parar animação** interrompem os novos emotes. Os controles de direção no celular também interrompem as ações.

As cadeiras existentes continuam usando os encaixes e controles anteriores. Objetos com ID iniciado por `sofa` usam um assento de 48 cm; ajuste o perfil em `seating.mjs` para a geometria de um sofá específico. Nenhum sofá ou modelo externo foi adicionado ao cenário.

Abraçar, beijar, cumprimentar e dançar em dupla usam convites entre jogadores online próximos (até 3 metros). Apenas o destinatário pode aceitar; ambos precisam estar livres e no mesmo piso. O cliente confere o corredor de aproximação contra móveis, NPCs e outros jogadores. O servidor define posições, orientações, início comum, aproximação de 1,5 segundo e término. Convites expiram após 20 segundos. Qualquer participante pode cancelar. Saída da sala e expiração encerram a sessão; revisões impedem snapshots antigos de reativá-la.

## Módulos

- `social-action-catalog.mjs`: IDs, rótulos, durações, distâncias e validação do protocolo, sem dependência de Three.js.
- `avatar-actions.mjs`: poses procedurais, buffers reutilizados por personagem e transições de entrada. Pode receber qualquer rig com arrays de pernas, joelhos, braços e cotovelos no mesmo contrato.
- `backend/social-actions.mjs`: consentimento, reservas, expiração e sessões compartilhadas.
- `social-actions-ui.mjs`: seleção, convite, aceite, recusa e cálculo da fase usando o relógio do servidor.
- `homelab.js`: locomação, cancelamento, recuperação suave e aplicação das poses locais e remotas.

Para adicionar um emote, registre seus metadados no catálogo e sua pose no módulo de animação. As geometrias não são deformadas nem substituídas. Roupas, cabelo e acessórios presos ao rig acompanham suas transformações; objetos nas mãos ficam temporariamente suspensos durante ações, como já acontecia nas interações anteriores, e reaparecem ao terminar.

O transporte existente continua limitado a uma atualização de pose a cada 100 ms; a animação é amostrada localmente a cada quadro, sem novos mixers, modelos ou polling por personagem. As memórias dos rigs usam `WeakMap`. Os testes cobrem consentimento, expiração, desconexão, validação da API, ordem dos snapshots, cancelamento durante requisições, aproximação, integridade das geometrias e contato com o piso.

A conferência visual das coreografias, a avaliação com dois navegadores e a medição de FPS ainda precisam ser feitas em um navegador disponível.
