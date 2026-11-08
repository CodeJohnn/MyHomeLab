import {accessoryCatalog,accessoryCategories,accessoryById,equipAccessory,validateEquipment,articulatedAccessoryModels} from './accessory-catalog.mjs';

const slotNames={Head:'Cabeça',Ears:'Fones',Face:'Óculos',FaceDetail:'Rosto',Back:'Costas',Shoulder:'Bolsa',LeftHand:'Mão esquerda',RightHand:'Mão direita'};
export function accessoryThumbnail(item,color=item.color){
  const fill=/^#[0-9a-f]{6}$/i.test(color)?color:item.color;
  const icons={
    head:'<path d="M17 40q0-27 25-27t25 27Z"/><path d="M12 41q31-7 60 0l-3 7H14Z"/><path d="M42 14v23" fill="none"/>',
    headset:'<path d="M18 43V31a24 24 0 0 1 48 0v12" fill="none" stroke-width="7"/><rect x="11" y="32" width="16" height="26" rx="7"/><rect x="57" y="32" width="16" height="26" rx="7"/><path d="M64 54 45 65" fill="none"/>',
    face:'<rect x="9" y="28" width="28" height="23" rx="10"/><rect x="47" y="28" width="28" height="23" rx="10"/><path d="M37 36h10M9 32 4 22m71 10 5-10" fill="none"/>',
    mask:'<path d="M16 26q26-15 52 0v28q-26 19-52 0Z"/><path d="M16 29Q0 15 3 49l13 4m52-24q16-14 13 20l-13 4M23 34h38M23 43h38M23 52h38" fill="none"/>',
    face_star:'<path d="m42 7 10 20 23 3-17 16 4 24-20-11-20 11 4-24L9 30l23-3Z"/>',
    bag:'<rect x="21" y="18" width="42" height="51" rx="13"/><path d="M31 20V10h22v10M16 29q-15 17 2 36m50-36q15 17-2 36" fill="none"/><rect x="28" y="44" width="28" height="18" rx="5"/>',
    shoulder:'<path d="M20 36q0-29 22-29t22 29" fill="none"/><rect x="15" y="32" width="54" height="35" rx="10"/><path d="M20 45h44M38 45v8h8v-8" fill="none"/>',
    laptop:'<rect x="15" y="12" width="54" height="37" rx="5"/><path d="m15 49-9 17h72l-9-17Z"/><path d="M23 21h38v20H23Zm9 38h20" fill="none"/>',
    phone:'<rect x="25" y="7" width="34" height="65" rx="8"/><path d="M31 17h22v42H31Zm7 49h8" fill="none"/>',
    cup:'<path d="m24 23 7 47h24l7-47Z"/><rect x="19" y="15" width="48" height="10" rx="5"/><path d="M29 41h28M34 8q-6-4 0-7m18 7q-6-4 0-7" fill="none"/>',
    book:'<path d="M8 17q16-8 34 2 18-10 34-2v48q-17-7-34 2-18-9-34-2Z"/><path d="M42 19v48M17 29l17 2m-17 9 17 2m17-11 17-2m-17 13 17-2" fill="none"/>',
    camera:'<rect x="9" y="24" width="66" height="43" rx="10"/><path d="m28 24 5-11h23l5 11"/><circle cx="42" cy="45" r="16"/><circle cx="42" cy="45" r="10" fill="#b0e0e5"/>',
    umbrella:'<path d="M6 39q36-61 72 0-12-8-24 0-12-8-24 0-12-8-24 0Z"/><path d="M42 14v49q0 16 12 11" fill="none"/>',
    briefcase:'<rect x="8" y="26" width="68" height="43" rx="8"/><path d="M28 26V14h28v12M8 42h68M37 40h10v9H37Z" fill="none"/>'
  };
  const shape=item.slots[0]==='Head'?'head':item.slots[0]==='Ears'?'headset':item.slots[0]==='Face'?'face':item.category==='Costas'?'bag':item.category==='Bolsas'?'shoulder':item.shape.startsWith('laptop')?'laptop':item.shape==='tablet'?'phone':item.shape==='coffee'?'cup':item.shape;
  return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 80"><g fill="${fill}" stroke="#294a58" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${icons[shape]||icons.bag}</g></svg>`);
}
export function createAccessoryInventory({onChange}){
  let equipment={},category=accessoryCategories[0],model='default';
  const element=document.createElement('details');element.className='accessoryInventory';
  element.innerHTML='<summary>Acessórios <span>26 itens</span></summary><div class="accessoryInventoryBody"><p>Experimente na prévia 3D, ajuste a cor do último item escolhido e salve o perfil para equipar na sala.</p><nav aria-label="Categorias de acessórios"></nav><div class="accessoryTools"><label>Cor<input type="color" value="#346d98" aria-label="Cor do último acessório escolhido"></label><label>Objetos na mão<select aria-label="Mão para equipar"><option value="RightHand">Direita</option><option value="LeftHand">Esquerda</option></select></label></div><p class="accessoryCompatibility" role="status" hidden></p><div class="accessoryEquipped" aria-label="Acessórios equipados"></div><div class="accessoryGrid"></div></div>';
  const grid=element.querySelector('.accessoryGrid'),color=element.querySelector('input'),hand=element.querySelector('select'),equipped=element.querySelector('.accessoryEquipped');
  const colorTarget=document.createElement('select');colorTarget.setAttribute('aria-label','Acessório para colorir');
  const colorLabel=document.createElement('label');colorLabel.textContent='Item';colorLabel.append(colorTarget);element.querySelector('.accessoryTools').append(colorLabel);
  color.setAttribute('aria-label','Cor do acessório selecionado');
  element.querySelector('.accessoryInventoryBody>p').textContent='Experimente na prévia 3D, escolha o item para colorir e salve o perfil para equipar na sala.';
  let colorChanged=false,activeSlot=null;
  const notify=()=>{render();onChange?.(api.read());};
  for(const title of accessoryCategories){
    const button=document.createElement('button');button.type='button';button.textContent=title;button.dataset.category=title;
    button.onclick=()=>{category=title;colorChanged=false;render();};element.querySelector('nav').append(button);
  }
  function render(){
    colorTarget.replaceChildren(new Option('Próximo item',''),...Object.entries(equipment).map(([slot,entry])=>new Option(slotNames[slot]+' · '+accessoryById.get(entry.id).name,slot)));
    colorTarget.value=equipment[activeSlot]?activeSlot:'';
    for(const button of element.querySelectorAll('nav button'))button.setAttribute('aria-pressed',String(button.dataset.category===category));
    equipped.replaceChildren(...Object.entries(equipment).map(([slot,entry])=>{
      const button=document.createElement('button');button.type='button';button.textContent=slotNames[slot]+': '+accessoryById.get(entry.id).name+' ×';button.setAttribute('aria-label','Remover '+accessoryById.get(entry.id).name+' de '+slotNames[slot]);
      button.onclick=()=>{delete equipment[slot];notify();};return button;
    }));
    grid.replaceChildren(...accessoryCatalog.filter(item=>item.category===category).map(item=>{
      const slot=item.slots.includes(hand.value)?hand.value:item.slots.at(-1),selected=equipment[slot]?.id===item.id;
      const card=document.createElement('article');card.className='accessoryCard';card.classList.toggle('isEquipped',selected);
      const image=document.createElement('img');image.src=accessoryThumbnail(item,selected?equipment[slot].color:item.color);image.alt='';
      const name=document.createElement('strong');name.textContent=item.name;
      const description=document.createElement('p');description.textContent=item.description;
      const button=document.createElement('button');button.type='button';button.textContent=selected?'Remover':'Experimentar';
      button.disabled=slot.endsWith('Hand')&&!articulatedAccessoryModels.has(model);
      button.onclick=()=>{
        if(selected){delete equipment[slot];if(activeSlot===slot)activeSlot=null;}else{equipment=equipAccessory(equipment,item.id,slot,colorChanged?color.value:item.color);color.value=equipment[slot].color;activeSlot=slot;}
        notify();
      };
      card.append(image,name,description,button);return card;
    }));
  }
  color.addEventListener('input',()=>{
    colorChanged=true;if(activeSlot&&equipment[activeSlot])equipment[activeSlot]={...equipment[activeSlot],color:color.value};notify();
  });
  hand.onchange=render;
  colorTarget.onchange=()=>{activeSlot=colorTarget.value||null;colorChanged=false;if(activeSlot)color.value=equipment[activeSlot].color;};
  const api={element,read:()=>structuredClone(equipment),set(value){equipment=validateEquipment(value)||{};render();},remove(slot){if(equipment[slot]){delete equipment[slot];notify();}},
    setModel(value){
      value=value||'default';if(model===value)return;model=value;
      const note=element.querySelector('.accessoryCompatibility'),supported=articulatedAccessoryModels.has(model);
      note.hidden=supported;note.textContent='Este modelo não possui mãos com suporte a estes objetos. Use o Personalizado para experimentar todos os itens.';
      if(!supported){delete equipment.LeftHand;delete equipment.RightHand;}render();
    }};
  render();return api;
}
