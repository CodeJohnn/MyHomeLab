import {buildHairGeometry} from './hair-geometry.mjs';
const geometryData=new Map();

// Attachment contract: head-local origin, +Z toward the face, Y up.
// Future GLB visuals can use this named group without changing the avatar rig.
export function createNaturalHair({THREE,color,style,hat,hatColor,hideHat=false}){
  const root=new THREE.Group();root.name='customAvatarHair';
  root.userData.hairStyle=style;root.userData.hairVisualSource='procedural';
  const covered=hat==='cap'||hat==='beanie';
  const key=style+':'+covered;
  if(!geometryData.has(key))geometryData.set(key,buildHairGeometry(style,{covered}));
  // Immutable CPU buffers are shared; each visual keeps independently disposable GPU resources.
  const data=geometryData.get(key);
  if(data.positions.length){
    const base=new THREE.Color(color),colors=new Float32Array(data.positions.length);
    for(let i=0;i<data.shades.length;i++){
      colors[i*3]=base.r*data.shades[i];colors[i*3+1]=base.g*data.shades[i];colors[i*3+2]=base.b*data.shades[i];
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(data.positions,3));
    geometry.setAttribute('normal',new THREE.BufferAttribute(data.normals,3));
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    geometry.setIndex(new THREE.BufferAttribute(data.indices,1));geometry.computeBoundingSphere();
    const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.82,metalness:0});
    const mesh=new THREE.Mesh(geometry,material);mesh.name='hairSurface';mesh.castShadow=true;root.add(mesh);
  }
  if(style==='ponytail'){
    const tie=new THREE.Mesh(new THREE.TorusGeometry(.047,.008,6,18),new THREE.MeshStandardMaterial({color:'#302a2b',roughness:.9}));
    tie.position.set(0,.035,-.22);root.add(tie);
  }
  if(covered&&!hideHat){
    const material=new THREE.MeshStandardMaterial({color:hatColor,roughness:.9});
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(.205,24,14,0,Math.PI*2,0,Math.PI/2),material);mesh.position.y=.015;root.add(mesh);
    if(hat==='cap'){
      const brim=new THREE.Mesh(new THREE.SphereGeometry(1,20,8),material);brim.scale.set(.16,.012,.115);brim.position.set(0,.025,.17);root.add(brim);
    }else{
      const rim=new THREE.Mesh(new THREE.TorusGeometry(.196,.02,8,24),material);rim.rotation.x=Math.PI/2;rim.position.y=.025;root.add(rim);
    }
  }
  return root;
}
