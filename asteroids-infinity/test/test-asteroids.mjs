import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSimulation,step,originalWrap} from '../public/src/core.js';
import {browserRandom,createAsteroid,spawnWave,stepAsteroid,asteroidScreenPosition,ORIGINAL_ASTEROID_SPIN} from '../public/src/asteroids.js';
const fixture=JSON.parse(readFileSync(new URL('./oracle-asteroids-m2.json',import.meta.url)));
function near(a,b,tol=2e-8){assert.ok(Math.abs(a-b)<=tol,`${a} != ${b} (tolerance ${tol})`);}
function eqArray(a,b,tol=2e-8){assert.equal(a.length,b.length);a.forEach((n,i)=>Array.isArray(n)?eqArray(n,b[i],tol):near(n,b[i],tol));}
function match(a,b){
  assert.equal(a.size,b.size);near(a.radius,b.radius);near(a.spin,b.spin);
  near(a.angle,b.angle);eqArray(a.pos,b.pos);eqArray(a.speed,b.speed);eqArray(a.points,b.points);
}
function taped(calls){
  let index=0;
  const read=(kind,a,b)=>{
    const c=calls[index++];
    assert.ok(c,`Missing RNG draw ${index}`);assert.equal(c.kind,kind);near(a,c.a);near(b,c.b);
    return c.value;
  };
  return {rng:{randint:(a,b)=>read('randint',a,b),uniform:(a,b)=>read('uniform',a,b)},
          done:()=>assert.equal(index,calls.length,'RNG draw count and order')};
}
test('original-source Asteroid.__init__: seeded draw tape, 3 first-class rock shapes',()=>{
  const {rng,done}=taped(fixture.calls),state=createSimulation();
  spawnWave(state,fixture.level,rng);done();assert.equal(state.wave,3);assert.equal(state.asteroids.length,3);
  for(let i=0;i<3;i++)match(state.asteroids[i],fixture.initial[i]);
});
test('original-source Obj.update: all rocks after 87 historical ticks',()=>{
  const {rng}=taped(fixture.calls),state=createSimulation();
  spawnWave(state,3,rng);
  for(let i=0;i<fixture.ticks;i++)step(state,{},fixture.dt);
  for(let i=0;i<3;i++)match(state.asteroids[i],fixture.after_ticks[i]);
  assert.equal(state.ticks,87);
});
test('first playable wave: one LARGE size-3 asteroid, 10 source-derived vertices',()=>{
  const state=createSimulation(),rng=browserRandom(()=>0);
  spawnWave(state,1,rng);
  assert.equal(state.asteroids.length,1);
  const a=state.asteroids[0];
  assert.deepEqual(a.pos,[0,0]);assert.deepEqual(a.speed,[-100,-100]);
  assert.equal(a.size,3);assert.equal(a.radius,24);near(a.spin,ORIGINAL_ASTEROID_SPIN);
  assert.equal(a.points.length,10);
  for(let i=0;i<10;i++){near(a.points[i][0],i*Math.PI/5);near(a.points[i][1],16.8);}
});
test('browser random inclusive bounds; cannot silently use a balanced-piece bag',()=>{
  let rng=browserRandom(()=>0.999999999999);
  let a=spawnWave(createSimulation(),1,rng).asteroids[0];
  assert.deepEqual(a.pos,[700,540]);assert.deepEqual(a.speed,[100,100]);
  assert.throws(()=>rng.randint(5,4),RangeError);
});
test('degenerate uniform consumes its RNG draw before 20 vertex draws',()=>{
  const calls=[];const rng={uniform(a,b){calls.push([a,b]);return a;}};
  createAsteroid([0,0],[0,0],1,rng);
  assert.equal(calls.length,21);near(calls[0][0],-2*Math.PI);near(calls[0][1],-2*Math.PI);
  assert.throws(()=>createAsteroid([0,0],[0,0],4,rng),RangeError);
});
test('asteroid drift: original SINGLE wrapping, same camera projection as ship',()=>{
  const a={pos:[699,539],speed:[200,200],angle:0,spin:-2*Math.PI};
  stepAsteroid(a,.01);eqArray(a.pos,[1,1]);near(a.angle,-2*Math.PI*.01);
  a.pos=[600,270];a.speed=[150000,0];stepAsteroid(a,.01);eqArray(a.pos,[1400,270]);
  const state=createSimulation({viewpoint:[30,30]});
  const b=createAsteroid([350,270],[0,0],1,browserRandom(()=>0));
  eqArray(asteroidScreenPosition(b,state.camera.pos),[320,240]);
  near(originalWrap(700,0,700),700);
});
test('M2 legacy flight-only oracle stays opt-in free of combat',()=>{
  const s=createSimulation();spawnWave(s,1,browserRandom(()=>0.5));
  const before=s.asteroids.length;
  for(let i=0;i<500;i++)step(s,{up:true},.01);
  assert.equal(s.asteroids.length,before);assert.equal(s.wave,1);
  assert.equal(s.score,0);assert.equal(s.gameplay,false);
});
test('invalid time steps refused for object motion',()=>{
  const a=createAsteroid([0,0],[0,0],1,browserRandom(()=>0));
  assert.throws(()=>stepAsteroid(a,0),RangeError);
});
