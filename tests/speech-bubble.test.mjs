import {test} from 'node:test';
import assert from 'node:assert/strict';
import {layoutSpeechBubble} from '../frontend/js/speech-bubble.mjs';

const measure=(text,kind)=>Array.from(text).length*(kind==='name'?12:16);

test('balão curto se ajusta ao nome e cresce com a mensagem sem esticar a fonte',()=>{
  const short=layoutSpeechBubble('oi','João Mateus',measure);
  const long=layoutSpeechBubble('Uma mensagem maior.','João Mateus',measure);
  assert.ok(short.width<long.width);assert.ok(short.width<300);
  assert.ok(short.contentWidth>=measure('João Mateus','name'));
  assert.equal(short.height,long.height);
  assert.deepEqual(short.lines,['oi']);
  assert.equal(short.heading,'João Mateus disse:');
});

test('mensagem longa quebra em palavras, aumenta altura e mantém largura limitada',()=>{
  const text='Uma conversa com várias palavras para ocupar várias linhas sem cortar nenhuma parte da mensagem. '.repeat(3).trim();
  const layout=layoutSpeechBubble(text,'Visitante',measure);
  assert.ok(layout.lines.length>1);assert.ok(layout.height>108);assert.ok(layout.width<=468);
  assert.equal(layout.lines.join(' '),text);
  assert.ok(layout.lines.every(line=>measure(line,'message')<=420));
});

test('palavras sem espaços e emojis compostos são quebrados sem perder conteúdo',()=>{
  const segmenter=new Intl.Segmenter(undefined,{granularity:'grapheme'});
  const graphemeWidth=text=>Array.from(segmenter.segment(text)).length*32;
  for(const word of ['a'.repeat(280),'👩🏽‍💻'.repeat(50)]){
    const layout=layoutSpeechBubble(word,'Pessoa',graphemeWidth);
    assert.equal(layout.lines.join(''),word);assert.ok(layout.width<=468);
    assert.ok(layout.lines.every(line=>graphemeWidth(line)<=420));
    if(word.startsWith('👩'))assert.ok(layout.lines.every(line=>Array.from(segmenter.segment(line)).every(part=>part.segment==='👩🏽‍💻')));
  }
});

test('quebras explícitas e nomes compridos cabem no limite do balão',()=>{
  const layout=layoutSpeechBubble('primeira\n\núltima','Nome muito comprido '.repeat(10),measure);
  assert.deepEqual(layout.lines,['primeira','','última']);assert.equal(layout.width,468);
});
