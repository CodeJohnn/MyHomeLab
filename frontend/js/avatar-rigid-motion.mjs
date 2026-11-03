// Models without authored animation keep their original mesh and skin weights.
export function rigidAvatarMotion(time,moving){
  if(!Number.isFinite(time))time=0;
  return moving?{y:Math.abs(Math.sin(time*7))*.012,z:Math.sin(time*7)*.009}:{y:Math.sin(time*1.5)*.002,z:0};
}
