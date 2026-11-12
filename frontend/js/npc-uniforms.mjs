// NPC-only wardrobe. Clothing is the limb surface, never a second intersecting shell.
export const NPC_UNIFORMS=Object.freeze([
  {id:'hoodie',color:'#707276',pants:'#222326',trim:'#ededee'},
  {id:'tee',color:'#151619',pants:'#252629',trim:'#e8e8ea'},
  {id:'sport',color:'#e4e4e5',pants:'#17181a',trim:'#252629'},
  {id:'jacket',color:'#222326',pants:'#525458',trim:'#ededee'},
  {id:'shirt',color:'#b7b8ba',pants:'#222326',trim:'#303236'}
]);

// Circumference at the print's height (elliptical torso), in world units.
const PRINT_CIRCUMFERENCE=.94, TORSO_HEIGHT=.47;
// End-cap centers coincide with animation pivots. Unlike scaling a unit capsule
// along Y, this preserves a round joint when the adjacent segment bends.
export function fittedNpcLimb(THREE,pool,parent,material,{width,depth=width,span,name}){
  const radius=width/2;
  const mesh=new THREE.Mesh(pool.capsule(radius,span,4,10),material);
  mesh.name=name;mesh.scale.z=depth/width;mesh.position.y=-span/2;
  mesh.castShadow=true;parent.add(mesh);return mesh;
}
export function uniformTorsoGeometry(THREE,profile){
  const geometry=new THREE.LatheGeometry(profile,32).rotateY(Math.PI);
  const positions=geometry.attributes.position,uv=geometry.attributes.uv;
  // Lathe defaults use profile indices, which stretch prints on unevenly spaced rings.
  for(let i=0;i<positions.count;i++)uv.setY(i,positions.getY(i)/TORSO_HEIGHT);
  return geometry;
}
export function drawUniform(ctx,look,logo){
  const w=ctx.canvas.width,h=ctx.canvas.height;
  ctx.fillStyle=look.color;ctx.fillRect(0,0,w,h);
  ctx.fillStyle=look.trim;
  // Side seams and ribbed hem remain well away from the chest print.
  for(const u of [.25,.75])ctx.fillRect(u*w,.15*h,.009*w,.72*h);
  ctx.fillRect(0,.95*h,w,.025*h);
  if(look.id==='jacket'||look.id==='shirt'){
    ctx.fillRect(.497*w,0,.006*w,.93*h);
    if(look.id==='shirt')for(let y=.23;y<.9;y+=.14)ctx.fillRect(.495*w,y*h,.01*w,.01*h);
  }
  if(look.id==='sport')ctx.fillRect(0,.12*h,w,.055*h);
  if(look.id==='hoodie'){
    for(const u of [.46,.54])ctx.fillRect(u*w,.12*h,.003*w,.19*h);
    ctx.fillRect(.43*w,.76*h,.14*w,.006*h);
  }
  if(!logo)return;
  // Each print keeps the source aspect ratio in physical space, not atlas pixels.
  const aspect=logo.naturalWidth/logo.naturalHeight;
  const print=(u,y,width)=>{
    const height=width/aspect;
    ctx.fillStyle='#151619';
    ctx.fillRect((u-width/PRINT_CIRCUMFERENCE/2)*w-3,y*h-3,
      width/PRINT_CIRCUMFERENCE*w+6,height/TORSO_HEIGHT*h+6);
    ctx.drawImage(logo,(u-width/PRINT_CIRCUMFERENCE/2)*w,y*h,
      width/PRINT_CIRCUMFERENCE*w,height/TORSO_HEIGHT*h);
  };
  print(look.id==='jacket'||look.id==='shirt'?.57:.5,.31,.085);
  // Back is the atlas seam; split the image instead of reversing or stretching it.
  ctx.save();ctx.translate(-w/2,0);print(.5,.28,.13);ctx.restore();
  ctx.save();ctx.translate(w/2,0);print(.5,.28,.13);ctx.restore();
}

export function createNpcWardrobe(THREE,{canvasFactory=()=>document.createElement('canvas'),imageFactory=()=>new Image()}={}){
  const cache=new Map();const logo=imageFactory();
  logo.onload=()=>{for(const {canvas,texture,look} of cache.values()){drawUniform(canvas.getContext('2d'),look,logo);texture.needsUpdate=true;}};
  logo.src=new URL('../assets/guedessec.png',import.meta.url).href;
  return index=>{
    const look=NPC_UNIFORMS[index%NPC_UNIFORMS.length];
    if(cache.has(look.id))return cache.get(look.id);
    const canvas=canvasFactory();canvas.width=1024;canvas.height=512;
    drawUniform(canvas.getContext('2d'),look,logo.complete&&logo.naturalWidth?logo:null);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const fabric=color=>new THREE.MeshStandardMaterial({color,roughness:.9});
    const entry={look,canvas,texture,torso:new THREE.MeshStandardMaterial({map:texture,roughness:.9}),
      sleeve:fabric(look.color),pants:fabric(look.pants),shoe:fabric('#17181a'),trim:fabric(look.trim)};
    cache.set(look.id,entry);return entry;
  };
}
