export function createBathroom({THREE,Reflector,scene,item,box,cyl,sphere,M,partition,backWall,wallHeight,isMobile}){
  const walls=new THREE.Group();walls.name='Banheiro dos fundos';scene.add(walls);
  const tile=M('#dedbd1',0,.85),wood=M('#a78361'),white=M('#f0f1eb',0,.28),chrome=M('#aebfc1',.85,.22),dark=M('#34484a');
  box(scene,9,.24,5,tile,0,-.13,-6);
  partition(walls,9,3.3,.14,0,1.65,-8.5,tile);
  for(const x of [-4.5,4.5])partition(walls,.14,3.3,5,x,1.65,-6,tile);
  // Entrada lateral ao setup, sem mover a mesa do laboratorio.
  const shape=new THREE.Shape();shape.moveTo(-4.5,-wallHeight/2);shape.lineTo(4.5,-wallHeight/2);shape.lineTo(4.5,wallHeight/2);shape.lineTo(-4.5,wallHeight/2);shape.closePath();
  const hole=new THREE.Path();hole.moveTo(2.6,-wallHeight/2);hole.lineTo(2.6,2.7-wallHeight/2);hole.lineTo(4,2.7-wallHeight/2);hole.lineTo(4,-wallHeight/2);hole.closePath();shape.holes.push(hole);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.14,bevelEnabled:false});geometry.translate(0,0,-.07);backWall.geometry.dispose();backWall.geometry=geometry;
  const door=new THREE.Group();door.position.set(4,0,-3.5);scene.add(door);
  const leaf=box(door,1.34,2.6,.065,wood,-.67,1.32,0,.018);
  sphere(door,.045,chrome,-1.17,1.15,.065);sphere(door,.045,chrome,-1.17,1.15,-.065);
  for(const x of [2.56,4.04])box(walls,.08,2.76,.17,wood,x,1.38,-3.5);box(walls,1.56,.08,.17,wood,3.3,2.76,-3.5);
  const vanity=item('piaBanheiroNovo','Pia e bancada do banheiro','floor',-2.5,0,-7.95,'Bancada com pia, torneira, armarios e espelho.');
  box(vanity,2.8,.82,.7,wood,0,.44,0,.03);box(vanity,2.9,.08,.8,white,0,.9,0,.025);
  for(const x of [-.9,0,.9]){box(vanity,.84,.65,.025,tile,x,.45,.365,.01);box(vanity,.24,.025,.03,chrome,x,.69,.39);}
  box(vanity,.85,.04,.48,M('#9eafb0',.4,.32),0,.96,.03,.045);cyl(vanity,.025,.29,chrome,0,1.1,-.2);box(vanity,.025,.025,.2,chrome,0,1.24,-.1);
  const mirrorGroup=item('espelhoBanheiroNovo','Espelho do banheiro','wallBathroom',-2.5,1.95,-8.39,'Espelho sobre a bancada da pia.');walls.add(mirrorGroup);
  box(mirrorGroup,2.65,1.4,.07,dark,0,0,0,.035);
  const mirror=new Reflector(new THREE.PlaneGeometry(2.5,1.25),{textureWidth:isMobile?256:512,textureHeight:isMobile?256:512,color:0xc9d7d5,clipBias:.003});mirror.position.z=.045;mirrorGroup.add(mirror);
  const renderReflection=mirror.onBeforeRender;let lastReflection=-Infinity;
  mirror.onBeforeRender=function(...args){const now=performance.now();if(now-lastReflection<(isMobile?100:66))return;lastReflection=now;return renderReflection.apply(this,args);};
  box(mirrorGroup,2.65,.045,.06,M('#fff0d0'),0,.74,.06);
  const toilet=item('vasoBanheiroNovo','Vaso sanitario','floor',.45,0,-7.8,'Vaso sanitario, com espaco livre nas laterais.');
  cyl(toilet,.25,.4,white,0,.23,.1);box(toilet,.52,.16,.69,white,0,.5,.15,.09);box(toilet,.53,.68,.22,white,0,.58,-.24,.035);box(toilet,.11,.015,.065,chrome,0,.94,-.24,.008);
  const shower=item('chuveiroBanheiroNovo','Box com chuveiro','floor',3.15,0,-7.15,'Box amplo com chuveiro, ralo e divisorias de vidro.');
  box(shower,2.1,.08,2.35,tile,0,.06,0,.04);
  const glass=new THREE.MeshPhysicalMaterial({color:'#b6d4d5',transparent:true,opacity:.2,roughness:.12,depthWrite:false,side:THREE.DoubleSide});
  box(shower,.025,2.5,2.35,glass,-1.04,1.32,0);box(shower,1.25,2.5,.025,glass,.43,1.32,1.16);
  cyl(shower,.025,2.5,chrome,-1.04,1.32,1.16);cyl(shower,.022,2.3,chrome,.45,1.65,-1.1);box(shower,.035,.035,.55,chrome,.45,2.8,-.85);cyl(shower,.19,.04,chrome,.45,2.77,-.55);
  box(shower,.15,.012,.15,dark,0,.108,0);
  const towels=item('toalhasBanheiroNovo','Toalheiro e toalhas','wallBathroom',-4.36,1.3,-5.5,'Toalhas organizadas na parede.');walls.add(towels);
  box(towels,.1,.04,1,chrome,0,0,0);box(towels,.035,.65,.6,M('#7e9990'),.07,-.28,0,.015);
  const mat=item('tapeteBanheiroNovo','Tapete do banheiro','rug',-2.5,.05,-6.8,'Tapete em frente a pia.');box(mat,2.3,.025,.65,M('#7c9990',0,1),0,0,0,.04);
  const bin=item('lixeiraBanheiroNovo','Lixeira do banheiro','floor',1.2,0,-7.8,'Lixeira ao lado do vaso.');cyl(bin,.15,.4,dark,0,.22,0);cyl(bin,.16,.03,chrome,0,.43,0);
  const boundaries=[new THREE.Box3(new THREE.Vector3(-4.5,0,-3.57),new THREE.Vector3(2.6,2.7,-3.43)),new THREE.Box3(new THREE.Vector3(4,0,-3.57),new THREE.Vector3(4.5,2.7,-3.43))];
  return {walls,door,leaf,boundaries};
}
