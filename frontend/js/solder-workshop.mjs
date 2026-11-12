const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function solderCycle(time){
  const t=((time%12)+12)%12;
  return {stage:t<1.2?'pickup':t<3?'approach':t<7.5?'solder':t<10?'inspect':'return',
    reach:t<1.2?smooth(t/1.2):t<3?1:t<7.5?1:t<10?1-smooth((t-7.5)/2.5):0,
    contact:t>=3&&t<7.5,held:t>=.6&&t<10.8,lift:t<3?.10*(1-smooth((t-1.2)/1.8)):t<7.5?0:.10};
}

export function createSolderWorkshop({THREE,bench,board,box,cyl,M,isMobile=false}){
  const props=new THREE.Group();props.name='snotWorkshop';bench.add(props);
  const dark=M('#202a31'),steel=M('#a3afb5',.65,.4),green=M('#236c4a'),blue=M('#245c73');
  const ledMat=new THREE.MeshStandardMaterial({color:'#41e69d',emissive:'#41e69d',emissiveIntensity:.5});
  // Keep the middle of the original work mat clear for the existing moving board.
  box(props,.28,.13,.16,dark,.74,1.145,1.44,.012);
  box(props,.19,.075,.008,ledMat,.74,1.16,1.525,.003);
  for(let i=0;i<3;i++)cyl(props,.012,.018,steel,.66+i*.075,1.22,1.44,10);
  box(props,.27,.018,.18,blue,.74,1.086,1.05,.005);
  for(let i=0;i<3;i++){
    box(props,.012,.012,.12,steel,.66+i*.07,1.105,1.05,.003);
    box(props,.025,.018,.045,dark,.66+i*.07,1.11,1.12,.003);
  }
  for(let i=0;i<6;i++){
    const x=.67+i%3*.065,z=.54+Math.floor(i/3)*.055;
    box(props,.035,.012,.025,green,x,1.11,z,.002);
    box(props,.018,.009,.012,dark,x,1.12,z,.001);
  }
  const led=cyl(board,.007,.007,ledMat,-.25,1.109,-.20,8);
  const effects=new THREE.Group();effects.name='solderContactEffects';bench.add(effects);effects.visible=false;
  const glowMat=new THREE.MeshBasicMaterial({color:'#ff9b32',transparent:true,opacity:.7,depthWrite:false});
  const glow=new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),glowMat);glow.scale.y=.22;effects.add(glow);
  const light=new THREE.PointLight('#ff9a38',0,.65,2);light.castShadow=false;effects.add(light);
  const count=isMobile?6:10,smokeCount=isMobile?3:5;
  const sparks=new Float32Array(count*3),smoke=new Float32Array(smokeCount*3);
  const pixels=new Uint8Array(16*16*4);
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const i=(y*16+x)*4,r=Math.hypot((x-7.5)/7.5,(y-7.5)/7.5);
    pixels[i]=pixels[i+1]=pixels[i+2]=255;pixels[i+3]=Math.round(Math.max(0,1-r)**2*255);
  }
  const particleTexture=new THREE.DataTexture(pixels,16,16);particleTexture.needsUpdate=true;
  particleTexture.magFilter=THREE.LinearFilter;
  function particles(array,color,size,opacity){
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(array,3).setUsage(THREE.DynamicDrawUsage));
    const material=new THREE.PointsMaterial({color,size,map:particleTexture,transparent:true,opacity,depthWrite:false,sizeAttenuation:true});
    const points=new THREE.Points(geometry,material);points.frustumCulled=false;effects.add(points);return points;
  }
  const sparkPoints=particles(sparks,'#ffbf65',.007,.8),smokePoints=particles(smoke,'#abb6bd',.018,.12);
  const contact=new THREE.Vector3(),world=new THREE.Vector3();let disposed=false;
  return {
    contact,world,props,effects,light,
    reset(time){
      if(disposed)return;
      effects.visible=false;light.intensity=0;
      ledMat.emissiveIntensity=.25+(Math.sin(time*3)> .65?.65:0);
    },
    update(time,active){
      if(disposed)return;
      effects.visible=active;light.intensity=active?.11+Math.sin(time*47)*.025:0;
      if(!active)return;
      effects.position.copy(contact);glowMat.opacity=.45+Math.sin(time*37)*.15;
      // Fixed pools, deterministic lifetimes: no per-frame allocation or emitters.
      for(let i=0;i<count;i++){
        const age=(time*3.4+i/count)%1,angle=i*2.399;
        sparks[i*3]=Math.cos(angle)*age*.035;sparks[i*3+1]=.004+age*(1-age)*.09;sparks[i*3+2]=Math.sin(angle)*age*.035;
      }
      for(let i=0;i<smokeCount;i++){
        const age=(time*.65+i/smokeCount)%1;
        smoke[i*3]=Math.sin(time*1.1+i)*.012*age;smoke[i*3+1]=.015+age*.15;smoke[i*3+2]=Math.cos(time+i)*.009*age;
      }
      sparkPoints.geometry.attributes.position.needsUpdate=true;smokePoints.geometry.attributes.position.needsUpdate=true;
    },
    dispose(){
      if(disposed)return;disposed=true;
      // Static primitives belong to the scene pool; dispose only private geometry.
      props.traverse(node=>{if(node.isMesh&&!node.geometry.userData.sharedPrimitive)node.geometry.dispose();});
      led.removeFromParent();
      if(!led.geometry.userData.sharedPrimitive)led.geometry.dispose();
      glow.geometry.dispose();glowMat.dispose();
      for(const points of [sparkPoints,smokePoints]){points.geometry.dispose();points.material.dispose();}
      particleTexture.dispose();
      for(const mat of [dark,steel,green,blue,ledMat])mat.dispose();
      light.dispose();effects.removeFromParent();props.removeFromParent();
    }
  };
}
