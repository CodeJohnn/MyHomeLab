export function createAdminTerminal(getServers, recovery = {}) {
  const puzzles = [
    {question:'O serviço inicia se REDE && (PRIMARIO || BACKUP). REDE=true, PRIMARIO=false, BACKUP=true. Qual o resultado? Responda verdadeiro ou falso.', answer:'verdadeiro', hint:'Resolva primeiro o trecho entre parênteses. Basta um dos dois servidores estar disponível.'},
    {question:'O contador de tentativas começa em 2. O código repete 3 vezes: tentativas = tentativas * 2. Qual o valor final?', answer:'16', hint:'Calcule as três multiplicações, uma de cada vez.'},
    {question:'As portas devem subir nesta ordem: banco antes da API, API antes do site. Digite os três nomes na ordem correta, separados por espaços.', answer:'banco api site', hint:'A API depende do banco. O site depende da API.'},
    {question:'O monitor recebeu a sequência 3, 6, 12, 24. Qual é o próximo número?', answer:'48', hint:'Compare cada número com o anterior.'},
    {question:'Há 12 tarefas. Cada worker processa 3 tarefas. Quantos workers são necessários para processar tudo em uma rodada?', answer:'4', hint:'Divida o total de tarefas pela capacidade de cada worker.'}
  ];
  let activeIncident=null, puzzle=null, puzzleIndex=-1;
  function incident(){
    const current=recovery.getIncident?.();
    if(!current){activeIncident=null;puzzle=null;return null;}
    if(activeIncident!==current.id){activeIncident=current.id;puzzleIndex=(puzzleIndex+1)%puzzles.length;puzzle=puzzles[puzzleIndex];}
    return current;
  }
  function diagnose(){const current=incident();if(!current){print('Todos os servidores estão online. Nenhum reparo pendente.');return;}print('FALHA: '+current.label+'\nRecuperação bloqueada por uma verificação lógica.\n'+puzzle.question+'\nUse: responder <resposta> | dica');}
  const modal=document.createElement('div');modal.id='adminTerminal';modal.hidden=true;
  modal.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="adminTerminalTitle"><header><div><span>GUEDESSEC / ADMINISTRACAO</span><h2 id="adminTerminalTitle">Terminal do laboratorio</h2></div><button type="button" aria-label="Fechar terminal">Fechar</button></header><p class="terminalNotice">Console simulado do ambiente 3D. Nao executa comandos no seu computador.</p><div class="terminalOutput" role="log" aria-live="polite"></div><form autocomplete="off"><label for="adminCommand">admin@homelab:~$</label><input id="adminCommand" spellcheck="false" autocomplete="off" aria-label="Comando do terminal" maxlength="200"></form></section>';
  document.body.append(modal);
  const output=modal.querySelector('.terminalOutput'),input=modal.querySelector('input'),history=[];
  let cursor=0,previousFocus;
  const started=Date.now();
  function print(text){const line=document.createElement('div');line.textContent=text;output.append(line);while(output.children.length>180)output.firstChild.remove();output.scrollTop=output.scrollHeight;}
  function close(){modal.hidden=true;previousFocus?.focus?.();}
  function run(command){
    const words=command.trim().split(/\s+/),name=words[0].toLowerCase();
    if(!name)return;
    print('admin@homelab:~$ '+command);
    switch(name){
      case 'diagnostico':case 'diagnóstico':case 'reparar':diagnose();break;
      case 'dica':if(incident())print(puzzle.hint);else print('Nenhuma falha ativa.');break;
      case 'responder':{
        if(!incident()){print('Nenhuma falha ativa.');break;}
        const answer=words.slice(1).join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[,;]+/g,' ').replace(/\s+/g,' ').trim();
        if(!answer){print('Uso: responder <resposta>. Digite diagnostico para ver o problema.');break;}
        if(answer!==puzzle.answer){print('A verificação ainda não passou. Tente novamente ou digite dica.');break;}
        if(recovery.repair?.(activeIncident)){print('Resposta correta! Serviços reiniciados. Servidor online.');activeIncident=null;puzzle=null;}else print('A falha mudou. Digite diagnostico novamente.');
        break;
      }
      case 'help': print('diagnostico          Mostra o desafio da falha\ndica                 Ajuda com o desafio\nresponder <resposta>  Valida e recupera o servidor\nhelp                 Lista os comandos\nservers / status     Mostra os racks do cenario\nnetwork              Mostra a topologia simulada\nping <destino>       Teste ilustrativo de rede\nls                   Lista os arquivos virtuais\ncat <arquivo>        Le um arquivo virtual\nwhoami / hostname    Identificacao do console\ndate / uptime        Hora e tempo desta sessao\necho <texto>         Exibe uma mensagem\nclear                Limpa a tela\nexit                 Fecha o terminal');break;
      case 'servers':case 'status': print('SERVIDORES DO CENARIO\n'+getServers().map((s,i)=>(i+1)+'. '+s.label+' | '+(s.online===false?'OFFLINE':'ONLINE')+' | posicao '+s.position.map(n=>n.toFixed(1)).join(', ')).join('\n')+'\nEstado visual do laboratorio; sem conexao com servidores reais.');break;
      case 'network':print('TOPOLOGIA SIMULADA\nModem Wi-Fi -> rack de rede -> computacao / backup / virtualizacao\nEstacoes: CodeJOHN, Vitoria, Xandy, Alex');break;
      case 'ping':print(words[1]?'SIMULACAO: resposta ilustrativa de '+words[1]+' em 1 ms.\nNenhum pacote de rede foi enviado.':'Uso: ping <destino>');break;
      case 'ls':print('README.txt  network.conf  tarefas.txt');break;
      case 'cat':{const files={'README.txt':'Console interativo do Home Lab GuedesSEC. Digite help para comecar.','network.conf':'# Configuracao virtual\ngateway=modem-wifi\nserver_room=rack-rede\nworkstations=4','tarefas.txt':'[ ] Conferir backups\n[ ] Revisar os servicos\n[ ] Documentar a rede'};print(files[words[1]]||'Arquivo virtual nao encontrado. Use ls.');break;}
      case 'whoami':print('admin (usuario virtual)');break;
      case 'hostname':print('guedessec-homelab');break;
      case 'date':print(new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}));break;
      case 'uptime':print('Sessao do console: '+Math.floor((Date.now()-started)/60000)+' minuto(s).');break;
      case 'echo':print(words.slice(1).join(' '));break;
      case 'clear':output.replaceChildren();break;
      case 'exit':close();break;
      default:print('Comando nao encontrado: '+name+'. Digite help.');
    }
  }
  modal.querySelector('button').onclick=close;
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  modal.querySelector('form').onsubmit=e=>{e.preventDefault();const text=input.value.trim();input.value='';if(text){history.push(text);cursor=history.length;run(text);}};
  modal.addEventListener('keydown',e=>{
    e.stopPropagation();
    if(e.key==='Escape'){e.preventDefault();close();}
    if(e.target===input&&['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();cursor=Math.max(0,Math.min(history.length,cursor+(e.key==='ArrowUp'?-1:1)));input.value=history[cursor]||'';}
    if(e.ctrlKey&&e.key.toLowerCase()==='l'){e.preventDefault();output.replaceChildren();}
  });
  print('GuedesSEC / terminal virtual pronto.\nDigite help para ver os comandos.');
  print('Recuperação: diagnostico | dica | responder <resposta>');
  return {open(){previousFocus=document.activeElement;modal.hidden=false;if(incident())diagnose();input.focus();output.scrollTop=output.scrollHeight;},close};
}
