export function buildBilliardsTable({THREE,table,box}){
  const material=(color,roughness=.65,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const wood=material('#35231e',.36),felt=material('#16564c',.98),rubber=material('#144d43',.85),leather=material('#211b18',.9),metal=material('#9d8860',.32,.65);
  function rectangle(w,h){const s=new THREE.Shape();s.moveTo(-w/2,-h/2);s.lineTo(w/2,-h/2);s.lineTo(w/2,h/2);s.lineTo(-w/2,h/2);s.closePath();return s;}
  function slab(shape,y,depth,mat){const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:24});g.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(g,mat);mesh.position.y=y;mesh.castShadow=true;mesh.receiveShadow=true;table.add(mesh);return mesh;}
  // Frame has an open centre; the pocket holes continue through the playing surface.
  const frame=rectangle(2.84,1.64),centre=new THREE.Path();centre.moveTo(-1.25,-.65);centre.lineTo(-1.25,.65);centre.lineTo(1.25,.65);centre.lineTo(1.25,-.65);centre.closePath();frame.holes.push(centre);slab(frame,.715,.12,wood);
  const bed=rectangle(2.5,1.3);
  for(const x of [-1.12,0,1.12])for(const z of [-.52,.52]){const hole=new THREE.Path();hole.absarc(x,-z,.106,0,Math.PI*2,true);bed.holes.push(hole);}
  slab(bed,.775,.028,felt);
  // Mitred cushions meet the actual collision lines and leave six pocket mouths open.
  for(const side of [-1,1])for(const half of [-1,1]){
    const a=half<0?-1.075:.105,b=half<0?-.105:1.075;
    const shape=new THREE.Shape();shape.moveTo(a,side*.65);shape.lineTo(b,side*.65);shape.lineTo(b-.045,side*.527);shape.lineTo(a+.045,side*.527);shape.closePath();slab(shape,.803,.055,rubber);
  }
  for(const side of [-1,1]){
    const shape=new THREE.Shape();shape.moveTo(side*1.25,-.46);shape.lineTo(side*1.25,.46);shape.lineTo(side*1.127,.415);shape.lineTo(side*1.127,-.415);shape.closePath();slab(shape,.803,.055,rubber);
  }
  for(const x of [-1.12,0,1.12])for(const z of [-.52,.52]){
    const throat=new THREE.Mesh(new THREE.CylinderGeometry(.106,.082,.22,24,1,true),leather);throat.material.side=THREE.DoubleSide;throat.position.set(x,.695,z);table.add(throat);
    const bottom=new THREE.Mesh(new THREE.CircleGeometry(.083,24),material('#060707'));bottom.rotation.x=-Math.PI/2;bottom.position.set(x,.586,z);table.add(bottom);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.108,.009,6,24),leather);rim.rotation.x=Math.PI/2;rim.position.set(x,.808,z);table.add(rim);
  }
  for(const z of [-.77,.77]){
    box(table,2.67,.24,.075,wood,0,.58,z,.025);
    box(table,2.64,.012,.014,metal,0,.67,z*1.052,.003);
    for(const x of [-.85,-.57,-.29,.29,.57,.85]){const diamond=new THREE.Mesh(new THREE.BoxGeometry(.025,.004,.025),material('#d8d0b2',.38));diamond.rotation.y=Math.PI/4;diamond.position.set(x,.838,z);table.add(diamond);}
  }
  for(const x of [-1.36,1.36])box(table,.07,.24,1.43,wood,x,.58,0,.025);
  for(const x of [-1.12,1.12])for(const z of [-.55,.55]){
    box(table,.22,.52,.22,wood,x,.3,z,.035);
    const foot=new THREE.Mesh(new THREE.CylinderGeometry(.12,.135,.065,16),metal);foot.position.set(x,.055,z);table.add(foot);
  }
  for(const z of [-.5,.5])box(table,2.28,.075,.09,wood,0,.2,z,.014);
}
