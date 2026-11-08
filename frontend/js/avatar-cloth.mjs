// Shared by the shirt and its fitted prints, so fabric never crosses a decal.
export const clothProfile = [
  [0,.19],[.018,.196],[.04,.21],[.075,.207],[.11,.213],
  [.16,.216],[.2,.22],[.27,.231],[.35,.24],[.43,.205],[.49,.095]
];

export function clothRadius(y){
  for(let i=1;i<clothProfile.length;i++){
    const [a,r0]=clothProfile[i-1],[b,r1]=clothProfile[i];
    if(y<=b)return r0+(r1-r0)*Math.max(0,(y-a)/(b-a));
  }
  return clothProfile.at(-1)[1];
}

// Shape existing vertices only: no extra draw calls, textures or animation work.
export function softenFabric(geometry){
  const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
    const t=Math.max(0,Math.min(1,(y+4)/8));
    const envelope=Math.sin(Math.PI*t)**2;
    const ease=1+envelope*(.035*Math.cos(t*Math.PI*4)-.018);
    positions.setXYZ(i,x*ease,y,z*ease);
  }
  positions.needsUpdate=true;
  geometry.computeVertexNormals();
  return geometry;
}
