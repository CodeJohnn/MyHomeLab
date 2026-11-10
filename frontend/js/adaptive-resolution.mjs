export function createAdaptiveResolution({enabled,initialRatio,onChange}){
  const maximum=initialRatio,minimum=Math.min(.8,maximum);
  let ratio=maximum,previous=null,start=null,total=0,count=0,lastChange=-Infinity;
  function reset(){previous=null;start=null;total=0;count=0;}
  return {
    get ratio(){return ratio;},
    reset,
    sample(time){
      if(!enabled)return;
      if(start===null){start=time;previous=time;return;}
      const elapsed=time-previous;previous=time;
      if(elapsed<=0||elapsed>250){reset();return;}
      if(time-start<4000)return;
      total+=elapsed;count++;
      if(count<90)return;
      const average=total/count;total=0;count=0;
      let next=ratio;
      if(average>44&&time-lastChange>3000)next=Math.max(minimum,ratio-.15);
      else if(average<35&&time-lastChange>10000)next=Math.min(maximum,ratio+.10);
      if(next===ratio)return;
      next=next===maximum?maximum:Math.min(maximum,Math.max(minimum,Math.round(next*100)/100));
      if(next!==ratio){ratio=next;lastChange=time;onChange(ratio);}
    }
  };
}
