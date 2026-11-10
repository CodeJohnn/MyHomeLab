// Scene-lifetime immutable geometry. Mesh transforms and materials stay independent.
export function createPrimitivePool(THREE,RoundedBoxGeometry,{limit=1024}={}){
  const cache=new Map();let hits=0,misses=0;
  function get(key,build){
    if(cache.has(key)){hits++;return cache.get(key);}
    misses++;const geometry=build();
    if(cache.size<limit){geometry.userData.sharedPrimitive=true;cache.set(key,geometry);}
    return geometry;
  }
  return {
    box(w,h,d,r=0){const radius=r?Math.min(r,w/2-.001,h/2-.001,d/2-.001):0;return get((r?'r:':'b:')+ [w,h,d,radius].join(','),()=>r?new RoundedBoxGeometry(w,h,d,2,radius):new THREE.BoxGeometry(w,h,d));},
    cylinder(r,h,segments=24){return get('c:'+ [r,h,segments].join(','),()=>new THREE.CylinderGeometry(r,r,h,segments));},
    sphere(r,segments=18){return get('s:'+r+','+segments,()=>new THREE.SphereGeometry(r,segments,12));},
    capsule(r,length,capSegments=4,radialSegments=10){return get('p:'+ [r,length,capSegments,radialSegments].join(','),()=>new THREE.CapsuleGeometry(r,length,capSegments,radialSegments));},
    stats:()=>({hits,misses,cached:cache.size}),
    dispose(){for(const geometry of cache.values())geometry.dispose();cache.clear();}
  };
}
export function disposePrivateGeometry(geometry){if(!geometry.userData?.sharedPrimitive)geometry.dispose();}
