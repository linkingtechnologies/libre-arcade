import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFrameClock,HISTORICAL_MAX_HZ} from '../public/src/frame-clock.js';
import {createSimulation,step} from '../public/src/core.js';
import {browserRandom,spawnWave} from '../public/src/asteroids.js';
function increments(hz,seconds=2){const c=createFrameClock();let n=0,total=0;for(let k=0;k<=hz*seconds;k++){
  const dt=c.advance(k/hz);if(dt!==null){n++;total+=dt;}}
  return {n,total};}
test('M10 frame scheduler is capped at the original maximum of 100 physical updates/s',()=>{
  assert.equal(HISTORICAL_MAX_HZ,100);
  for(const hz of [50,60,100,120,144,200]){
    const {n,total}=increments(hz);
    assert.ok(n<=200,`${hz} Hz simulated ${n} updates`);
    assert.ok(n>=Math.floor(2*Math.min(50,hz))-1,`${hz} Hz undersampled`);
    assert.ok(total>1.98&&total<=2.001,`${hz} Hz simulated ${total} seconds`);
  }
});
test('M10 measured dt is not quantized to 10 ms or replayed as catch-up steps',()=>{
  const clock=createFrameClock();assert.equal(clock.advance(10),null);
  assert.ok(Math.abs(clock.advance(10+1/60)-1/60)<1e-12);
  assert.equal(clock.advance(10+1/60+1/240),null);
  assert.ok(Math.abs(clock.advance(10+2/60)-1/60)<1e-12);
});
test('M10 skipped background gaps reset the reference time without huge physical step',()=>{
  const clock=createFrameClock();assert.equal(clock.advance(1),null);
  assert.equal(clock.advance(1.8),null);
  assert.ok(Math.abs(clock.advance(1.82)-.02)<1e-10);
  clock.reset();assert.equal(clock.advance(50),null);
  assert.ok(Math.abs(clock.advance(50.02)-.02)<1e-10);
});
test('M10 clock rejects impossible timestamps and invalid parameters',()=>{
  assert.throws(()=>createFrameClock({maxHz:0}),RangeError);
  assert.throws(()=>createFrameClock({maxGap:-1}),RangeError);
  const clock=createFrameClock();assert.equal(clock.advance(NaN),null);
  assert.equal(clock.advance(100),null);
  assert.equal(clock.advance(99),null);
  assert.ok(Math.abs(clock.advance(99.02)-.02)<1e-10);
});
test('M10 variable-time ordinary gameplay: natural game over without forcing a collision, score or lives',()=>{
  let seed=19;const rng=browserRandom(()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;});
  const state=createSimulation({gameplay:true,rng});spawnWave(state,1,rng);
  const clock=createFrameClock();clock.advance(0);
  let updates=0;
  for(let i=1;i<100000 && state.mode!=='gameover';i++){
    const dt=clock.advance(i/60);
    if(dt!==null){step(state,{},dt);updates++;}
  }
  assert.equal(state.mode,'gameover');assert.equal(state.lostShips,5);
  assert.equal(state.lives,0);assert.ok(updates>0&&updates<100000);
});
