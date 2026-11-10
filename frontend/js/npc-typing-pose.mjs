// One solver per synchronous animation loop. All scratch objects are reused.
export function createTypingPoseSolver(THREE){
  const down=new THREE.Vector3(0,-1,0),target=new THREE.Vector3(),direction=new THREE.Vector3(),bend=new THREE.Vector3(),elbow=new THREE.Vector3(),upperDirection=new THREE.Vector3();
  const inverseRoot=new THREE.Matrix4(),inverseArm=new THREE.Quaternion();
  return function poseNpcTyping(npc,station,time){
    const keyboard=station.userData.keyboard;if(!keyboard)return;
    npc.root.updateWorldMatrix(true,false);keyboard.updateWorldMatrix(true,false);
    inverseRoot.copy(npc.root.matrixWorld).invert();
    const a=npc.upperLength||.22,b=npc.lowerLength||.27;
    for(let i=0;i<npc.arms.length;i++){
      const arm=npc.arms[i],side=i===0?-1:1,shoulder=arm.position;
      target.set(-side*.145,.063+Math.sin(time*.015+i*Math.PI)*.004,.02).applyMatrix4(keyboard.matrixWorld).applyMatrix4(inverseRoot);
      direction.subVectors(target,shoulder);
      const distance=THREE.MathUtils.clamp(direction.length(),.025,a+b-.002);direction.normalize();
      const along=(a*a-b*b+distance*distance)/(2*distance);
      bend.set(side*.4,-1,0).normalize();bend.addScaledVector(direction,-bend.dot(direction)).normalize();
      elbow.copy(shoulder).addScaledVector(direction,along).addScaledVector(bend,Math.sqrt(Math.max(0,a*a-along*along)));
      upperDirection.subVectors(elbow,shoulder).normalize();arm.quaternion.setFromUnitVectors(down,upperDirection);
      inverseArm.copy(arm.quaternion).invert();
      target.sub(elbow).normalize().applyQuaternion(inverseArm);npc.forearms[i].quaternion.setFromUnitVectors(down,target);
    }
  };
}
