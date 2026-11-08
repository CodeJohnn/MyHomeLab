export function isPhysicalInteractionHit(hit,isVisible){
  const object=hit?.object;
  if(!object?.isMesh||object.userData?.interactionIgnore||!isVisible(object))return false;
  const material=Array.isArray(object.material)?object.material[hit.face?.materialIndex??0]:object.material;
  return material?.visible!==false&&material?.opacity!==0;
}

// Resolve depth before dispatching actions, regardless of which handler runs first.
export function closestInteraction(hits,characters,isVisible){
  let nearest=null;
  for(const hit of hits)if(isPhysicalInteractionHit(hit,isVisible)&&(!nearest||hit.distance<nearest.distance))nearest=hit;
  if(!nearest)return null;
  let character=null;
  for(let node=nearest.object;node;node=node.parent)if(characters.has(node)){character=characters.get(node);break;}
  return {hit:nearest,character};
}

export function canActivateHit(hit,frontHit,tolerance=.025){
  return !!hit&&(!frontHit||hit.distance<=frontHit.distance+tolerance);
}

export function interactionRoots(roots){
  const unique=new Set(roots);
  return [...unique].filter(root=>{for(let parent=root.parent;parent;parent=parent.parent)if(unique.has(parent))return false;return true;});
}

export function interactionHitsFor(hits,roots,recursive=true){
  const targets=new Set(roots);
  return hits.filter(hit=>{
    for(let node=hit.object;node;node=recursive?node.parent:null)if(targets.has(node))return true;
    return false;
  });
}
