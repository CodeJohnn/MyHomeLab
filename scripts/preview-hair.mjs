// Dependency-free orthographic CPU preview of the actual procedural vertex buffers.
// This checks geometry/coverage, not the browser's WebGL material or animation pipeline.
import {mkdir,writeFile} from 'node:fs/promises';
import {encodeRgbaPng} from './lib/png.mjs';
import {buildHairGeometry,hairStyles} from '../frontend/js/hair-geometry.mjs';

const views=[['FRONT',0,.12],['THREE QUARTER',-.7,.3],['BACK',Math.PI,.16],['TOP',0,1.48]];
const tileW=220,tileH=264,width=tileW*hairStyles.length,height=tileH*views.length;
const pixels=Buffer.alloc(width*height*4),depth=new Float32Array(width*height).fill(-Infinity);
for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;pixels.set([233,238,237,255],i);}
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
function ellipsoid(center,radius,color){
  const positions=[],normals=[],indices=[],segments=48,rings=24;
  for(let row=0;row<=rings;row++)for(let col=0;col<=segments;col++){
    const t=row/rings*Math.PI,p=col/segments*Math.PI*2,s=[Math.sin(t)*Math.cos(p),Math.cos(t),Math.sin(t)*Math.sin(p)];
    positions.push(...s.map((n,i)=>center[i]+n*radius[i]));
    const normal=s.map((n,i)=>n/radius[i]),length=Math.hypot(...normal);normals.push(...normal.map(n=>n/length));
    if(row<rings&&col<segments){const a=row*(segments+1)+col,b=a+segments+1;indices.push(a,a+1,b,a+1,b+1,b);}
  }
  return {positions,normals,indices,color};
}
const head=[ellipsoid([0,-.045,.01],[.1584,.2034,.1692],[189,137,108]),ellipsoid([0,-.135,.035],[.12125,.09,.1125],[189,137,108]),
  ...[-1,1].flatMap(side=>[ellipsoid([side*.065,.018,.173],[.02975,.02905,.0168],[238,239,233]),ellipsoid([side*.065,.018,.195],[.011,.016,.006],[49,43,39])]),
  ellipsoid([0,-.021,.19],[.021,.021,.027],[189,137,108]),ellipsoid([0,-.077,.167],[.023,.003,.008],[117,72,56])];
function render(mesh,col,row,yaw,pitch){
  const right=[Math.cos(yaw),0,-Math.sin(yaw)],up=[-Math.sin(yaw)*Math.sin(pitch),Math.cos(pitch),-Math.cos(yaw)*Math.sin(pitch)],eye=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)];
  const scale=300,projected=[];
  for(let i=0;i<mesh.positions.length;i+=3){const v=[mesh.positions[i],mesh.positions[i+1]+.025,mesh.positions[i+2]];projected.push([col*tileW+110+dot(v,right)*scale,row*tileH+128-dot(v,up)*scale,dot(v,eye)]);}
  const color=mesh.color||[107,75,53];
  for(let i=0;i<mesh.indices.length;i+=3){
    const ids=[mesh.indices[i],mesh.indices[i+1],mesh.indices[i+2]],v=ids.map(id=>projected[id]);
    const n=ids.map(id=>Array.from(mesh.normals.slice(id*3,id*3+3)));
    if(dot(n[0].map((x,k)=>x+n[1][k]+n[2][k]),eye)<=0)continue;
    const [a,b,c]=v,area=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(area)<1e-7)continue;
    const x0=Math.max(col*tileW,Math.floor(Math.min(...v.map(p=>p[0])))),x1=Math.min((col+1)*tileW-1,Math.ceil(Math.max(...v.map(p=>p[0]))));
    const y0=Math.max(row*tileH+24,Math.floor(Math.min(...v.map(p=>p[1])))),y1=Math.min((row+1)*tileH-1,Math.ceil(Math.max(...v.map(p=>p[1]))));
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
      const u=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/area;
      const w=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/area,t=1-u-w;
      if(u<0||w<0||t<0)continue;
      const z=u*a[2]+w*b[2]+t*c[2],id=y*width+x;if(z<=depth[id])continue;depth[id]=z;
      const normal=n[0].map((value,k)=>value*u+n[1][k]*w+n[2][k]*t),length=Math.hypot(...normal)||1;
      const light=.38+.58*Math.max(0,dot(normal,[-.44,.7,.56])/length)+.12*Math.max(0,dot(normal,[.8,.2,-.4])/length);
      const shade=mesh.shades?u*mesh.shades[ids[0]]+w*mesh.shades[ids[1]]+t*mesh.shades[ids[2]]:1;
      pixels.set([...color.map(value=>Math.min(255,Math.round(value*light*shade))),255],id*4);
    }
  }
}
const font={A:'01110100011000111111100011000110001',B:'11110100011000111110100011000111110',C:'01111100001000010000100001000001111',D:'11110100011000110001100011000111110',E:'11111100001000011110100001000011111',F:'11111100001000011110100001000010000',G:'01111100001000010111100011000101111',H:'10001100011000111111100011000110001',I:'11111001000010000100001000010011111',K:'10001100101010011000101001001010001',L:'10000100001000010000100001000011111',N:'10001110011010110011100011000110001',O:'01110100011000110001100011000101110',P:'11110100011000111110100001000010000',Q:'01110100011000110001101011001001101',R:'11110100011000111110101001001010001',S:'01111100001000001110000010000111110',T:'11111001000010000100001000010000100',U:'10001100011000110001100011000101110',Y:'10001100010101000100001000010000100'};
function label(text,x,y){for(const char of text.toUpperCase()){const glyph=font[char]||'0'.repeat(35);for(let j=0;j<35;j++)if(glyph[j]==='1')for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const id=((y+Math.floor(j/5)*2+dy)*width+x+(j%5)*2+dx)*4;pixels.set([47,65,62,255],id);}x+=12;}}
for(let row=0;row<views.length;row++)for(let col=0;col<hairStyles.length;col++){
  const [view,yaw,pitch]=views[row],style=hairStyles[col];
  for(const mesh of head)render(mesh,col,row,yaw,pitch);
  render(buildHairGeometry(style),col,row,yaw,pitch);label(style,col*tileW+10,row*tileH+8);label(view,col*tileW+10,row*tileH+244);
}
const png=encodeRgbaPng(width,height,pixels);
await mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});await writeFile(new URL('../artifacts/hair-preview.png',import.meta.url),png);
console.log('artifacts/hair-preview.png — actual geometry, CPU preview; browser validation still required.');
