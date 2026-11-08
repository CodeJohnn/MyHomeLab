export const chatFonts={name:'500 24px "Segoe UI", system-ui, sans-serif',message:'400 26px "Segoe UI", system-ui, sans-serif'};

export function layoutSpeechBubble(text,sender,measure){
  const maxWidth=420,lines=[],heading=`${sender} disse:`;
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
  const contentWidth=Math.max(48,Math.min(maxWidth,measure(heading,'name')),...lines.map(line=>measure(line,'message')));
  return {lines,heading,width:Math.ceil(contentWidth+48),height:Math.ceil(76+lines.length*32),contentWidth};
}

export function paintSpeechBubble(canvas,text,sender){
  const ctx=canvas.getContext('2d');
  const layout=layoutSpeechBubble(text,sender,(value,kind)=>{ctx.font=chatFonts[kind];return ctx.measureText(value).width;});
  canvas.width=layout.width;canvas.height=layout.height;
  const {width,height}=layout,bodyBottom=height-20,center=width/2;
  ctx.shadowColor='rgba(0,0,0,.18)';ctx.shadowBlur=6;ctx.shadowOffsetY=3;
  ctx.beginPath();ctx.roundRect(8,8,width-16,bodyBottom-8,14);
  // A single silhouette avoids a seam or a doubled shadow at the tail.
  ctx.moveTo(center-10,bodyBottom-1);ctx.lineTo(center+10,bodyBottom-1);ctx.lineTo(center,bodyBottom+10);ctx.closePath();
  ctx.fillStyle='#ffffff';ctx.fill();
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.textBaseline='top';ctx.textAlign='left';
  ctx.font=chatFonts.name;ctx.fillStyle='#222222';ctx.fillText(layout.heading,24,20,width-48);
  ctx.font=chatFonts.message;ctx.fillStyle='#222222';
  layout.lines.forEach((line,index)=>ctx.fillText(line,24,50+index*32));
  return layout;
}
