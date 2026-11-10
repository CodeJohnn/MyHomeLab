import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {disposePrivateGeometry} from './primitive-pool.mjs';

// Merge only direct, static hair pieces. Eyes and their blinking pivots stay intact.
export function mergeNpcHair(THREE,head,material){
  const pieces=head.children.filter(node=>node.isMesh&&node.material===material);
  if(pieces.length<2)return;
  const geometries=pieces.map(node=>{
    node.updateMatrix();
    const geometry=node.geometry.clone();geometry.applyMatrix4(node.matrix);
    geometry.deleteAttribute('uv');
    if(!geometry.index)return geometry;
    const flat=geometry.toNonIndexed();geometry.dispose();return flat;
  });
  const merged=mergeGeometries(geometries,false);
  geometries.forEach(geometry=>geometry.dispose());
  if(!merged)return;
  merged.computeBoundingSphere();
  const hair=new THREE.Mesh(merged,material);hair.name='npcHair';hair.castShadow=true;
  for(const piece of pieces){piece.removeFromParent();disposePrivateGeometry(piece.geometry);}
  head.add(hair);
}
