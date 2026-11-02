export function applyAvatarAppearance(root,config,THREE){
  const signature=JSON.stringify(config);if(root.userData.avatarSignature===signature)return;
  root.userData.avatarSignature=signature;
  root.traverse(node=>{
    if(node.userData.avatarHide)node.visible=false;
    if(node.userData.avatarGlasses)node.visible=config.glasses;
    const part=node.userData.avatarPart;
    if(part&&node.material){
      if(!node.userData.avatarOwnMaterial){node.material=node.material.clone();node.userData.avatarOwnMaterial=true;}
      node.material.color.set(config[part]);
    }
    if(node.userData.avatarTorso)node.scale.x=config.gender==='feminine'?.92:1;
  });
  const head=root.getObjectByName('onlineAvatarHead');if(!head)return;
  const old=head.getObjectByName('customAvatarHair');
  if(old){old.traverse(n=>{n.geometry?.dispose();n.material?.dispose();});old.removeFromParent();}
  const hair=new THREE.Group();hair.name='customAvatarHair';head.add(hair);
  function piece(x,y,z,sx,sy,sz){
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,12,10),new THREE.MeshStandardMaterial({color:config.hair,roughness:.9}));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);hair.add(mesh);
  }
  piece(0,.13,-.025,.17,.14,.16);
  if(config.hairStyle==='long'){
    piece(0,-.04,-.12,.18,.3,.08);
    for(const side of [-1,1])piece(side*.16,-.025,.015,.045,.25,.1);
  }else if(config.hairStyle==='curly'){
    for(let i=0;i<12;i++){const angle=i*Math.PI/6;piece(Math.cos(angle)*.14,.15+Math.sin(i*2)*.025,Math.sin(angle)*.13,.075,.075,.075);}
  }
}
