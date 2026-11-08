import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFrameClock} from '../frontend/js/frame-clock.mjs';

test('desktop aproveita todos os quadros em 60, 144 e 165 Hz e mantém a mesma velocidade',()=>{
  for(const refresh of [60,144,165]){
    const clock=createFrameClock();clock.reset(0);let distance=0;
    for(let frame=1;frame<=refresh;frame++){
      const dt=clock.next(frame*1000/refresh);
      assert.notEqual(dt,null);assert.ok(Math.abs(dt-1/refresh)<1e-9);
      distance+=dt*2.3;
    }
    assert.ok(Math.abs(distance-2.3)<1e-9);
  }
});

test('celular mantém 30 FPS e não duplica quadros ao aceitar um timestamp levemente adiantado',()=>{
  const clock=createFrameClock({maxFps:30});clock.reset(0);
  assert.equal(clock.next(16.6),null);assert.ok(clock.next(33.1)>0);
  assert.equal(clock.next(49.9),null);assert.ok(clock.next(66.6)>0);
  const regular=createFrameClock({maxFps:30});regular.reset(0);let count=0,total=0;
  for(let frame=1;frame<=120;frame++){
    const dt=regular.next(frame*1000/120);if(dt!==null){count++;total+=dt;}
  }
  assert.equal(count,30);assert.ok(Math.abs(total-1)<1e-9);
});

test('pausar ou perder um quadro não produz um salto grande na movimentação',()=>{
  const clock=createFrameClock();clock.reset(0);assert.equal(clock.next(500),.05);
  clock.reset(5000);assert.ok(Math.abs(clock.next(5010)-.01)<1e-9);
});
