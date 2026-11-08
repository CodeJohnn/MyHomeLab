# Autonomia dos NPCs

O módulo `npc-mind.mjs` retorna intenções locais. Não recebe acesso ao terminal, rede, credenciais ou ações de reparo. O jogo aplica essas intenções usando a navegação, colisões e articulações existentes.

Vitória prioriza observação e serviços; Xandy, sociabilidade e conexões; Alex, prudência e diagnóstico; Snot, equipamentos; Luiza, colaboração e serviços.

O agendador consulta a equipe uma vez por segundo; cada NPC decide a cada 2,2 a 5 segundos. Pausas são avaliadas a cada 45 a 120 segundos. Conversas, chamadas telefônicas, deslocamentos e interações têm prioridade.

Alertas compartilhados são somente observados. Exercícios locais de serviço, conexão e equipamento surgem a cada 120 a 210 segundos e expiram após 60 segundos. As falas identificam a simulação. O NPC pode ignorar, comunicar, investigar ou tentar uma verificação simulada. Cada evento reserva um investigador, com limite de tempo e reconhecimento de caminhos inacessíveis. Encerrar um alerta compartilhado cancela sua investigação. O reparo autorizado existente continua sob controle do usuário.

A memória dura a sessão: até 8 eventos ativos, 16 eventos observados por NPC, 8 destinos, 6 falas recentes, 12 trocas de conversa e 8 respostas recentes. Não há gravação das conversas em banco ou envio a serviços de IA. O repertório é local e baseado em regras.

Os testes verificam decisões, intervalos, ocupação, expiração, reservas e memória de diálogos. Circulação e desempenho precisam de avaliação visual no navegador.
