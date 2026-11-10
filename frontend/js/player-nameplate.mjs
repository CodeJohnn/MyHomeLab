import {nobleTitle} from './nobility.mjs';
import {nobleCrestUrl} from './nobility-effects.mjs';

const crests=new Map();
function loadCrest(title){
  if(!crests.has(title.id)){
    crests.set(title.id,new Promise(resolve=>{
      const image=new Image();
      image.onload=()=>resolve(image);
      image.onerror=()=>{crests.delete(title.id);resolve(null);};
      image.src=nobleCrestUrl(title.id);
    }));
  }
  return crests.get(title.id);
}

// One canvas texture per label; crest images are shared by everyone of the same rank.
export function paintPlayerNameplate(canvas,name,level,{onUpdate,isDisposed}={}){
  const ctx=canvas.getContext('2d'),title=nobleTitle(level);
  const font='600 36px "Segoe UI", system-ui, sans-serif';ctx.font=font;
  canvas.width=Math.ceil(Math.min(768,ctx.measureText(name).width+140));canvas.height=112;
  function paint(crest){
    if(isDisposed?.())return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(crest)ctx.drawImage(crest,8,10,94,91);
    ctx.font=font;ctx.textAlign='left';ctx.textBaseline='middle';ctx.lineJoin='round';
    ctx.strokeStyle='rgba(0,0,0,.75)';ctx.lineWidth=3;
    ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=5;ctx.shadowOffsetY=2;
    ctx.strokeText(name,116,56,canvas.width-128);
    ctx.fillStyle='#ffffff';ctx.fillText(name,116,56,canvas.width-128);
    onUpdate?.();
  }
  paint(null);
  void loadCrest(title).then(paint);
}
