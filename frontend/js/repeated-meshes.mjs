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
