export function createCharacterHover({THREE,canvas,getCamera,getCharacters,getBlockers,isEnabled}){
  const card=document.createElement('aside');card.className='characterHoverCard';card.hidden=true;card.setAttribute('role','tooltip');
  card.innerHTML='<header><span class="hoverAvatar"></span><div><small data-kind></small><strong data-name></strong></div><span class="hoverLevel"></span></header><div class="hoverFacts"><span data-level></span><span data-status></span></div><p data-description></p><footer>HomeLab &middot; GuedesSEC</footer>';document.body.append(card);
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let timer=null,lastEvent=null,active=null;
  function hide(){card.hidden=true;active=null;}
  function inspect(){
    timer=null;const event=lastEvent;if(!event||!isEnabled()){hide();return;}
    const rect=canvas.getBoundingClientRect();pointer.set((event.x-rect.left)/rect.width*2-1,-(event.y-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,getCamera());
    const characters=getCharacters().filter(c=>c.root.visible),hits=ray.intersectObjects(characters.map(c=>c.root),true);
    const hit=hits.find(h=>{for(let n=h.object;n;n=n.parent)if(!n.visible)return false;return !h.object.isSprite;});
    if(!hit){hide();return;}
    const blocker=ray.intersectObjects(getBlockers(),true).find(h=>{for(let n=h.object;n;n=n.parent)if(!n.visible)return false;return true;});
    if(blocker&&blocker.distance<hit.distance-.02){hide();return;}
    const character=characters.find(c=>{for(let n=hit.object;n;n=n.parent)if(n===c.root)return true;return false;});if(!character){hide();return;}
    active=character.root;
    card.querySelector('[data-name]').textContent=character.name;card.querySelector('[data-kind]').textContent=character.kind;
    card.querySelector('.hoverAvatar').textContent=character.name.trim().slice(0,2).toLocaleUpperCase('pt-BR');
    card.querySelector('.hoverLevel').textContent=character.npc?'NPC':'1';
    card.querySelector('[data-level]').textContent=character.npc?'Equipe do laboratorio':'Nivel 1 ? Iniciante';
    card.querySelector('[data-status]').textContent=character.online?'? Online':character.npc?'? Personagem virtual':'Perfil local';
    card.querySelector('[data-description]').textContent=character.description||'Clique no personagem para ver as opcoes.';
    card.hidden=false;const size=card.getBoundingClientRect();card.style.left=Math.max(8,Math.min(event.x+18,innerWidth-size.width-8))+'px';card.style.top=Math.max(8,Math.min(event.y+18,innerHeight-size.height-8))+'px';
  }
  function move(event){if(event.pointerType==='touch'||event.buttons){hide();return;}lastEvent={x:event.clientX,y:event.clientY};if(timer===null)timer=setTimeout(inspect,90);}
  canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerleave',hide);canvas.addEventListener('pointerdown',hide);globalThis.addEventListener('blur',hide);
  return {hide,dispose(){clearTimeout(timer);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerleave',hide);canvas.removeEventListener('pointerdown',hide);globalThis.removeEventListener('blur',hide);card.remove();}};
}
