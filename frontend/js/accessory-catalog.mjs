export const accessoryCategories=Object.freeze(['Cabeça','Rosto','Costas','Bolsas','Mãos','Eletrônicos']);
export const equipmentSlots=Object.freeze(['Head','Ears','Face','FaceDetail','Back','Shoulder','LeftHand','RightHand']);
const hands=['LeftHand','RightHand'];
const rows=[
  ['cap','Boné clássico','Cabeça',['Head'],'Boné de seis painéis, aba curva e costuras.','cap','#346d98'],
  ['flat_cap','Boné de aba reta','Cabeça',['Head'],'Painel estruturado e aba reta com acabamento contrastante.','flat_cap','#393751'],
  ['beanie','Gorro canelado','Cabeça',['Head'],'Malha estilizada com dobra acolchoada.','beanie','#a34e60'],
  ['fedora','Chapéu fedora','Cabeça',['Head'],'Copa moldada, fita de tecido e aba arredondada.','fedora','#937451'],
  ['bucket','Chapéu bucket','Cabeça',['Head'],'Copa macia, aba inclinada e costuras circulares.','bucket','#72916b'],
  ['headset','Headset gamer','Cabeça',['Ears'],'Arco acolchoado, conchas, almofadas e microfone lateral.','headset','#7163ce'],
  ['bluetooth','Fone Bluetooth','Cabeça',['Ears'],'Fone sem fio com conchas macias e controles laterais.','bluetooth','#d9b99a'],
  ['sunglasses','Óculos de sol','Rosto',['Face'],'Armação arredondada, lentes escuras e hastes laterais.','sunglasses','#242d39'],
  ['optical','Óculos de grau','Rosto',['Face'],'Lentes claras e armação leve com ponte e hastes.','optical','#94704d'],
  ['mask','Máscara','Rosto',['FaceDetail'],'Máscara com pregas, ponte nasal e elásticos.','mask','#6bafb4'],
  ['face_star','Estrela decorativa','Rosto',['FaceDetail'],'Pequena estrela metálica para a bochecha.','face_star','#e6b64a'],
  ['school_bag','Mochila escolar','Costas',['Back'],'Alças, bolso frontal, zíper e puxador superior.','backpack','#cc7857'],
  ['gamer_bag','Mochila gamer','Costas',['Back'],'Mochila estruturada com compartimentos e acabamento colorido.','backpack','#514f93'],
  ['travel_bag','Mochila com compartimentos','Costas',['Back'],'Bolsos extras, porta-garrafa e alças acolchoadas.','backpack','#528975'],
  ['crossbody','Bolsa transversal','Bolsas',['Shoulder'],'Bolsa frontal com alça diagonal e fecho metálico.','crossbody','#b37b4c'],
  ['handbag','Bolsa feminina','Bolsas',['Shoulder'],'Bolsa de couro estilizado com alças e ferragens.','handbag','#bd6587'],
  ['shoulder_bag','Bolsa de ombro','Bolsas',['Shoulder'],'Bolsa lateral de tecido com alça longa e bolso externo.','shoulder_bag','#568b9f'],
  ['laptop_open','Notebook aberto','Eletrônicos',['RightHand'],'Tela, teclado, touchpad e dobradiças; pose com as duas mãos.','laptop_open','#71879a','twoHands'],
  ['laptop_closed','Notebook fechado','Eletrônicos',hands,'Notebook fino com bordas suaves, dobradiças e logotipo.','laptop_closed','#7e8d9c','carry'],
  ['phone','Celular','Eletrônicos',hands,'Celular com tela, câmeras, botões e pose de uso.','phone','#5c729f','phone'],
  ['tablet','Tablet','Eletrônicos',['RightHand'],'Tablet com tela e câmera; segurado pelas duas mãos.','tablet','#697785','twoHands'],
  ['coffee','Copo de café','Mãos',hands,'Copo térmico com tampa, manga de papel e pose de sustentação.','coffee','#c49d76','cup'],
  ['book','Livro','Mãos',['RightHand'],'Livro aberto com capa, páginas e pose de leitura.','book','#9c555a','twoHands'],
  ['camera','Câmera fotográfica','Eletrônicos',hands,'Corpo, lente, grip, visor e botão de disparo.','camera','#465469','camera'],
  ['umbrella','Guarda-chuva','Mãos',hands,'Cobertura em painéis, varetas, haste e cabo curvo.','umbrella','#527bb0','umbrella'],
  ['briefcase','Maleta executiva','Mãos',hands,'Maleta com cantos arredondados, alça, fechos e costuras.','briefcase','#805c44','carry']
];
export const accessoryCatalog=Object.freeze(rows.map(([id,name,category,slots,description,shape,color,pose=null])=>Object.freeze({id,name,category,slots:Object.freeze([...slots]),description,shape,color,pose})));
export const accessoryById=new Map(accessoryCatalog.map(item=>[item.id,item]));
export const articulatedAccessoryModels=new Set(['default']);
const colorPattern=/^#[0-9a-f]{6}$/i;
export function validateEquipment(value){
  if(value===undefined)return {};
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>equipmentSlots.length)return null;
  const result={};
  for(const [slot,entry] of Object.entries(value)){
    if(!equipmentSlots.includes(slot)||!entry||typeof entry!=='object'||Array.isArray(entry))return null;
    if(Object.keys(entry).some(key=>!['id','color'].includes(key)))return null;
    const item=accessoryById.get(entry.id);
    if(!item||!item.slots.includes(slot)||(entry.color!==undefined&&!colorPattern.test(entry.color)))return null;
    result[slot]={id:item.id,color:entry.color||item.color};
  }
  if(result.Back&&result.Shoulder)return null;
  if(result.Ears&&['fedora','bucket'].includes(result.Head?.id))return null;
  if(result.LeftHand&&result.RightHand&&[result.LeftHand,result.RightHand].some(entry=>accessoryById.get(entry.id).pose==='twoHands'))return null;
  return result;
}
export function equipAccessory(equipment,id,slot,color){
  const item=accessoryById.get(id);if(!item)return validateEquipment(equipment)||{};
  slot=slot||item.slots.at(-1);if(!item.slots.includes(slot))return validateEquipment(equipment)||{};
  const next={...(validateEquipment(equipment)||{})};
  if(slot==='Back')delete next.Shoulder;if(slot==='Shoulder')delete next.Back;
  if(slot==='Head'&&['fedora','bucket'].includes(id))delete next.Ears;
  if(slot==='Ears'&&['fedora','bucket'].includes(next.Head?.id))delete next.Head;
  if(item.pose==='twoHands'){delete next.LeftHand;delete next.RightHand;}
  else if(slot.endsWith('Hand'))for(const hand of ['LeftHand','RightHand'])if(next[hand]&&accessoryById.get(next[hand].id).pose==='twoHands')delete next[hand];
  next[slot]={id,color:colorPattern.test(color||'')?color:item.color};return next;
}
