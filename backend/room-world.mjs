import {createBilliardsState,joinBilliards,shootBilliards,leaveBilliards,resetBilliards,stepBilliards} from './billiards.mjs';

export {leaveBilliards};
export const rackIds=['bancadaTI','instrumentosTI','rackExtraTI','pecasTI'];
export function createWorld(now=Date.now(),random=Math.random){
  return {revision:0,incident:{id:0,down:false,rackId:null,nextAt:now+(65+random()*45)*1000},doors:{restricted:false,entrance:false},lights:{lab:true,servers:true,office:true,bath:true},billiards:createBilliardsState()};
}
export function tickWorld(world,now=Date.now(),random=Math.random){
  let changed=false;
  if(!world.incident.down&&now>=world.incident.nextAt){world.incident={id:world.incident.id+1,down:true,rackId:rackIds[Math.min(3,Math.floor(random()*4))],nextAt:null};world.revision++;changed=true;}
  if(world.billiards?.moving&&stepBilliards(world.billiards))changed=true;
  return changed;
}
export function actOnWorld(world,action,now=Date.now(),random=Math.random,player=null){
  if(!action||typeof action!=='object')return false;
  if(action.type==='repair'){
    if(!world.incident.down||action.id!==world.incident.id)return false;
    world.incident={...world.incident,down:false,nextAt:now+(100+random()*100)*1000};
  }else if(action.type==='door'&&Object.hasOwn(world.doors,action.id)&&typeof action.open==='boolean')world.doors[action.id]=action.open;
  else if(action.type==='light'&&Object.hasOwn(world.lights,action.id)&&typeof action.on==='boolean')world.lights[action.id]=action.on;
  else if(action.type==='billiards'&&world.billiards&&player){
    const game=world.billiards;
    const accepted=action.action==='join'?joinBilliards(game,player)
      :action.action==='shot'?shootBilliards(game,player.id,action.angle,action.power)
      :action.action==='reset'?resetBilliards(game,player.id)
      :action.action==='leave'?leaveBilliards(game,player.id):false;
    if(!accepted)return false;
  }
  else return false;
  world.revision++;return true;
}
