export function hairScalpPoint(phi,theta,style,lift=0){
  const crown=Math.max(0,Math.cos(theta)),front=Math.max(0,Math.sin(phi)),wave=style==='curly'?Math.sin(phi*5)*Math.sin(theta)*.002:0;
  const width=style==='bob'?.012:style==='long'?.006:0;
  const height={short:0,fade:.022,quiff:.10,curly:.047,bob:.023,long:.012,ponytail:0}[style]||0;
  const fade=style==='fade'?.012*Math.pow(Math.sin(theta),3):0;
  const volume=style==='quiff'?.55+front*1.5*Math.sin(theta)*Math.exp(-theta*theta/.8):1;
  return [-Math.cos(phi)*Math.sin(theta)*(.177+lift+width+wave-fade),Math.cos(theta)*(.219+lift)+.008+height*crown*crown*volume,Math.sin(phi)*Math.sin(theta)*(.181+lift+width+wave-fade)-.005];
}
