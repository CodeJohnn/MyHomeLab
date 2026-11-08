import {hairScalpPoint} from './hair-profile.mjs';

export const hairStyles=Object.freeze(['short','fade','quiff','curly','bob','long','ponytail']);
const TAU=Math.PI*2;
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

// Head-local coordinates. Shared crowns and wrapped indices prevent pole/seam cracks.
// Locks are relief on a continuous surface, never independent cylinders.
export function buildHairGeometry(requestedStyle,{covered=false}={}){
  const style=hairStyles.includes(requestedStyle)?requestedStyle:'short';
  const positions=[],indices=[],shades=[];
  const add=(point,shade=1)=>{const id=positions.length/3;positions.push(...point);shades.push(shade);return id;};
  function shell(segments,rings,point){
    const outerStart=positions.length/3;
    const crown=add(point(0,0),1.015),rows=[];
    for(let row=1;row<=rings;row++){
      const ids=[];
      for(let col=0;col<segments;col++){
        const phi=col/segments*TAU,t=row/rings;
        const vertex=point(phi,t);
        ids.push(add(vertex,vertex.shade??(.965+.035*Math.cos(phi*3+.8)*Math.sin(Math.PI*t))));
      }
      rows.push(ids);
    }
    const faceStart=indices.length;
    for(let col=0;col<segments;col++)indices.push(crown,rows[0][col],rows[0][(col+1)%segments]);
    for(let row=1;row<rings;row++)for(let col=0;col<segments;col++){
      const next=(col+1)%segments,a=rows[row-1][col],b=rows[row][col],c=rows[row-1][next],d=rows[row][next];
      indices.push(a,b,c,c,b,d);
    }
    const outerEnd=positions.length/3,innerOffset=outerEnd-outerStart;
    // Thin inner shell and a return edge keep the nape and underside solid.
    for(let id=outerStart;id<outerEnd;id++)add([positions[id*3]*.966,positions[id*3+1]-.005,positions[id*3+2]*.966],.91);
    const outerFaces=indices.slice(faceStart);
    for(let i=0;i<outerFaces.length;i+=3)indices.push(outerFaces[i]+innerOffset,outerFaces[i+2]+innerOffset,outerFaces[i+1]+innerOffset);
    const edge=rows.at(-1);
    for(let col=0;col<segments;col++){
      const a=edge[col],b=edge[(col+1)%segments];indices.push(a,a+innerOffset,b,b,a+innerOffset,b+innerOffset);
    }
  }
  if(!covered){
    const curtain=style==='long'||style==='bob',capEnd=curtain?.64:1;
    const segments=curtain||style==='curly'?64:style==='fade'?48:56;
    const rings=curtain?30:style==='fade'?16:style==='short'||style==='ponytail'?18:20;
    shell(segments,rings,(phi,t)=>{
      const u=Math.min(1,t/capEnd),front=Math.sin(phi);
      const hairline=1.55-.35*Math.max(0,front)+.25*Math.max(0,-front)+.014*Math.sin(phi*7+.4)+.007*Math.sin(phi*11);
      const theta=u*hairline;
      const flow=phi+(.70*Math.sin(theta*1.5)+.18*Math.sin(phi*2+.5)*Math.sin(theta))*(style==='ponytail'?.35:1);
      const phase=flow*8+theta*(style==='quiff'?3.5:1.8)+.65*Math.sin(flow*3);
      const envelope=style==='curly'?1:Math.pow(Math.sin(theta),1.6);
      const ridge=Math.pow(.5+.5*Math.cos(phase),3);
      let lobe=(style==='fade'?.007:style==='quiff'?.014:.011)*ridge;
      if(style==='curly'){
        lobe=0;
        for(let i=0;i<26;i++){
          const curlPhi=i*2.399963,curlTheta=Math.sqrt((i+.5)/26)*1.8;
          const distance=2*(1-(Math.cos(theta)*Math.cos(curlTheta)+Math.sin(theta)*Math.sin(curlTheta)*Math.cos(phi-curlPhi)));
          lobe+=(.027+.005*Math.sin(i*4.7))*Math.exp(-distance/.028);
        }
      }
      const point=hairScalpPoint(phi,theta,style,lobe*envelope);
      if(curtain&&t>capEnd){
        const v=(t-capEnd)/(1-capEnd),drape=1-smooth(.18,.75,front);
        const edge=hairScalpPoint(phi,hairline,style,0);
        const bottom=(style==='long'?-.34:-.175)+.005*Math.sin(phi*7+.6)+.003*Math.sin(phi*13);
        const spread=1+.075*Math.sin(v*Math.PI)-.055*v*v;
        point[0]=edge[0]*spread+.004*drape*Math.sin(phi*8+v*3)*Math.sin(Math.PI*v);
        point[1]=edge[1]+(bottom-edge[1])*v*drape-.009*v*(1-drape);
        point[2]=edge[2]*spread-.009*Math.sin(Math.PI*v)*drape;
        const relief=.006*Math.pow(.5+.5*Math.cos(phi*10+.9*Math.sin(phi*3)+v*2),3)*Math.sin(Math.PI*v);
        point[0]+=Math.cos(phi)*-relief;point[2]+=Math.sin(phi)*relief;
      }
      point.shade=style==='curly'?.95+Math.min(.05,lobe*2):.94+.055*ridge+.015*Math.cos(phi*3+.8)*Math.sin(Math.PI*t);
      return point;
    });
  }
  if(style==='ponytail'){
    const faceStart=indices.length;
    // Closed curved volume with broad irregular folds and a rounded end.
    const segments=24,rings=18,start=add([0,.08,-.185],.95),rows=[];
    for(let row=1;row<rings;row++){
      const t=row/rings,r=.047*Math.pow(Math.sin(Math.PI*t),.6),ids=[];
      for(let col=0;col<segments;col++){
        const phi=col/segments*TAU,fold=1+.08*Math.cos(phi*5+t*4)+.03*Math.sin(phi*3-t*5);
        ids.push(add([.018*Math.sin(Math.PI*t)+Math.cos(phi)*r*fold,.08-.42*t,-.185-.07*Math.sin(Math.PI*t)+.025*t+Math.sin(phi)*r*.8*fold],.96+.025*Math.cos(phi*3)));
      }
      rows.push(ids);
    }
    for(let col=0;col<segments;col++)indices.push(start,rows[0][col],rows[0][(col+1)%segments]);
    for(let row=1;row<rows.length;row++)for(let col=0;col<segments;col++){
      const next=(col+1)%segments,a=rows[row-1][col],b=rows[row][col],c=rows[row-1][next],d=rows[row][next];indices.push(a,b,c,c,b,d);
    }
    const end=add([0,-.34,-.16],.96);
    for(let col=0;col<segments;col++)indices.push(rows.at(-1)[col],end,rows.at(-1)[(col+1)%segments]);
    for(let i=faceStart;i<indices.length;i+=3){const swap=indices[i+1];indices[i+1]=indices[i+2];indices[i+2]=swap;}
  }
  const normals=new Float32Array(positions.length);
  for(let i=0;i<indices.length;i+=3){
    const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3;
    const ux=positions[b]-positions[a],uy=positions[b+1]-positions[a+1],uz=positions[b+2]-positions[a+2];
    const vx=positions[c]-positions[a],vy=positions[c+1]-positions[a+1],vz=positions[c+2]-positions[a+2];
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    for(const id of [a,b,c]){normals[id]+=nx;normals[id+1]+=ny;normals[id+2]+=nz;}
  }
  for(let i=0;i<normals.length;i+=3){const length=Math.hypot(normals[i],normals[i+1],normals[i+2])||1;normals[i]/=length;normals[i+1]/=length;normals[i+2]/=length;}
  return {positions:new Float32Array(positions),normals,indices:new Uint16Array(indices),shades:new Float32Array(shades)};
}
