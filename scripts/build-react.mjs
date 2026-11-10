import {build,context} from 'esbuild';

const options={
  entryPoints:['frontend/react/main.jsx'],
  outfile:'frontend/js/react-app.js',
  bundle:true,
  format:'esm',
  jsx:'automatic',
  external:['../js/*'],
  target:['es2020'],
  minify:true,
  define:{'process.env.NODE_ENV':'"production"'},
  legalComments:'eof',
  logLevel:'info'
};
if(process.argv.includes('--watch')){
  const watcher=await context(options);
  await watcher.watch();
  console.log('Observando os componentes JSX. Abra o servidor com npm start.');
}else await build(options);
