const BALL_RADIUS = 0.047;
const TABLE_BOUNDS = { x: 1.08, z: 0.48 };
const POCKETS = [
  [-1.12, -0.52], [0, -0.52], [1.12, -0.52],
  [-1.12, 0.52], [0, 0.52], [1.12, 0.52]
];

export function createBilliardsState() {
  const balls = [{ id: 0, x: -0.7, z: 0, vx: 0, vz: 0, alive: true }];
  const rack=[[1,0,0],[2,1,-.5],[3,1,.5],[4,2,-1],[8,2,0],[5,2,1],[6,3,-1.5],[7,3,-.5],[9,3,.5],[10,3,1.5],[11,4,-2],[12,4,-1],[13,4,0],[14,4,1],[15,4,2]];
  for (const [id,row,offset] of rack)balls.push({id,x:.23+row*BALL_RADIUS*2.05,z:offset*BALL_RADIUS*2.05,vx:0,vz:0,alive:true});
  return {
    players: [null, null],
    groups: [null, null],
    turn: 0,
    balls,
    moving: false,
    winner: null,
    message: 'Entre na mesa para iniciar uma partida.',
    revision: 0,
    lastShotBy: null,
    shotPotted: [],
    scratch: false,
    contacted: false
  };
}

export function joinBilliards(state, player) {
  const existing = state.players.findIndex(entry => entry?.id === player.id);
  if (existing >= 0) {
    state.players[existing] = { id: player.id, name: player.name };
    state.message = state.players.length < 2 || state.players.some(entry => !entry)
      ? 'Aguardando outro jogador.'
      : `Vez de ${state.players[state.turn].name}.`;
    state.revision++;
    return true;
  }
  const slot = state.players.findIndex(entry => !entry);
  if (slot < 0 || state.winner) return false;
  state.players[slot] = { id: player.id, name: player.name };
  if(slot===0)state.turn=0;
  state.message = state.players.every(Boolean)
    ? `Partida iniciada. Vez de ${state.players[state.turn].name}.`
    : `${player.name} entrou. Aguardando outro jogador.`;
  state.revision++;
  return true;
}

export function shootBilliards(state, playerId, angle, power) {
  if (!state.players.every(Boolean) || state.winner || state.moving
    || state.players[state.turn]?.id !== playerId
    || !Number.isFinite(angle) || Math.abs(angle) > Math.PI
    || !Number.isFinite(power) || power < 0.12 || power > 1) return false;
  const cueBall = state.balls[0];
  if (!cueBall?.alive) return false;
  cueBall.vx = Math.cos(angle) * power * 4.4;
  cueBall.vz = Math.sin(angle) * power * 4.4;
  state.moving = true;
  state.lastShotBy = playerId;
  state.shotPotted = [];
  state.scratch = false;
  state.contacted = false;
  state.message = 'Tacada em andamento…';
  state.revision++;
  return true;
}

export function leaveBilliards(state, playerId) {
  const slot = state.players.findIndex(player => player?.id === playerId);
  if (slot < 0) return false;
  state.players[slot] = null;
  state.moving=false;
  for(const ball of state.balls){ball.vx=0;ball.vz=0;}
  if(!state.balls[0].alive){state.balls[0].alive=true;state.balls[0].x=-.7;state.balls[0].z=0;}
  if (state.players.some(Boolean)) {
    state.turn = state.players.findIndex(Boolean);
    state.message = 'Aguardando outro jogador. O segundo lugar esta livre.';
  } else {
    const next=createBilliardsState();
    Object.assign(state,next,{revision:state.revision+1});
    return true;
  }
  state.revision++;
  return true;
}

export function resetBilliards(state, playerId) {
  if (!state.players.some(player => player?.id === playerId)) return false;
  const next = createBilliardsState();
  Object.assign(state, next, { players: state.players, revision: state.revision + 1 });
  state.message = state.players.every(Boolean)
    ? `Nova partida. Vez de ${state.players[state.turn].name}.`
    : 'Aguardando outro jogador.';
  return true;
}

export function stepBilliards(state, elapsed = 0.05) {
  if (!state.moving || !Number.isFinite(elapsed) || elapsed <= 0) return false;
  const stepCount = Math.max(1, Math.ceil(elapsed / (1 / 120)));
  const dt = Math.min(elapsed / stepCount, 1 / 120);
  for (let step = 0; step < stepCount; step++) {
    for (const ball of state.balls) {
      if (!ball.alive) continue;
      ball.x += ball.vx * dt;
      ball.z += ball.vz * dt;
      if (POCKETS.some(([x, z]) => Math.hypot(ball.x - x, ball.z - z) < 0.13)) {
        ball.alive = false;
        ball.vx = 0;
        ball.vz = 0;
        if (ball.id === 0) state.scratch = true;
        else state.shotPotted.push(ball.id);
        continue;
      }
      if (ball.x < -TABLE_BOUNDS.x || ball.x > TABLE_BOUNDS.x) {
        ball.x = Math.max(-TABLE_BOUNDS.x, Math.min(TABLE_BOUNDS.x, ball.x));
        ball.vx *= -0.88;
      }
      if (ball.z < -TABLE_BOUNDS.z || ball.z > TABLE_BOUNDS.z) {
        ball.z = Math.max(-TABLE_BOUNDS.z, Math.min(TABLE_BOUNDS.z, ball.z));
        ball.vz *= -0.88;
      }
    }
    for (let i = 0; i < state.balls.length; i++) {
      const first = state.balls[i];
      if (!first.alive) continue;
      for (let j = i + 1; j < state.balls.length; j++) {
        const second = state.balls[j];
        if (!second.alive) continue;
        const dx = second.x - first.x, dz = second.z - first.z;
        const distance = Math.hypot(dx, dz), diameter = BALL_RADIUS * 2;
        if (distance >= diameter) continue;
        const nx = distance > 1e-8 ? dx / distance : 1, nz = distance > 1e-8 ? dz / distance : 0;
        const overlap = (diameter - distance) / 2;
        first.x -= nx * overlap; first.z -= nz * overlap;
        second.x += nx * overlap; second.z += nz * overlap;
        const relativeSpeed = (first.vx - second.vx) * nx + (first.vz - second.vz) * nz;
        if (relativeSpeed > 0) {
          if(first.id===0||second.id===0)state.contacted=true;
          first.vx -= relativeSpeed * nx;
          first.vz -= relativeSpeed * nz;
          second.vx += relativeSpeed * nx;
          second.vz += relativeSpeed * nz;
        }
      }
    }
    for (const ball of state.balls) {
      if (!ball.alive) continue;
      const friction = Math.exp(-1.35 * dt);
      ball.vx *= friction;
      ball.vz *= friction;
      if (Math.hypot(ball.vx, ball.vz) < 0.025) ball.vx = ball.vz = 0;
    }
  }
  if (!state.balls.some(ball => ball.alive && (ball.vx !== 0 || ball.vz !== 0))) {
    state.moving = false;
    const eightBall = state.balls.find(ball => ball.id === 8);
    if (eightBall && !eightBall.alive) {
      const currentGroup=state.groups[state.turn];
      const ownBallsRemain=state.balls.some(ball=>ball.alive&&(currentGroup==='solids'?ball.id>=1&&ball.id<=7:currentGroup==='stripes'&&ball.id>=9));
      const winnerSlot = !state.scratch&&currentGroup&&!ownBallsRemain ? state.turn : 1 - state.turn;
      state.winner = state.players[winnerSlot]?.id || null;
      state.message = state.winner
        ? `${state.players[winnerSlot].name} venceu a partida!`
        : 'Partida encerrada.';
    } else {
      if(!state.groups[state.turn]){
        const firstPotted=state.shotPotted.find(id=>id!==8);
        if(firstPotted){state.groups[state.turn]=firstPotted<8?'solids':'stripes';state.groups[1-state.turn]=firstPotted<8?'stripes':'solids';}
      }
      if (state.scratch||!state.contacted) {
        const cueBall = state.balls[0];
        if(state.scratch){cueBall.x = -0.7; cueBall.z = 0; cueBall.alive = true;}
        state.turn = 1 - state.turn;
        state.message = `${state.scratch?'Falta.':'Nenhuma bola atingida.'} Vez de ${state.players[state.turn].name}.`;
      } else {
        const currentGroup=state.groups[state.turn];
        const pocketedOwn=state.shotPotted.some(id=>currentGroup==='solids'?id>=1&&id<=7:currentGroup==='stripes'&&id>=9);
        if (!pocketedOwn) state.turn = 1 - state.turn;
        state.message = `Vez de ${state.players[state.turn].name}.`;
      }
    }
    state.revision++;
  }
  return true;
}
