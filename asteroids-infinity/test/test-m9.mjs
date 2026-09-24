import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {frameDelta,BACKGROUND_GAP_SECONDS} from '../public/src/frame-delta.js';
import {recordRandom,replayRandom} from '../public/src/rng-tape.js';
import {createSimulation,step} from '../public/src/core.js';
import {spawnWave} from '../public/src/asteroids.js';
import {particle,updateParticle} from '../public/src/particles.js';
import {createSaucer,stepSaucer} from '../public/src/saucers.js';

// Seeded JS RNG is a controlled diagnostic; it is NOT Python's random module.
function seeded(seed=19){let x=seed>>>0;const raw=()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);
  return {random:raw,randint(a,b){return a+Math.floor(raw()*(b-a+1));},uniform(a,b){return a+(b-a)*raw();}};
}
function view(s){return {ticks:s.ticks,mode:s.mode,score:s.score,lives:s.lives,
  ship:s.ship&&{pos:s.ship.pos,speed:s.ship.speed,angle:s.ship.angle},
  camera:s.camera, asteroids:s.asteroids.map(a=>[a.pos,a.speed,a.angle,a.size]),
  saucers:s.saucers.map(a=>[a.pos,a.speed,a.radius,a.proto]),
  bullets:s.bullets.map(a=>[a.pos,a.lifetime]),
  particles:s.particles.map(a=>[a.kind,a.pos,a.speed,a.alive])};}
function replayScenario(rng){
  const s=createSimulation({rng,gameplay:true});spawnWave(s,1,rng);
  for(let i=0;i<180;i++)step(s,{up:i<60, left:i>40&&i<80,shoot:i%9===0, shield:i>115&&i<150},[.01,.016,.02,.0125][i%4]);
  return view(s);
}
test('M9: variable dt passes through without a fixed 10 ms accumulator',()=>{
  for(const value of [1/50,1/60,1/100,1/200,.012345])assert.equal(frameDelta(value),value);
  assert.equal(frameDelta(BACKGROUND_GAP_SECONDS),BACKGROUND_GAP_SECONDS);
});
test('M9: discard invalid/background gaps; one step per non-skipped foreground frame',()=>{
  for(const value of [0,-.01,NaN,Infinity,.25001,2])assert.equal(frameDelta(value),null);
  let s=createSimulation({position:[350,100]});
  const clock=[.016,.019,.31,.012];
  for(const dt of clock){const value=frameDelta(dt);if(value!==null)step(s,{up:true},value);}
  assert.equal(s.ticks,3);
  assert.ok(Math.abs(s.ship.speed[1]-(800/3)*(.016+.019+.012))<1e-10);
});
test('M9: camera drifts without ship as in upstream unconditionally executed main loop',()=>{
  const s=createSimulation({viewpoint:[30,30],viewpointSpeed:[100,-50]});
  s.ship=null;step(s,{},.02);
  assert.deepEqual(s.camera.pos,[32,29]);
  assert.deepEqual(s.camera.speed,[100,-50]);
});
test('M9: camera drifts on the respawn frame without double integration',()=>{
  const s=createSimulation({viewpoint:[30,30],viewpointSpeed:[100,50]});
  s.justRespawned=true;step(s,{},.02);
  assert.deepEqual(s.camera.pos,[32,31]);
});
test('M9: record/replay checks entire RNG call signature and all resulting game state',()=>{
  const record=recordRandom(seeded(19));const one=replayScenario(record.rng);
  const tape=JSON.parse(JSON.stringify(record.tape));
  assert.ok(tape.length>100,'Expected game + particle RNG draws');
  assert.ok(new Set(tape.map(x=>x.type)).size===3);
  const replay=replayRandom(tape);const two=replayScenario(replay.rng);
  replay.assertConsumed();assert.equal(replay.remaining,0);assert.deepEqual(two,one);
});
test('M9: reject altered randint bounds and reordered random calls',()=>{
  const record=recordRandom(seeded(19));record.rng.randint(0,50);record.rng.uniform(0,Math.PI);
  const replay=replayRandom(record.tape);
  assert.throws(()=>replay.rng.randint(0,51),/mismatch/);
  assert.equal(replay.rng.randint(0,50),record.tape[0].result);
  assert.throws(()=>replay.rng.random(),/mismatch/);
  assert.equal(replay.rng.uniform(0,Math.PI),record.tape[1].result);
  replay.assertConsumed();
});
test('M9: detect truncated trace, unused draws and corrupted outputs',()=>{
  const record=recordRandom(seeded());record.rng.random();record.rng.random();
  const replay=replayRandom(record.tape);replay.rng.random();
  assert.throws(()=>replay.assertConsumed(),/Unused RNG draws/);
  replay.rng.random();replay.assertConsumed();
  assert.throws(()=>replay.rng.random(),/mismatch/);
  assert.throws(()=>replayRandom([{type:'random',args:[],result:NaN}]).rng.random(),/mismatch/);
});
test('M9: particle decay consumes exactly one RNG draw per update, including fatal update',()=>{
  const rng=recordRandom({random:()=>.99,randint:()=>1,uniform:()=>0});
  const s=createSimulation({gameplay:true,rng:rng.rng});
  particle(s,[100,100],[20,10]);let p=s.particles[0];
  updateParticle(s,p,.01);assert.equal(p.alive,false);assert.equal(rng.count,1);
  assert.deepEqual(p.pos,[100.2,100.1]);
  updateParticle(s,p,.02);assert.equal(rng.count,1);
});
test('M9: saucer growth uses historical 7**dt at 50,100,200 FPS',()=>{
  const ref=readFileSync(new URL('../reference/AsteroidsInfinity-1.2.py',import.meta.url),'utf8');
  assert.match(ref,/self\.radius \*= 7\*\*\(1 \/ fps\)/);
  assert.match(ref,/if random\.random\(\) > 0\.35\*\*\(1\/fps\)/);
  for(const hz of [50,100,200]){
    const s=createSimulation({gameplay:true,rng:{random:()=>0,uniform:()=>0,randint:()=>40}});
    const saucer=createSaucer(s,'big',[350,270]);
    stepSaucer(s,saucer,1/hz);
    assert.ok(Math.abs(saucer.radius-0.5*Math.pow(7,1/hz))<1e-12);
    assert.equal(saucer.proto,true);
    assert.equal(s.bullets.length,0);
  }
});
test('M9: particle survival threshold is frame-dependent and retains source strict >',()=>{
  for(const hz of [50,100,200]){
    const threshold=Math.pow(.35,1/hz);
    const state=createSimulation({gameplay:true,rng:{random:()=>threshold,uniform:()=>0,randint:()=>0}});
    particle(state,[100,100],[0,0]);updateParticle(state,state.particles[0],1/hz);
    assert.equal(state.particles[0].alive,true);
    state.rng.random=()=>Math.min(1,threshold+1e-4);
    updateParticle(state,state.particles[0],1/hz);
    assert.equal(state.particles[0].alive,false);
  }
});
