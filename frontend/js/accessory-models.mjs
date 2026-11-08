import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {accessoryById} from './accessory-catalog.mjs';

const pool=new Map();
export function accessoryPoolSize(){return pool.size;}
export function createAccessoryVisual(THREE,id,color){
  const item=accessoryById.get(id);if(!item)throw new Error('Acessório desconhecido: '+id);
  const key=id+':'+color;
  if(!pool.has(key)){
    const buckets=new Map();
    const add=(geometry,material='body',position=[0,0,0],scale=[1,1,1],rotation=[0,0,0])=>{
      const matrix=new THREE.Matrix4().compose(new THREE.Vector3(...position),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(...scale));
      geometry.applyMatrix4(matrix);geometry.deleteAttribute('uv');
      // Uniform non-indexed attributes allow every part of a finish to share one draw call.
      const flat=geometry.index?geometry.toNonIndexed():geometry;if(flat!==geometry)geometry.dispose();
      if(!buckets.has(material))buckets.set(material,[]);buckets.get(material).push(flat);
    };
    const box=(w,h,d,x=0,y=0,z=0,mat='body',r=.012)=>add(r?new RoundedBoxGeometry(w,h,d,1,Math.min(r,w/2-.0001,h/2-.0001,d/2-.0001)):new THREE.BoxGeometry(w,h,d),mat,[x,y,z]);
    const ball=(rx,ry,rz,x=0,y=0,z=0,mat='body')=>add(new THREE.SphereGeometry(1,16,10),mat,[x,y,z],[rx,ry,rz]);
    const cylinder=(r,h,x=0,y=0,z=0,mat='metal',top=r)=>add(new THREE.CylinderGeometry(top,r,h,20),mat,[x,y,z]);
    const tube=(points,r=.008,mat='detail',closed=false)=>add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed),Math.max(10,points.length*3),r,5,closed),mat);
    const ring=(r,t,x=0,y=0,z=0,mat='detail',rotation=[0,0,0])=>add(new THREE.TorusGeometry(r,t,5,20),mat,[x,y,z],[1,1,1],rotation);
    const zip=(x,y,z,w,h)=>{tube([[x-w/2,y-h/2,z],[x-w/2,y+h/2,z],[x+w/2,y+h/2,z],[x+w/2,y-h/2,z]],.004,'metal');box(.015,.025,.007,x+w/2,y+.01,z-.004,'metal',.003);};
    const screen=(w,h,x,y,z)=>{box(w,h,.004,x,y,z,'screen',.008);for(let line=0;line<3;line++)box(w*(.7-line*.12),.008,.003,x-w*.05,y+h*.22-line*.025,z-.003,'accent',.002);};
    const shape=item.shape;
    if(['cap','flat_cap','beanie','fedora','bucket'].includes(shape)){
      if(shape==='cap'||shape==='flat_cap'){
        add(new THREE.SphereGeometry(1,24,14,0,Math.PI*2,0,Math.PI/2),'body',[0,.025,0],[.213,.235,.213]);
        if(shape==='cap')ball(.178,.018,.133,0,.028,.175);
        else box(.34,.016,.18,0,.028,.19,'body',.018);
        for(let k=0;k<6;k++){const phi=k*Math.PI/3,points=[];for(let j=0;j<=7;j++){const theta=j/7*Math.PI/2;points.push([Math.cos(phi)*Math.sin(theta)*.215,.026+Math.cos(theta)*.235,Math.sin(phi)*Math.sin(theta)*.215]);}tube(points,.002,'seam');}
        ball(.016,.008,.016,0,.264,0,'detail');box(.045,.035,.004,0,.14,.197,'accent',.005);
      }else if(shape==='beanie'){
        const geo=new THREE.SphereGeometry(1,32,16,0,Math.PI*2,0,Math.PI/2),p=geo.attributes.position;
        for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),rib=1+.008*Math.cos(Math.atan2(z,x)*22);p.setXYZ(i,x*rib,p.getY(i),z*rib);}geo.computeVertexNormals();
        add(geo,'body',[0,.025,0],[.217,.25,.217]);ring(.207,.021,0,.035,0,'detail',[Math.PI/2,0,0]);box(.035,.027,.008,0,.037,.225,'accent',.004);
      }else{
        const profile=shape==='fedora'?[[.214,.066],[.211,.095],[.198,.17],[.180,.218],[.165,.243],[.13,.253],[.08,.235],[0,.228]]:
          [[.255,.025],[.254,.039],[.236,.064],[.214,.085],[.201,.15],[.189,.207],[.176,.228],[.13,.237],[0,.238]];
        const geometry=new THREE.LatheGeometry(profile.map(point=>new THREE.Vector2(...point)),28),positions=geometry.attributes.position;
        if(shape==='fedora')for(let i=0;i<positions.count;i++)if(positions.getY(i)>.17&&positions.getZ(i)>.03)positions.setX(i,positions.getX(i)*(.88+.12*Math.cos(positions.getZ(i)*6)));
        geometry.computeVertexNormals();add(geometry);
        if(shape==='fedora'){ball(.29,.018,.275,0,.045,0);cylinder(.213,.035,0,.09,0,'rubber',.205);}
        else ring(.241,.002,0,.047,0,'seam',[Math.PI/2,0,0]);
      }
    }else if(shape==='headset'||shape==='bluetooth'){
      const arch=[];for(let i=0;i<=12;i++){const a=i/12*Math.PI;arch.push([Math.cos(a)*.215,.025+Math.sin(a)*.263,-.005]);}
      tube(arch,.014,'metal');tube(arch.slice(2,-2),.022,'rubber');
      for(const side of [-1,1]){
        ball(.036,.073,.065,side*.207,-.004,0,'rubber');ball(.027,.061,.055,side*.239,-.004,0);
        ball(.012,.042,.035,side*.264,-.004,0,'accent');box(.008,.024,.008,side*.269,-.02,.031,'metal',.003);
      }
      if(shape==='headset'){tube([[-.24,-.03,.015],[-.24,-.09,.11],[-.10,-.11,.22]],.006,'metal');ball(.025,.013,.016,-.095,-.11,.22,'rubber');}
    }else if(shape==='sunglasses'||shape==='optical'){
      for(const side of [-1,1]){
        const points=[];for(let i=0;i<20;i++){const a=i/20*Math.PI*2;points.push([side*.066+Math.cos(a)*.057,.018+Math.sin(a)*.045,.218]);}
        tube(points,.006,'body',true);add(new THREE.CircleGeometry(1,20),shape==='optical'?'clear':'glass',[side*.066,.018,.217],[.052,.040,1]);
        tube([[side*.119,.033,.214],[side*.16,.032,.17],[side*.166,.015,-.015]],.005,'body');
      }
      tube([[-.014,.022,.223],[0,.031,.228],[.014,.022,.223]],.005,'metal');
    }else if(shape==='mask'){
      ball(.115,.062,.027,0,-.042,.184);
      for(let row=0;row<3;row++)tube([[-.09,-.065+row*.022,.205],[0,-.071+row*.022,.214],[.09,-.065+row*.022,.205]],.002,'seam');
      for(const side of [-1,1])tube([[side*.105,-.005,.19],[side*.18,-.018,.025],[side*.105,-.085,.18]],.003,'rubber');
    }else if(shape==='face_star'){
      const outline=new THREE.Shape();for(let i=0;i<10;i++){const r=i%2?.012:.026,a=i/10*Math.PI*2;const x=Math.sin(a)*r,y=Math.cos(a)*r;i?outline.lineTo(x,y):outline.moveTo(x,y);}outline.closePath();
      add(new THREE.ExtrudeGeometry(outline,{depth:.004,bevelEnabled:true,bevelSize:.001,bevelThickness:.001,bevelSegments:1,steps:1}),'body',[.105,-.05,.177]);
    }else if(shape==='backpack'){
      box(.34,.43,.16,0,0,-.08,'body',.05);box(.265,.19,.055,0,-.10,-.18,'detail',.025);zip(0,-.10,-.211,.22,.13);
      tube([[-.06,.207,-.08],[-.05,.25,-.08],[.05,.25,-.08],[.06,.207,-.08]],.012,'rubber');
      for(const side of [-1,1])tube([[side*.12,.17,-.025],[side*.17,.17,.19],[side*.16,-.15,.31],[side*.115,-.19,.015]],.018,'rubber');
      zip(0,.01,-.165,.29,.35);box(.08,.025,.007,0,.115,-.166,'accent',.005);
      if(id!=='school_bag')for(const side of [-1,1])box(.064,.19,.075,side*.20,-.09,-.075,'detail',.02);
      if(id==='travel_bag'){cylinder(.027,.14,.20,-.025,-.08,'metal');cylinder(.025,.018,.20,.052,-.08,'rubber');}
      if(id==='gamer_bag')for(const side of [-1,1])tube([[side*.10,.13,-.175],[side*.12,.02,-.18],[side*.07,-.025,-.18]],.005,'accent');
    }else if(['crossbody','handbag','shoulder_bag'].includes(shape)){
      const cross=shape==='crossbody',x=cross?.22:.32,y=-.28,z=cross?.19:.025;
      box(.25,.215,.11,x,y,z,'body',.037);box(.23,.075,.015,x,y+.05,z+.063,'detail',.018);zip(x,y,z+.061,.205,.155);
      box(.026,.032,.012,x,y+.015,z+.077,'metal',.004);
      if(cross)tube([[-.20,.17,.01],[-.08,.02,.19],[x+.06,y+.09,z+.02],[x-.06,y+.09,z+.02],[-.19,.15,-.15]],.012,'rubber');
      else{tube([[x-.09,y+.09,z],[.22,.20,-.015],[.33,.17,.01],[x+.09,y+.09,z]],.012,'rubber');if(shape==='handbag')tube([[x-.08,y+.10,z+.04],[x-.06,y+.21,z+.04],[x+.06,y+.21,z+.04],[x+.08,y+.10,z+.04]],.009,'metal');}
    }else if(shape.startsWith('laptop')){
      const open=shape==='laptop_open',cx=open?-.18:0;
      box(.36,.022,.25,cx,0,.025,'body',.014);
      for(const side of [-1,1])cylinder(.010,.04,cx+side*.12,.014,-.085,'metal');
      if(open){
        box(.355,.215,.013,cx,.12,-.095,'body',.011);screen(.325,.18,cx,.12,-.104);
        box(.12,.002,.05,cx,.013,.095,'detail',.005);
        for(let row=0;row<3;row++)for(let col=0;col<10;col++)box(.024,.004,.022,cx-.139+col*.031,.014,-.045+row*.03,'rubber',0);
      }else{box(.36,.012,.25,0,.02,.025,'detail',.012);ball(.017,.002,.017,0,.028,.025,'accent');}
    }else if(shape==='phone'||shape==='tablet'){
      const tablet=shape==='tablet',w=tablet?.255:.086,h=tablet?.32:.155,cx=tablet?-.13:0;
      box(w,h,.016,cx,h*.35,0,'body',.016);screen(w-.014,h-.027,cx,h*.35,-.010);
      ball(.005,.005,.002,cx,h*.35+h*.44,-.012,'rubber');
      for(let i=0;i<(tablet?1:2);i++)ball(.008,.008,.004,cx-w*.30+i*.018,h*.35+h*.35,.012,'glass');
      box(.003,.027,.008,cx+w/2,h*.35,.001,'metal',.001);
    }else if(shape==='coffee'){
      cylinder(.038,.135,0,.06,0,'paper',.046);cylinder(.047,.014,0,.132,0,'rubber');cylinder(.049,.009,0,.122,0,'detail');
      cylinder(.043,.055,0,.055,0,'body',.045);ball(.012,.014,.002,0,.058,.045,'accent');box(.014,.003,.005,0,.141,.025,'rubber',.002);
    }else if(shape==='book'){
      for(const side of [-1,1]){box(.16,.013,.215,-.16+side*.082,0,.03,'body',.007);box(.149,.021,.202,-.16+side*.081,.016,.03,'paper',.005);for(let line=0;line<5;line++)box(.11,.001,.002,-.16+side*.081,.028,-.035+line*.027,'ink',0);}
      tube([[-.16,.013,-.08],[-.16,.022,.03],[-.16,.013,.14]],.004,'detail');
    }else if(shape==='camera'){
      box(.18,.105,.06,0,.04,0,'body',.02);box(.042,.10,.07,.067,.035,.01,'rubber',.012);
      add(new THREE.CylinderGeometry(.038,.041,.055,24),'rubber',[-.018,.04,.05],[1,1,1],[Math.PI/2,0,0]);
      add(new THREE.CircleGeometry(.031,24),'glass',[-.018,.04,.080]);ring(.037,.004,-.018,.04,.079,'metal');
      box(.046,.026,.038,-.015,.101,0,'detail',.006);box(.034,.012,.025,.063,.096,0,'metal',.005);screen(.085,.057,-.025,.035,-.033);
    }else if(shape==='umbrella'){
      const geo=new THREE.SphereGeometry(.47,24,8,0,Math.PI*2,0,Math.PI/2);geo.scale(1,.39,1);geo.translate(-.15,.91,0);add(geo,'body');
      tube([[0,-.025,0],[0,.33,0],[-.10,.72,0],[-.15,1.095,0]],.006,'metal');
      tube([[0,-.02,0],[0,-.09,0],[.04,-.105,0],[.055,-.06,0]],.013,'rubber');
      for(let k=0;k<8;k++){const a=k/8*Math.PI*2,points=[];for(let i=0;i<=6;i++){const t=i/6*Math.PI/2;points.push([-.15+Math.cos(a)*Math.sin(t)*.47,.91+Math.cos(t)*.184,Math.sin(a)*Math.sin(t)*.47]);}tube(points,.0025,'metal');}
      ball(.009,.018,.009,-.15,1.103,0,'metal');
    }else if(shape==='briefcase'){
      box(.34,.24,.09,0,-.16,0,'body',.025);zip(0,-.16,.048,.30,.20);
      tube([[-.055,-.04,0],[-.05,.008,0],[.05,.008,0],[.055,-.04,0]],.012,'rubber');
      for(const side of [-1,1])box(.027,.024,.010,side*.10,-.067,.051,'metal',.004);
    }
    const group=new THREE.Group(),materials=[];
    const palette={body:color||item.color,detail:new THREE.Color(color||item.color).multiplyScalar(.72),accent:'#71d4d3',metal:'#a8b5c2',rubber:'#242a32',seam:'#bfcbd2',paper:'#f3e9d6',screen:'#172c42',ink:'#64717c',glass:'#243746',clear:'#c6ecf0'};
    for(const [finish,geometries] of buckets){
      const geometry=mergeGeometries(geometries,false);geometries.forEach(geo=>geo.dispose());if(!geometry)throw new Error('Malha inválida: '+id);
      geometry.computeBoundingSphere();
      const material=new THREE.MeshStandardMaterial({color:palette[finish],roughness:finish==='metal'?.35:finish==='glass'||finish==='clear'?.18:.72,metalness:finish==='metal'?.65:0,
        transparent:finish==='clear'||finish==='glass',opacity:finish==='clear'?.2:finish==='glass'?.85:1,side:THREE.DoubleSide});
      if(finish==='screen'){material.emissive.set('#0b2437');material.emissiveIntensity=.25;}
      materials.push(material);const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=finish!=='clear'&&finish!=='glass';group.add(mesh);
    }
    if(shape==='camera')group.position.x=-.065;
    pool.set(key,{group,materials,refs:0});
  }
  const entry=pool.get(key);entry.refs++;
  const visual=entry.group.clone(true);visual.name='accessory:'+id;visual.userData.accessoryId=id;
  let released=false;
  return {visual,release(){if(released)return;released=true;visual.removeFromParent();if(--entry.refs===0){entry.group.traverse(node=>node.geometry?.dispose());entry.materials.forEach(material=>material.dispose());pool.delete(key);}}};
}
