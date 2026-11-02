export function createAdminTerminal(getServers, recovery = {}) {
  const puzzles = [
    {id:'workers',title:'Recuperar fila de tarefas',question:'Implemente resolver(tarefas, capacidade). Retorne quantos workers sao necessarios para processar todas as tarefas. Arredonde para cima. Para zero tarefas, retorne 0.',starter:'function resolver(tarefas, capacidade) {\n  // Calcule a quantidade de workers\n}',hint:'Divida as tarefas pela capacidade. Math.ceil arredonda para cima.',tests:[{args:[12,3],expected:4},{args:[10,3],expected:4},{args:[0,5],expected:0},{args:[1,8],expected:1}]},
    {id:'health',title:'Validar disponibilidade',question:'Implemente resolver(rede, primario, backup). O servico fica disponivel quando a rede funciona e pelo menos um dos servidores esta online. Retorne um booleano.',starter:'function resolver(rede, primario, backup) {\n  // Combine os valores booleanos\n}',hint:'Use && para exigir a rede e || para aceitar primario ou backup.',tests:[{args:[true,false,true],expected:true},{args:[false,true,true],expected:false},{args:[true,false,false],expected:false},{args:[true,true,false],expected:true}]},
    {id:'backup',title:'Conferir tamanho do backup',question:'Implemente resolver(tamanhos). Some os tamanhos dos arquivos, incluindo o caso de lista vazia.',starter:'function resolver(tamanhos) {\n  // Some todos os elementos\n}',hint:'Comece com total igual a zero e percorra o array.',tests:[{args:[[10,20,30]],expected:60},{args:[[]],expected:0},{args:[[5]],expected:5},{args:[[0,7,0,3]],expected:10}]},
    {id:'failures',title:'Contar servicos com falha',question:'Implemente resolver(estados). Cada item e true para online e false para offline. Retorne quantos servicos estao offline.',starter:'function resolver(estados) {\n  // Conte apenas os valores false\n}',hint:'Percorra os estados e incremente um contador quando estado === false.',tests:[{args:[[true,false,true,false]],expected:2},{args:[[]],expected:0},{args:[[true,true]],expected:0},{args:[[false,false,false]],expected:3}]}
  ];
  let activeIncident=null, puzzle=null, puzzleIndex=-1;
  function incident(){
    const current=recovery.getIncident?.();
    if(!current){activeIncident=null;puzzle=null;return null;}
    if(activeIncident!==current.id){activeIncident=current.id;puzzleIndex=(current.id-1)%puzzles.length;puzzle=puzzles[puzzleIndex];}
    return current;
  }
  function diagnose(openEditor=true){
    const current=incident();
    if(!current){print('Todos os servidores estao online. Nenhum reparo pendente.');return;}
    print('FALHA: '+current.label+'\nDESAFIO JAVASCRIPT: '+puzzle.question+'\nEscreva a funcao resolver na IDE e passe em todos os testes.\nUse: reparar | dica');
    if(openEditor && recovery.openChallenge) {
      const incidentId=current.id,task={...puzzle,id:'recovery-'+current.id,description:puzzle.question+' Dica: '+puzzle.hint};
      close();
      recovery.openChallenge(task,()=>{
        if(recovery.getIncident?.()?.id!==incidentId){print('A falha mudou. Rode diagnostico novamente.');return;}
        if(recovery.repair?.(incidentId)){print('Todos os testes passaram! Recuperacao do servidor autorizada.');activeIncident=null;puzzle=null;}
      });
    }
  }

  const modal=document.createElement('div');modal.id='adminTerminal';modal.hidden=true;
  modal.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="adminTerminalTitle"><header><div><span>GUEDESSEC / ADMINISTRACAO</span><h2 id="adminTerminalTitle">Terminal do laboratorio</h2></div><button type="button" aria-label="Fechar terminal">Fechar</button></header><p class="terminalNotice">Console simulado do ambiente 3D. Nao executa comandos no seu computador.</p><div class="terminalOutput" role="log" aria-live="polite"></div><button type="button" data-repair-js>Resolver falha em JavaScript</button><form autocomplete="off"><label for="adminCommand">admin@homelab:~$</label><input id="adminCommand" spellcheck="false" autocomplete="off" aria-label="Comando do terminal" maxlength="200"></form></section>';
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
      case 'responder':print('Agora o reparo exige codigo JavaScript. Digite reparar para abrir a IDE.');break;
      case 'help': print('diagnostico          Mostra o desafio da falha\ndica                 Ajuda com o desafio\nreparar              Abre a IDE JavaScript com testes\nhelp                 Lista os comandos\nservers / status     Mostra os racks do cenario\nnetwork              Mostra a topologia simulada\nping <destino>       Teste ilustrativo de rede\nls                   Lista os arquivos virtuais\ncat <arquivo>        Le um arquivo virtual\nwhoami / hostname    Identificacao do console\ndate / uptime        Hora e tempo desta sessao\necho <texto>         Exibe uma mensagem\nclear                Limpa a tela\nexit                 Fecha o terminal');break;
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
  modal.querySelector('[data-repair-js]').onclick=()=>diagnose();
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  modal.querySelector('form').onsubmit=e=>{e.preventDefault();const text=input.value.trim();input.value='';if(text){history.push(text);cursor=history.length;run(text);}};
  modal.addEventListener('keydown',e=>{
    e.stopPropagation();
    if(e.key==='Escape'){e.preventDefault();close();}
    if(e.target===input&&['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();cursor=Math.max(0,Math.min(history.length,cursor+(e.key==='ArrowUp'?-1:1)));input.value=history[cursor]||'';}
    if(e.ctrlKey&&e.key.toLowerCase()==='l'){e.preventDefault();output.replaceChildren();}
  });
  print('GuedesSEC / terminal virtual pronto.\nDigite help para ver os comandos.');
  print('Recuperação: diagnostico | dica | reparar (JavaScript)');
  return {open(){previousFocus=document.activeElement;modal.hidden=false;if(incident())diagnose(false);input.focus();output.scrollTop=output.scrollHeight;},close};
}
