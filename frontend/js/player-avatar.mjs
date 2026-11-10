import {clothProfile,softenFabric} from './avatar-cloth.mjs';

export function createPlayerAvatar({THREE,RoundedBoxGeometry,isMobile=false,anisotropy=1}){
  const guedesLogoUrl=new URL('../assets/guedessec.png',import.meta.url).href;
  const M=(color,metalness=0,roughness=.72)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
  const black=M('#151d25',.2,.42),white=M('#dce5e7');
  function box(g,w,h,d,m,x=0,y=0,z=0,r=0){const geo=r?new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/2-.001,h/2-.001,d/2-.001)):new THREE.BoxGeometry(w,h,d);const mesh=new THREE.Mesh(geo,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;}
  function sphere(g,r,m,x,y,z){const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,isMobile?16:18,12),m);mesh.position.set(x,y,z);mesh.castShadow=true;g.add(mesh);return mesh;}
  function cyl(g,r,h,m,x,y,z,segments=24){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),m);mesh.position.set(x,y,z);mesh.castShadow=true;g.add(mesh);return mesh;}
      const avatar = new THREE.Group();
      const skin = M('#bd896c'), shirt = M('#080808'), shirtLight = M('#151515'), pants = M('#17191e'), hair = M('#292725'), shoeMat = M('#20242b'), eyeMat = M('#16191d');
      const pelvis=sphere(avatar,1,pants,0,.70,-.015);pelvis.scale.set(.19,.12,.135);pelvis.userData.avatarPelvis=true;
      const johnBodyShape=clothProfile.map(([y,r])=>new THREE.Vector2(r,y));
      const johnTorso=new THREE.Mesh(new THREE.LatheGeometry(johnBodyShape,24),shirt);johnTorso.position.y=.79;johnTorso.scale.z=.8;johnTorso.castShadow=true;avatar.add(johnTorso);
      function johnLimb(parent,width,length,depth,material,x,y,z) {
        const geometry=new THREE.CapsuleGeometry(1,6,5,12);
        if(material===shirt||material===shirtLight||material===pants)softenFabric(geometry);
        const part=new THREE.Mesh(geometry,material);part.scale.set(width/2,length/8,depth/2);part.position.set(x,y,z);part.castShadow=true;parent.add(part);return part;
      }
      const johnCollar=new THREE.Mesh(new THREE.TorusGeometry(.078,.014,8,24),shirtLight);johnCollar.rotation.x=Math.PI/2;johnCollar.position.y=1.29;johnCollar.userData.avatarCollar=true;avatar.add(johnCollar);


      // Estampa GuedesSEC na frente e nas costas da camisa.
      const shirtLogo = new THREE.TextureLoader().load(guedesLogoUrl);
      shirtLogo.colorSpace = THREE.SRGBColorSpace;
      shirtLogo.anisotropy = anisotropy;
      const shirtPrintMaterial=new THREE.MeshStandardMaterial({map:shirtLogo,roughness:.95,metalness:0,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
      function addUniformLogo(torso,profile,centerY=.275) {
        function radiusAt(y) {
          for(let i=1;i<profile.length;i++)if(y<=profile[i].y) {
            const t=THREE.MathUtils.clamp((y-profile[i-1].y)/(profile[i].y-profile[i-1].y),0,1);
            return THREE.MathUtils.lerp(profile[i-1].x,profile[i].x,t);
          }
          return profile[profile.length-1].x;
        }
        for(const side of [-1]) {
          const geometry=new THREE.PlaneGeometry(.24,.255,20,20),positions=geometry.attributes.position;
          for(let i=0;i<positions.count;i++) {
            const x=positions.getX(i)*side,y=positions.getY(i)+centerY,r=radiusAt(y);
            positions.setXYZ(i,x,y,side*(Math.sqrt(Math.max(.00001,r*r-x*x))+.0015));
          }
          geometry.computeVertexNormals();
          const print=new THREE.Mesh(geometry,shirtPrintMaterial);torso.add(print);
        }
      }
      function addBlackLabCoat(root,{color='#080808',trim='#30343a'}={}) {
        const cloth=M(color,0,.9),seam=M(trim,0,.86);
        const profile=[new THREE.Vector2(.205,0),new THREE.Vector2(.208,.06),new THREE.Vector2(.18,.34),new THREE.Vector2(.20,.60),new THREE.Vector2(.17,.68),new THREE.Vector2(.09,.73)];
        const coat=new THREE.Mesh(new THREE.LatheGeometry(profile,24),cloth);
        coat.position.y=.55;coat.scale.z=.8;coat.castShadow=true;root.add(coat);
        addUniformLogo(coat,profile,.49);
        box(root,.008,.46,.009,seam,0,.80,.167,.002);
        for(const side of [-1,1]){
          box(root,.095,.09,.014,cloth,side*.105,.69,.166,.008);
          box(root,.095,.008,.012,seam,side*.105,.733,.176,.002);
        }
        for(const y of [.62,.78,.94])sphere(root,.008,seam,0,y,.176);
        return coat;
      }
      const originalUniformParts=new Set(avatar.children);
      addBlackLabCoat(avatar);
      for(const part of avatar.children)if(!originalUniformParts.has(part))part.userData.avatarHide=true;
      cyl(avatar, .075, .12, skin, 0, 1.32, 0);
      const playerHead=sphere(avatar,.18,skin,0,1.555,.01);playerHead.scale.set(.88,1.13,.94);
      const playerJaw=sphere(avatar,.125,skin,0,1.465,.035);playerJaw.scale.set(.97,.72,.9);
      const studs=M('#cbd3db',.85,.25),naturalHair=M('#171615',.02,.92);
      const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.184,28,16,0,Math.PI*2,0,1.35),naturalHair);
      hairCap.position.set(0,1.565,.005);hairCap.scale.set(.91,1.13,.95);hairCap.castShadow=true;avatar.add(hairCap);
      for(const side of [-1,1]) {
        const sideburn=sphere(avatar,.035,naturalHair,side*.148,1.595,.022);sideburn.scale.set(.32,1.8,1);

      }
      const playerChin=sphere(avatar,.047,naturalHair,0,1.435,.126);playerChin.scale.set(.72,.72,.4);
      cyl(avatar, .079, .035, shirt, 0, 1.35, 0);
      for (const x of [-.04, 0, .04]) sphere(avatar, .009, studs, x, 1.35, .075);
      // Corrente prateada pendurada no quadril.
      for (let i = 0; i < 9; i++) {
        const link = new THREE.Mesh(new THREE.TorusGeometry(.014, .004, 5, 10), studs);
        link.position.set(.09 + i * .013, .79 - .065 * Math.sin(i / 8 * Math.PI), .145);
        avatar.add(link);
      }
      for (const side of [-1, 1]) {
        const playerEar=sphere(avatar,.034,skin,side*.163,1.55,.005);playerEar.scale.set(.55,1.12,.7);
        const innerEar=sphere(avatar,.019,M('#b67f64'),side*.169,1.55,.017);innerEar.scale.set(.4,1,.6);
        sphere(avatar, .021, white, side * .071, 1.56, .181);
        sphere(avatar, .010, eyeMat, side * .071, 1.56, .198);
        box(avatar, .045, .012, .012, hair, side * .071, 1.595, .188, .004);
      }
      sphere(avatar, .026, skin, 0, 1.515, .205);
      box(avatar, .055, .009, .008, M('#764c45'), 0, 1.468, .19, .003);

      const legs = [], knees = [], arms = [], elbows = [];
      for (const side of [-1, 1]) {
        const hip = new THREE.Group();
        hip.position.set(side * .115, .68, 0);
        avatar.add(hip);
        legs.push(hip);
        const thigh=johnLimb(hip,.17,.36,.18,pants,0,-.18,0);thigh.userData.avatarThigh=true;
        const knee = new THREE.Group();
        knee.position.y = -.36;
        hip.add(knee);
        knees.push(knee);
        sphere(knee, .073, pants, 0, 0, 0);
        const lowerLeg=new THREE.Group();lowerLeg.position.y=.105;knee.add(lowerLeg);
        johnLimb(lowerLeg,.15,.35,.16,pants,0,-.17,0);
        const johnShoe=sphere(lowerLeg,.105,shoeMat,0,-.35,.055);johnShoe.scale.set(.9,.7,1.5);
        // Slightly narrow the heel and toe while keeping the sole height intact.
        const shoePositions=johnShoe.geometry.attributes.position;
        for(let i=0;i<shoePositions.count;i++){
          const z=shoePositions.getZ(i),toe=Math.max(0,z/.105),heel=Math.max(0,-z/.105);
          shoePositions.setX(i,shoePositions.getX(i)*(1-.12*toe*toe-.08*heel));
        }
        shoePositions.needsUpdate=true;johnShoe.geometry.computeVertexNormals();
        const ankle=box(lowerLeg,.16,.13,.18,shoeMat,0,-.275,.005,.02);ankle.userData.avatarShoeUpper=true;
        box(lowerLeg, .17, .035, .29, black, 0, -.39, .045, .008);
        for (let i = 0; i < 4; i++) box(lowerLeg, .065, .008, .012, studs, 0, -.19 - i * .033, .1, .002);


        const shoulder = new THREE.Group();
        shoulder.position.set(side * .275, 1.22, 0);
        avatar.add(shoulder);
        arms.push(shoulder);
        sphere(shoulder, .105, shirtLight, 0, 0, 0);
        johnLimb(shoulder,.19,.3,.2,shirt,0,-.145,0);
        const elbow = new THREE.Group();
        elbow.position.y = -.28;
        shoulder.add(elbow);
        elbows.push(elbow);
        sphere(elbow, .055, shirt, 0, 0, 0);
        johnLimb(elbow,.15,.26,.16,shirtLight,0,-.12,0);

        for (const x of [-.035, 0, .035]) sphere(elbow, .01, studs, x, -.215, .067);
        const johnHand=sphere(elbow,.05,skin,0,-.265,.015);johnHand.scale.set(.85,1.15,.72);
        for (let finger = 0; finger < 3; finger++) box(elbow, .014, .042, .014, skin, -.02 + finger * .02, -.285, .035, .006);
      }
      const johnCartoonHead=new THREE.Group();johnCartoonHead.position.set(0,1.6,0);avatar.add(johnCartoonHead);
      const headParts=avatar.children.filter(child=>child!==johnCartoonHead && child.position.y>1.41);
      for(const part of headParts){part.position.y-=1.555;johnCartoonHead.add(part);}
      // Substitui os pequenos olhos por olhos expressivos atras dos oculos.
      for(const part of [...johnCartoonHead.children]) {
        if(part.position.z>=.17 && part.position.y>-.12 && part.position.y<.08){part.removeFromParent();}
      }
      for(const side of [-1,1]) {
        const eye=sphere(johnCartoonHead,.035,white,side*.065,.018,.173);eye.scale.set(.85,.83,.48);
        const iris=sphere(johnCartoonHead,.024,M('#5e4635'),side*.065,.018,.19);iris.scale.set(.8,1,.3);
        const pupil=sphere(johnCartoonHead,.014,eyeMat,side*.065,.018,.198);pupil.scale.set(.8,1.2,.3);
        sphere(johnCartoonHead,.006,white,side*.065-.008,.032,.203);
        const glasses=new THREE.Group();glasses.position.set(side*.066,.018,.209);
        for(const y of [-.035,.035])box(glasses,.093,.009,.009,hair,0,y,0,.003);
        for(const x of [-.042,.042])box(glasses,.009,.07,.009,hair,x,0,0,.003);
        box(glasses,.009,.008,.095,hair,side*.045,.024,-.04,.002);glasses.userData.avatarGlasses=true;johnCartoonHead.add(glasses);
        const angryBrow=box(johnCartoonHead,.058,.016,.014,hair,side*.065,.067,.187,.005);angryBrow.rotation.z=side*.3;
      }
      box(johnCartoonHead,.04,.006,.008,hair,0,.025,.21,.002);
      const johnNose=sphere(johnCartoonHead,.023,skin,0,-.021,.19);johnNose.scale.set(.9,.9,1.15);
      box(johnCartoonHead,.047,.005,.008,M('#754838'),0,-.077,.167,.002);
      // Capuz continuo com abertura frontal; a superficie nao cruza o rosto.
      hairCap.visible=true;
      const hoodMaterial=M('#080808',.02,.96),hoodLining=M('#151515',.02,1);
      hoodMaterial.side=THREE.DoubleSide;
      const hoodGeometry=new THREE.SphereGeometry(.245,32,22,0,Math.PI*2,1.02,Math.PI-1.02);
      hoodGeometry.rotateX(Math.PI/2);
      const hood=new THREE.Mesh(hoodGeometry,hoodMaterial);hood.position.set(0,.015,-.015);hood.scale.set(.98,1.16,1);hood.castShadow=true;johnCartoonHead.add(hood);
      const openingRadius=.245*Math.sin(1.02),openingZ=.245*Math.cos(1.02)-.015;
      const rim=[];
      for(let i=0;i<64;i++){const angle=i/64*Math.PI*2;rim.push(new THREE.Vector3(Math.cos(angle)*openingRadius*.98,.015+Math.sin(angle)*openingRadius*1.16,openingZ));}
      const hoodEdge=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim,true),64,.011,6,true),hoodLining);johnCartoonHead.add(hoodEdge);
      // Franja curta visivel entre o capuz e a testa.
      for(let i=0;i<3;i++) {
        const fringe=sphere(johnCartoonHead,.054,naturalHair,-.055+i*.045,.165-i*.012,.128);
        fringe.scale.set(.9,.48,.7);fringe.rotation.z=-.25;
      }
      johnCartoonHead.scale.setScalar(1.48);
      avatar.position.set(-1.2, 0, 2.45);
      // NPCs independentes do personagem controlado pelo jogador.
      johnCartoonHead.name='onlineAvatarHead';johnTorso.userData.avatarTorso=true;
      for(const node of [hood,hoodEdge,hairCap])node.userData.avatarHide=true;
      avatar.traverse(node=>{
        if(node.material===studs)node.userData.avatarHide=true;
        if(node.material===skin)node.userData.avatarPart='skin';
        else if(node.material===shirt||node.material===shirtLight)node.userData.avatarPart='shirt';
        else if(node.material===shoeMat)node.userData.avatarPart='shoes';
        else if(node.material===pants)node.userData.avatarPart='pants';
        else if(node.material===hair||node.material===naturalHair){node.userData.avatarPart='hair';if(node.material===naturalHair)node.userData.avatarHide=true;}
      });
  [...legs,...knees,...arms,...elbows].forEach((joint,index)=>joint.name='networkJoint'+index);
  return {avatar,skin,shirt,shirtLight,pants,hair,shoeMat,eyeMat,studs,naturalHair,legs,knees,arms,elbows,johnLimb,addBlackLabCoat,johnCartoonHead,johnTorso};
}
