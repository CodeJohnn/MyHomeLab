// Reveal the existing CSS3D player through the WebGL canvas at the screen's depth.
// Players, streams and media materials remain owned by the existing media code.
export function createScreenDepth(THREE){
  const masks=new Map();
  const material=new THREE.MeshBasicMaterial({color:0x000000,opacity:0,transparent:true,
    blending:THREE.NoBlending,depthTest:true,depthWrite:true,side:THREE.DoubleSide,forceSinglePass:true,toneMapped:false,fog:false});
  return {
    setVisible(screen,visible){
      let mask=masks.get(screen);
      if(!mask&&visible){
        mask=new THREE.Mesh(screen.geometry,material);mask.name='screenDepthMask';
        mask.position.z=.006;mask.renderOrder=-1;
        // The proxy participates in depth only, never pointer picking or shadows.
        mask.raycast=()=>{};mask.castShadow=false;mask.receiveShadow=false;
        screen.add(mask);masks.set(screen,mask);
      }
      if(mask)mask.visible=visible;
    },
    dispose(){for(const mask of masks.values())mask.removeFromParent();masks.clear();material.dispose();}
  };
}
