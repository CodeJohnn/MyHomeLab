# Interface React

A tela inicial é renderizada com React. Os componentes editáveis ficam em
`frontend/react/LandingPage.jsx`; `frontend/react/main.jsx` controla o estado
de carregamento e conecta a interface ao login e perfil existentes.

O cenário Three.js, o editor de avatar e os serviços de conta continuam nos
módulos existentes. `initializeLanding` integra esses módulos à tela React e
desmonta a raiz React quando o jogador entra no mundo.

## Desenvolvimento

- `npm ci`: instala as dependências do lockfile.
- `npm start`: compila JSX e inicia o servidor em `http://localhost:3000`.
- `npm run dev:react`: recompila JSX ao salvar; use em outro terminal com o servidor aberto.
- `npm run build`: gera `frontend/js/react-app.js`.
- `node --test tests/react-landing.test.mjs`: verifica a renderização e o estado de carregamento.

O bundle gerado é ignorado pelo Git. O workflow do GitHub Pages executa
`npm ci` e `npm run build` antes de copiar os arquivos públicos. Os caminhos
relativos mantêm a publicação funcionando em subdiretórios.
