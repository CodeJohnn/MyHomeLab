const clamp=value=>Math.max(0,Math.min(1,value));
export function autoAvatarWeights(x,y,height,{hips=.44,shoulder=.73,head=.8,armEdge=.16}={}){
  const ny=y/height,nx=x/height,side=x<0?0:1;
  // Indices: root, spine, head, left/right hips, knees, arms and forearms.
  if(ny>=head)return {indices:[2,1,0,0],weights:[clamp((ny-head)/.07),1-clamp((ny-head)/.07),0,0]};
  if(ny<hips){
    const knee=clamp((hips*.6-ny)/.11),hip=3+side,lower=5+side;
    const seam=clamp((hips-ny)/.08);
    return {indices:[hip,lower,1,0],weights:[(1-knee)*seam,knee*seam,1-seam,0]};
  }
  if(Math.abs(nx)>armEdge&&ny>hips+.04&&ny<shoulder+.09){
    const blend=clamp((Math.abs(nx)-armEdge)/.055),forearm=clamp((shoulder-.13-ny)/.12);
    return {indices:[7+side,9+side,1,0],weights:[blend*(1-forearm),blend*forearm,1-blend,0]};
  }
  return {indices:[1,0,0,0],weights:[1,0,0,0]};
}
