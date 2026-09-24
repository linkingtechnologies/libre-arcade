import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSimulation,step,REFERENCE_DT} from '../public/src/core.js';
import {spawnWave,browserRandom} from '../public/src/asteroids.js';
import {loadScores,qualifies} from '../public/src/storage.js';
function ordinaryRun(seed){let s=seed>>>0;const rand=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
  const rng=browserRandom(rand),state=createSimulation({gameplay:true,rng});spawnWave(state,1,rng);
  let ticks=0;for(;ticks<120000&&state.mode!=='gameover';ticks++)step(state,{},REFERENCE_DT);
  return {ticks,mode:state.mode,lostShips:state.lostShips,lives:state.lives,score:state.score,wave:state.wave};}
test('M7 ordinary no-input game session reaches game over without forced collisions/teleports',()=>{
  const result=ordinaryRun(19);assert.equal(result.mode,'gameover');assert.equal(result.lostShips,5);assert.equal(result.lives,0);
  assert.equal(result.ticks,42510);assert.equal(result.score,300);assert.equal(result.wave,1);
  assert.equal(qualifies(loadScores(null),result.score),false);
});
test('M7 seeded browser-engine ordinary replay reproduces game-over state',()=>assert.deepEqual(ordinaryRun(19),ordinaryRun(19)));
