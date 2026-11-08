# Emotes

As nove imagens em `emoticos/` são associadas por nome em `frontend/js/emotion-reactions.mjs`.

Risos usa `audio emoticos/risos.mp3`. Raiva, Ai ai, Atraente, Beijo, Choro, E aí, Por favor e Suspeito usam os arquivos `.ogg` de mesmo nome em `audio emoticos/`. Indo nessa continua com `audio: null` até receber seu arquivo. Quando o áudio for adicionado, atribua seu caminho no catálogo. Nenhum áudio ausente é solicitado pelo navegador.

Os emotes aparecem no seletor do chat e no menu de reações do personagem. A mensagem enviada sincroniza a imagem e, quando configurado, seu áudio com os demais jogadores. As imagens são carregadas uma vez e reutilizadas; a reação mantém um emoji de fallback se a imagem falhar.
