const profiles={
  vitoria:{trait:'observadora e cuidadosa',curiosity:.8,social:.45,duty:.8,skills:['service']},
  xandy:{trait:'sociável e curioso',curiosity:.9,social:.85,duty:.5,skills:['connection']},
  alex:{trait:'prudente e metódico',curiosity:.5,social:.5,duty:.95,skills:['connection','service']},
  snot:{trait:'prático e concentrado',curiosity:.6,social:.25,duty:.85,skills:['equipment']},
  luiza:{trait:'colaborativa e versátil',curiosity:.75,social:.9,duty:.7,skills:['service','equipment']}
};
export function npcPersonality(npc){
  return profiles[npc.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()]||profiles.luiza;
}
function remember(list,value,limit){list.push(value);if(list.length>limit)list.shift();}

// Pure local simulation: returns intentions, never network calls or server commands.
export function createNpcMind({random=Math.random}={}){
  const states=new WeakMap(),events=new Map(),claims=new Map();
  function state(npc,now){
    if(!states.has(npc))states.set(npc,{next:now+random()*3000,routine:now+45000+random()*45000,seen:[],tasks:[],lines:[]});
    return states.get(npc);
  }
  function line(npc,options){
    const memory=state(npc,0),available=options.filter(text=>!memory.lines.includes(text));
    const pool=available.length?available:[options.reduce((oldest,text)=>memory.lines.lastIndexOf(text)<memory.lines.lastIndexOf(oldest)?text:oldest)];
    const text=pool[Math.floor(random()*pool.length)];
    remember(memory.lines,text,6);return text;
  }
  return {
    chooseLine:line,
    observe(event,now){
      if(!event?.id||!['connection','service','equipment'].includes(event.type))return;
      events.set(event.id,{...event,expires:now+60000});
      while(events.size>8){const id=events.keys().next().value;events.delete(id);claims.delete(id);}
    },
    resolve(id){events.delete(id);claims.delete(id);},
    chooseTask(npc,tasks){
      const memory=state(npc,0),available=tasks.filter(task=>task.id!==npc.task?.id&&!memory.tasks.slice(-3).includes(task.id));
      const pool=available.length?available:tasks.filter(task=>task.id!==npc.task?.id);
      if(!pool.length)return null;
      const task=pool[Math.floor(random()*pool.length)];remember(memory.tasks,task.id,8);return task;
    },
    decide(npc,now,{busy=false,working=false}={}){
      const memory=state(npc,now);if(now<memory.next)return null;
      memory.next=now+2200+random()*2800;
      for(const [id,event] of events)if(event.expires<=now){events.delete(id);claims.delete(id);}
      if(busy)return null;
      const personality=npcPersonality(npc);
      const event=[...events.values()].find(item=>!memory.seen.includes(item.id));
      if(event){
        remember(memory.seen,event.id,16);
        const skilled=personality.skills.includes(event.type),interest=personality.curiosity+(skilled?.35:0)-(working?.3:0);
        const roll=random();
        let action=roll>Math.min(.94,interest)?'ignore':skilled&&roll<personality.duty*.42?'attempt':roll<personality.social*.8?'communicate':'investigate';
        if(action==='attempt'||action==='investigate'){
          const claim=claims.get(event.id);
          if(claim&&claim.npc!==npc&&claim.until>now)action='communicate';
          else claims.set(event.id,{npc,until:now+45000});
        }
        npc.aiLastEvent={...event,action};
        const label=event.label;
        const text=action==='ignore'?null:line(npc,action==='communicate'?[
          `Notei um alerta simulado em ${label}. Alguém pode acompanhar comigo?`,
          `${label} apresentou uma falha na simulação. Vou avisar a equipe antes de mudar de tarefa.`,
          `Pessoal, há um problema simulado em ${label}. A correção do servidor continua dependendo de autorização.`
        ]:[`Vou observar ${label} e comparar os sinais, sem alterar configurações.`,
          `Esse alerta de ${label} combina com minha área. Vou fazer uma verificação apenas na simulação.`,
          `Vou até ${label} conferir o que aconteceu antes de tirar conclusões.`]);
        return {action,event,text};
      }
      if(now>=memory.routine){
        memory.routine=now+45000+random()*75000;
        if(random()<personality.duty*.65)return null;
        return {action:'routine'};
      }
      return null;
    },
    complete(npc,event,action,reached){
      if(claims.get(event.id)?.npc===npc)claims.delete(event.id);
      const outcome=!reached?'unreachable':action==='attempt'?'simulated-check':'observed';
      npc.aiLastEvent={...event,action,outcome};
      return line(npc,!reached?[
        `Não consegui chegar a ${event.label}. Vou retomar minha tarefa e deixar o alerta registrado.`,
        `O caminho até ${event.label} está ocupado; vou aguardar outra oportunidade.`
      ]:action==='attempt'?[
        `Concluí a verificação simulada de ${event.label}. Nenhuma configuração foi alterada; o reparo precisa ser autorizado.`,
        `Testei uma hipótese apenas na simulação de ${event.label}. Vou comunicar o resultado, sem executar comandos no servidor.`
      ]:[`Observei os sinais de ${event.label}. Vou compartilhar a suspeita e voltar ao trabalho.`,
        `Terminei de olhar ${event.label}. Ainda não posso afirmar a causa; precisamos conferir o diagnóstico.`]);
    }
  };
}
