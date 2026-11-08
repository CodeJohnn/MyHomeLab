import {soloActions,smoothAction} from './social-action-catalog.mjs';
export const avatarActions=soloActions.map(([id,label])=>[id,label]);
const states=new WeakMap();
function stateFor({avatar,legs,knees,arms,elbows}){
  if(!states.has(avatar))states.set(avatar,{joints:[...legs,...knees,...arms,...elbows],target:new Float32Array(27),from:new Float32Array(27),kind:null});
  return states.get(avatar);
}
export function resetAvatarAction(avatar){const state=states.get(avatar);if(state)state.kind=null;}
export function poseAvatarAction(kind,time,rig){
  const {avatar,baseY=0}=rig,state=stateFor(rig),p=state.target;p.fill(0);
  if(kind==='sleep'&&(state.kind!==kind||state.fitSignature!==avatar.userData.avatarSignature)){state.fitSignature=avatar.userData.avatarSignature;state.sleepHeight=avatar.getObjectByName('equipment:Back')?.visible ? .55 : .39;}
  const sin=Math.sin,phase=Math.max(0,time),entry=smoothAction(phase/.32);
  // Joint angles, followed by root height, pitch and roll. Buffers are reused.
  const arm=(i,x=0,y=0,z=0)=>{p[12+i*3]=x;p[13+i*3]=y;p[14+i*3]=z;};
  const elbow=(i,x=0,y=0,z=0)=>{p[18+i*3]=x;p[19+i*3]=y;p[20+i*3]=z;};
  if(['dance','funk','hiphop','romantic','funny','duet'].includes(kind)){
    const speed=kind==='romantic'?2:kind==='funk'?6:kind==='hiphop'?4.6:5,s=sin(phase*speed);
    p[24]=Math.abs(s)*(kind==='romantic'?.018:.055);p[26]=s*(kind==='funny'?.17:.065);
    for(let i=0;i<2;i++){
      const side=i?1:-1,beat=sin(phase*speed+i*Math.PI);
      p[i*3]=beat*(kind==='funk'?.15:.28);p[6+i*3]=Math.max(0,beat)*.32;
      arm(i,kind==='hiphop'?-.7+beat*.35:sin(phase*speed*.8+i)*.35,0,side*(kind==='romantic'?.35:.75+s*.25));elbow(i,-.65+beat*.18);
    }
  }else if(kind==='floor'){
    p[24]=-.52;p[0]=p[3]=-Math.PI/2;p[2]=-.25;p[5]=.25;arm(0,-.35);arm(1,-.35);
  }else if(kind==='kneel'){
    p[24]=-.25;p[0]=-1.25;p[3]=.45;p[6]=1.25;p[9]=1.8;arm(0,-.35);arm(1,-.25);
  }else if(kind==='sleep'){
    p[24]=state.sleepHeight;p[25]=-Math.PI/2;p[0]=p[3]=-.12;p[6]=p[9]=.25;arm(0,0,0,-.12);arm(1,0,0,.12);elbow(0,-.15);elbow(1,-.15);
  }else if(kind==='wave'){arm(1,0,0,-2.3);elbow(1,sin(phase*8)*.32);
  }else if(kind==='cross'){for(let i=0;i<2;i++){arm(i,-.7,0,(i?-1:1)*.28);elbow(i,-1.2,0,(i?-1:1)*.9);}
  }else if(kind==='point'){arm(1,-Math.PI/2);elbow(1,-.08);
  }else if(kind==='finger'){arm(1,-.65);elbow(1,-2.05);
  }else if(kind==='fart'){p[0]=p[3]=-.2;p[6]=p[9]=.35;p[26]=sin(phase*8)*.06;
  }else if(kind==='clap'){
    for(let i=0;i<2;i++){arm(i,-1.05,0,(i?-1:1)*(.32+.1*sin(phase*9)));elbow(i,-.75,0,(i?-1:1)*.25);}
  }else if(kind==='laugh'){p[25]=.12+sin(phase*10)*.035;p[24]=sin(phase*10)*.008;arm(0,-.7);arm(1,-.7);elbow(0,-1);elbow(1,-1);
  }else if(kind==='cry'){p[25]=.05;arm(0,-2.05,0,.3);arm(1,-2.05,0,-.3);elbow(0,-.65+sin(phase*4)*.1);elbow(1,-.65-sin(phase*4)*.1);
  }else if(kind==='blowkiss'){const send=smoothAction((phase-.9)/.8);arm(1,-1.9+send*.45);elbow(1,-.75*(1-send));
  }else if(kind==='celebrate'){p[24]=Math.max(0,sin(phase*5))*.13;arm(0,0,0,2.5);arm(1,0,0,-2.5);elbow(0,-.25);elbow(1,-.25);
  }else if(kind==='hug'||kind==='kiss'){
    const reach=smoothAction(phase/.8);for(let i=0;i<2;i++){arm(i,-1.1*reach,0,(i?-1:1)*.18);elbow(i,-.65*reach,0,(i?-1:1)*.35);}p[25]=kind==='kiss'?.02*reach:0;
  }else if(kind==='handshake'){arm(1,-1+sin(phase*6)*.045,0,-.48);elbow(1,-.3);}
  if(state.kind!==kind||time<state.lastTime){
    state.kind=kind;state.joints.forEach((joint,i)=>{state.from[i*3]=joint.rotation.x;state.from[i*3+1]=joint.rotation.y;state.from[i*3+2]=joint.rotation.z;});
    state.from[24]=avatar.position.y-baseY;state.from[25]=avatar.rotation.x;state.from[26]=avatar.rotation.z;
  }
  state.lastTime=time;
  state.joints.forEach((joint,i)=>joint.rotation.set(state.from[i*3]+(p[i*3]-state.from[i*3])*entry,state.from[i*3+1]+(p[i*3+1]-state.from[i*3+1])*entry,state.from[i*3+2]+(p[i*3+2]-state.from[i*3+2])*entry));
  avatar.position.y=baseY+state.from[24]+(p[24]-state.from[24])*entry;
  avatar.rotation.x=state.from[25]+(p[25]-state.from[25])*entry;avatar.rotation.z=state.from[26]+(p[26]-state.from[26])*entry;
}
