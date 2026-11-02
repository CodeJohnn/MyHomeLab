# GitHub Pages + Render

O frontend fica no GitHub Pages. O backend e a API ficam em um Web Service gratuito no Render. O computador local pode ficar desligado.

## 1. Criar o backend no Render

Envie o projeto completo ao reposit?rio. No Render, use **New > Blueprint** e selecione esse reposit?rio. O render.yaml configura Node 22, plano Free, npm start e verifica??o de sa?de em /health. Mantenha a raiz do reposit?rio como Root Directory.

Quando solicitado, preencha ALLOWED_ORIGINS com a origem do frontend: por exemplo, https://SEU-USUARIO.github.io (sem barra final e sem o nome do reposit?rio). Para v?rios dom?nios, separe por v?rgula. Se usar dom?nio pr?prio, informe sua origem HTTPS tamb?m.

SERVE_FRONTEND=false faz o Render entregar somente API e /health. A URL principal do backend retornar 404 ? esperado. Copie a URL HTTPS do servi?o.

## 2. Conectar o frontend

Em frontend/js/config.mjs, preencha API_BASE_URL com a URL real do Render, por exemplo:

export const API_BASE_URL = 'https://SEU-SERVICO.onrender.com';

N?o acrescente /api. Essa configura??o ? p?blica e n?o deve conter senhas nem chaves. POST, eventos em tempo real e v?deos compartilhados usam esse endere?o. Os convites continuam apontando para o GitHub Pages.

## 3. Publicar o frontend

No GitHub, abra **Settings > Pages > Source > GitHub Actions**. O workflow .github/workflows/pages.yml publica apenas index.html e frontend/, sem publicar backend, API e testes no site. Ele roda em pushes para main ou manualmente na aba Actions. Se sua branch tiver outro nome, ajuste branches no workflow.

Fa?a push da configura??o com a URL real do Render e aguarde a publica??o. Abra https://SEU-USUARIO.github.io/SEU-REPOSITORIO/. Teste a entrada em duas abas e o envio de um v?deo.

## Ligar e desligar

Use Suspend e Resume no painel do Render para parar e retomar o backend. O site no GitHub Pages continua acess?vel; o multiplayer, chat e v?deos compartilhados precisam do backend ligado. O ambiente local e suas intera??es locais continuam no navegador.

O Free pode entrar em repouso ap?s 15 minutos sem tr?fego e demora cerca de um minuto para voltar no pr?ximo acesso. Salas, mensagens e uploads s?o tempor?rios e se perdem ao reiniciar. Deploys autom?ticos do Render est?o desativados; publique mudan?as do backend com Manual Deploy > Deploy latest commit.

## Desenvolvimento local

npm start entrega o site e a API juntos por padr?o. Com API_BASE_URL vazio, o frontend usa a mesma origem. Para testar o backend remoto, mantenha sua URL e adicione a origem local usada no navegador a ALLOWED_ORIGINS no Render.

## Refer?ncias

- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://render.com/docs/free
- https://render.com/docs/blueprint-spec

## Senha da porta dos servidores

No Render, configure SERVER_ROOM_PASSWORD em Environment e publique novamente o backend. A senha e validada no servidor e nao deve ser colocada em config.mjs nem no repositorio. Sem essa variavel, a abertura online fica bloqueada. No modo local, o primeiro acesso permite definir uma senha, cujo hash fica salvo neste navegador. Esta e uma trava da porta do cenario, nao um sistema de autenticacao das APIs ou de todos os movimentos dos jogadores.

## Filmes por transmissao direta

Para a versao WebRTC, publique tambem o backend com Manual Deploy. Veja [WATCH-PARTY.md](WATCH-PARTY.md). WEBRTC_ICE_SERVERS e opcional para configurar um servidor TURN; sem ele, algumas redes nao conseguem conectar.
