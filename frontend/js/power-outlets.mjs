// Pontos visuais de alimentacao; acompanham a parede mais proxima do equipamento.
export function createPowerOutlets({THREE,box,M,byId,roomWalls}){
  const plate=M('#e2e1d9',.12,.65),inset=M('#c2c6c1',.1,.7),holes=M('#253239');
  const holeGeometry=new THREE.CircleGeometry(.007,8);
  const points=[
    ['mesa','SETUP',.48],['mesaL','BANCADA',1.15],['mesaLeitura','LEITURA',.48],
    ['setupVitoria','VITORIA',.48],['setupXandy','XANDY',.48],['setupAlex','ALEX',.48],
    ['bancadaTI','TI 01',.48],['instrumentosTI','TI 02',.48],['rackExtraTI','RACK 03',.48],
    ['pecasTI','REDE',.48],['rackStorageNovo','STORAGE',.48],['rackClusterNovo','CLUSTER',.48]
  ].map(([id,label,height])=>{
    const group=new THREE.Group();group.name='Tomada '+label;group.userData.wallAttachment=true;
    box(group,.15,.25,.026,plate,0,0,0,.012);
    for(const y of [-.06,.06]){
      box(group,.11,.095,.009,inset,0,y,.018,.012);
      for(const [x,dy]of [[-.026,.012],[.026,.012],[0,-.017]]){
        const hole=new THREE.Mesh(holeGeometry,holes);hole.position.set(x,y+dy,.024);group.add(hole);
      }
    }
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#e2e1d9';ctx.fillRect(0,0,256,64);ctx.fillStyle='#34434a';ctx.textAlign='center';ctx.font='bold 30px sans-serif';ctx.fillText(label,128,44,240);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const tag=new THREE.Mesh(new THREE.PlaneGeometry(.2,.05),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));tag.position.set(0,.17,.017);group.add(tag);
    return {id,group,height,signature:''};
  });
  let lastUpdate=-Infinity;
  function update(time){
    if(time-lastUpdate<400)return;lastUpdate=time;
    for(const point of points){
      const target=byId[point.id]?.g;if(!target)continue;
      const x=target.position.x,z=target.position.z,signature=x+':'+z;
      if(point.signature===signature)continue;point.signature=signature;
      const candidates=[
        {side:'back',distance:Math.abs(z+3.5),x:THREE.MathUtils.clamp(x,-4.1,12.1),z:-3.405,angle:0},
        {side:'front',distance:Math.abs(z-10.5),x:THREE.MathUtils.clamp(x,-4.1,12.1),z:10.405,angle:Math.PI},
        {side:'left',distance:Math.abs(x+4.5),x:-4.405,z:THREE.MathUtils.clamp(z,-3.1,10.1),angle:Math.PI/2},
        {side:'right',distance:Math.abs(x-12.5),x:12.405,z:THREE.MathUtils.clamp(z,-3.1,10.1),angle:-Math.PI/2}
      ].filter(p=>!(p.side==='front'&&p.x>3.05&&p.x<4.95)&&!(p.side==='back'&&p.x>2.35&&p.x<4.25));
      const wall=candidates.sort((a,b)=>a.distance-b.distance)[0];
      roomWalls[wall.side].group.add(point.group);point.group.position.set(wall.x,point.height,wall.z);point.group.rotation.y=wall.angle;
    }
  }
  return {update};
}
