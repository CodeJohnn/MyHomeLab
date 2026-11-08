// Desktop follows display refresh; touch devices retain their battery-saving cap.
export function createFrameClock({maxFps=Infinity,maxDelta=.05}={}){
  const interval=1000/maxFps;
  let previous=null,lastSlot=null;
  return {
    reset(time){previous=time;lastSlot=time;},
    next(time){
      if(previous===null){previous=time;lastSlot=time;return 1/60;}
      const elapsed=time-lastSlot;
      if(interval&&elapsed<interval-.5)return null;
      const dt=Math.min(maxDelta,Math.max(0,(time-previous)/1000));
      previous=time;
      lastSlot=interval?(elapsed<interval?lastSlot+interval:time-(elapsed%interval)):time;
      return dt;
    }
  };
}
