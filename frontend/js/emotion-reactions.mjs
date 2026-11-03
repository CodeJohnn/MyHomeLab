export const characterReactions=Object.freeze({
  laugh:Object.freeze({message:'😂',emoji:'😂',audio:'../assets/audio/risos.mp3'}),
  anger:Object.freeze({message:'😡',emoji:'😡',audio:'../assets/audio/raiva.mp3'}),
  sad:Object.freeze({message:'😢',emoji:'😢',motion:'sad'}),
  surprise:Object.freeze({message:'😮',emoji:'😮',motion:'surprise'})
});

export function reactionFromMessage(message){
  return Object.entries(characterReactions).find(([,reaction])=>reaction.message===message)?.[0]??null;
}
