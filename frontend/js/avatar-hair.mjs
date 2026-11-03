import {hairScalpPoint} from './hair-profile.mjs';
// Sculpted locks: solid tapered surfaces, no transparent cards or loose fibers.
export function createNaturalHair({THREE,color,style,hat,hatColor,skinColor}){
  const root=new THREE.Group();root.name='customAvatarHair';const covered=hat==='cap'||hat==='beanie';
  const base=new THREE.Color(color),positions=[],colors=[],indices=[];
  function merge(geometry,shade=1){
    const p=geometry.attributes.position,offset=positions.length/3,c=base.clone().multiplyScalar(shade);
    for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));colors.push(c.r,c.g,c.b);}
    for(const index of geometry.index.array)indices.push(offset+index);geometry.dispose();
  }
  function lock(points,width,depth,shade=1){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),verts=[],tris=[],steps=18,sides=10;
    for(let i=0;i<=steps;i++){
      const t=i/steps,p=curve.getPoint(t),tangent=curve.getTangent(t);
      const reference=Math.abs(tangent.y)>.9?new THREE.Vector3(0,0,1):new THREE.Vector3(0,1,0);
      const side=new THREE.Vector3().crossVectors(tangent,reference).normalize(),normal=new THREE.Vector3().crossVectors(side,tangent).normalize();
      const taper=Math.max(.015,Math.sin((.17+t*.83)*Math.PI/2)*Math.pow(1-t,.43));
      for(let j=0;j<=sides;j++){
        const a=j/sides*Math.PI*2,ridge=1+.045*Math.cos(a*6),v=p.clone().addScaledVector(side,Math.cos(a)*width*taper*ridge).addScaledVector(normal,Math.sin(a)*depth*taper);
        verts.push(v.x,v.y,v.z);
        if(i<steps&&j<sides){const k=i*(sides+1)+j;tris.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}
      }
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(tris);merge(geo,shade);
  }
  const scalp=new THREE.SphereGeometry(1,36,24,0,Math.PI*2,0,1),p=scalp.attributes.position,uv=scalp.attributes.uv;
  for(let i=0;i<p.count;i++){const phi=uv.getX(i)*Math.PI*2,theta=(1-uv.getY(i))*(1.5-.31*Math.sin(phi)),v=hairScalpPoint(phi,theta,style);p.setXYZ(i,...v);}
  if(!covered)merge(scalp,.87);else scalp.dispose();
  if(!covered){
    if(style==='short'){
      for(let i=0;i<10;i++){const z=-.115+i*.028;lock([[-.13,.13,z],[-.085,.235,z+.012],[.035,.225,z+.026],[.145,.13,z+.036]],.024,.022,.96+i%3*.045);}
      for(let i=0;i<3;i++)lock([[.03,.19,.10],[.075,.17,.165],[.125,.095-i*.012,.16]],.029,.017,1.03);
    }
    if(style==='fade'){
      for(let i=0;i<7;i++){const x=-.105+i*.033;lock([[x,.17,.125],[x+.025,.261,.07],[x+.03,.255,-.06],[x+.02,.15,-.145]],.026,.025,.98+i%2*.07);}
    }
    if(style==='quiff'){
      for(let i=0;i<8;i++){const x=-.13+i*.035;lock([[x,.13,.15],[x-.015,.31,.16],[x+.02,.35,.045],[x+.045,.23,-.13]],.03,.033,.95+i%3*.045);}
    }
    if(style==='curly'){
      for(let i=0;i<30;i++){
        const phi=i*2.39996,theta=.12+Math.sqrt((i+.5)/30)*1.14,v=new THREE.Vector3(...hairScalpPoint(phi,theta,style,.006));
        const points=[];for(let j=0;j<13;j++){const t=j/12,a=t*Math.PI*2.3;points.push([v.x+Math.cos(a)*.023,v.y+Math.sin(a)*.018,v.z+(t-.5)*.038]);}
        lock(points,.012,.012,.91+i%4*.045);
      }
    }
    if(style==='bob'||style==='long'){
      const end=style==='bob'?-.14:-.30;
      for(let i=0;i<15;i++){
        const phi=Math.PI+i/14*Math.PI,x=Math.cos(phi)*.17,z=Math.sin(phi)*.065-.13;
        lock([[x*.55,.19,z*.65],[x,.06,z],[x*1.08,end*.65,z-.018],[x*.98,end,z+.012]],.032,style==='bob'?.032:.025,.94+i%3*.045);
      }
      for(const side of [-1,1])for(let i=0;i<4;i++){
        const z=.075-i*.035;lock([[side*.06,.205,.035],[side*.16,.12,z],[side*.19,-.04,z-.012],[side*.16,end,z-.025]],.036,.022,.98+i%2*.07);
      }
      if(style==='bob')for(let i=0;i<5;i++)lock([[-.12+i*.025,.18,.10],[-.06+i*.028,.145,.17],[.015+i*.028,.075,.166]],.027,.015,1.02);
    }
    if(style==='ponytail'){
      for(let i=0;i<9;i++){
        const phi=i/9*Math.PI*2;lock([[Math.cos(phi)*.15,.05,Math.sin(phi)*.13],[Math.cos(phi)*.13,.18,-.05],[Math.cos(phi)*.035,.085,-.20]],.024,.014,.96+i%3*.035);
      }
    }
  }
  if(style==='ponytail'){
    for(let i=0;i<8;i++){const phi=i/8*Math.PI*2,x=Math.cos(phi)*.04,z=Math.sin(phi)*.032;lock([[x,.06,-.22+z],[x+.025,-.075,-.245+z],[x+.015,-.20,-.23+z],[x*.4,-.315,-.20+z]],.026,.023,.96+i%2*.06);}
    const tie=new THREE.Mesh(new THREE.TorusGeometry(.05,.008,6,18),new THREE.MeshStandardMaterial({color:'#302a2b'}));tie.position.set(0,.035,-.22);root.add(tie);
  }
  if(positions.length){
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
    const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.62,metalness:0});
    const mesh=new THREE.Mesh(geo,material);mesh.castShadow=true;root.add(mesh);
  }
  if(covered){
    const material=new THREE.MeshStandardMaterial({color:hatColor,roughness:.9});const mesh=new THREE.Mesh(new THREE.SphereGeometry(.205,24,14,0,Math.PI*2,0,Math.PI/2),material);mesh.position.y=.015;root.add(mesh);
    if(hat==='cap'){const brim=new THREE.Mesh(new THREE.SphereGeometry(1,20,8),material);brim.scale.set(.16,.012,.115);brim.position.set(0,.025,.17);root.add(brim);}
    else{const rim=new THREE.Mesh(new THREE.TorusGeometry(.196,.02,8,24),material);rim.rotation.x=Math.PI/2;rim.position.y=.025;root.add(rim);}
  }
  return root;
}
