import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildHairGeometry,hairStyles} from '../frontend/js/hair-geometry.mjs';
import {hairScalpPoint} from '../frontend/js/hair-profile.mjs';

test('todos os cortes têm malhas fechadas, índices válidos e normais suaves finitas',()=>{
  for(const style of hairStyles){
    const mesh=buildHairGeometry(style),count=mesh.positions.length/3,edges=new Map();
    assert.equal(mesh.normals.length,mesh.positions.length);assert.equal(mesh.shades.length,count);
    assert.ok(mesh.positions.every(Number.isFinite));assert.ok(mesh.normals.every(Number.isFinite));
    for(let i=0;i<count;i++)assert.ok(Math.abs(Math.hypot(...mesh.normals.slice(i*3,i*3+3))-1)<1e-5,style+' normal '+i);
    for(let i=0;i<mesh.indices.length;i+=3){
      const face=Array.from(mesh.indices.slice(i,i+3));assert.ok(face.every(id=>id<count));assert.equal(new Set(face).size,3);
      const [a,b,c]=face.map(id=>Array.from(mesh.positions.slice(id*3,id*3+3)));
      const u=b.map((v,k)=>v-a[k]),v=c.map((n,k)=>n-a[k]);
      assert.ok(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])>1e-12,style+' triangle '+i/3);
      for(let j=0;j<3;j++){
        const a=face[j],b=face[(j+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(':');
        const edge=edges.get(key)||{count:0,direction:0};edge.count++;edge.direction+=a<b?1:-1;edges.set(key,edge);
      }
    }
    for(const edge of edges.values()){assert.equal(edge.count,2,style+' open/nonmanifold edge');assert.equal(edge.direction,0,style+' winding');}
  }
});

test('topo converge no mesmo ponto e a cobertura não atravessa o couro cabeludo',()=>{
  for(const style of hairStyles){
    const crown=hairScalpPoint(0,0,style);
    for(let i=0;i<64;i++){
      const phi=i/64*Math.PI*2;
      assert.ok(hairScalpPoint(phi,0,style).every((value,index)=>Math.abs(value-crown[index])<1e-12),style+' crown');
      for(let row=0;row<=16;row++){
        const theta=row/16*1.2,[x,y,z]=hairScalpPoint(phi,theta,style);
        const skull=(x/.1584)**2+((y+.045)/.2034)**2+((z-.01)/.1692)**2;
        assert.ok(skull>1,style+' scalp coverage');
      }
    }
  }
});

test('orçamento de triângulos fica abaixo das mechas tubulares anteriores em todos os cortes',()=>{
  // Old cap: 36 * (2*24-1) faces; each lock: 18*10*2 faces.
  const locks={short:13,fade:7,quiff:8,curly:30,bob:28,long:23,ponytail:17};
  for(const style of hairStyles){
    const mesh=buildHairGeometry(style),previous=1692+locks[style]*360;
    assert.ok(mesh.indices.length/3<previous,style+' triangle budget');
    assert.ok(mesh.positions.length/3<65536);
    assert.deepEqual(mesh,buildHairGeometry(style),style+' deterministic');
    const covered=buildHairGeometry(style,{covered:true});
    assert.equal(covered.positions.length>0,style==='ponytail');
  }
});
