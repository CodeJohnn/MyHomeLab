export function createMobileContactShadows({THREE,scene,objects}){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,8,64,64,64);
  gradient.addColorStop(0,'rgba(0,0,0,.26)');gradient.addColorStop(.5,'rgba(0,0,0,.12)');gradient.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const texture=new THREE.CanvasTexture(canvas);
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  const geometry=new THREE.PlaneGeometry(1,1);
  const contacts=objects.filter(object=>object.kind==='floor').map(({g})=>{
    const mesh=new THREE.Mesh(geometry,material);mesh.rotation.x=-Math.PI/2;mesh.renderOrder=1;scene.add(mesh);
    return {object:g,mesh,position:new THREE.Vector3(),rotation:new THREE.Euler(),scale:new THREE.Vector3(),dirty:true};
  });
  const world=new THREE.Vector3(),bounds=new THREE.Box3(),center=new THREE.Vector3();
  let lastUpdate=-Infinity,disposed=false;
  function update(time){
    if(disposed||time-lastUpdate<200)return;
    lastUpdate=time;
    for(const contact of contacts){
      const {object,mesh}=contact;
      if(!contact.dirty&&contact.position.equals(object.position)&&contact.rotation.equals(object.rotation)&&contact.scale.equals(object.scale))continue;
      contact.dirty=false;contact.position.copy(object.position);contact.rotation.copy(object.rotation);contact.scale.copy(object.scale);
      object.getWorldPosition(world);mesh.visible=world.y<.25;
      if(!mesh.visible)continue;
      bounds.setFromObject(object).getCenter(center);
      mesh.position.set(center.x,.038,center.z);
      mesh.scale.set(Math.min(5,bounds.max.x-bounds.min.x+.35),Math.min(3,bounds.max.z-bounds.min.z+.35),1);
    }
  }
  return {update,dispose(){
    if(disposed)return;
    disposed=true;
    for(const {mesh} of contacts)mesh.removeFromParent();
    contacts.length=0;geometry.dispose();material.dispose();texture.dispose();
  }};
}
