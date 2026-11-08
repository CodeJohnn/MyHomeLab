export const chatFonts={name:'600 24px "Segoe UI", system-ui, sans-serif',message:'400 32px "Segoe UI", system-ui, sans-serif'};

export function layoutSpeechBubble(text,sender,measure){
  const maxWidth=640,lines=[];
  // Wrap at words where possible, splitting only words longer than the whole bubble.
  for(const paragraph of String(text).split('\n')){
    let line='';
    for(const word of paragraph.split(/\s+/).filter(Boolean)){
      const candidate=line?line+' '+word:word;
      if(measure(candidate,'message')<=maxWidth){line=candidate;continue;}
      if(line){lines.push(line);line='';}
      if(measure(word,'message')<=maxWidth){line=word;continue;}
      const characters=typeof Intl.Segmenter==='function'
        ?Array.from(new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(word),part=>part.segment):Array.from(word);
      for(const char of characters){
        if(line&&measure(line+char,'message')>maxWidth){lines.push(line);line='';}
        line+=char;
      }
    }
    lines.push(line);
  }
  const contentWidth=Math.max(72,Math.min(maxWidth,measure(sender,'name')),...lines.map(line=>measure(line,'message')));
  return {lines,width:Math.ceil(contentWidth+72),height:Math.ceil(104+lines.length*42),contentWidth};
}

export function paintSpeechBubble(canvas,text,sender){
  const ctx=canvas.getContext('2d');
  const layout=layoutSpeechBubble(text,sender,(value,kind)=>{ctx.font=chatFonts[kind];return ctx.measureText(value).width;});
  canvas.width=layout.width;canvas.height=layout.height;
  const {width,height}=layout,bodyBottom=height-26,center=width/2;
  ctx.shadowColor='rgba(0,0,0,.22)';ctx.shadowBlur=10;ctx.shadowOffsetY=4;
  ctx.beginPath();ctx.roundRect(12,10,width-24,bodyBottom-10,22);
  // A single silhouette avoids a seam or a doubled shadow at the tail.
  ctx.moveTo(center-13,bodyBottom-1);ctx.lineTo(center+13,bodyBottom-1);ctx.lineTo(center,bodyBottom+14);ctx.closePath();
  const background=ctx.createLinearGradient(0,10,0,bodyBottom);
  background.addColorStop(0,'#ffffff');background.addColorStop(1,'#eef5f3');ctx.fillStyle=background;ctx.fill();
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.textBaseline='top';ctx.textAlign='left';
  ctx.font=chatFonts.name;ctx.fillStyle='#287d6a';ctx.fillText(sender,36,28,width-72);
  ctx.font=chatFonts.message;ctx.fillStyle='#203b36';
  layout.lines.forEach((line,index)=>ctx.fillText(line,36,66+index*42));
  return layout;
}
