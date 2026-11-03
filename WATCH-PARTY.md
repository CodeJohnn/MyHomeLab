# Assistir a um arquivo com um amigo

O modo online transmite o audio e o video do arquivo local por WebRTC. O Render troca os dados de conexao e o estado da sala; os bytes do filme nao sao enviados ao backend nem guardados nele. O amigo assiste no navegador, sem salvar ou abrir um arquivo manualmente.

## Publicar esta atualizacao

1. Envie as alteracoes de `frontend/`, `api/`, `tests/` e `index.html` ao GitHub. Inclua o novo `frontend/js/peer-video.mjs`.
2. No Render, use **Manual Deploy > Deploy latest commit**. O backend precisa das novas rotas `share`, `signal` e `rtc`.
3. Aguarde o GitHub Pages publicar o frontend e recarregue os dois navegadores.

## Usar

1. Entre no Mundo online e envie **Copiar convite** ao seu amigo.
2. No computador que tem o filme, escolha o arquivo em um monitor ou em **Compartilhar uma tela**.
3. A transmissao inicia diretamente, sem upload completo. O limite antigo de 100 MB nao se aplica a esse fluxo; filmes de duas horas podem ser selecionados se o navegador conseguir reproduzir o arquivo.
4. Clique em **Ativar som / reproduzir** quando necessario. Na tela ampliada, tambem existe **Reproduzir com som**.
5. Quem escolheu o arquivo controla play, pausa e avancar. O amigo recebe a imagem e o audio em tempo real, com o atraso da conexao. Ele controla seu proprio volume, mas nao avanca o arquivo.
6. Use **Encerrar transmissao** para parar. Ao sair da sala ou fechar a pagina do anfitriao, a transmissao termina.

O anfitriao precisa manter a pagina aberta. MP4 H.264/AAC e WebM sao boas opcoes, desde que suportadas pelo navegador. A captura do elemento de video nao esta disponivel em todos os navegadores: para transmitir, use Chrome, Edge ou Firefox no computador. Um navegador com WebRTC pode receber mesmo sem oferecer captura do arquivo local. Nao ha acesso a camera ou microfone.

A qualidade e a estabilidade dependem da capacidade de codificacao do aparelho e do upload do anfitriao. Cada espectador usa uma conexao de saida adicional. Recomendamos comecar com duas pessoas. Celulares podem interromper a reproducao ao bloquear a tela ou deixar a pagina em segundo plano.

Se um celular mostrar tela preta enquanto o status diz que esta recebendo diretamente, aguarde alguns segundos: o painel diferencia quadros recebidos, quadros decodificados e ausencia de quadros. Isso ajuda a separar problema de conexao, decodificacao e exibicao do monitor 3D.

## Conexao entre redes diferentes

O padrao usa um servidor STUN para tentar a conexao direta. Algumas redes, CGNATs e firewalls exigem um servidor TURN. Sem TURN, a conexao pode falhar mesmo com a sala e o chat funcionando. A interface informa essa situacao; nao envia silenciosamente o filme ao Render como alternativa.

Se contratar ou hospedar TURN, defina **WEBRTC_ICE_SERVERS** nas variaveis de ambiente do Render com um array JSON:

```json
[
  {"urls":"stun:stun.l.google.com:19302"},
  {"urls":["turn:SEU-SERVIDOR:3478","turns:SEU-SERVIDOR:5349"],"username":"SEU-USUARIO","credential":"SUA-CREDENCIAL"}
]
```

Nao use os valores de exemplo como servidores reais. Essa configuracao e entregue somente a participantes autenticados na sala, pois o navegador precisa dela para conectar. Use credenciais restritas, cotas e rotacao; nunca coloque uma chave administrativa do provedor nesse campo. O trafego de um TURN pode gerar custo. O Render nao funciona como servidor TURN deste projeto.

## Validacao

Os testes automatizados verificam autorizacao e destinatario da sinalizacao, encerramento quando o anfitriao sai, controle de reproducao e o fluxo sem upload com um arquivo de tamanho declarado grande. A captura, os codecs, o audio e a passagem por NAT precisam de teste real em dois navegadores. O teste com tamanho declarado nao decodifica um filme de varios gigabytes.

Referencias: [captura de video](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/captureStream), [conexoes WebRTC e TURN](https://webrtc.org/getting-started/peer-connections).
