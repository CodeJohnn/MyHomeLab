import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const source=await readFile(new URL('../frontend/react/LandingPage.jsx',import.meta.url),'utf8');
const compiled=await transform(source,{loader:'jsx',jsx:'automatic',format:'esm'});
const code=compiled.code.replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime')));
const {default:LandingPage}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('tela React mantém navegação, instruções e caminhos relativos para GitHub Pages',()=>{
  const html=renderToStaticMarkup(createElement(LandingPage,{busy:false,message:'',onEnter(){}}));
  assert.match(html,/id="landingTitle"/);
  assert.match(html,/href="#about"/);
  assert.match(html,/Como jogar/);
  assert.match(html,/src="\.\/frontend\/assets\/guedessec.png"/);
  assert.equal((html.match(/<button/g)||[]).length,3);
  assert.doesNotMatch(html,/disabled=""/);
  assert.match(html,/<p id="landingLoading" role="status" hidden=""><\/p>/);
});

test('verificação de conta bloqueia todas as entradas e mostra o estado acessível',()=>{
  const html=renderToStaticMarkup(createElement(LandingPage,{busy:true,message:'Verificando sua conta...',onEnter(){}}));
  assert.equal((html.match(/disabled=""/g)||[]).length,3);
  assert.match(html,/<p id="landingLoading" role="status">Verificando sua conta\.\.\.<\/p>/);
});
