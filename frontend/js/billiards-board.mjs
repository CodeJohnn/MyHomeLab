export function createBilliardsBoard({container,onAim,onCharge,onShot}){
  const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=560;canvas.className='billiardsBoard';
  canvas.setAttribute('aria-label','Mesa de sinuca. Clique ou toque para apontar a bola branca.');
  container.append(canvas);const ctx=canvas.getContext('2d');let current=null,drag=null;
  const scale=360,cx=500,cy=280;
  const point=(x,z)=>({x:cx+x*scale,y:cy+z*scale});
  function draw(state,angle,canAim,power){
    current={state,canAim,angle};ctx.clearRect(0,0,1000,560);
    ctx.save();ctx.shadowColor='#0009';ctx.shadowBlur=24;ctx.shadowOffsetY=14;
    const wood=ctx.createLinearGradient(0,20,0,540);wood.addColorStop(0,'#986245');wood.addColorStop(.5,'#4f3028');wood.addColorStop(1,'#9a6849');ctx.fillStyle=wood;ctx.beginPath();ctx.roundRect(35,35,930,490,35);ctx.fill();ctx.restore();
    ctx.strokeStyle='#d8ad6d';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(44,44,912,472,29);ctx.stroke();
    ctx.fillStyle='#144d50';ctx.fillRect(65,65,870,430);
    const felt=ctx.createRadialGradient(cx,cy,30,cx,cy,500);felt.addColorStop(0,'#248c92');felt.addColorStop(1,'#155c64');ctx.fillStyle=felt;ctx.fillRect(cx-1.08*scale,cy-.48*scale,2.16*scale,.96*scale);
    for(const x of [130,250,375,625,750,870])for(const y of [65,495]){ctx.fillStyle='#ebd9b8';ctx.beginPath();ctx.arc(x,y,3.2,0,Math.PI*2);ctx.fill();}
    for(const x of [-1.12,0,1.12])for(const z of [-.52,.52]){const p=point(x,z);ctx.beginPath();ctx.arc(p.x,p.y,27,0,Math.PI*2);ctx.fillStyle='#080f10';ctx.fill();ctx.strokeStyle='#8c7455';ctx.lineWidth=3;ctx.stroke();}
    const cue=state?.balls?.find(b=>b.id===0);
    if(cue?.alive&&canAim&&!state.moving&&!state.winner){
      const p=point(cue.x,cue.z),dx=Math.cos(angle),dy=Math.sin(angle);
      ctx.save();ctx.beginPath();ctx.rect(cx-1.08*scale,cy-.48*scale,2.16*scale,.96*scale);ctx.clip();
      let length=900;
      for(const ball of state.balls){if(!ball.alive||ball.id===0)continue;const other=point(ball.x,ball.z),rx=other.x-p.x,ry=other.y-p.y,along=rx*dx+ry*dy,side=rx*dy-ry*dx;if(along>0&&Math.abs(side)<34)length=Math.min(length,along-Math.sqrt(34*34-side*side));}
      ctx.setLineDash([8,8]);ctx.lineWidth=2;ctx.strokeStyle='#ffffffb0';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+dx*length,p.y+dy*length);ctx.stroke();ctx.setLineDash([]);
      ctx.beginPath();ctx.arc(p.x+dx*length,p.y+dy*length,17,0,Math.PI*2);ctx.strokeStyle='#ffffffa0';ctx.stroke();ctx.restore();
      const pull=drag?.mode==='charge'?drag.power*90:0;
      ctx.strokeStyle='#c7a16c';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x-dx*(37+pull),p.y-dy*(37+pull));ctx.lineTo(p.x-dx*(180+pull),p.y-dy*(180+pull));ctx.stroke();
      ctx.strokeStyle='#f0d5a2';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p.x-dx*(37+pull),p.y-dy*(37+pull));ctx.lineTo(p.x-dx*(110+pull),p.y-dy*(110+pull));ctx.stroke();
    }
    const colors=['#f1cf35','#357ac5','#bd4545','#7658ad','#d88b33','#429264','#824743'];
    for(const ball of state?.balls||[]){
      if(!ball.alive)continue;const p=point(ball.x,ball.z),r=17;
      ctx.beginPath();ctx.arc(p.x+3,p.y+4,r,0,Math.PI*2);ctx.fillStyle='#0004';ctx.fill();
      const base=ball.id===0?'#f1eee3':ball.id===8?'#171d21':colors[(ball.id>8?ball.id-9:ball.id-1)%7];
      ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle=base;ctx.fill();
      const shine=ctx.createRadialGradient(p.x-5,p.y-6,1,p.x+3,p.y+4,23);shine.addColorStop(0,'#ffffff66');shine.addColorStop(.4,'#ffffff00');shine.addColorStop(1,'#0009');ctx.fillStyle=shine;ctx.fill();
      if(ball.id>8){ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.clip();ctx.fillStyle='#eee9dc';ctx.fillRect(p.x-r,p.y-r,r*2,8);ctx.fillRect(p.x-r,p.y+r-8,r*2,8);ctx.restore();}
      if(ball.id){ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.fillStyle='#f1eee4';ctx.fill();ctx.fillStyle='#142024';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(ball.id),p.x,p.y);}
      ctx.beginPath();ctx.arc(p.x-5,p.y-5,3,0,Math.PI*2);ctx.fillStyle='#fff6';ctx.fill();
    }
  }
  function aim(event){
    if(!current?.canAim||current.state?.moving)return;
    const cue=current.state?.balls?.find(b=>b.id===0);if(!cue?.alive)return;
    const rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)*1000/rect.width,z=(event.clientY-rect.top)*560/rect.height;
    const p=point(cue.x,cue.z);if(Math.hypot(x-p.x,z-p.y)<5)return;
    onAim(Math.atan2(z-p.y,x-p.x));
  }
  function coordinates(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*1000/r.width,y:(event.clientY-r.top)*560/r.height};}
  canvas.addEventListener('pointerdown',event=>{
    if(!current?.canAim||current.state?.moving)return;
    const cue=current.state?.balls?.find(b=>b.id===0);if(!cue?.alive)return;
    event.preventDefault();canvas.setPointerCapture(event.pointerId);
    const at=coordinates(event),p=point(cue.x,cue.z),dx=at.x-p.x,dy=at.y-p.y;
    const behind=-(dx*Math.cos(current.angle)+dy*Math.sin(current.angle)),side=Math.abs(dx*Math.sin(current.angle)-dy*Math.cos(current.angle));
    const charge=Math.hypot(dx,dy)<37||(behind>25&&behind<260&&side<30);
    drag={id:event.pointerId,mode:charge?'charge':'aim',start:at,angle:current.angle,power:0};
    if(!charge)aim(event);else onCharge?.(0);
  });
  canvas.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    if(drag.mode==='aim'){aim(event);return;}
    const at=coordinates(event),length=-((at.x-drag.start.x)*Math.cos(drag.angle)+(at.y-drag.start.y)*Math.sin(drag.angle));
    drag.power=Math.max(0,Math.min(1,length/160));onCharge?.(drag.power);
  });
  canvas.addEventListener('pointerup',event=>{if(!drag||drag.id!==event.pointerId)return;const release=drag;drag=null;if(release.mode==='charge'&&release.power>=.12&&current?.canAim&&!current.state?.moving)onShot?.(release.power);});
  for(const event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=null;});
  return {draw};
}
