# Emotes

As nove imagens em `emoticos/` são associadas por nome em `frontend/js/emotion-reactions.mjs`.

`audio emoticos/risos.mp3` e `audio emoticos/raiva.mp3` já estão associados. Os outros oito emotes têm `audio: null` e funcionam sem som. Quando seus arquivos forem adicionados, atribua o caminho correspondente no campo `audio` de cada entrada do catálogo. Nenhum áudio ausente é solicitado pelo navegador.

Os emotes aparecem no seletor do chat e no menu de reações do personagem. A mensagem enviada sincroniza a imagem e, quando configurado, seu áudio com os demais jogadores. As imagens são carregadas uma vez e reutilizadas; a reação mantém um emoji de fallback se a imagem falhar.
