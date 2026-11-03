// Decorative strands share one geometry to keep the editor and guests lightweight.
export function addHairDetails({THREE,hair,color,style,hasHat}){
  const vertices=[],normals=[],indices=[];let offset=0;
  function strand(points,radius=.002){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const tube=new THREE.TubeGeometry(curve,10,radius,3,false),p=tube.attributes.position,n=tube.attributes.normal;
    for(let i=0;i<p.count;i++){vertices.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));}
    for(const index of tube.index.array)indices.push(index+offset);offset+=p.count;tube.dispose();
  }
  if(!hasHat){
    // Follow the scalp from the crown to the variable hairline.
    for(let i=0;i<30;i++){
      const phi=i/30*Math.PI*2,max=1.5-.31*Math.sin(phi),points=[];
      for(let j=0;j<7;j++){const theta=.18+(max-.23)*j/6,twist=phi+.10*Math.sin(theta);points.push([-Math.cos(twist)*Math.sin(theta)*.18,Math.cos(theta)*.222+.008,Math.sin(twist)*Math.sin(theta)*.184-.005]);}
      strand(points,.0015);
    }
    if(style==='short'||style==='quiff'||style==='fade'){
      for(let i=0;i<11;i++){
        const x=-.12+i*.023,height=style==='quiff'?.065:.025;
        strand([[x,.155,.12],[x+.018,.20+height,.07],[x+.035,.211+height,-.015],[x+.04,.176,-.08]],.0035);
      }
    }
  }
  if(style==='long'||style==='bob'){
    const bottom=style==='bob'?-.19:-.30;
    for(let i=0;i<18;i++){
      const phi=Math.PI+i/17*Math.PI,x=Math.cos(phi)*.164,z=Math.sin(phi)*.07-.125;
      strand([[x*.75,.12,z],[x,-.02,z-.023],[x+Math.sin(i)*.008,bottom*.65,z-.025],[x*.95,bottom,z]],.0025);
    }
    for(const side of [-1,1])for(let i=0;i<5;i++)strand([[side*(.12+i*.009),.12,.085-i*.017],[side*.184,.01,.05-i*.018],[side*(.177+i*.002),bottom*.55,.005-i*.016],[side*.17,bottom*.82,-.025-i*.014]],.002);
  }
  if(style==='ponytail'){
    const tie=new THREE.Mesh(new THREE.TorusGeometry(.058,.009,5,16),new THREE.MeshStandardMaterial({color:'#27232a',roughness:.9}));tie.position.set(0,-.025,-.217);hair.add(tie);
    for(let i=0;i<12;i++){const phi=i*Math.PI*2/12;strand([[Math.cos(phi)*.052,-.02,-.22+Math.sin(phi)*.04],[Math.cos(phi)*.07,-.14,-.23+Math.sin(phi)*.06],[Math.cos(phi)*.045,-.29,-.22+Math.sin(phi)*.045]],.002);}
  }
  const accent=new THREE.Color(color).lerp(new THREE.Color('#b6a68e'),.12);
  if(vertices.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setIndex(indices);const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:accent,roughness:.85}));hair.add(mesh);}
  if(style==='curly'&&!hasHat){
    const geometry=new THREE.SphereGeometry(1,8,6),material=new THREE.MeshStandardMaterial({color,roughness:.9}),curls=new THREE.InstancedMesh(geometry,material,34),dummy=new THREE.Object3D();
    for(let i=0;i<34;i++){const phi=i*2.39996,r=.15*Math.sqrt((i+.5)/34);dummy.position.set(Math.cos(phi)*r,.215+Math.sqrt(Math.max(0,1-(r/.18)**2))*.033,Math.sin(phi)*r);dummy.scale.set(.028,.026,.028);dummy.rotation.set(i*.7,i*.3,0);dummy.updateMatrix();curls.setMatrixAt(i,dummy.matrix);}
    curls.instanceMatrix.needsUpdate=true;curls.castShadow=true;hair.add(curls);
  }
}
