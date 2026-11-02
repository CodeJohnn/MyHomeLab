export const characterReactions=Object.freeze({
  laugh:Object.freeze({message:'😂',emoji:'😂',audio:'../assets/audio/risos.mp3'}),
  anger:Object.freeze({message:'😡',emoji:'😡',audio:'../assets/audio/raiva.mp3'})
});

export function reactionFromMessage(message){
  return Object.entries(characterReactions).find(([,reaction])=>reaction.message===message)?.[0]??null;
}
