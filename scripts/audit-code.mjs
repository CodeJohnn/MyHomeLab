import {ESLint} from 'eslint';
import {readFile,writeFile,readdir,access} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const root=process.cwd();
const relative=file=>path.relative(root,file).split(path.sep).join('/');
const imports=[],dynamicReferences=[],bodies=new Map();
const collect={create(context){
  const source=context.sourceCode,file=relative(context.filename);
  function dependency(node,value,kind){
    if(typeof value==='string')imports.push({file,line:node.loc.start.line,kind,specifier:value});
    else dynamicReferences.push({file,line:node.loc.start.line,kind,expression:source.getText(node)});
  }
  function functionBody(node){
    if(node.body?.type!=='BlockStatement')return;
    const tokens=source.getTokens(node.body);
    if(tokens.length<60)return;
    const signature=[];
    for(const param of node.params)signature.push(...source.getTokens(param));
    signature.push(...tokens);
    const hash=createHash('sha256').update(JSON.stringify(signature.map(token=>[token.type,token.value]))).digest('hex');
    if(!bodies.has(hash))bodies.set(hash,[]);
    bodies.get(hash).push({file,line:node.loc.start.line,name:node.id?.name||node.parent?.id?.name||'(callback)'});
  }
  return {
    ImportDeclaration:node=>dependency(node,node.source.value,'import'),
    ExportNamedDeclaration:node=>{if(node.source)dependency(node,node.source.value,'export');},
    ExportAllDeclaration:node=>dependency(node,node.source.value,'export'),
    ImportExpression:node=>dependency(node,node.source.value,'dynamic-import'),
    NewExpression(node){
      if(node.callee.name==='URL'&&node.arguments[1]?.type==='MemberExpression'&&source.getText(node.arguments[1])==='import.meta.url')dependency(node,node.arguments[0]?.value,'asset-url');
    },
    FunctionDeclaration:functionBody,
    FunctionExpression:functionBody,
    ArrowFunctionExpression:functionBody
  };
}};
const lint=new ESLint({overrideConfigFile:true,overrideConfig:[
  {ignores:['frontend/js/react-app.js','node_modules/**']},
  {files:['**/*.{js,mjs,jsx}'],languageOptions:{ecmaVersion:'latest',sourceType:'module',parserOptions:{ecmaFeatures:{jsx:true}}},plugins:{audit:{rules:{collect}}},rules:{
    'audit/collect':'warn',
    'no-unused-vars':['error',{vars:'all',args:'none',caughtErrors:'none',ignoreRestSiblings:true}],
    'no-unreachable':'error','no-dupe-args':'error','no-dupe-keys':'error',
    'no-constant-condition':['error',{checkLoops:false}], 'no-useless-return':'error'
  }}
]});
const results=await lint.lintFiles(['frontend/js/**/*.{js,mjs}','frontend/react/**/*.jsx','backend/**/*.mjs','api/**/*.mjs','scripts/**/*.mjs','tests/**/*.mjs','tools/**/*.mjs']);
const html=await readFile('index.html','utf8');
for(const match of html.matchAll(/(?:src|href)="(\.\/[^"#?]+)(?:\?[^"#]*)?"/g))imports.push({file:'index.html',kind:'html',specifier:match[1]});
const missing=[];
for(const entry of imports){
  if(!entry.specifier.startsWith('.'))continue;
  const target=path.resolve(root,path.dirname(entry.file),entry.specifier.split(/[?#]/)[0]);
  if(relative(target)==='frontend/js/react-app.js')continue;
  try{await access(target);}catch{missing.push(entry);}
}
async function inventory(directory){
  const entries=await readdir(directory,{withFileTypes:true});
  const nested=await Promise.all(entries.map(entry=>entry.isDirectory()?inventory(path.join(directory,entry.name)):[relative(path.join(directory,entry.name))]));
  return nested.flat();
}
const assets=await inventory('frontend/assets');
const findings=results.flatMap(result=>result.messages.map(message=>({file:relative(result.filePath),line:message.line,rule:message.ruleId,message:message.message})));
const report={sourceFiles:results.length,assetFiles:assets.length,imports,missing,dynamicReferences,duplicateBodies:[...bodies.values()].filter(entries=>entries.length>1),findings};
const reportAt=process.argv.indexOf('--report');
if(reportAt!==-1){
  if(!process.argv[reportAt+1])throw new Error('Informe o caminho de saída após --report.');
  await writeFile(process.argv[reportAt+1],JSON.stringify(report,null,2)+'\n');
}
for(const finding of findings)console.log(`${finding.file}:${finding.line} ${finding.rule}: ${finding.message}`);
for(const entry of missing)console.log(`Referência ausente: ${entry.file} -> ${entry.specifier}`);
console.log(`${results.length} fontes; ${assets.length} assets; ${imports.length} referências; ${dynamicReferences.length} referências dinâmicas preservadas; ${report.duplicateBodies.length} grupos de corpos repetidos; ${findings.length} problemas estáticos; ${missing.length} referências ausentes.`);
if(findings.length||missing.length)process.exitCode=1;
