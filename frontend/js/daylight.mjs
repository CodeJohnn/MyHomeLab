const frames=[
  [0,.12,.03,.37,.82,'#8ba9dc','#b9c8e5'],
  [5,.12,.03,.37,.82,'#8ba9dc','#b9c8e5'],
  [6,.6,.65,.6,.95,'#e2c0a1','#ffc691'],
  [8,1.65,2.1,.9,1.04,'#dceafa','#ffe5bc'],
  [12,2.3,3.3,1,1,'#e3f4ff','#fff3dc'],
  [16,1.95,2.6,.95,1,'#dce8f7','#ffe2b5'],
  [18,.95,1.1,.67,.96,'#c1b7ce','#ffa776'],
  [19,.22,.12,.4,.86,'#91a5cf','#bec9e6'],
  [24,.12,.03,.37,.82,'#8ba9dc','#b9c8e5']
];
export function daylightAt(hour){
  const h=((hour%24)+24)%24;let i=1;while(frames[i][0]<h)i++;
  const a=frames[i-1],b=frames[i],raw=(h-a[0])/(b[0]-a[0]),t=raw*raw*(3-2*raw);
  return {hour:h,sky:a[1]+(b[1]-a[1])*t,sun:a[2]+(b[2]-a[2])*t,background:a[3]+(b[3]-a[3])*t,exposure:a[4]+(b[4]-a[4])*t,skyA:a[5],skyB:b[5],sunA:a[6],sunB:b[6],blend:t};
}
export function saoPauloTime(date=new Date()){
  const parts=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date);
  const values=Object.fromEntries(parts.map(p=>[p.type,p.value]));return {hour:Number(values.hour)+Number(values.minute)/60+Number(values.second)/3600,label:values.hour+':'+values.minute};
}
