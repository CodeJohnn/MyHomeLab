// Identical local geometry and material; the parent remains movable and interactive.
export function instanceMeshes(THREE,parent,meshes){
  if(meshes.length<2)return null;
  const first=meshes[0];
  if(meshes.some(mesh=>mesh.parent!==parent||mesh.geometry!==first.geometry||mesh.material!==first.material))throw new Error('Instâncias precisam compartilhar pai, geometria e material.');
  const batch=new THREE.InstancedMesh(first.geometry,first.material,meshes.length);
  batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;
  meshes.forEach((mesh,index)=>{mesh.updateMatrix();batch.setMatrixAt(index,mesh.matrix);});
  batch.instanceMatrix.needsUpdate=true;batch.computeBoundingBox();batch.computeBoundingSphere();
  meshes.forEach(mesh=>parent.remove(mesh));parent.add(batch);return batch;
}

// Opt-in static decoration only. Spatial buckets retain useful culling granularity.
export function instanceStaticDecoration(THREE,root,{cellSize=6,minCount=4}={}){
  let removed=0,batches=0;
  const parents=[];root.traverse(node=>{if(node.children.length)parents.push(node);});
  for(const parent of parents){
    const groups=new Map();
    for(const mesh of parent.children){
      if(!mesh.isMesh||mesh.isInstancedMesh||mesh.isSkinnedMesh||mesh.children.length||!mesh.visible||Array.isArray(mesh.material)||mesh.material.transparent||mesh.material.opacity!==1||mesh.morphTargetInfluences||mesh.customDepthMaterial||mesh.customDistanceMaterial||Object.hasOwn(mesh,'onBeforeRender')||Object.hasOwn(mesh,'onAfterRender')||mesh.scale.x<=0||mesh.scale.y<=0||mesh.scale.z<=0)continue;
      const cell=[mesh.position.x,mesh.position.y,mesh.position.z].map(value=>Math.floor(value/cellSize)).join(',');
      const key=[mesh.geometry.uuid,mesh.material.uuid,mesh.castShadow,mesh.receiveShadow,mesh.renderOrder,mesh.layers.mask,mesh.frustumCulled,cell].join(':');
      if(!groups.has(key))groups.set(key,[]);groups.get(key).push(mesh);
    }
    for(const meshes of groups.values())if(meshes.length>=minCount){
      const first=meshes[0],batch=instanceMeshes(THREE,parent,meshes);
      batch.name='staticDecorationBatch';batch.renderOrder=first.renderOrder;batch.layers.mask=first.layers.mask;batch.frustumCulled=first.frustumCulled;
      batch.updateMatrix();batch.matrixAutoUpdate=false;removed+=meshes.length-1;batches++;
    }
  }
  return {batches,removed};
}
