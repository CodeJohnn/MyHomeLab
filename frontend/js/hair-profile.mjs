export function hairScalpPoint(phi,theta,style,lift=0){
  const crown=Math.max(0,Math.cos(theta)),front=Math.max(0,Math.sin(phi)),wave=style==='curly'?Math.sin(phi*13+theta*19)*.005:0;
  const width=style==='bob'?.012:style==='long'?.006:0;
  const height={short:0,fade:.022,quiff:.10,curly:.047,bob:.023,long:.012,ponytail:0}[style]||0;
  return [-Math.cos(phi)*Math.sin(theta)*(.177+lift+width+wave),Math.cos(theta)*(.219+lift)+.008+height*crown*crown*(style==='quiff'?.5+front*.5:1),Math.sin(phi)*Math.sin(theta)*(.181+lift+width+wave)-.005];
}
