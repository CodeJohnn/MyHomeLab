export const rackIds=['bancadaTI','instrumentosTI','rackExtraTI','pecasTI'];
export function createWorld(now=Date.now(),random=Math.random){
  return {revision:0,incident:{id:0,down:false,rackId:null,nextAt:now+(65+random()*45)*1000},doors:{restricted:false,entrance:false},lights:{lab:true,servers:true,office:true,bath:true}};
}
export function tickWorld(world,now=Date.now(),random=Math.random){
  if(world.incident.down||now<world.incident.nextAt)return false;
  world.incident={id:world.incident.id+1,down:true,rackId:rackIds[Math.min(3,Math.floor(random()*4))],nextAt:null};world.revision++;return true;
}
export function actOnWorld(world,action,now=Date.now(),random=Math.random){
  if(!action||typeof action!=='object')return false;
  if(action.type==='repair'){
    if(!world.incident.down||action.id!==world.incident.id)return false;
    world.incident={...world.incident,down:false,nextAt:now+(100+random()*100)*1000};
  }else if(action.type==='door'&&Object.hasOwn(world.doors,action.id)&&typeof action.open==='boolean')world.doors[action.id]=action.open;
  else if(action.type==='light'&&Object.hasOwn(world.lights,action.id)&&typeof action.on==='boolean')world.lights[action.id]=action.on;
  else return false;
  world.revision++;return true;
}
