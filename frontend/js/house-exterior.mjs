// Somente elementos externos: nao altera pisos, paredes ou objetos dos comodos.
export function createHouseExterior({THREE,scene,box,cyl,sphere,M}) {
  const garden=new THREE.Group();garden.name='Exterior da casa';scene.add(garden);
  const lawn=M('#70945b'),paving=M('#c9bda7'),stone=M('#a19887'),fence=M('#ddd5c3');
  const soil=M('#705640'),trunk=M('#73513a'),leaves=M('#487344'),shrub=M('#64864c');
  // Terreno continuo ate o horizonte: a casa nao fica sobre uma ilha suspensa.
  box(garden,2000,.3,2000,lawn,4,-.59,2.5);
  const asphalt=M('#55575a'),concrete=M('#c7c4bc'),paint=M('#eadc9e');
  const neighborhood=new THREE.Group();neighborhood.name='Vizinhanca residencial';garden.add(neighborhood);
  for(const z of [20,-20]){
    box(neighborhood,180,.08,7,asphalt,4,-.4,z);
    for(const side of [-1,1]){
      box(neighborhood,180,.15,2.1,concrete,4,-.355,z+side*4.6);
      box(neighborhood,180,.22,.18,stone,4,-.33,z+side*3.55);
    }
    for(let x=-80;x<90;x+=6)box(neighborhood,2.5,.012,.12,paint,x,-.354,z);
  }
  const neighborGlass=M('#83aeb9',.18,.32),door=M('#805e43'),frame=M('#eee4d3');
  function neighborHouse(x,z,color,roofColor,turn=0){
    const home=new THREE.Group();home.position.set(x,0,z);home.rotation.y=turn;neighborhood.add(home);
    const finish=M(color),tiles=M(roofColor);
    box(home,10,.22,8.5,stone,0,-.32,0);
    box(home,9.5,3.5,8,finish,0,1.54,0);
    const triangle=new THREE.Shape();triangle.moveTo(-4,0);triangle.lineTo(4,0);triangle.lineTo(0,1.7);triangle.closePath();
    const gable=new THREE.Mesh(new THREE.ExtrudeGeometry(triangle,{depth:9.5,bevelEnabled:false}),finish);
    gable.rotation.y=Math.PI/2;gable.position.set(-4.75,3.29,0);home.add(gable);
    const angle=Math.atan2(1.7,4.5),span=Math.hypot(4.5,1.7);
    for(const side of [-1,1]){
      const panel=box(home,10.4,.16,span,tiles,0,4.14,side*2.25);panel.rotation.x=side*angle;
      box(home,10.5,.18,.15,frame,0,3.27,side*4.5);
    }
    box(home,1.1,2.25,.08,door,0,.9,4.05);
    sphere(home,.045,metalHandle,.36,.9,4.11);
    for(const xx of [-2.8,2.8]){
      box(home,1.7,1.45,.1,frame,xx,1.65,4.06);
      box(home,1.48,1.23,.04,neighborGlass,xx,1.65,4.13);
      box(home,.045,1.25,.04,frame,xx,1.65,4.16);
      box(home,1.5,.045,.04,frame,xx,1.65,4.16);
    }
    box(home,1.8,.08,4.2,paving,0,-.38,6.3);
    for(const xx of [-3.9,3.9])sphere(home,.6,shrub,xx,.02,5);
  }
  const metalHandle=M('#b49a61',.5,.35);
  // Casas laterais e do outro lado das ruas, sem tocar na planta principal.
  for(const [x,color,tiles] of [[-24,'#d7b88e','#9b5541'],[32,'#b8c7b0','#766257']])neighborHouse(x,2,color,tiles);
  for(const x of [-37,-18,3,24,45]){
    neighborHouse(x,34,x%2?'#e2c6a7':'#c1cbd1','#a2634c',Math.PI);
    neighborHouse(x,-34,'#d4c9b4','#786b60');
  }
  // Postes baixos e arvores na calcada reforcam a escala da rua.
  for(const x of [-15,23]){
    cyl(neighborhood,.09,4.4,M('#59605b'),x,1.8,15.7,10);
    box(neighborhood,.75,.12,.35,frame,x+.25,4.03,15.7,.04);
    for(const z of [14,-14]){
      cyl(neighborhood,.12,2.4,trunk,x,.7,z,10);
      sphere(neighborhood,1.1,leaves,x,2.5,z);
    }
  }
  // Passeio ao redor da mesma planta, sem invadir os ambientes.
  box(garden,19,.12,1.1,paving,4,-.36,-4.12);
  box(garden,19,.12,1.1,paving,4,-.36,11.12);
  for(const x of [-5.12,13.12])box(garden,1.1,.12,14.2,paving,x,-.36,3.5);
  box(garden,2.4,.1,3.3,paving,4,-.37,13.3);
  for(let i=0;i<6;i++)box(garden,2.3,.012,.035,stone,4,-.313,11.7+i*.5);
  // Cerca baixa e abertura do portao alinhada ao caminho.
  for(const [x,w] of [[-4,13],[12,13]])box(garden,w,.12,.12,fence,x,.1,15);
  for(const x of [-10.5,18.5]){
    for(const y of [-.05,.45])box(garden,.1,.09,25,fence,x,y,2.5);
    for(let z=-10;z<=15;z+=1)box(garden,.13,.95,.13,fence,x,.035,z,.018);
  }
  for(let x=-10.5;x<=18.5;x+=1){
    if(x>2.7&&x<5.3)continue;
    box(garden,.13,.95,.13,fence,x,.035,15,.018);
  }
  for(const [x,z] of [[-7.8,-6.6],[15.8,-6.6],[-8,11.5],[16,11.5]]){
    cyl(garden,.65,.12,soil,x,-.38,z);
    cyl(garden,.15,2.2,trunk,x,.65,z,10);
    sphere(garden,1.1,leaves,x,2.3,z);
    sphere(garden,.8,shrub,x+.55,2.05,z+.2);
  }
  for(const x of [-6.5,14.5])for(let z=-2;z<=7;z+=2.2){
    box(garden,1.15,.14,1.3,soil,x,-.36,z,.04);
    sphere(garden,.48,shrub,x,-.02,z);
  }
  const utilities=new THREE.Group();utilities.name='Poste e entrada de energia e internet';garden.add(utilities);
  const poleConcrete=M('#99978c'),utilityBlack=M('#16191b',.12,.75),insulator=M('#c8ceca',.15,.4);
  const poleX=10,poleZ=-16;
  cyl(utilities,.2,7.7,poleConcrete,poleX,3.41,poleZ,12);
  box(utilities,1.5,.13,.16,utilityBlack,poleX,6.8,poleZ);
  for(const x of [-.5,0,.5]){
    cyl(utilities,.07,.2,insulator,poleX+x,6.97,poleZ,12);
    cyl(utilities,.095,.035,insulator,poleX+x,6.99,poleZ,12);
  }
  // Caixa de distribuicao de fibra e reserva de cabo presa ao poste.
  box(utilities,.34,.48,.2,utilityBlack,poleX,4.85,poleZ+.22,.025);
  const fiberLoop=new THREE.Mesh(new THREE.TorusGeometry(.22,.018,6,28),utilityBlack);
  fiberLoop.position.set(poleX,4.25,poleZ+.24);utilities.add(fiberLoop);
  function utilityCable(points,radius=.022){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const wire=new THREE.Mesh(new THREE.TubeGeometry(curve,36,radius,6,false),utilityBlack);
    wire.name='Cabo preto de entrada';utilities.add(wire);
  }
  // Ramal aereo com folga; energia e fibra chegam a pontos separados da fachada.
  const entryX=11.7,entryZ=-3.67;
  cyl(utilities,.055,2.25,utilityBlack,entryX,4.7,entryZ,10);
  for(const offset of [-.11,.11]){
    utilityCable([[poleX+offset,7.08,poleZ],[10.8+offset,5.9,-9.8],[entryX+offset,5.8,entryZ]],.025);
    utilityCable([[entryX+offset,5.8,entryZ],[entryX+offset,4.7,entryZ],[entryX+offset,1.75,entryZ]],.02);
  }
  const meter=M('#c8c6bc',.25,.45);
  box(utilities,.45,.6,.2,meter,entryX,1.45,entryZ,.025);
  box(utilities,.25,.22,.025,M('#52676e',.3,.25),entryX,1.53,entryZ-.115,.01);
  utilityCable([[poleX,4.85,poleZ+.33],[10.5,3.7,-9.8],[11.1,3.5,entryZ]],.018);
  utilityCable([[11.1,3.5,entryZ],[-3.05,2.9,entryZ],[-3.05,2.35,entryZ]],.016);
  box(utilities,.29,.36,.13,utilityBlack,11.1,2.2,entryZ,.015);
  // Passagens pela parede dos fundos ate os pontos internos de distribuicao.
  utilityCable([[11.1,2.2,entryZ],[11.1,2.2,-3.3]],.016);
  utilityCable([[entryX,1.45,entryZ],[entryX,1.45,-3.3]],.025);
  const roof=new THREE.Group();roof.name='Telhado da casa';roof.visible=false;scene.add(roof);
  const roofTile=M('#9d5440'),fascia=M('#e6dbc7');
  // Telhado de duas aguas sobre a planta retangular existente.
  const slope=Math.atan2(1.8,7.55),length=Math.hypot(7.55,1.8);
  for(const side of [-1,1]){
    const panel=box(roof,18.1,.13,length,roofTile,4,4.3,3.5+side*3.775);
    panel.rotation.x=side*slope;
    box(roof,18.2,.2,.16,fascia,4,3.4,3.5+side*7.55);
    for(let x=-4.8;x<=12.8;x+=.42){
      const seam=box(roof,.045,.035,length,roofTile,x,4.39,3.5+side*3.775);
      seam.rotation.x=side*slope;
    }
  }
  box(roof,18.2,.18,.22,roofTile,4,5.23,3.5,.04);
  garden.updateWorldMatrix(true,true);
  const colliders=[];
  garden.traverse(object=>{
    if(!object.isMesh)return;
    const bounds=new THREE.Box3().setFromObject(object);
    if(bounds.min.y<1.8&&bounds.max.y>.08)colliders.push(bounds);
  });
  // O entorno fixo nao precisa recalcular suas matrizes a cada quadro.
  garden.traverse(object=>{object.updateMatrix();object.matrixAutoUpdate=false;});
  // Trafego decorativo em faixas separadas, fora da area de caminhada.
  const traffic=new THREE.Group();traffic.name='Carros nas ruas';scene.add(traffic);
  const cars=[],rubber=M('#202325',0,.95),hub=M('#a8b1b5',.7,.35),carGlass=M('#344d5c',.25,.22);
  const carColors=['#9b4b3d','#e0ddd2','#4d7185','#50565b'];
  for(const [roadIndex,roadZ]of [20,-20].entries())for(const direction of [-1,1])for(let slot=0;slot<2;slot++){
    const car=new THREE.Group();traffic.add(car);
    const body=M(carColors[(roadIndex*2+slot+(direction===1?1:0))%4],.25,.35);
    box(car,3.8,.52,1.65,body,0,.4,0,.12);
    box(car,2,.65,1.46,body,-.25,.95,0,.12);
    box(car,1.76,.39,.025,carGlass,-.25,1.02,.746,.035);
    box(car,1.76,.39,.025,carGlass,-.25,1.02,-.746,.035);
    box(car,.025,.4,1.25,carGlass,.77,1.01,0,.025);
    box(car,.025,.38,1.25,carGlass,-1.27,1.01,0,.025);
    for(const side of [-1,1]){
      box(car,.05,.16,.4,M('#f6edc9'),1.91,.51,side*.51,.025);
      box(car,.05,.16,.4,M('#a4312b'),-1.91,.51,side*.51,.025);
    }
    const wheels=[];
    for(const x of [-1.15,1.15])for(const z of [-.8,.8]){
      const axle=new THREE.Group();axle.position.set(x,.26,z);car.add(axle);
      const wheel=cyl(axle,.29,.2,rubber,0,0,0,12);wheel.rotation.x=Math.PI/2;
      const cap=cyl(axle,.15,.215,hub,0,0,0,10);cap.rotation.x=Math.PI/2;wheels.push(axle);
    }
    car.position.set(-70+slot*90+(direction===1?24:0),-.35,roadZ+direction*1.7);
    car.rotation.y=direction===1?0:Math.PI;
    cars.push({car,wheels,direction,speed:roadIndex?5:4.2});
  }
  function updateTraffic(dt){
    for(const {car,wheels,direction,speed}of cars){
      car.position.x+=direction*speed*dt;
      if(car.position.x>94)car.position.x-=180;
      if(car.position.x< -86)car.position.x+=180;
      for(const wheel of wheels)wheel.rotation.z-=speed*dt/.29;
    }
  }
  return {roof,colliders,updateTraffic,internetEntry:new THREE.Vector3(11.1,2.2,-3.3),powerEntry:new THREE.Vector3(11.7,1.45,-3.3)};
}
