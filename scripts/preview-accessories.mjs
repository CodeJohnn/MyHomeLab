// CPU geometry QA, not a substitute for the in-game WebGL material/animation check.
import * as THREE from 'three';
import {mkdir,writeFile} from 'node:fs/promises';
import {deflateSync} from 'node:zlib';
import {accessoryCatalog} from '../frontend/js/accessory-catalog.mjs';
import {createAccessoryVisual} from '../frontend/js/accessory-models.mjs';
const tile=220,tileHeight=230,columns=7,width=tile*columns,height=tileHeight*Math.ceil(accessoryCatalog.length/columns);
const pixels=Buffer.alloc(width*height*4),depth=new Float32Array(width*height).fill(-Infinity);
for(let i=0;i<width*height;i++)pixels.set([230,238,240,255],i*4);
const font={A:'01110100011000111111100011000110001',B:'11110100011000111110100011000111110',C:'01111100001000010000100001000001111',D:'11110100011000110001100011000111110',E:'11111100001000011110100001000011111',F:'11111100001000011110100001000010000',G:'01111100001000010111100011000101111',H:'10001100011000111111100011000110001',I:'11111001000010000100001000010011111',J:'00111000100001000010100101001001100',K:'10001100101010011000101001001010001',L:'10000100001000010000100001000011111',M:'10001110111010110101100011000110001',N:'10001110011010110011100011000110001',O:'01110100011000110001100011000101110',P:'11110100011000111110100001000010000',Q:'01110100011000110001101011001001101',R:'11110100011000111110101001001010001',S:'01111100001000001110000010000111110',T:'11111001000010000100001000010000100',U:'10001100011000110001100011000101110',V:'10001100011000110001100010101000100',W:'10001100011000110101101011101110001',X:'10001100010101000100010101000110001',Y:'10001100010101000100001000010000100',Z:'11111000010001000100010001000011111'};
function label(text,x,y){for(const char of text.toUpperCase().replaceAll('_',' ')){const glyph=font[char]||'0'.repeat(35);for(let j=0;j<35;j++)if(glyph[j]==='1')for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)pixels.set([43,70,80,255],((y+Math.floor(j/5)*2+dy)*width+x+(j%5)*2+dx)*4);x+=12;}}
for(let itemIndex=0;itemIndex<accessoryCatalog.length;itemIndex++){
  const item=accessoryCatalog[itemIndex],resource=createAccessoryVisual(THREE,item.id,item.color),group=resource.visual;group.updateMatrixWorld(true);
  const col=itemIndex%columns,row=Math.floor(itemIndex/columns),yaw=item.category==='Costas'?Math.PI+.55:['phone','tablet','laptop_open'].includes(item.id)?Math.PI-.45:-.55,pitch=item.id==='book'?.7:.36;
  const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),up=new THREE.Vector3(-Math.sin(yaw)*Math.sin(pitch),Math.cos(pitch),-Math.cos(yaw)*Math.sin(pitch)),eye=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
  const projected=[],allPoints=[];group.traverse(mesh=>{
    if(!mesh.geometry)return;const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,matrix=new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld),vertices=[];
    for(let i=0;i<p.count;i++){
      const position=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),normal=new THREE.Vector3().fromBufferAttribute(n,i).applyMatrix3(matrix).normalize();
      const point={x:position.dot(right),y:position.dot(up),z:position.dot(eye),normal};vertices.push(point);allPoints.push(point);
    }
    projected.push({vertices,material:mesh.material});
  });
  const minX=Math.min(...allPoints.map(p=>p.x)),maxX=Math.max(...allPoints.map(p=>p.x)),minY=Math.min(...allPoints.map(p=>p.y)),maxY=Math.max(...allPoints.map(p=>p.y));
  const scale=Math.min(174/(maxX-minX),176/(maxY-minY));
  for(const mesh of projected){for(const p of mesh.vertices){p.x=col*tile+110+(p.x-(maxX+minX)/2)*scale;p.y=row*tileHeight+104-(p.y-(maxY+minY)/2)*scale;}}
  projected.sort((a,b)=>Number(a.material.transparent)-Number(b.material.transparent));
  for(const {vertices,material} of projected){
    const rgb=material.color.clone().convertLinearToSRGB(),base=[rgb.r*255,rgb.g*255,rgb.b*255],alpha=material.opacity;
    for(let i=0;i<vertices.length;i+=3){
      const [a,b,c]=vertices.slice(i,i+3),area=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(area)<1e-7)continue;
      const x0=Math.max(col*tile,Math.floor(Math.min(a.x,b.x,c.x))),x1=Math.min((col+1)*tile-1,Math.ceil(Math.max(a.x,b.x,c.x)));
      const y0=Math.max(row*tileHeight,Math.floor(Math.min(a.y,b.y,c.y))),y1=Math.min(row*tileHeight+199,Math.ceil(Math.max(a.y,b.y,c.y)));
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
        const u=((b.y-c.y)*(x+.5-c.x)+(c.x-b.x)*(y+.5-c.y))/area,v=((c.y-a.y)*(x+.5-c.x)+(a.x-c.x)*(y+.5-c.y))/area,w=1-u-v;if(u<0||v<0||w<0)continue;
        const z=u*a.z+v*b.z+w*c.z,id=y*width+x;if(z<depth[id])continue;depth[id]=z;
        const normal=a.normal.clone().multiplyScalar(u).addScaledVector(b.normal,v).addScaledVector(c.normal,w).normalize();if(normal.dot(eye)<0)normal.negate();
        const light=.38+.60*Math.max(0,normal.dot(new THREE.Vector3(-.4,.75,.53)))+.10*Math.max(0,normal.dot(new THREE.Vector3(.7,.3,-.5)));
        for(let k=0;k<3;k++)pixels[id*4+k]=Math.round(Math.min(255,base[k]*light)*alpha+pixels[id*4+k]*(1-alpha));
      }
    }
  }
  label(item.id,col*tile+10,row*tileHeight+208);resource.release();
}
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function chunk(type,bytes){const name=Buffer.from(type),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(bytes.length);crc.writeUInt32BE(crc32(Buffer.concat([name,bytes])));return Buffer.concat([size,name,bytes,crc]);}
const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
const scanlines=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++)pixels.copy(scanlines,y*(width*4+1)+1,y*width*4,(y+1)*width*4);
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(scanlines)),chunk('IEND',Buffer.alloc(0))]);
await mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});await writeFile(new URL('../artifacts/accessory-preview.png',import.meta.url),png);
console.log('artifacts/accessory-preview.png — 26 real accessory meshes, CPU geometry preview.');
