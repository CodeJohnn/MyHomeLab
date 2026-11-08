export const characterReactions=Object.freeze({
  laugh:Object.freeze({label:'Risos',message:'😂',emoji:'😂',image:'../assets/emoticos/emoticos/risos.png',audio:'../assets/emoticos/audio emoticos/risos.mp3'}),
  anger:Object.freeze({label:'Raiva',message:'😡',emoji:'😡',image:null,audio:'../assets/emoticos/audio emoticos/raiva.mp3'}),
  facepalm:Object.freeze({label:'Ai, ai…',message:'[emote:facepalm]',emoji:'🤦',image:'../assets/emoticos/emoticos/aiai.png',audio:null}),
  attractive:Object.freeze({label:'Atraente',message:'[emote:attractive]',emoji:'😎',image:'../assets/emoticos/emoticos/atraente.png',audio:null}),
  kiss:Object.freeze({label:'Beijo',message:'[emote:kiss]',emoji:'😘',image:'../assets/emoticos/emoticos/beijo.png',audio:null}),
  cry:Object.freeze({label:'Choro',message:'[emote:cry]',emoji:'😭',image:'../assets/emoticos/emoticos/choro.png',audio:null}),
  greet:Object.freeze({label:'E aí!',message:'[emote:greet]',emoji:'👋',image:'../assets/emoticos/emoticos/eae.png',audio:null}),
  bye:Object.freeze({label:'Indo nessa',message:'[emote:bye]',emoji:'👋',image:'../assets/emoticos/emoticos/indo nessa.png',audio:null}),
  please:Object.freeze({label:'Por favor',message:'[emote:please]',emoji:'🙏',image:'../assets/emoticos/emoticos/por favor.png',audio:null}),
  suspect:Object.freeze({label:'Suspeito',message:'[emote:suspect]',emoji:'🤨',image:'../assets/emoticos/emoticos/suspeito.png',audio:null})
});

export function reactionFromMessage(message){
  return Object.entries(characterReactions).find(([,reaction])=>reaction.message===message)?.[0]??null;
}
