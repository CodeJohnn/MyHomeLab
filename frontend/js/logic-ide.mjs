const challenges=[
 {id:'soma',title:'1. Somar dois numeros',description:'Implemente resolver(a, b) e retorne a soma.',starter:'function resolver(a, b) {\n  return a + b;\n}',tests:[{args:[2,3],expected:5},{args:[-4,7],expected:3},{args:[0,0],expected:0}]},
 {id:'par',title:'2. Numero par',description:'Implemente resolver(numero). Retorne true se for par, false se for impar.',starter:'function resolver(numero) {\n  // Escreva aqui\n}',tests:[{args:[4],expected:true},{args:[7],expected:false},{args:[0],expected:true},{args:[-2],expected:true}]},
 {id:'lista',title:'3. Somar uma lista',description:'Implemente resolver(numeros) e retorne a soma dos elementos. Uma lista vazia deve retornar 0.',starter:'function resolver(numeros) {\n  // Use um laco ou reduce\n}',tests:[{args:[[1,2,3]],expected:6},{args:[[]],expected:0},{args:[[-2,4]],expected:2}]}
];
function idePage(){
 const select=document.getElementById('challenge'),editor=document.getElementById('code'),output=document.getElementById('output'),run=document.getElementById('run');
 let data=[],drafts={},completed=[],worker=null,timer=null,job=0,sessionId=null;
 const preview=()=>{const task=data[Number(select.value)||0];if(task)parent.postMessage({kind:'logic-preview',title:task.title,code:editor.value,output:output.textContent},'*');};
 const store=()=>{parent.postMessage({kind:'logic-save',drafts,completed,sessionId},'*');preview();};
 new MutationObserver(preview).observe(output,{childList:true,characterData:true,subtree:true});
 function choose(){const task=data[Number(select.value)||0];document.getElementById('description').textContent=task.description;editor.value=drafts[task.id]??task.starter;output.textContent=completed.includes(task.id)?'Desafio concluido. Pode praticar novamente.':'Pronto para executar.';preview();}
 editor.addEventListener('input',()=>{drafts[data[Number(select.value)].id]=editor.value;store();});
 function finish(){if(worker)worker.terminate();worker=null;clearTimeout(timer);run.disabled=false;}
 select.onchange=()=>{finish();choose();};
 document.getElementById('reset').onclick=()=>{finish();const task=data[Number(select.value)];drafts[task.id]=task.starter;store();choose();};
 document.getElementById('stop').onclick=()=>{finish();output.textContent='Execucao interrompida.';};
 function execute(payload){
   let logs=[],size=0;
   const format=value=>{try{return typeof value==='string'?value:JSON.stringify(value)??String(value);}catch{return String(value);}};
   const console={log:(...values)=>{if(logs.length>=60||size>10000)return;const line=values.map(format).join(' ').slice(0,1000);size+=line.length;logs.push(line);}};
   console.warn=console.error=console.info=console.log;
   try{
     const resolver=new Function('console',payload.code+'\n;return typeof resolver === "function" ? resolver : null;')(console);
     if(!resolver)throw Error('Defina a funcao resolver.');
     const results=payload.tests.map((test,index)=>{
       const actual=resolver(...test.args);
       return {index:index+1,pass:JSON.stringify(actual)===JSON.stringify(test.expected),actual:format(actual).slice(0,500),expected:format(test.expected)};
     });
     self.postMessage({logs,results});
   }catch(error){self.postMessage({logs,error:String(error.message||error).slice(0,1000)});}
 }
 run.onclick=()=>{
   finish();run.disabled=true;output.textContent='Executando...';
   const task=data[Number(select.value)],current=++job;drafts[task.id]=editor.value;store();
   const source='self.onmessage=e=>('+execute.toString()+')(e.data);';
   const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
   try{worker=new Worker(url);}catch(error){URL.revokeObjectURL(url);finish();output.textContent='Nao foi possivel iniciar: '+error.message;return;}
   URL.revokeObjectURL(url);
   worker.onmessage=e=>{
     if(current!==job)return;
     const result=e.data;finish();
     if(!result||!Array.isArray(result.logs)){output.textContent='Resposta invalida da execucao.';return;}
     let lines=result.logs.slice(0,60);
     if(result.error)lines.push('Erro: '+result.error);
     else if(Array.isArray(result.results)){
       const passed=result.results.filter(r=>r.pass).length;
       lines.push(...result.results.map(r=>(r.pass?'OK':'FALHOU')+' teste '+r.index+(r.pass?'':': esperado '+r.expected+', recebido '+r.actual)));
       lines.push(passed+'/'+task.tests.length+' testes passaram.');
       if(passed===task.tests.length&&!completed.includes(task.id)){completed.push(task.id);store();}
       if(passed===task.tests.length)parent.postMessage({kind:'logic-solved',taskId:task.id,sessionId},'*');
     }
     output.textContent=lines.join('\n');
   };
   worker.onerror=e=>{finish();output.textContent='Erro: '+e.message;};
   worker.postMessage({code:editor.value,tests:task.tests});
   timer=setTimeout(()=>{finish();output.textContent='Tempo limite: 1,5 s. Confira se ha um laco infinito.';},1500);
 };
 editor.onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();editor.setRangeText('  ',editor.selectionStart,editor.selectionEnd,'end');editor.dispatchEvent(new Event('input'));}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();run.click();}};
 window.addEventListener('message',e=>{
   if(e.source!==parent)return;
   if(e.data?.kind==='logic-stop'){finish();return;}
   if(e.data?.kind!=='logic-init')return;
   finish();job++;sessionId=e.data.sessionId||null;
   data=e.data.challenges;drafts=e.data.drafts||{};completed=e.data.completed||[];
   select.replaceChildren(...data.map((task,i)=>{const option=document.createElement('option');option.value=i;option.textContent=task.title;return option;}));choose();
 });
 parent.postMessage({kind:'logic-ready'},'*');
}
export function createLogicIde(onOpen=()=>{},onPreview=()=>{}){
 const dialog=document.createElement('dialog');dialog.id='logicIde';
 dialog.innerHTML='<header><strong>JS LAB / Treino de logica</strong><button type="button">Fechar</button></header>';
 const frame=document.createElement('iframe');frame.title='IDE de JavaScript';frame.setAttribute('sandbox','allow-scripts');dialog.append(frame);document.body.append(dialog);
 onPreview({title:challenges[0].title,code:challenges[0].starter,output:'Clique no monitor para programar.'});
 let session=null,sessionCounter=0;const recoveryDrafts={};
 function initializeFrame(){frame.contentWindow.postMessage(session?{kind:'logic-init',challenges:[session.task],drafts:recoveryDrafts,completed:[],sessionId:session.id}:{kind:'logic-init',challenges,...state},'*');}
 let state={drafts:{},completed:[]};try{const saved=JSON.parse(localStorage.getItem('guedessec.logic-ide.v1')||'{}');if(saved&&typeof saved==='object'){state.drafts=saved.drafts||{};state.completed=Array.isArray(saved.completed)?saved.completed:[];}}catch{}
 window.addEventListener('message',e=>{
   if(e.source!==frame.contentWindow)return;
   if(e.data?.kind==='logic-preview')onPreview({title:String(e.data.title||'JS LAB').slice(0,100),code:String(e.data.code||'').slice(0,30000),output:String(e.data.output||'').slice(0,12000)});
   if(e.data?.kind==='logic-ready')initializeFrame();
   if(e.data?.kind==='logic-solved' && session && e.data.sessionId===session.id && e.data.taskId===session.task.id){const solved=session.onSolved;session.onSolved=()=>{};solved();}
   if(e.data?.kind==='logic-save'){
     if(e.data.sessionId){if(session && e.data.sessionId===session.id){const code=e.data.drafts?.[session.task.id];if(typeof code==='string')recoveryDrafts[session.task.id]=code.slice(0,30000);}return;}
     const drafts={};for(const task of challenges){const code=e.data.drafts?.[task.id];if(typeof code==='string')drafts[task.id]=code.slice(0,30000);}
     state={drafts,completed:challenges.filter(t=>e.data.completed?.includes(t.id)).map(t=>t.id)};
     try{localStorage.setItem('guedessec.logic-ide.v1',JSON.stringify(state));}catch{}
   }
 });
 dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>frame.contentWindow?.postMessage({kind:'logic-stop'},'*'));
 const script='('+idePage.toString()+')();';
 frame.srcdoc='<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\' \'unsafe-eval\' blob:; worker-src blob:; style-src \'unsafe-inline\'; connect-src \'none\'"><style>*{box-sizing:border-box}body{margin:0;padding:18px;background:#141414;color:#fafafa;font:14px system-ui}select,button{padding:9px;border:1px solid #777;border-radius:6px;background:#fafafa;color:#111}button{cursor:pointer}#run{background:#f7df1e}textarea{width:100%;min-height:260px;resize:vertical;padding:16px;background:#080808;color:#fafafa;border:1px solid #555;border-radius:8px;font:16px/1.6 Consolas,monospace;tab-size:2}pre{background:#080808;padding:15px;min-height:110px;white-space:pre-wrap;overflow-wrap:anywhere}nav{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}p{line-height:1.5}button:disabled{opacity:.5}</style><label for="challenge">Desafio </label><select id="challenge"></select><p id="description"></p><label for="code">Seu codigo JavaScript</label><textarea id="code" spellcheck="false" maxlength="30000"></textarea><nav><button id="run">Executar / Ctrl+Enter</button><button id="stop">Parar</button><button id="reset">Restaurar codigo</button></nav><strong>Console e testes</strong><pre id="output" role="status"></pre><script>'+script.replace(/<\/script/gi,'<\\/script')+'</script></html>';
 return {open(){session=null;onOpen();initializeFrame();if(!dialog.open)dialog.showModal();},openChallenge(task,onSolved){session={task,onSolved,id:'repair-'+(++sessionCounter)};onOpen();initializeFrame();if(!dialog.open)dialog.showModal();}};
}
