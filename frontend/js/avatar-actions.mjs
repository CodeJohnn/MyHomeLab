export const avatarActions=[['dance','Dancar'],['floor','Sentar no chao'],['fart','Peidar'],['finger','Dedo do meio'],['point','Apontar'],['cross','Cruzar os bracos']];
export function poseAvatarAction(kind,time,{avatar,legs,knees,arms,elbows,baseY}){
  [...legs,...knees,...arms,...elbows].forEach(j=>j.rotation.set(0,0,0));avatar.position.y=baseY;avatar.rotation.z=0;
  if(kind==='dance'){
    avatar.position.y+=Math.abs(Math.sin(time*5))*.07;avatar.rotation.z=Math.sin(time*5)*.09;
    arms.forEach((j,i)=>{j.rotation.z=(i?1:-1)*(.8+Math.sin(time*5+i)*.5);j.rotation.x=Math.sin(time*4+i)*.5;elbows[i].rotation.x=-.8;legs[i].rotation.x=Math.sin(time*5+i*Math.PI)*.25;});
  }else if(kind==='floor'){
    avatar.position.y-=.56;legs.forEach((j,i)=>{j.rotation.x=-1.35;j.rotation.z=(i?1:-1)*.35;knees[i].rotation.x=.65;});arms.forEach(j=>j.rotation.x=-.35);
  }else if(kind==='cross'){
    arms.forEach((j,i)=>{j.rotation.x=-.7;j.rotation.z=(i?-1:1)*.28;elbows[i].rotation.x=-1.2;elbows[i].rotation.z=(i?-1:1)*.9;});
  }else if(kind==='wave'){arms[1].rotation.z=-2.3;elbows[1].rotation.x=Math.sin(time*9)*.4;
  }else if(kind==='point'){arms[1].rotation.x=-Math.PI/2;elbows[1].rotation.x=-.08;
  }else if(kind==='finger'){arms[1].rotation.x=-.65;elbows[1].rotation.x=-2.05;
  }else if(kind==='fart'){legs.forEach(j=>j.rotation.x=-.2);knees.forEach(j=>j.rotation.x=.35);avatar.rotation.z=Math.sin(time*8)*.06;}
}
