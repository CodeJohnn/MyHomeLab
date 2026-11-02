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
      node.material.roughness=part==='skin'?.8:.95;
      node.material.metalness=0;
    }
    if(node.userData.avatarTorso)node.scale.x=config.gender==='feminine'?.92:1;
  });
  const head=root.getObjectByName('onlineAvatarHead');if(!head)return;
  const hairSignature=config.hair+':'+config.hairStyle;
  if(root.userData.avatarHairSignature===hairSignature)return;
  root.userData.avatarHairSignature=hairSignature;
  const old=head.getObjectByName('customAvatarHair');
  if(old){const materials=new Set();old.traverse(n=>{n.geometry?.dispose();if(n.material)materials.add(n.material);});materials.forEach(m=>m.dispose());old.removeFromParent();}
  const hair=new THREE.Group();hair.name='customAvatarHair';head.add(hair);
  const hairMaterial=new THREE.MeshStandardMaterial({color:config.hair,roughness:.95,metalness:0});
  function piece(x,y,z,sx,sy,sz){
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,18,12),hairMaterial);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);hair.add(mesh);
  }
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.19,24,16,0,Math.PI*2,0,1.15),hairMaterial);
  cap.position.set(0,-.02,-.005);cap.scale.z=.97;hair.add(cap);
  if(config.hairStyle==='long'){
    piece(0,-.07,-.13,.173,.25,.065);
    for(const side of [-1,1])piece(side*.163,-.045,-.012,.035,.21,.075);
  }else if(config.hairStyle==='curly'){
    for(let i=0;i<9;i++){const angle=i*Math.PI*2/9;piece(Math.cos(angle)*.12,.13+Math.sin(i*2)*.012,Math.sin(angle)*.115,.06,.06,.06);}
  }else piece(-.035,.125,.105,.12,.045,.045);
}
