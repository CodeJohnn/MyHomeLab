// Exact reference from b643598, used only by tests and benchmarks.
export function createLegacyTypingPose(THREE){
      function poseNpcTyping(npc,station,time) {
        const keyboard=station.userData.keyboard;if(!keyboard)return;
        // IK reads only these two world transforms, not every descendant mesh/bone.
        npc.root.updateWorldMatrix(true,false);keyboard.updateWorldMatrix(true,false);
        const down=new THREE.Vector3(0,-1,0),upperLength=npc.upperLength||.22,lowerLength=npc.lowerLength||.27;
        npc.arms.forEach((arm,i)=>{
          const side=i===0?-1:1;
          const target=keyboard.localToWorld(new THREE.Vector3(-side*.145,.063+Math.sin(time*.015+i*Math.PI)*.004,.02));
          npc.root.worldToLocal(target);
          const shoulder=arm.position.clone(),delta=target.clone().sub(shoulder);
          const distance=THREE.MathUtils.clamp(delta.length(),.025,upperLength+lowerLength-.002),direction=delta.normalize();
          const along=(upperLength*upperLength-lowerLength*lowerLength+distance*distance)/(2*distance);
          const outward=new THREE.Vector3(side*.4,-1,0).normalize();
          const bend=outward.addScaledVector(direction,-outward.dot(direction)).normalize();
          const elbowPoint=shoulder.clone().addScaledVector(direction,along).addScaledVector(bend,Math.sqrt(Math.max(0,upperLength*upperLength-along*along)));
          arm.quaternion.setFromUnitVectors(down,elbowPoint.clone().sub(shoulder).normalize());
          const lowerDirection=target.sub(elbowPoint).normalize().applyQuaternion(arm.quaternion.clone().invert());
          npc.forearms[i].quaternion.setFromUnitVectors(down,lowerDirection);
        });
      }
return poseNpcTyping;
}
