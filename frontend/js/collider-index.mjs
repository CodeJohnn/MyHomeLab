// Broad phase only: the final circle/AABB predicate is identical to the linear scan.
export function createColliderIndex(boxes,{cellSize=1.5,maxCells=256}={}){
  if(!Number.isFinite(cellSize)||cellSize<=0||!Number.isInteger(maxCells)||maxCells<1)throw new RangeError('Invalid spatial index dimensions');
  const cells=new Map(),large=[],seen=new Int32Array(boxes.length);let stamp=0,cellCount=0;
  for(let id=0;id<boxes.length;id++){
    const {min,max}=boxes[id];if(![min.x,min.z,max.x,max.z].every(Number.isFinite))continue;
    const x0=Math.floor(min.x/cellSize),x1=Math.floor(max.x/cellSize),z0=Math.floor(min.z/cellSize),z1=Math.floor(max.z/cellSize);
    if((x1-x0+1)*(z1-z0+1)>maxCells){large.push(id);continue;}
    for(let x=x0;x<=x1;x++){
      if(!cells.has(x))cells.set(x,new Map());const column=cells.get(x);
      for(let z=z0;z<=z1;z++){if(!column.has(z)){column.set(z,[]);cellCount++;}column.get(z).push(id);}
    }
  }
  function intersects(id,x,z,r2){const {min,max}=boxes[id],dx=x-Math.max(min.x,Math.min(x,max.x)),dz=z-Math.max(min.z,Math.min(z,max.z));return dx*dx+dz*dz<r2;}
  return {
    info:{boxes:boxes.length,cells:cellCount,largeBoxes:large.length},
    blocked(x,z,radius){
      if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(radius)){for(let id=0;id<boxes.length;id++)if(intersects(id,x,z,radius*radius))return true;return false;}
      radius=Math.abs(radius);
      const r2=radius*radius,x0=Math.floor((x-radius)/cellSize),x1=Math.floor((x+radius)/cellSize),z0=Math.floor((z-radius)/cellSize),z1=Math.floor((z+radius)/cellSize);
      if((x1-x0+1)*(z1-z0+1)>maxCells){for(let id=0;id<boxes.length;id++)if(intersects(id,x,z,r2))return true;return false;}
      for(const id of large)if(intersects(id,x,z,r2))return true;
      if(++stamp===2147483647){seen.fill(0);stamp=1;}
      for(let cx=x0;cx<=x1;cx++){
        const column=cells.get(cx);if(!column)continue;
        for(let cz=z0;cz<=z1;cz++){
          const bucket=column.get(cz);if(!bucket)continue;
          for(const id of bucket){if(seen[id]===stamp)continue;seen[id]=stamp;if(intersects(id,x,z,r2))return true;}
        }
      }
      return false;
    }
  };
}
