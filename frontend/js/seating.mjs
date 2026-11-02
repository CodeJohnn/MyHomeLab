// Altura do topo do assento; o quadril do personagem fica em y=.68.
export function chairPoseProfile(id) {
  const reading=id==='cadeiraLeitura';
  const top=reading?.555:id==='cadeiraSolda'?.64:/^cadeira(?:Admin|Manutencao)/.test(id)?.575:.84;
  return {offset:{x:0,y:top+.085-.68,z:reading?-.025:.025},facing:reading?Math.PI:0};
}

export const seatedLegAngles={hip:-Math.PI/2,knee:Math.PI/2};
