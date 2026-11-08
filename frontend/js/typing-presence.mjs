export function createTypingPresence({send,onChange=()=>{},now=Date.now,schedule=setTimeout,cancel=clearTimeout}){
  let active=false,timer=null,lastSent=-Infinity,pending=Promise.resolve();
  function notify(value){pending=pending.then(()=>send(value)).catch(()=>{});}
  function stop(){
    cancel(timer);timer=null;
    if(!active)return;
    active=false;onChange(false);notify(false);
  }
  return {
    input(text){
      if(!text.trim()){stop();return;}
      const changed=!active;active=true;
      if(changed)onChange(true);
      if(changed||now()-lastSent>=2000){lastSent=now();notify(true);}
      cancel(timer);timer=schedule(stop,3000);
    },
    stop
  };
}
