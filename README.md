# Home Lab — sala compartilhada

Requer Node.js 22 ou superior e npm. Os menus React em `frontend/js/*.react` são compilados com esbuild ao iniciar e ao publicar.

Estrutura: `index.html` é a entrada na raiz; `frontend/` contém scripts, estilos, assets e `ambiente.json`; `api/rooms.mjs` implementa as rotas de salas e sincronização; `backend/` contém o servidor HTTP e a lógica do mundo; `tests/` reúne os testes automatizados. Para publicar alterações do editor, substitua `frontend/ambiente.json` pelo arquivo exportado.

Para hospedar sem depender do seu computador, consulte [Hospedar no Render gratuito](RENDER.md). O projeto inclui `render.yaml` para criar o serviço no plano Free e instruções para suspendê-lo e retomá-lo pelo painel.

```powershell
npm start
```

Abra http://localhost:3000. O painel **Mundo online** conecta automaticamente ao ambiente comum, com até 12 pessoas. Quem abrir o mesmo servidor entra nesse ambiente, com posições iniciais diferentes, nomes sobre os personagens, movimentos e poses sincronizados. Use WASD ou as setas para andar; as interações locais de sentar e digitar também são visíveis aos outros. O chat permite conversar, acenar e enviar corações, com mensagens sobre o personagem. As falhas dos servidores, seus reparos, as portas da sala restrita e da entrada e os interruptores são compartilhados em tempo real. O backend decide quando ocorre uma falha; todos recebem o mesmo incidente e desafio, inclusive ao entrar ou reconectar. NPCs, geladeira e alterações do editor ainda têm simulações locais.

A mesa de sinuca fica perto da estação do Alex. Clique nela para entrar em um dos dois lugares; mire clicando no pano e ajuste a força antes de tacar. As bolas, faltas, grupos, turnos e o resultado da partida são calculados e sincronizados pelo servidor para todos na sala.

O botão **Copiar convite** aponta para a sala atual. URLs antigas de salas privadas continuam aceitando duas pessoas. Após atualizar o código, reinicie `npm start` e recarregue os navegadores com Ctrl+F5. A sessão é recuperada após atualizar a página; **Sair da sala** libera a vaga imediatamente.

Os participantes podem escolher um filme local em qualquer monitor ou pelo painel da sala. O arquivo e transmitido diretamente por WebRTC; o Render faz a sinalizacao. Quem transmite controla a reproducao e precisa manter a pagina aberta. Veja [Assistir com um amigo](WATCH-PARTY.md) para publicar, usar e configurar TURN quando necessario.

Na mesma rede, substitua `localhost` pelo IP do computador que executa o servidor antes de copiar o convite (por exemplo, `http://192.168.1.10:3000`). Para acesso pela internet, hospede este processo Node em um servidor com HTTPS e suporte a conexões SSE. GitHub Pages e Live Server sozinhos não executam o backend. `PORT` e `HOST` são configuráveis por variáveis de ambiente.

Na transmissao direta nao ha limite fixo de 100 MB: o navegador precisa conseguir reproduzir e capturar o arquivo. O endpoint antigo de upload continua limitado a 100 MB e usa RAM, mas nao e mais utilizado pelo seletor de filmes online. Links de sites/YouTube continuam independentes.

Os personagens dos participantes compartilham posição e direção. Salas, participantes e vídeos são temporários e se perdem ao reiniciar o servidor. Um participante desconectado libera sua vaga após cerca de 45–60 segundos; salas vazias expiram após 10 minutos. O link da sala permite entrar e deve ser enviado apenas a quem você quer convidar. Esta versão é para uso pessoal: limita a 100 salas e mantém um vídeo por sala em RAM; hospedagem pública ampla requer autenticação, cotas globais de armazenamento e limites de requisições.

Execute `npm.cmd test` para verificar o fluxo de sala e sincronização.
