import {feminineBustOffset,applyBodyShape} from './avatar-body.mjs';
import {createNaturalHair} from './avatar-hair.mjs?v=equipment-3';
import {applyEquipment} from './avatar-equipment.mjs';
import {clothRadius} from './avatar-cloth.mjs';
let guedesLogoTexture;
function shirtLogo(THREE){
  if(!guedesLogoTexture){guedesLogoTexture=new THREE.TextureLoader().load(new URL('../assets/guedessec.png',import.meta.url).href,()=>globalThis.dispatchEvent(new Event('avatar-texture-ready')));guedesLogoTexture.colorSpace=THREE.SRGBColorSpace;}
  return guedesLogoTexture;
}
let brazilPrintTexture;
function brazilPrint(THREE){
  if(brazilPrintTexture)return brazilPrintTexture;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#168342';ctx.beginPath();ctx.moveTo(172,22);ctx.lineTo(213,22);ctx.lineTo(210,58);ctx.quadraticCurveTo(193,79,176,58);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ffdf35';ctx.beginPath();ctx.moveTo(192,30);ctx.lineTo(206,45);ctx.lineTo(192,60);ctx.lineTo(178,45);ctx.closePath();ctx.fill();
  ctx.fillStyle='#204a98';ctx.beginPath();ctx.arc(192,45,8,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.fillRect(186,43,12,2);
  ctx.fillStyle='#168342';ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillText('BRASIL',192,90);
  ctx.font='bold 100px Arial';ctx.fillText('10',128,202);
  brazilPrintTexture=new THREE.CanvasTexture(canvas);brazilPrintTexture.colorSpace=THREE.SRGBColorSpace;return brazilPrintTexture;
}
let ptLulaTexture;
function ptLulaPrint(THREE){
  if(ptLulaTexture)return ptLulaTexture;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
  const stamp=()=>{
    ctx.fillStyle='#c91d32';ctx.fillRect(0,0,512,512);
    ctx.fillStyle='#ffffff';ctx.beginPath();for(let i=0;i<10;i++){const angle=-Math.PI/2+i*Math.PI/5,r=i%2?29:66;const x=92+Math.cos(angle)*r,y=93+Math.sin(angle)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();
    ctx.fillStyle='#c91d32';ctx.font='bold 36px Arial';ctx.textAlign='center';ctx.fillText('PT',92,106);
    ctx.fillStyle='#fff';ctx.font='bold 66px Arial';ctx.fillText('LULA',260,468);
  };
  stamp();ptLulaTexture=new THREE.CanvasTexture(canvas);ptLulaTexture.colorSpace=THREE.SRGBColorSpace;
  const image=new Image();image.onload=()=>{
    stamp();ctx.save();ctx.beginPath();ctx.ellipse(280,245,145,166,0,0,Math.PI*2);ctx.clip();ctx.drawImage(image,100,90,1080,1270,135,79,290,332);ctx.restore();ptLulaTexture.needsUpdate=true;globalThis.dispatchEvent(new Event('avatar-texture-ready'));
  };image.src=new URL('../assets/lula-rosto.jpg',import.meta.url).href;
  return ptLulaTexture;
}
export function applyAvatarAppearance(root,config,THREE){
  applyEquipment(root,config,THREE);
  const signature=JSON.stringify(config);if(root.userData.avatarSignature===signature)return;
  root.userData.avatarSignature=signature;
  root.traverse(node=>{
    if(node.userData.avatarHide)node.visible=false;
    if(node.userData.avatarCollar)node.visible=!['underwear','sport'].includes(config.outfit);
    if(node.userData.avatarGlasses)node.visible=config.glasses&&!config.accessories?.Face;
    const part=node.userData.avatarPart;
    const intimateTop=['underwear','sport'].includes(config.outfit),intimateBottom=['briefs','boxer'].includes(config.bottom);
    if(part&&node.material){
      if(!node.userData.avatarOwnMaterial){node.material=node.material.clone();node.userData.avatarOwnMaterial=true;}
      node.material.color.set(part==='shirt'&&config.outfit==='guedessec'?'#080808':config[part]||(part==='shoes'?'#20242b':'#17191e'));
      if(part==='shirt'&&config.outfit==='pt_lula')node.material.color.set('#c91d32');
      if(part==='shirt'&&config.outfit==='brazil')node.material.color.set(node.userData.avatarCollar?'#168342':'#ffda28');
      if(part==='shoes'){if(!node.userData.baseShoeScale)node.userData.baseShoeScale=node.scale.toArray();node.scale.fromArray(node.userData.baseShoeScale);if(node.userData.avatarShoeUpper){node.visible=config.footwear==='boots';}else if(config.footwear==='formal')node.scale.z*=1.05;}
      if(part==='shirt'&&intimateTop)node.material.color.set(config.skin);
      if(part==='pants'&&intimateBottom&&!node.userData.avatarPelvis)node.material.color.set(node.userData.avatarThigh&&config.bottom==='boxer'?config.pants:config.skin);
      if(node.userData.avatarTorso){
        node.material.vertexColors=intimateTop&&config.gender==='feminine';
        if(node.material.vertexColors){
          const position=node.geometry.attributes.position,colors=[],skinColor=new THREE.Color(config.skin),cloth=new THREE.Color(config.shirt);
          for(let i=0;i<position.count;i++){const y=position.getY(i),lower=config.outfit==='sport'?.12:.21;const c=y>=lower&&y<=.43?cloth:skinColor;colors.push(c.r,c.g,c.b);}
          node.geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));node.material.color.set('#ffffff');
        }
        node.material.needsUpdate=true;
      }
      node.material.roughness=part==='skin'?.8:part==='shoes'?(config.footwear==='formal'?.48:.78):part==='pants'?(config.bottom==='jeans'?.96:.87):.9;
      node.material.metalness=0;
    }
    if(node.userData.avatarTorso)applyBodyShape(node,config.gender);
    if(node.userData.avatarPelvis){const feminine=config.gender==='feminine';node.scale.set(feminine?.275:.19,feminine?.165:.12,feminine?.225:.135);node.position.z=feminine?-.065:-.015;}
  });
  const outfit=config.outfit||'casual';
  const clothingSignature=[outfit,config.bottom,config.shirt,config.pants,config.gender].join(':');
  if(root.userData.clothingSignature!==clothingSignature){
    root.userData.clothingSignature=clothingSignature;
    const old=root.getObjectByName('customAvatarClothes');
    if(old){old.traverse(n=>{n.geometry?.dispose();n.material?.dispose();});old.removeFromParent();}
    const clothes=new THREE.Group();clothes.name='customAvatarClothes';root.add(clothes);
    const add=(geometry,color,x,y,z)=>{const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.9}));mesh.position.set(x,y,z);mesh.castShadow=true;clothes.add(mesh);return mesh;};
    // Small fabric details follow the actual torso surface, without floating boxes.
    function surfaceZ(x,y){
      const radius=clothRadius(y-.79);
      const sx=config.gender==='feminine'?.92:1;
      const z=Math.sqrt(Math.max(0,radius*radius-(x/sx)**2));
      return z*.8+(config.gender==='feminine'?feminineBustOffset(x,y)*Math.min(1,z/.18)**2:0)+.0035;
    }
    function fabricPanel(width,y0,y1,color,map=null){
      const vertices=[],uvs=[],indices=[],rows=18,columns=8;
      for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
        const x=(col/columns-.5)*width,y=y0+(y1-y0)*row/rows;vertices.push(x,y,surfaceZ(x,y));uvs.push(col/columns,row/rows);
      }
      for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){const i=row*(columns+1)+col;indices.push(i,i+1,i+columns+1,i+1,i+columns+2,i+columns+1);}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
      const panel=add(geometry,color,0,0,0);if(map){panel.material.alphaMap=map;panel.material.transparent=true;panel.material.alphaTest=.2;}panel.material.polygonOffset=true;panel.material.polygonOffsetFactor=-1;panel.material.polygonOffsetUnits=-1;return panel;
    }
    const fabricColor=new THREE.Color(config.shirt||'#17191e');
    const trim=fabricColor.clone().lerp(new THREE.Color('#ffffff'),.12);
    const shadow=fabricColor.clone().multiplyScalar(.72);
    function tailoredPanel(points,color){
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(points.flatMap(([x,y])=>[x,y,surfaceZ(x,y)+.002]),3));
      geometry.setIndex([0,1,2,0,2,3]);geometry.computeVertexNormals();
      const panel=add(geometry,color,0,0,0);panel.material.side=THREE.DoubleSide;
    }
    if(!intimateOutfit(outfit)){
      // Narrow tonal hem follows the same surface as the shirt.
      fabricPanel(.25,.807,.816,shadow);
    }
    function intimateOutfit(value){return value==='underwear'||value==='sport';}
    if(outfit==='pt_lula'){const print=fabricPanel(.30,.91,1.235,'#ffffff');print.material.map=ptLulaPrint(THREE);}
    if(outfit==='brazil'){
      const print=fabricPanel(.30,.92,1.22,'#ffffff');print.material.map=brazilPrint(THREE);print.material.transparent=true;print.material.alphaTest=.2;
    }
    if(outfit==='guedessec')fabricPanel(.19,.94,1.145,'#ffffff',shirtLogo(THREE));
    if(outfit==='shirt'||outfit==='polo'){
      const top=outfit==='polo'?1.23:1.24,bottom=outfit==='polo'?1.1:.84;
      fabricPanel(.022,bottom,top,config.shirt);
      for(let y=top-.035;y>bottom;y-=.065)add(new THREE.SphereGeometry(.006,8,6),'#b9b6ab',0,y,surfaceZ(0,y)+.003);
      for(const side of [-1,1])tailoredPanel([[side*.018,1.253],[side*.085,1.24],[side*.105,1.192],[side*.043,1.211]],trim);
    }
    if(outfit==='jacket'){
      fabricPanel(.075,.84,1.24,'#d4d2c8');
      for(const side of [-1,1]){
        tailoredPanel([[side*.035,1.245],[side*.108,1.205],[side*.075,1.115],[side*.018,1.04]],trim);
        tailoredPanel([[side*.075,.914],[side*.153,.914],[side*.153,.903],[side*.075,.903]],shadow);
      }
    }

  }
  const head=root.getObjectByName('onlineAvatarHead');if(!head)return;
  const equipmentHat=config.accessories?.Head?.id;
  const hairSignature=[config.hair,config.hairStyle,config.hat,equipmentHat,config.hat==='cap'||config.hat==='beanie'?config.shirt:''].join(':');
  if(root.userData.avatarHairSignature===hairSignature)return;
  root.userData.avatarHairSignature=hairSignature;
  const old=head.getObjectByName('customAvatarHair');
  if(old){const materials=new Set(),textures=new Set();old.traverse(n=>{n.geometry?.dispose();if(n.material){materials.add(n.material);if(n.material.map)textures.add(n.material.map);}});textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());old.removeFromParent();}
  head.add(createNaturalHair({THREE,color:config.hair,style:config.hairStyle,hat:equipmentHat?'cap':config.hat,hideHat:!!equipmentHat,hatColor:config.shirt,skinColor:config.skin}));
}
