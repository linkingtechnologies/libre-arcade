import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSimulation,step,screenCoordinates} from '../public/src/core.js';
import {browserRandom,createAsteroid} from '../public/src/asteroids.js';
import {makeShot,collisions} from '../public/src/combat.js';
import {createSaucer} from '../public/src/saucers.js';
import {particle,stick,explosion,exhaust,shipDebris,saucerDebris,bulletDebris,updateParticle,advanceParticles,particleScreenPosition} from '../public/src/particles.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
const state=(val=.25)=>createSimulation({gameplay:true,rng:browserRandom(()=>val)});
function addRock(s,pos=[80,80],size=1){const a=createAsteroid(pos,[0,0],size,s.rng);s.asteroids.push(a);s.collidables.push(a);return a;}
function addBullet(s,pos,creator=s.ship){const b=makeShot(s.ship);b.creator=creator;b.pos=[...pos];s.bullets.push(b);s.collidables.push(b);return b;}
test('Particle and Stick constructors use original position/speed copies and spin draw only for Stick',()=>{
  let calls=[];const s=state();s.rng={uniform:(a,b)=>{calls.push([a,b]);return .7;},random:()=>0};
  const pos=[10,20],vel=[30,40],p=particle(s,pos,vel),t=stick(s,pos,vel,7);
  pos[0]=999;vel[0]=999;assert.deepEqual(p.pos,[10,20]);assert.deepEqual(t.speed,[30,40]);
  assert.equal(p.spin,0);assert.equal(t.spin,.7);assert.deepEqual(calls,[[-2*Math.PI,2*Math.PI]]);
  assert.equal(s.particles.length,2);
});
test('explosion creates N particles with source order angle/speed and inherited vector; addedSpeed 100 for bullets',()=>{
  const s=state(.25);explosion(s,[3,4],[5,6],3,100);
  assert.equal(s.particles.length,3);
  for(const p of s.particles){assert.deepEqual(p.pos,[3,4]);close(p.speed[0],30);close(p.speed[1],6);}
});
test('exhaust source polar coordinate, negative forward radius, velocity and angular jitter',()=>{
  const s=state(.5);s.ship.pos=[350,270];s.ship.speed=[5,7];s.ship.angle=0;
  exhaust(s,s.ship,0,[0,-5]);assert.equal(s.particles.length,1);
  assert.deepEqual(s.particles[0].pos,[350,265]);close(s.particles[0].speed[0],5);close(s.particles[0].speed[1],-143);
});
test('source ship impact: seven sticks BEFORE 25 particles, sticks consume third spin uniform draw',()=>{
  let calls=[];const s=state();s.rng={uniform:(a,b)=>{calls.push([a,b]);return a;},random:()=>0};
  shipDebris(s,s.ship);assert.equal(s.particles.length,32);
  assert.deepEqual(s.particles.slice(0,7).map(p=>p.kind),Array(7).fill('stick'));
  assert.deepEqual(s.particles.slice(7).map(p=>p.kind),Array(25).fill('particle'));
  assert.equal(calls.length,71);assert.deepEqual(calls.slice(0,3),[[0,2*Math.PI],[0,200],[-2*Math.PI,2*Math.PI]]);
});
test('saucer destruction: explosion 25 FIRST, ten sticks with radius/2 and spin',()=>{
  const s=state();const saucer={pos:[40,50],speed:[1,2],radius:15};saucerDebris(s,saucer);
  assert.equal(s.particles.length,35);assert.deepEqual(s.particles.slice(0,25).map(p=>p.kind),Array(25).fill('particle'));
  assert.ok(s.particles.slice(25).every(p=>p.kind==='stick'&&p.radius===7.5));
});
test('bullet destruction uses average projectile/victim velocity, 25 particles, added speed 100',()=>{
  const s=state(.5);bulletDebris(s,{pos:[2,3],speed:[50,100]},{speed:[10,20]});
  assert.equal(s.particles.length,25);close(s.particles[0].speed[0],30);close(s.particles[0].speed[1],10);
});
test('source per-frame decay: threshold is strict > for Particle 0.35 and Stick 0.50',()=>{
  const s=state();let r=.35;s.rng={random:()=>r,uniform:(a,b)=>a};const p=particle(s,[699,539],[20,20]);
  updateParticle(s,p,1);assert.equal(p.alive,true);assert.deepEqual(p.pos,[19,19]);
  r=.350001;updateParticle(s,p,1);assert.equal(p.alive,false);assert.deepEqual(p.pos,[39,39],'Obj.update runs after kill');
  r=.5;const q=stick(s,[40,50],[0,0],4);updateParticle(s,q,1);assert.equal(q.alive,true);
  r=.500001;updateParticle(s,q,1);assert.equal(q.alive,false);
});
test('particle decay consumes one random draw each per frame and removes dead sprites',()=>{
  const s=state();let calls=0;s.rng={random:()=>{calls++;return calls===2?1:0;}};
  particle(s,[2,3],[1,0]);particle(s,[4,5],[0,1]);advanceParticles(s,1);
  assert.equal(calls,2);assert.equal(s.particles.length,1);assert.deepEqual(s.particles[0].pos,[3,3]);
});
test('single axis wrap uses strict > and only one subtraction; screen position uses historic extended viewport',()=>{
  const s=state();const p=particle(s,[700,540],[0,0]);updateParticle(s,p,.01);
  assert.deepEqual(p.pos,[700,540]);p.speed=[150000,0];updateParticle(s,p,.01);assert.equal(p.pos[0],1500);
  assert.deepEqual(particleScreenPosition({pos:[699,539]},[30,30]),screenCoordinates([699,539],[30,30]));
});
test('ship control RNG checks ordered left right down up and source exhaust is present on same tick',()=>{
  const s=state();addRock(s,[600,450]);s.rng={random:()=>0,uniform:(a,b)=>a,randint:a=>a};
  step(s,{left:true,right:true,down:true,up:true},.01);
  assert.equal(s.particles.filter(p=>p.kind==='particle').length,5);
  close(s.ship.spin,0);
});
test('asteroid impact has 50 particles plus 25 bullet-impact particles; score and splitting still work',()=>{
  const s=state(.25);s.ship.pos=[400,400];const rock=addRock(s,[80,80],3),b=addBullet(s,rock.pos);
  collisions(s);assert.equal(rock.alive,false);assert.equal(b.alive,false);
  assert.equal(s.particles.length,75);assert.ok(s.particles.every(p=>p.kind==='particle'));
  assert.equal(s.asteroids.length,2);assert.equal(s.score,25);
});
test('ship impact produces 7 sticks and 25 particles, saucer impact produces 10 sticks and 25 particles',()=>{
  const s=state(.25);addRock(s,[500,450]);s.ship.pos=[80,80];s.ship.collisionType='Explosive';s.ship.startShield=0;
  addBullet(s,[80,80],{kind:'saucer'});collisions(s);
  assert.equal(s.ship,null);assert.equal(s.particles.filter(p=>p.kind==='stick').length,7);
  assert.equal(s.particles.length,57,'ship 32 + bullet impact 25');
  const t=state(.25);t.ship.pos=[500,450];addRock(t,[400,400]);const enemy=createSaucer(t,'big',[80,80]);enemy.proto=false;enemy.radius=15;t.collidables.push(enemy);
  addBullet(t,[80,80]);collisions(t);assert.equal(enemy.alive,false);
  assert.equal(t.particles.filter(p=>p.kind==='stick').length,10);assert.equal(t.particles.length,60);
});
test('flight-only oracle stays devoid of gameplay particle effects',()=>{
  const s=createSimulation();for(let i=0;i<200;i++)step(s,{up:true,left:true},.01);
  assert.deepEqual(s.particles,[]);
});
test('active saucer and particle RNG update follows Objects insertion order; proto follows Objects',()=>{
  for(const first of ['particle','saucer']){
    const s=state(.25);s.wave=1;addRock(s,[600,500]);
    if(first==='particle')particle(s,[20,20],[0,0]);
    const saucer=createSaucer(s,'big',[400,400]);saucer.proto=false;saucer.radius=15;
    saucer.objectOrder=++s.objectSerial;s.collidables.push(saucer);
    if(first==='saucer')particle(s,[20,20],[0,0]);
    const calls=[];s.rng={random:()=>{calls.push('random');return 0;},uniform:(a,b)=>a,randint:(a,b)=>a};
    // Record the object processing order by providing per-object callbacks.
    const originalParticle=s.particles[0];
    Object.defineProperty(originalParticle,'speed',{get(){calls.push('particle-move');return [0,0];}});
    Object.defineProperty(saucer,'speed',{get(){calls.push('saucer-move');return [0,0];},set(){} });
    step(s,{},.01);
    const moves=calls.filter(x=>x.endsWith('-move'));
    assert.equal(moves[0],first==='particle'?'particle-move':'saucer-move');
  }
});
test('wave reset subtracts camera velocity from existing particle velocities as source Objects loop',()=>{
  const s=state(.25);s.wave=1;s.camera.speed=[12,-7];
  const p=particle(s,[200,100],[30,40]);
  step(s,{},.01);
  assert.deepEqual(p.speed,[18,47]);
});
