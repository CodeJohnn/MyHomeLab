export const extraDialogueTopics = [
  {
    "id": "design",
    "pattern": "design|cores|tipografia|layout",
    "replies": [
      "Eu começaria pela hierarquia: o que a pessoa precisa enxergar primeiro? Depois escolheria poucas cores, espaçamentos consistentes e textos claros. Um protótipo simples já ajuda a descobrir o que está confuso.",
      "Uma tela bonita também precisa ser fácil de usar. Vale testar contraste, tamanho dos botões e leitura no celular. Qual parte do layout está parecendo poluída para você?",
      "Na interface, eu prefiro mostrar apenas as ações importantes naquele momento. O restante pode ficar em uma seção recolhida, sem desaparecer completamente.",
      "Posso ajudar ligando o layout aos dados reais. Antes disso, precisamos combinar como ficam carregamento, erro e ausência de resultados.",
      "Eu revisaria também os caminhos de saída. Uma ação importante precisa explicar o resultado e permitir voltar quando isso fizer sentido."
    ]
  },
  {
    "id": "accessibility",
    "pattern": "acessibilidade|leitor de tela|daltonismo",
    "replies": [
      "Acessibilidade começa com navegação por teclado, foco visível e nomes claros nos controles. Não devemos depender somente da cor para avisar que algo deu certo ou errado.",
      "Podemos testar uma tarefa sem usar o mouse. Se ficar difícil saber onde estamos ou acionar um botão, já temos uma melhoria concreta para fazer. Qual tarefa você quer testar?",
      "Eu daria atenção especial aos rótulos dos campos e ?s mensagens de erro. A pessoa precisa entender o problema sem adivinhar.",
      "Nos componentes, eu usaria os elementos nativos antes de inventar controles. Botões e formulários já oferecem comportamentos ?teis para teclado.",
      "Eu colocaria esses testes no checklist de revisão. Acessibilidade deve acompanhar o projeto, em vez de virar uma correção no final."
    ]
  },
  {
    "id": "performance",
    "pattern": "performance|desempenho|travando|lentidao|fps",
    "replies": [
      "Primeiro precisamos medir. Um travamento pode vir da renderização, de cálculos repetidos ou de uma requisição. Alterar tudo ao mesmo tempo dificulta descobrir qual mudança realmente ajudou.",
      "Eu tentaria reproduzir o problema em uma situação pequena e observar quando acontece. ? ao abrir a página, mover a câmera ou carregar conteúdo? Cada caso aponta para um lugar diferente.",
      "Na interface, podemos evitar redesenhar partes que não mudaram e manter o retorno das ações visível enquanto o trabalho termina.",
      "Eu procuraria operações dentro do loop principal. Recalcular muitos objetos a cada quadro costuma custar mais do que parece.",
      "Depois da otimização, precisamos repetir a mesma medição. Uma impressão de velocidade ? ?til, mas números ajudam a comparar com segurança."
    ]
  },
  {
    "id": "containers",
    "pattern": "container|docker|compose|imagem docker",
    "replies": [
      "Um contêiner ajuda a separar a aplicação e suas dependências. Ainda precisamos cuidar dos volumes, variáveis de ambiente e portas para que os dados não desapareçam quando ele for recriado.",
      "Eu separaria os serviços em aplicação, banco e proxy quando o projeto exigir isso. A comunicação entre eles deve ser explícita, sem expor todas as portas para fora da máquina.",
      "Para quem desenvolve a interface, um ambiente reproduzível evita diferenças inesperadas entre o computador de cada pessoa.",
      "Podemos começar com um arquivo Compose pequeno e documentar como subir, parar e consultar os logs. Qual serviço você quer colocar nele?",
      "Eu verificaria permissões, credenciais e persistência antes de tratar o ambiente como pronto. Ter um contêiner rodando não garante que a aplicação está saudável."
    ]
  },
  {
    "id": "documentation",
    "pattern": "documentacao|readme|documentar",
    "replies": [
      "Uma boa documentação responde como instalar, configurar e executar o projeto. Também explica os problemas conhecidos e como verificar se a primeira execução funcionou.",
      "Eu escreveria para alguém que nunca viu o código. Se uma etapa depende de algo que só está na nossa cabeça, vale transformar isso em instrução ou exemplo.",
      "Capturas e pequenos exemplos ajudam bastante quando a dúvida envolve uma tela. Mas o texto também precisa continuar compreensível sem a imagem.",
      "Para a API, eu documentaria os dados de entrada, exemplos de resposta e erros esperados. Isso reduz perguntas repetidas durante a integração.",
      "Eu registraria decisões importantes e procedimentos de recuperação. Quando surge um incidente, ninguém deveria precisar reconstruir todo o contexto de memória."
    ]
  },
  {
    "id": "planning",
    "pattern": "prazo|cronograma|prioridade|planejamento|organizar projeto",
    "replies": [
      "Eu dividiria o trabalho em entregas pequenas e verificáveis. Cada tarefa precisa dizer o que muda e como vamos saber que terminou. Isso evita cartões enormes que nunca saem do lugar.",
      "Podemos separar o que ? essencial para a primeira versão do que seria agradável ter depois. Qual problema precisa estar resolvido para você considerar essa entrega ?til?",
      "Eu começaria pelo fluxo principal da interface e deixaria os detalhes decorativos para quando ele estiver funcionando.",
      "Eu avaliaria as dependências entre tarefas. ?s vezes uma preparação pequena desbloqueia várias pessoas e merece vir antes.",
      "Eu reservaria tempo para testes e revisão. Um cronograma que considera somente escrever código costuma esquecer uma parte importante do trabalho."
    ]
  },
  {
    "id": "career",
    "pattern": "carreira|portfolio|curriculo|entrevista|emprego",
    "replies": [
      "Um portfólio fica mais claro quando explica o problema, sua participação e o resultado. Mostrar decisões e limitações ajuda mais do que apresentar somente uma lista de ferramentas.",
      "Para treinar uma entrevista, podemos pegar um projeto seu e explicar por que ele foi feito daquele jeito. Não precisa decorar um discurso; precisa conseguir acompanhar o raciocínio.",
      "Eu escolheria poucos projetos bem apresentados, com imagens legíveis e uma descrição direta. Qual deles representa melhor o que você quer fazer profissionalmente?",
      "Eu incluiria instruções para executar o projeto e exemplos do que ele faz. Um repositório acessível fica mais fácil de avaliar.",
      "Saber dizer o que você ainda não domina também faz parte. Podemos separar experiência prática, estudo e assuntos que deseja aprender."
    ]
  },
  {
    "id": "teamwork",
    "pattern": "equipe|trabalhar junto|colaborar|conflito",
    "replies": [
      "Uma equipe trabalha melhor quando combina expectativas e compartilha o contexto. Perguntar cedo evita que duas pessoas resolvam o mesmo problema de formas incompatíveis.",
      "Quando discordamos, eu tentaria comparar as opções com o objetivo do projeto. Podemos fazer um teste pequeno em vez de transformar preferência pessoal em regra definitiva.",
      "Eu gosto de revisar a experiência completa com quem vai usar. Isso ajuda a enxergar detalhes que passam despercebidos olhando apenas uma tela.",
      "Eu separaria as interfaces entre as partes e combinaria responsabilidades. Assim cada pessoa pode avançar sem precisar alterar tudo ao mesmo tempo.",
      "Eu registraria o acordo e o próximo passo. Uma boa conversa perde valor se ninguém sabe o que ficou decidido depois dela."
    ]
  },
  {
    "id": "rest",
    "pattern": "descansar|pausa|fim de semana|ferias",
    "replies": [
      "Uma pausa pode ajudar a enxergar um problema de outro jeito. Não precisamos transformar cada intervalo em outra tarefa; ?s vezes ? melhor simplesmente mudar de ambiente por alguns minutos.",
      "Eu tentaria encerrar o trabalho anotando o próximo passo. Assim fica mais fácil descansar sem continuar repetindo mentalmente tudo o que falta fazer.",
      "Eu gosto de alternar coisas: ouvir música, conversar e passar um tempo longe da tela. O que costuma ajudar você a desligar?",
      "?s vezes eu tenho vontade de mexer em um projeto pessoal, mas sem cobrança de terminar. Explorar também pode ser uma forma de descansar.",
      "Eu prefiro uma rotina com pausas reais a insistir até perder a atenção. Voltar com a cabeça mais tranquila costuma melhorar o trabalho."
    ]
  },
  {
    "id": "hardware",
    "pattern": "processador|memoria ram|placa de video|ssd|hardware",
    "replies": [
      "Antes de mudar uma peça, eu olharia qual tarefa está limitada. Uso de memória, armazenamento e processamento contam histórias diferentes. Qual programa ou situação está apresentando dificuldade?",
      "Comparar componentes sem entender o uso pode levar a uma troca que não resolve o problema. Vale observar temperatura, espaço disponível e carga durante a tarefa que incomoda.",
      "Para o meu trabalho, fluidez ao testar a interface importa bastante. Mas eu não escolheria uma configuração só pela aparência do gabinete.",
      "Eu pensaria também em compatibilidade e possibilidade de expansão. A peça precisa funcionar com o conjunto, não apenas parecer melhor isoladamente.",
      "Eu verificaria os sintomas antes de concluir que uma peça estragou. Registros e testes controlados ajudam a evitar substituições desnecessárias."
    ]
  },
  {
    "id": "reading",
    "pattern": "leitura|ler livro|recomenda ler|estante",
    "replies": [
      "Eu gosto de ler com uma pergunta em mente e anotar ideias que possam ser testadas depois. Isso transforma uma leitura técnica em algo que consigo relacionar com um projeto real.",
      "Não precisamos terminar um livro inteiro antes de experimentar um conceito. Um exemplo pequeno depois de cada parte pode mostrar o que ficou claro e o que merece revisão.",
      "No canto de leitura, eu começaria por um assunto que desperte curiosidade. Aprender fica mais leve quando existe uma pergunta de verdade.",
      "Eu compararia a explicação do livro com um teste prático. Se o resultado for diferente, temos um bom motivo para investigar os detalhes.",
      "Eu anotaria também as condições em que uma técnica funciona. Uma ideia ?til em um contexto pode precisar de adaptação em outro."
    ]
  },
  {
    "id": "observability",
    "pattern": "log|monitoramento|metrica|alerta",
    "replies": [
      "Logs explicam eventos, métricas mostram tendências e alertas chamam atenção para situações que exigem ação. Não adianta guardar muitos dados se ninguém consegue interpretar o que eles significam.",
      "Eu começaria pelas perguntas: o serviço responde, quanto demora e quantas requisições falham? Depois acrescentaria detalhes conforme aparecem necessidades reais do projeto.",
      "No painel, eu mostraria poucos indicadores importantes e deixaria os detalhes acessíveis por seleção. Isso evita uma tela cheia de números sem prioridade.",
      "Eu incluiria horário e contexto nos registros para conseguir acompanhar uma operação entre serviços. Precisamos tomar cuidado para não registrar senhas ou dados sensíveis.",
      "Um alerta precisa ter uma ação possível. Se ele dispara o tempo todo sem ajudar a resolver nada, as pessoas acabam deixando de prestar atenção."
    ]
  }
];
