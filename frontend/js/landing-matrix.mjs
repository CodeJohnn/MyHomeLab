export function createLandingMatrix(host){
  const canvas=document.createElement('canvas');canvas.className='landingMatrix';canvas.setAttribute('aria-hidden','true');host.prepend(canvas);
  const ctx=canvas.getContext('2d');if(!ctx)return {dispose:()=>canvas.remove()};
  const motion=matchMedia('(prefers-reduced-motion: reduce)');let width=0,height=0,columns=[],frame=0,last=0,disposed=false;
  const size=20,characters='010101010101<>/{}[]ABCDEF';
  function resize(){
    width=innerWidth;height=innerHeight;const ratio=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.font='13px monospace';columns=Array.from({length:Math.ceil(width/size)},()=>({y:Math.random()*height,speed:1+Math.random()*1.8,length:6+Math.floor(Math.random()*12)}));
    ctx.clearRect(0,0,width,height);draw(true);
  }
  function draw(staticFrame=false){
    ctx.clearRect(0,0,width,height);
    columns.forEach((column,index)=>{
      for(let i=0;i<column.length;i++){
        const y=column.y-i*size;if(y<0||y>height)continue;
        ctx.fillStyle=i===0?'rgba(225,225,225,.65)':'rgba(140,140,140,'+((1-i/column.length)*.42)+')';
        ctx.fillText(characters[Math.floor(Math.random()*characters.length)],index*size,y);
      }
      if(!staticFrame){column.y+=column.speed*size*.2;if(column.y-column.length*size>height){column.y=-size;column.speed=1+Math.random()*1.8;}}
    });
  }
  function tick(time){frame=0;if(disposed||document.hidden||motion.matches)return;if(time-last>65){draw();last=time;}frame=requestAnimationFrame(tick);}
  function start(){cancelAnimationFrame(frame);frame=0;if(!disposed&&!document.hidden&&!motion.matches)frame=requestAnimationFrame(tick);else if(motion.matches)draw(true);}
  resize();start();addEventListener('resize',resize);document.addEventListener('visibilitychange',start);motion.addEventListener('change',start);
  return {dispose(){disposed=true;cancelAnimationFrame(frame);removeEventListener('resize',resize);document.removeEventListener('visibilitychange',start);motion.removeEventListener('change',start);canvas.remove();}};
}
