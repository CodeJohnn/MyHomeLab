const lines=Object.freeze([
  '// GuedesSEC - development',
  'const lab = await connect();',
  'async function deploy(service) {',
  '  const build = await compile(service);',
  '  if (build.ok) return lab.run(build);',
  '}',
  'const status = await lab.health();',
  'console.log(status);',
  '// watching changes...',
  '$ npm run dev',
  '$ git status',
  '// tests: passed',
  '$ _'
]);

export function createTerminalScreen({THREE,isMobile=false}){
  const canvas=document.createElement('canvas');
  canvas.width=900;canvas.height=510;
  const ctx=canvas.getContext('2d');
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false,side:THREE.DoubleSide});
  let frame=0,lastPaint=-Infinity,disposed=false;

  function paint(time){
    if(disposed||time-lastPaint<(isMobile?100:50))return;
    lastPaint=time;frame+=3;
    ctx.fillStyle='#07120f';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#173f2d';ctx.fillRect(0,0,canvas.width,43);
    ctx.fillStyle='#b9ffda';ctx.font='bold 21px monospace';
    ctx.fillText('\u25cf  \u25cf  \u25cf   ubuntu@bibliotecadealexandria: ~',18,29);
    ctx.font='20px monospace';
    lines.forEach((line,index)=>{
      ctx.fillStyle=line.startsWith('$')?'#70ffad':'#b2c9c1';
      ctx.fillText(line,24,83+index*30);
    });
    ctx.fillStyle='#42e29a';ctx.fillRect(24,canvas.height-10,(frame*2)%canvas.width,3);
    texture.needsUpdate=true;
  }

  return {material,paint,dispose(){
    if(disposed)return;
    disposed=true;material.dispose();texture.dispose();
  }};
}
