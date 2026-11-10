export function createLightBudget({THREE,scene,isMobile=false}){
  const pools={point:[],spot:[]};
  scene.traverse(light=>{
    const type=light.isSpotLight?'spot':light.isPointLight?'point':null;
    if(type)pools[type].push({light,score:0,index:pools[type].length});
  });
  const position=new THREE.Vector3();
  let lastUpdate=-Infinity;
  return {update(time,focus){
    if(time-lastUpdate<250)return;
    lastUpdate=time;
    for(const type of ['point','spot']){
      const ranked=pools[type],limit=type==='spot'?8:(isMobile?2:4);
      for(const entry of ranked){
        entry.light.getWorldPosition(position);
        entry.score=entry.light.intensity/(1+position.distanceToSquared(focus));
      }
      // Match the original scene traversal order when two scores tie.
      ranked.sort((a,b)=>b.score-a.score||a.index-b.index);
      ranked.forEach(({light},index)=>{light.visible=index<limit;});
    }
  }};
}
