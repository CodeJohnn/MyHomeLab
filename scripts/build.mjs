import {build} from 'esbuild';

await build({
  entryPoints: ['frontend/js/reaction-menu.react'],
  outfile: 'frontend/js/reaction-menu.bundle.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  define: {'process.env.NODE_ENV': '"production"'},
  minify: true,
  jsx: 'automatic',
  loader: {'.react': 'jsx'}
});
