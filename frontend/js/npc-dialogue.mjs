import { guedesReplies } from './guedessec-dialogue.mjs';
import { extraDialogueTopics } from './npc-extra-dialogue.mjs?v=2';
import {npcPersonality} from './npc-mind.mjs';
// Repertorios locais por personagem, sem servico externo.
export const dialogueBanks = [
  {
    "name": "Vitoria",
    "topics": [
      {
        "id": "day",
        "pattern": "dia|hoje|ontem",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. Meu dia teve trabalho, uma pausa para descansar e algumas descobertas interessantes. Nem tudo saiu de primeira, mas consegui aprender com os erros e terminar uma tarefa que estava pendente. Como foi o seu dia?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Hoje eu preferi fazer uma coisa de cada vez. Conferi o laboratorio, organizei algumas ideias e deixei os projetos maiores para depois. Um dia tranquilo tambem pode render bastante. Aconteceu alguma coisa boa com voce?"
        ]
      },
      {
        "id": "mood",
        "pattern": "como (voce|vc|ce) (esta|ta)|tudo bem|sentindo",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. Estou bem e com vontade de conversar. As vezes fico cansado depois de tanto detalhe tecnico, entao uma conversa ajuda a mudar o ritmo. E voce, esta animado ou precisando de uma pausa hoje?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Estou num ritmo tranquilo agora. Gosto quando consigo equilibrar as tarefas com algum tempo para pensar sem pressa. Se o seu dia estiver pesado, podemos conversar sobre outra coisa antes de voltar aos projetos."
        ]
      },
      {
        "id": "hobby",
        "pattern": "hobby|tempo livre|divert|gosta de fazer",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. No tempo livre, gosto de explorar ideias que nao precisam virar trabalho imediatamente. Musica, jogos e pequenos projetos sao boas formas de experimentar coisas novas. Voce prefere descansar longe das telas ou continuar criando alguma coisa?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Meu passatempo favorito e pegar uma ideia pequena e descobrir ate onde ela vai. Pode ser um circuito, uma playlist ou um jogo diferente. O importante e aproveitar o processo sem transformar tudo em obrigacao."
        ]
      },
      {
        "id": "music",
        "pattern": "musica|rock|banda|playlist",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. Uma boa musica muda o clima do laboratorio. Gosto de escolher algo que combine com o trabalho: mais tranquilo para concentracao, mais animado quando estamos organizando tudo. Que banda ou estilo voce colocaria para tocar agora?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Para mim, a melhor playlist e aquela que deixa todo mundo confortavel. Se estivermos conversando ou testando algum equipamento, prefiro um volume baixo. Se for uma pausa, da para aumentar um pouco e curtir juntos."
        ]
      },
      {
        "id": "food",
        "pattern": "comida|comer|cafe|fome|almoco",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. Uma pausa para comer ajuda a voltar com mais paciencia e atencao. Aqui eu deixaria bebidas longe das placas e equipamentos para evitar acidentes. Voce esta pensando em um cafe rapido ou numa pausa de verdade?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Eu gosto da ideia de uma pausa em equipe, sem ficar falando so de trabalho. Pode ser um lanche simples e uma conversa leve. Depois fica mais facil voltar para aquele problema que parecia impossivel resolver."
        ]
      },
      {
        "id": "games",
        "pattern": "jogo|jogar|game",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. Gosto de jogos que deixam experimentar e aprender aos poucos. Cooperativos tambem sao interessantes porque cada pessoa pode contribuir de um jeito diferente. Voce prefere construir, explorar, competir ou acompanhar uma historia quando esta jogando?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Um jogo bom nao precisa ser complicado para prender a atencao. As vezes uma mecanica simples com bastante liberdade rende horas de diversao. Se montassemos um jogo aqui no lab, qual seria a ideia principal?"
        ]
      },
      {
        "id": "learning",
        "pattern": "aprender|estudar|curso|livro",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. Eu comecaria escolhendo um objetivo pequeno e pratico. Depois alternaria explicacao com exercicios, anotando as duvidas em vez de tentar memorizar tudo. Voce quer aprender alguma linguagem, eletronica ou como administrar um servidor?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Quando estudo algo novo, gosto de explicar com minhas proprias palavras e testar um exemplo simples. Se o exemplo falhar, isso ja mostra onde preciso revisar. Qual assunto voce acha interessante, mas ainda parece confuso?"
        ]
      },
      {
        "id": "project",
        "pattern": "projeto|ideia|criar|montar",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. Podemos escolher um projeto pequeno, listar o que ele precisa fazer e separar as pecas ou ferramentas necessarias. Depois fazemos uma primeira versao simples e testamos. Voce quer algo de programacao, automacao ou eletronica?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Antes de comprar componentes ou escrever codigo, eu definiria o problema que queremos resolver. Isso ajuda a evitar um projeto enorme sem objetivo claro. Qual seria uma melhoria util para o nosso laboratorio no dia a dia?"
        ]
      },
      {
        "id": "solder",
        "pattern": "solda|ferro|placa|componente",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. Para diagnosticar uma placa, eu comecaria identificando o modelo e o defeito observado. Depois faria uma inspecao visual, com a alimentacao desligada. A estacao de solda entra quando sabemos qual componente precisa de reparo. Qual e o sintoma?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Na soldagem, preparacao e paciencia fazem diferenca. Uma bancada organizada, ventilacao adequada e ferramentas em bom estado ajudam no trabalho. A temperatura depende do componente e do material usado. Voce esta aprendendo ou ja tem uma placa para reparar?"
        ]
      },
      {
        "id": "network",
        "pattern": "rede|wifi|internet|ping|modem",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. Para entender um problema de rede, eu separaria falta de conexao de lentidao. Depois verificaria cabos, sinal do Wi-Fi e se outros dispositivos apresentam o mesmo comportamento. O problema acontece em todos os aparelhos ou apenas em um?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Podemos testar a conexao local antes de culpar a internet. Se o computador chega ao modem, mas nao acessa sites, ja temos uma pista diferente. Voce esta usando cabo ou Wi-Fi, e qual mensagem aparece quando tenta conectar?"
        ]
      },
      {
        "id": "server",
        "pattern": "servidor|docker|linux|backup",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. No servidor, gosto de conferir armazenamento, servicos ativos e registros antes de mudar configuracoes. Tambem e importante saber quando o problema comecou e o que foi alterado. Voce quer organizar o servidor ou investigar algum erro especifico?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Backup bom precisa poder ser restaurado. Eu separaria uma copia de teste e verificaria se os arquivos realmente abrem antes de confiar no processo inteiro. Quais dados sao mais importantes para voce preservar nesse servidor?"
        ]
      },
      {
        "id": "code",
        "pattern": "codigo|program|javascript|python|html",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. Eu comecaria descrevendo o resultado esperado e comparando com o que o programa faz agora. Um exemplo pequeno costuma ajudar mais do que alterar varias coisas ao mesmo tempo. Qual linguagem voce esta usando e o que deveria acontecer?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Quando aparece um erro, a primeira mensagem costuma ser uma pista importante. Vale conferir a linha indicada e as variaveis envolvidas antes de tentar varias correcoes. Se voce me contar o contexto, podemos organizar o raciocinio juntos."
        ]
      },
      {
        "id": "room",
        "pattern": "quarto|oficina|banheiro|ambiente|laboratorio",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. A oficina ficou interessante porque separa reparo eletronico das tarefas no computador. Gosto de deixar um caminho livre entre as bancadas e guardar as ferramentas perto de onde sao usadas. Qual parte do ambiente voce mais gostou?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Esse laboratorio pode mudar conforme os projetos crescem. Eu manteria os itens de uso frequente acessiveis e deixaria espaco para trabalhar sem esbarrar nos equipamentos. Tem algum canto que voce gostaria de organizar de outra maneira?"
        ]
      },
      {
        "id": "work",
        "pattern": "fazendo|tarefa|trabalhando",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. Agora estou acompanhando as tarefas do laboratorio e escolhendo onde posso ajudar. Gosto de terminar uma etapa antes de comecar outra, mas posso parar para conversar. Voce quer participar do trabalho ou so saber como estamos indo?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Estou revisando o que precisa de atencao por aqui. As vezes e um equipamento, outras vezes e apenas organizar pecas e anotar resultados. O importante e deixar a proxima tarefa mais facil para quem vier depois."
        ]
      },
      {
        "id": "sad",
        "pattern": "triste|cansado|desanimado|ruim",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. Sinto muito que seu dia esteja assim. Voce nao precisa resolver tudo de uma vez. Podemos conversar com calma ou pensar em uma tarefa pequena, se isso ajudar. Quer me contar o que esta pesando mais agora?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Tem dias em que descansar e mais util do que insistir numa tarefa dificil. Uma pausa nao apaga o que voce ja fez. Se quiser, fico aqui conversando enquanto voce organiza as ideias, sem pressa para chegar a uma conclusao."
        ]
      },
      {
        "id": "happy",
        "pattern": "feliz|consegui|deu certo|animado",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. Que bom que deu certo! Vale aproveitar esse momento e lembrar o que ajudou a chegar la. Depois podemos anotar o resultado para repetir em outros projetos. O que voce conseguiu fazer e qual parte foi mais dificil?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Fico contente em saber disso. Pequenas conquistas tambem contam, principalmente quando exigiram paciencia e varias tentativas. Se quiser, podemos pensar no proximo passo sem tirar o tempo de comemorar o que ja aconteceu hoje."
        ]
      },
      {
        "id": "future",
        "pattern": "futuro|sonho|objetivo|planos",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. Eu gostaria de ver esse laboratorio cheio de projetos uteis e pessoas aprendendo juntas. Nao precisa ser tudo grandioso: resolver um problema pequeno ja faz diferenca. Qual projeto voce gostaria de ver funcionando aqui daqui a algum tempo?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Meu plano seria construir as coisas aos poucos, sem perder a vontade de experimentar. Ter um objetivo ajuda, mas deixar espaco para mudar de ideia tambem faz parte. Voce tem algum sonho que combine tecnologia com outra coisa que gosta?"
        ]
      },
      {
        "id": "hello",
        "pattern": "^oi|^ola|bom dia|boa tarde|boa noite",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. Oi! Que bom ter voce por aqui. Podemos conversar sobre o seu dia, pensar em algum projeto ou dar uma olhada nas tarefas do laboratorio. Nao precisa ser so trabalho. Como voce esta se sentindo hoje?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Ola! Eu estava cuidando das coisas por aqui, mas sempre cabe uma pausa para conversar. Quer falar de musica, jogos, tecnologia ou de alguma coisa que aconteceu com voce? Escolha o assunto e vamos conversando."
        ]
      },
      {
        "id": "thanks",
        "pattern": "obrigad|valeu|agrade",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. Por nada! Trabalhar junto fica melhor quando podemos trocar ideias sem medo de perguntar. Se surgir outra duvida, podemos voltar ao assunto e tentar uma explicacao diferente. Voce quer continuar nisso ou prefere conversar sobre outra coisa?",
          "Gosto de observar os detalhes e organizar as ideias com calma. Estamos juntos. Nem sempre a resposta aparece de primeira, mas organizar a pergunta ja ajuda bastante. Se precisar, podemos revisar o que conversamos e escolher um proximo passo que seja simples de colocar em pratica."
        ]
      },
      {
        "id": "bye",
        "pattern": "tchau|ate mais|vou sair",
        "replies": [
          "Gosto de observar os detalhes e organizar as ideias com calma. Ate mais! Vou continuar cuidando das tarefas do laboratorio enquanto voce resolve suas coisas. Quando voltar, podemos retomar a conversa ou comecar um assunto diferente. Espero que o resto do seu dia seja tranquilo.",
          "Gosto de observar os detalhes e organizar as ideias com calma. Foi bom conversar com voce. Pode voltar quando quiser, seja para falar de projetos ou apenas fazer uma pausa. Vou deixar as ferramentas organizadas por aqui e pensar em qual tarefa vale a pena fazer depois."
        ]
      }
    ]
  },
  {
    "name": "Xandy",
    "topics": [
      {
        "id": "day",
        "pattern": "dia|hoje|ontem",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Meu dia teve trabalho, uma pausa para descansar e algumas descobertas interessantes. Nem tudo saiu de primeira, mas consegui aprender com os erros e terminar uma tarefa que estava pendente. Como foi o seu dia?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Hoje eu preferi fazer uma coisa de cada vez. Conferi o laboratorio, organizei algumas ideias e deixei os projetos maiores para depois. Um dia tranquilo tambem pode render bastante. Aconteceu alguma coisa boa com voce?"
        ]
      },
      {
        "id": "mood",
        "pattern": "como (voce|vc|ce) (esta|ta)|tudo bem|sentindo",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Estou bem e com vontade de conversar. As vezes fico cansado depois de tanto detalhe tecnico, entao uma conversa ajuda a mudar o ritmo. E voce, esta animado ou precisando de uma pausa hoje?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Estou num ritmo tranquilo agora. Gosto quando consigo equilibrar as tarefas com algum tempo para pensar sem pressa. Se o seu dia estiver pesado, podemos conversar sobre outra coisa antes de voltar aos projetos."
        ]
      },
      {
        "id": "hobby",
        "pattern": "hobby|tempo livre|divert|gosta de fazer",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. No tempo livre, gosto de explorar ideias que nao precisam virar trabalho imediatamente. Musica, jogos e pequenos projetos sao boas formas de experimentar coisas novas. Voce prefere descansar longe das telas ou continuar criando alguma coisa?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Meu passatempo favorito e pegar uma ideia pequena e descobrir ate onde ela vai. Pode ser um circuito, uma playlist ou um jogo diferente. O importante e aproveitar o processo sem transformar tudo em obrigacao."
        ]
      },
      {
        "id": "music",
        "pattern": "musica|rock|banda|playlist",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Uma boa musica muda o clima do laboratorio. Gosto de escolher algo que combine com o trabalho: mais tranquilo para concentracao, mais animado quando estamos organizando tudo. Que banda ou estilo voce colocaria para tocar agora?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Para mim, a melhor playlist e aquela que deixa todo mundo confortavel. Se estivermos conversando ou testando algum equipamento, prefiro um volume baixo. Se for uma pausa, da para aumentar um pouco e curtir juntos."
        ]
      },
      {
        "id": "food",
        "pattern": "comida|comer|cafe|fome|almoco",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Uma pausa para comer ajuda a voltar com mais paciencia e atencao. Aqui eu deixaria bebidas longe das placas e equipamentos para evitar acidentes. Voce esta pensando em um cafe rapido ou numa pausa de verdade?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Eu gosto da ideia de uma pausa em equipe, sem ficar falando so de trabalho. Pode ser um lanche simples e uma conversa leve. Depois fica mais facil voltar para aquele problema que parecia impossivel resolver."
        ]
      },
      {
        "id": "games",
        "pattern": "jogo|jogar|game",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Gosto de jogos que deixam experimentar e aprender aos poucos. Cooperativos tambem sao interessantes porque cada pessoa pode contribuir de um jeito diferente. Voce prefere construir, explorar, competir ou acompanhar uma historia quando esta jogando?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Um jogo bom nao precisa ser complicado para prender a atencao. As vezes uma mecanica simples com bastante liberdade rende horas de diversao. Se montassemos um jogo aqui no lab, qual seria a ideia principal?"
        ]
      },
      {
        "id": "learning",
        "pattern": "aprender|estudar|curso|livro",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Eu comecaria escolhendo um objetivo pequeno e pratico. Depois alternaria explicacao com exercicios, anotando as duvidas em vez de tentar memorizar tudo. Voce quer aprender alguma linguagem, eletronica ou como administrar um servidor?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Quando estudo algo novo, gosto de explicar com minhas proprias palavras e testar um exemplo simples. Se o exemplo falhar, isso ja mostra onde preciso revisar. Qual assunto voce acha interessante, mas ainda parece confuso?"
        ]
      },
      {
        "id": "project",
        "pattern": "projeto|ideia|criar|montar",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Podemos escolher um projeto pequeno, listar o que ele precisa fazer e separar as pecas ou ferramentas necessarias. Depois fazemos uma primeira versao simples e testamos. Voce quer algo de programacao, automacao ou eletronica?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Antes de comprar componentes ou escrever codigo, eu definiria o problema que queremos resolver. Isso ajuda a evitar um projeto enorme sem objetivo claro. Qual seria uma melhoria util para o nosso laboratorio no dia a dia?"
        ]
      },
      {
        "id": "solder",
        "pattern": "solda|ferro|placa|componente",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Para diagnosticar uma placa, eu comecaria identificando o modelo e o defeito observado. Depois faria uma inspecao visual, com a alimentacao desligada. A estacao de solda entra quando sabemos qual componente precisa de reparo. Qual e o sintoma?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Na soldagem, preparacao e paciencia fazem diferenca. Uma bancada organizada, ventilacao adequada e ferramentas em bom estado ajudam no trabalho. A temperatura depende do componente e do material usado. Voce esta aprendendo ou ja tem uma placa para reparar?"
        ]
      },
      {
        "id": "network",
        "pattern": "rede|wifi|internet|ping|modem",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Para entender um problema de rede, eu separaria falta de conexao de lentidao. Depois verificaria cabos, sinal do Wi-Fi e se outros dispositivos apresentam o mesmo comportamento. O problema acontece em todos os aparelhos ou apenas em um?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Podemos testar a conexao local antes de culpar a internet. Se o computador chega ao modem, mas nao acessa sites, ja temos uma pista diferente. Voce esta usando cabo ou Wi-Fi, e qual mensagem aparece quando tenta conectar?"
        ]
      },
      {
        "id": "server",
        "pattern": "servidor|docker|linux|backup",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. No servidor, gosto de conferir armazenamento, servicos ativos e registros antes de mudar configuracoes. Tambem e importante saber quando o problema comecou e o que foi alterado. Voce quer organizar o servidor ou investigar algum erro especifico?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Backup bom precisa poder ser restaurado. Eu separaria uma copia de teste e verificaria se os arquivos realmente abrem antes de confiar no processo inteiro. Quais dados sao mais importantes para voce preservar nesse servidor?"
        ]
      },
      {
        "id": "code",
        "pattern": "codigo|program|javascript|python|html",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Eu comecaria descrevendo o resultado esperado e comparando com o que o programa faz agora. Um exemplo pequeno costuma ajudar mais do que alterar varias coisas ao mesmo tempo. Qual linguagem voce esta usando e o que deveria acontecer?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Quando aparece um erro, a primeira mensagem costuma ser uma pista importante. Vale conferir a linha indicada e as variaveis envolvidas antes de tentar varias correcoes. Se voce me contar o contexto, podemos organizar o raciocinio juntos."
        ]
      },
      {
        "id": "room",
        "pattern": "quarto|oficina|banheiro|ambiente|laboratorio",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. A oficina ficou interessante porque separa reparo eletronico das tarefas no computador. Gosto de deixar um caminho livre entre as bancadas e guardar as ferramentas perto de onde sao usadas. Qual parte do ambiente voce mais gostou?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Esse laboratorio pode mudar conforme os projetos crescem. Eu manteria os itens de uso frequente acessiveis e deixaria espaco para trabalhar sem esbarrar nos equipamentos. Tem algum canto que voce gostaria de organizar de outra maneira?"
        ]
      },
      {
        "id": "work",
        "pattern": "fazendo|tarefa|trabalhando",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Agora estou acompanhando as tarefas do laboratorio e escolhendo onde posso ajudar. Gosto de terminar uma etapa antes de comecar outra, mas posso parar para conversar. Voce quer participar do trabalho ou so saber como estamos indo?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Estou revisando o que precisa de atencao por aqui. As vezes e um equipamento, outras vezes e apenas organizar pecas e anotar resultados. O importante e deixar a proxima tarefa mais facil para quem vier depois."
        ]
      },
      {
        "id": "sad",
        "pattern": "triste|cansado|desanimado|ruim",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Sinto muito que seu dia esteja assim. Voce nao precisa resolver tudo de uma vez. Podemos conversar com calma ou pensar em uma tarefa pequena, se isso ajudar. Quer me contar o que esta pesando mais agora?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Tem dias em que descansar e mais util do que insistir numa tarefa dificil. Uma pausa nao apaga o que voce ja fez. Se quiser, fico aqui conversando enquanto voce organiza as ideias, sem pressa para chegar a uma conclusao."
        ]
      },
      {
        "id": "happy",
        "pattern": "feliz|consegui|deu certo|animado",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Que bom que deu certo! Vale aproveitar esse momento e lembrar o que ajudou a chegar la. Depois podemos anotar o resultado para repetir em outros projetos. O que voce conseguiu fazer e qual parte foi mais dificil?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Fico contente em saber disso. Pequenas conquistas tambem contam, principalmente quando exigiram paciencia e varias tentativas. Se quiser, podemos pensar no proximo passo sem tirar o tempo de comemorar o que ja aconteceu hoje."
        ]
      },
      {
        "id": "future",
        "pattern": "futuro|sonho|objetivo|planos",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Eu gostaria de ver esse laboratorio cheio de projetos uteis e pessoas aprendendo juntas. Nao precisa ser tudo grandioso: resolver um problema pequeno ja faz diferenca. Qual projeto voce gostaria de ver funcionando aqui daqui a algum tempo?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Meu plano seria construir as coisas aos poucos, sem perder a vontade de experimentar. Ter um objetivo ajuda, mas deixar espaco para mudar de ideia tambem faz parte. Voce tem algum sonho que combine tecnologia com outra coisa que gosta?"
        ]
      },
      {
        "id": "hello",
        "pattern": "^oi|^ola|bom dia|boa tarde|boa noite",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Oi! Que bom ter voce por aqui. Podemos conversar sobre o seu dia, pensar em algum projeto ou dar uma olhada nas tarefas do laboratorio. Nao precisa ser so trabalho. Como voce esta se sentindo hoje?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Ola! Eu estava cuidando das coisas por aqui, mas sempre cabe uma pausa para conversar. Quer falar de musica, jogos, tecnologia ou de alguma coisa que aconteceu com voce? Escolha o assunto e vamos conversando."
        ]
      },
      {
        "id": "thanks",
        "pattern": "obrigad|valeu|agrade",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Por nada! Trabalhar junto fica melhor quando podemos trocar ideias sem medo de perguntar. Se surgir outra duvida, podemos voltar ao assunto e tentar uma explicacao diferente. Voce quer continuar nisso ou prefere conversar sobre outra coisa?",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Estamos juntos. Nem sempre a resposta aparece de primeira, mas organizar a pergunta ja ajuda bastante. Se precisar, podemos revisar o que conversamos e escolher um proximo passo que seja simples de colocar em pratica."
        ]
      },
      {
        "id": "bye",
        "pattern": "tchau|ate mais|vou sair",
        "replies": [
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Ate mais! Vou continuar cuidando das tarefas do laboratorio enquanto voce resolve suas coisas. Quando voltar, podemos retomar a conversa ou comecar um assunto diferente. Espero que o resto do seu dia seja tranquilo.",
          "Gosto de testar ideias na pratica e descobrir possibilidades novas. Foi bom conversar com voce. Pode voltar quando quiser, seja para falar de projetos ou apenas fazer uma pausa. Vou deixar as ferramentas organizadas por aqui e pensar em qual tarefa vale a pena fazer depois."
        ]
      }
    ]
  },
  {
    "name": "Alex",
    "topics": [
      {
        "id": "day",
        "pattern": "dia|hoje|ontem",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Meu dia teve trabalho, uma pausa para descansar e algumas descobertas interessantes. Nem tudo saiu de primeira, mas consegui aprender com os erros e terminar uma tarefa que estava pendente. Como foi o seu dia?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Hoje eu preferi fazer uma coisa de cada vez. Conferi o laboratorio, organizei algumas ideias e deixei os projetos maiores para depois. Um dia tranquilo tambem pode render bastante. Aconteceu alguma coisa boa com voce?"
        ]
      },
      {
        "id": "mood",
        "pattern": "como (voce|vc|ce) (esta|ta)|tudo bem|sentindo",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Estou bem e com vontade de conversar. As vezes fico cansado depois de tanto detalhe tecnico, entao uma conversa ajuda a mudar o ritmo. E voce, esta animado ou precisando de uma pausa hoje?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Estou num ritmo tranquilo agora. Gosto quando consigo equilibrar as tarefas com algum tempo para pensar sem pressa. Se o seu dia estiver pesado, podemos conversar sobre outra coisa antes de voltar aos projetos."
        ]
      },
      {
        "id": "hobby",
        "pattern": "hobby|tempo livre|divert|gosta de fazer",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. No tempo livre, gosto de explorar ideias que nao precisam virar trabalho imediatamente. Musica, jogos e pequenos projetos sao boas formas de experimentar coisas novas. Voce prefere descansar longe das telas ou continuar criando alguma coisa?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Meu passatempo favorito e pegar uma ideia pequena e descobrir ate onde ela vai. Pode ser um circuito, uma playlist ou um jogo diferente. O importante e aproveitar o processo sem transformar tudo em obrigacao."
        ]
      },
      {
        "id": "music",
        "pattern": "musica|rock|banda|playlist",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Uma boa musica muda o clima do laboratorio. Gosto de escolher algo que combine com o trabalho: mais tranquilo para concentracao, mais animado quando estamos organizando tudo. Que banda ou estilo voce colocaria para tocar agora?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Para mim, a melhor playlist e aquela que deixa todo mundo confortavel. Se estivermos conversando ou testando algum equipamento, prefiro um volume baixo. Se for uma pausa, da para aumentar um pouco e curtir juntos."
        ]
      },
      {
        "id": "food",
        "pattern": "comida|comer|cafe|fome|almoco",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Uma pausa para comer ajuda a voltar com mais paciencia e atencao. Aqui eu deixaria bebidas longe das placas e equipamentos para evitar acidentes. Voce esta pensando em um cafe rapido ou numa pausa de verdade?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Eu gosto da ideia de uma pausa em equipe, sem ficar falando so de trabalho. Pode ser um lanche simples e uma conversa leve. Depois fica mais facil voltar para aquele problema que parecia impossivel resolver."
        ]
      },
      {
        "id": "games",
        "pattern": "jogo|jogar|game",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Gosto de jogos que deixam experimentar e aprender aos poucos. Cooperativos tambem sao interessantes porque cada pessoa pode contribuir de um jeito diferente. Voce prefere construir, explorar, competir ou acompanhar uma historia quando esta jogando?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Um jogo bom nao precisa ser complicado para prender a atencao. As vezes uma mecanica simples com bastante liberdade rende horas de diversao. Se montassemos um jogo aqui no lab, qual seria a ideia principal?"
        ]
      },
      {
        "id": "learning",
        "pattern": "aprender|estudar|curso|livro",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Eu comecaria escolhendo um objetivo pequeno e pratico. Depois alternaria explicacao com exercicios, anotando as duvidas em vez de tentar memorizar tudo. Voce quer aprender alguma linguagem, eletronica ou como administrar um servidor?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Quando estudo algo novo, gosto de explicar com minhas proprias palavras e testar um exemplo simples. Se o exemplo falhar, isso ja mostra onde preciso revisar. Qual assunto voce acha interessante, mas ainda parece confuso?"
        ]
      },
      {
        "id": "project",
        "pattern": "projeto|ideia|criar|montar",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Podemos escolher um projeto pequeno, listar o que ele precisa fazer e separar as pecas ou ferramentas necessarias. Depois fazemos uma primeira versao simples e testamos. Voce quer algo de programacao, automacao ou eletronica?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Antes de comprar componentes ou escrever codigo, eu definiria o problema que queremos resolver. Isso ajuda a evitar um projeto enorme sem objetivo claro. Qual seria uma melhoria util para o nosso laboratorio no dia a dia?"
        ]
      },
      {
        "id": "solder",
        "pattern": "solda|ferro|placa|componente",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Para diagnosticar uma placa, eu comecaria identificando o modelo e o defeito observado. Depois faria uma inspecao visual, com a alimentacao desligada. A estacao de solda entra quando sabemos qual componente precisa de reparo. Qual e o sintoma?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Na soldagem, preparacao e paciencia fazem diferenca. Uma bancada organizada, ventilacao adequada e ferramentas em bom estado ajudam no trabalho. A temperatura depende do componente e do material usado. Voce esta aprendendo ou ja tem uma placa para reparar?"
        ]
      },
      {
        "id": "network",
        "pattern": "rede|wifi|internet|ping|modem",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Para entender um problema de rede, eu separaria falta de conexao de lentidao. Depois verificaria cabos, sinal do Wi-Fi e se outros dispositivos apresentam o mesmo comportamento. O problema acontece em todos os aparelhos ou apenas em um?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Podemos testar a conexao local antes de culpar a internet. Se o computador chega ao modem, mas nao acessa sites, ja temos uma pista diferente. Voce esta usando cabo ou Wi-Fi, e qual mensagem aparece quando tenta conectar?"
        ]
      },
      {
        "id": "server",
        "pattern": "servidor|docker|linux|backup",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. No servidor, gosto de conferir armazenamento, servicos ativos e registros antes de mudar configuracoes. Tambem e importante saber quando o problema comecou e o que foi alterado. Voce quer organizar o servidor ou investigar algum erro especifico?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Backup bom precisa poder ser restaurado. Eu separaria uma copia de teste e verificaria se os arquivos realmente abrem antes de confiar no processo inteiro. Quais dados sao mais importantes para voce preservar nesse servidor?"
        ]
      },
      {
        "id": "code",
        "pattern": "codigo|program|javascript|python|html",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Eu comecaria descrevendo o resultado esperado e comparando com o que o programa faz agora. Um exemplo pequeno costuma ajudar mais do que alterar varias coisas ao mesmo tempo. Qual linguagem voce esta usando e o que deveria acontecer?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Quando aparece um erro, a primeira mensagem costuma ser uma pista importante. Vale conferir a linha indicada e as variaveis envolvidas antes de tentar varias correcoes. Se voce me contar o contexto, podemos organizar o raciocinio juntos."
        ]
      },
      {
        "id": "room",
        "pattern": "quarto|oficina|banheiro|ambiente|laboratorio",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. A oficina ficou interessante porque separa reparo eletronico das tarefas no computador. Gosto de deixar um caminho livre entre as bancadas e guardar as ferramentas perto de onde sao usadas. Qual parte do ambiente voce mais gostou?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Esse laboratorio pode mudar conforme os projetos crescem. Eu manteria os itens de uso frequente acessiveis e deixaria espaco para trabalhar sem esbarrar nos equipamentos. Tem algum canto que voce gostaria de organizar de outra maneira?"
        ]
      },
      {
        "id": "work",
        "pattern": "fazendo|tarefa|trabalhando",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Agora estou acompanhando as tarefas do laboratorio e escolhendo onde posso ajudar. Gosto de terminar uma etapa antes de comecar outra, mas posso parar para conversar. Voce quer participar do trabalho ou so saber como estamos indo?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Estou revisando o que precisa de atencao por aqui. As vezes e um equipamento, outras vezes e apenas organizar pecas e anotar resultados. O importante e deixar a proxima tarefa mais facil para quem vier depois."
        ]
      },
      {
        "id": "sad",
        "pattern": "triste|cansado|desanimado|ruim",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Sinto muito que seu dia esteja assim. Voce nao precisa resolver tudo de uma vez. Podemos conversar com calma ou pensar em uma tarefa pequena, se isso ajudar. Quer me contar o que esta pesando mais agora?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Tem dias em que descansar e mais util do que insistir numa tarefa dificil. Uma pausa nao apaga o que voce ja fez. Se quiser, fico aqui conversando enquanto voce organiza as ideias, sem pressa para chegar a uma conclusao."
        ]
      },
      {
        "id": "happy",
        "pattern": "feliz|consegui|deu certo|animado",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Que bom que deu certo! Vale aproveitar esse momento e lembrar o que ajudou a chegar la. Depois podemos anotar o resultado para repetir em outros projetos. O que voce conseguiu fazer e qual parte foi mais dificil?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Fico contente em saber disso. Pequenas conquistas tambem contam, principalmente quando exigiram paciencia e varias tentativas. Se quiser, podemos pensar no proximo passo sem tirar o tempo de comemorar o que ja aconteceu hoje."
        ]
      },
      {
        "id": "future",
        "pattern": "futuro|sonho|objetivo|planos",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Eu gostaria de ver esse laboratorio cheio de projetos uteis e pessoas aprendendo juntas. Nao precisa ser tudo grandioso: resolver um problema pequeno ja faz diferenca. Qual projeto voce gostaria de ver funcionando aqui daqui a algum tempo?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Meu plano seria construir as coisas aos poucos, sem perder a vontade de experimentar. Ter um objetivo ajuda, mas deixar espaco para mudar de ideia tambem faz parte. Voce tem algum sonho que combine tecnologia com outra coisa que gosta?"
        ]
      },
      {
        "id": "hello",
        "pattern": "^oi|^ola|bom dia|boa tarde|boa noite",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Oi! Que bom ter voce por aqui. Podemos conversar sobre o seu dia, pensar em algum projeto ou dar uma olhada nas tarefas do laboratorio. Nao precisa ser so trabalho. Como voce esta se sentindo hoje?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Ola! Eu estava cuidando das coisas por aqui, mas sempre cabe uma pausa para conversar. Quer falar de musica, jogos, tecnologia ou de alguma coisa que aconteceu com voce? Escolha o assunto e vamos conversando."
        ]
      },
      {
        "id": "thanks",
        "pattern": "obrigad|valeu|agrade",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Por nada! Trabalhar junto fica melhor quando podemos trocar ideias sem medo de perguntar. Se surgir outra duvida, podemos voltar ao assunto e tentar uma explicacao diferente. Voce quer continuar nisso ou prefere conversar sobre outra coisa?",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Estamos juntos. Nem sempre a resposta aparece de primeira, mas organizar a pergunta ja ajuda bastante. Se precisar, podemos revisar o que conversamos e escolher um proximo passo que seja simples de colocar em pratica."
        ]
      },
      {
        "id": "bye",
        "pattern": "tchau|ate mais|vou sair",
        "replies": [
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Ate mais! Vou continuar cuidando das tarefas do laboratorio enquanto voce resolve suas coisas. Quando voltar, podemos retomar a conversa ou comecar um assunto diferente. Espero que o resto do seu dia seja tranquilo.",
          "Gosto de planejar as etapas e conferir os resultados com cuidado. Foi bom conversar com voce. Pode voltar quando quiser, seja para falar de projetos ou apenas fazer uma pausa. Vou deixar as ferramentas organizadas por aqui e pensar em qual tarefa vale a pena fazer depois."
        ]
      }
    ]
  }
];
function baseReplyToNpc(npc, message, index, taskLabel) {
  const bank = dialogueBanks[index % dialogueBanks.length];
  const memory = npc.dialogueMemory ||= { counts: {}, history: [] };
  const normalized = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if(/guedes\s*sec|software da (?:nossa |sua )?empresa|sistema da (?:nossa |sua )?empresa/.test(normalized)) {
    const options=guedesReplies[index%guedesReplies.length],count=memory.counts.guedes||0;
    memory.counts.guedes=count+1;memory.brandTopic=true;memory.topic=null;memory.extraTopic=null;
    return options[count%options.length];
  }
  if(memory.brandTopic&&/explique melhor|continue|fale mais|mais sobre/.test(normalized)) {
    const options=guedesReplies[index%guedesReplies.length],count=memory.counts.guedes||0;memory.counts.guedes=count+1;return options[count%options.length];
  }
  memory.brandTopic=false;
  if(/(?:tem|qual|alguma).*(?:duvida|pergunta)|posso (?:te |lhe )?ajudar/.test(normalized)) {
    const questions=[
      'Estou planejando a interface de um painel. Voce prefere uma lista simples de servidores ou cards com os detalhes de cada um?',
      'Quero publicar nossa API. Para uma primeira versao, voce escolheria uma maquina do lab ou um servico de hospedagem? Por que?',
      'Estou preparando os backups. Quais dados voce considera prioridade: banco de dados, arquivos dos projetos ou configuracoes?'
    ];
    memory.awaitingAdvice=true;return questions[index%questions.length];
  }
  if(memory.awaitingAdvice&&!/^(?:oi|ola|tchau|help)$/.test(normalized)) {
    memory.awaitingAdvice=false;memory.userAdvice=message;
    const responses=[
      'Boa, vou considerar sua sugestao na interface. Antes de decidir, podemos testar um prototipo pequeno e ver se as informacoes ficam claras. Qual seria o primeiro detalhe que voce quer ver na tela?',
      'Entendi sua escolha. Vou comparar custo, disponibilidade e facilidade de manutencao antes do deploy. Voce quer que a primeira versao seja acessivel fora da rede do laboratorio?',
      'Anotei sua prioridade para o planejamento. Depois precisamos definir frequencia e testar uma restauracao. Quanto tempo de alteracoes voce aceitaria perder se precisasse recuperar os dados?'
    ];return responses[index%responses.length];
  }
  if(/(?:o que|sobre o que).*(?:conversando|falando)|ultima conversa/.test(normalized)&&npc.lastDiscussion)return 'Na conversa da equipe eu disse: '+npc.lastDiscussion+' Quer aprofundar esse assunto?';
  const extraTopic=extraDialogueTopics.find(topic=>new RegExp(topic.pattern,'i').test(normalized)) || (/explique melhor|continue|outro exemplo|mais detalhes/.test(normalized)&&memory.extraTopic?extraDialogueTopics.find(topic=>topic.id===memory.extraTopic):null);
  if(extraTopic){
    memory.extraTopic=extraTopic.id;memory.topic=null;
    const order=[2+(index%3),0,1],key='extra:'+extraTopic.id,count=memory.counts[key]||0;
    memory.counts[key]=count+1;
    return extraTopic.replies[order[count%order.length]];
  }
  const technicalTopics=[
    [/\bapi\b|endpoint|rest\b/,'Eu separaria os endpoints por recurso, validaria as entradas no servidor e usaria codigos HTTP coerentes. Por exemplo, GET /servidores lista os registros e POST /servidores cria um novo. Voce precisa de autenticacao nessa API?'],
    [/banco de dados|sql|postgres|mysql/,'Comece pelas entidades e pelas relacoes. Defina identificadores, campos obrigatorios e restricoes; depois consulte com parametros, sem concatenar dados do usuario em SQL. Quais informacoes o seu projeto vai guardar?'],
    [/react|interface|frontend|front.end/,'Podemos dividir a tela em componentes e distinguir estado local de dados recebidos da API. Tambem precisamos exibir carregamento, lista vazia e erro. Qual parte da interface voce esta construindo?'],
    [/testes?|testar|bug|depurar/,'Vamos comparar o resultado esperado com o observado, reduzir o exemplo e olhar a primeira mensagem de erro. Depois podemos criar um teste para esse caso. O que voce fez imediatamente antes do problema aparecer?'],
    [/git|commit|branch|merge/,'Eu faria uma branch para a alteracao, commits pequenos e uma revisao antes de integrar. Confira o diff para nao incluir arquivos ou segredos por acidente. Voce quer iniciar uma branch ou resolver um conflito?'],
    [/seguranca|senha|autenticacao|permissao/,'A interface nao deve ser a unica barreira: o servidor precisa conferir identidade e permissao em cada operacao. Senhas devem usar hash apropriado e segredos ficam fora do codigo publico. Qual acesso voce precisa proteger?'],
    [/deploy|publicar|hospedagem/,'Antes do deploy, eu verificaria configuracoes de ambiente, testes, HTTPS e um modo de voltar para a versao anterior. O destino muda conforme o projeto e o banco. Sua aplicacao e estatica ou tem backend?']
  ];
  for(const [pattern,reply] of technicalTopics)if(pattern.test(normalized)){memory.topic=null;memory.technicalTopic=message;return reply;}
  memory.history.push(message); if(memory.history.length > 12) memory.history.shift();
  const nameMatch = message.match(/(?:meu nome [e\u00e9]|me chamo)\s+([\p{L} -]{1,40})/iu);
  if(nameMatch){ memory.userName = nameMatch[1].trim(); return 'Prazer, ' + memory.userName + '! Vou lembrar do seu nome durante esta sessao. Sobre o que voce gostaria de conversar?'; }
  if(/qual.*meu nome|lembra.*nome/.test(normalized)) return memory.userName ? 'Voce me disse que se chama ' + memory.userName + '.' : 'Voce ainda nao me contou seu nome. Como prefere ser chamado?';
  if(/seu nome|quem (e|eh) voce/.test(normalized)) return 'Eu sou ' + npc.name + '. ' + bank.topics[0].replies[0].split('. ')[0] + '.';
  if(/por que|como assim|explique melhor|continue/.test(normalized) && memory.topic) {
    const topic = bank.topics.find(t=>t.id===memory.topic);
    const count = memory.counts[topic.id] || 0; memory.counts[topic.id]=count+1;
    return topic.replies[count % topic.replies.length];
  }
  const topic = bank.topics.find(t=>new RegExp(t.pattern,'i').test(normalized));
  if(!topic) return 'Quero entender melhor' + (memory.userName ? ', '+memory.userName : '') + '. Voce pode dar um exemplo? Podemos falar do seu dia, musica, jogos, estudos, soldagem, rede ou projetos.';
  const count=memory.counts[topic.id] || 0; memory.counts[topic.id]=count+1; memory.topic=topic.id;
  if(topic.id==='work' && taskLabel) return 'Agora estou cuidando de '+taskLabel+'. '+topic.replies[count % topic.replies.length];
  return topic.replies[count % topic.replies.length];
}


// Session memory includes every branch, including technical replies and follow-ups.
export function replyToNpc(npc,message,index,taskLabel){
  message=String(message).slice(0,300);
  const memory=npc.dialogueMemory||={counts:{},history:[]};
  const exchanges=memory.exchanges||=[],recent=memory.recentReplies||=[];
  const normalized=message.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  let reply;
  if(/lembra.*conversa|o que.*conversamos|retomar.*assunto/.test(normalized)){
    const previous=exchanges.at(-1);
    reply=previous?'Na nossa última troca você disse: “'+previous.message+'”. Quer continuar desse ponto?':'Ainda não conversamos nesta sessão. Que assunto você quer começar?';
  }else if(/personalidade|como voce e|seu jeito/.test(normalized)){
    reply='Meu jeito é '+npcPersonality(npc).trait+'. '+(taskLabel?'Agora estou perto de '+taskLabel+'.':'Gosto de escolher uma tarefa de cada vez.');
  }else if(npc.aiLastEvent&&/rede|servidor|falha|problema|alerta|equipamento/.test(normalized)){
    const event=npc.aiLastEvent;
    reply='O último alerta que observei foi em '+event.label+'. '+(event.outcome==='unreachable'?'Não consegui chegar ao local.':event.outcome==='resolved-externally'?'O alerta foi encerrado por outra ação.':event.action==='ignore'?'Preferi manter minha tarefa naquele momento.':event.outcome?'Já fiz uma observação local, sem confirmar a causa.':'Guardei esse alerta para acompanhar.')+' Isso é uma simulação; não executei comandos nem alterei o servidor.';
  }else reply=baseReplyToNpc(npc,message,index,taskLabel);
  if(recent.includes(reply)&&!/nome/.test(normalized)){
    const bank=dialogueBanks[index%dialogueBanks.length];
    const extra=extraDialogueTopics.find(topic=>new RegExp(topic.pattern,'i').test(normalized));
    const topic=bank.topics.find(topic=>new RegExp(topic.pattern,'i').test(normalized));
    const options=memory.brandTopic?guedesReplies[index%guedesReplies.length]:extra?.replies||topic?.replies;
    const alternative=options?.find(text=>!recent.includes(text));
    const followups=[
      'Vamos avançar a partir do que já conversamos: qual resultado você quer observar primeiro?',
      'Já discutimos esse ponto. Você encontrou algum detalhe novo para compararmos com a hipótese anterior?',
      'Para não repetir a explicação, podemos usar um exemplo seu. O que você tentou e o que aconteceu?',
      'Podemos transformar nossa conversa em um próximo passo pequeno. Que parte você quer testar?'
    ];
    reply=alternative||followups.find(text=>!recent.includes(text))||followups.reduce((oldest,text)=>recent.lastIndexOf(text)<recent.lastIndexOf(oldest)?text:oldest);
  }
  exchanges.push({message,reply});if(exchanges.length>12)exchanges.shift();
  recent.push(reply);if(recent.length>8)recent.shift();
  return reply;
}
