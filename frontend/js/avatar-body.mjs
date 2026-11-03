// Shape changes stay inside the clothed body mesh; prints use the same surface.
export function feminineBustOffset(x,y){
  const vertical=Math.exp(-(((y-1.105)/.082)**2));
  return .077*vertical*(Math.exp(-(((x-.085)/.074)**2))+Math.exp(-(((x+.085)/.074)**2)));
}
export function applyBodyShape(node,gender){
  if(!node.userData.avatarTorso)return;
  if(!node.userData.bodyBasePositions){node.geometry=node.geometry.clone();node.userData.bodyBasePositions=Array.from(node.geometry.attributes.position.array);}
  const position=node.geometry.attributes.position,base=node.userData.bodyBasePositions,feminine=gender==='feminine';
  for(let i=0;i<position.count;i++){
    const x=base[i*3],y=base[i*3+1],z=base[i*3+2];
    const front=z>0?Math.min(1,z/.18)**2:0;
    position.setXYZ(i,x,y,z+(feminine?feminineBustOffset(x*.92,y+.79)*front/.8:0));
  }
  position.needsUpdate=true;node.geometry.computeVertexNormals();node.geometry.computeBoundingSphere();node.scale.x=feminine?.92:1;
}
