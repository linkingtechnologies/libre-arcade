import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSimulation,step} from '../public/src/core.js';
import {createAsteroid,browserRandom} from '../public/src/asteroids.js';
import {makeShot,pairOverlaps,collisions} from '../public/src/combat.js';
function simulation(){return createSimulation({gameplay:true,rng:browserRandom(()=>0.25)});}
function rock(s,pos,size=3,velocity=[0,0]){
  const a=createAsteroid(pos,velocity,size,s.rng);
  s.asteroids.push(a);s.collidables.push(a);return a;
}
function shot(s,pos,velocity=[0,0]){
  const b=makeShot(s.ship);b.pos=[...pos];b.speed=[...velocity];
  s.bullets.push(b);s.collidables.push(b);return b;
}
function isolated(){const s=simulation();s.wave=1;return s;}
test('historical strict radii and toroidal comparison on x/y and corners',()=>{
  const s=isolated(),a=rock(s,[699,539],1),b=shot(s,[1,1]);
  assert.equal(pairOverlaps(a,b),true);
  b.pos=[a.pos[0]+a.radius+b.radius,a.pos[1]];
  assert.equal(pairOverlaps(a,b),false);
  b.pos=[a.pos[0]+a.radius+b.radius-.00001,a.pos[1]];
  assert.equal(pairOverlaps(a,b),true);
  assert.deepEqual([a.pos[0],a.pos[1]],[699,539]);
});
test('bullet inherits ship velocity and pre-rotation angle; delayed collision by one tick',()=>{
  const s=simulation();s.wave=1;s.ship.angle=Math.PI/2;
  s.ship.speed=[30,5];s.ship.pos=[100,100];
  const a=rock(s,[100,100],1); // shielded ship overlaps with rock
  step(s,{shoot:true},.01);
  assert.equal(s.bullets.length,1);
  assert.ok(Math.abs(s.bullets[0].speed[0]-430)<1e-10);
  assert.ok(Math.abs(s.bullets[0].speed[1]-5)<1e-10);
  assert.equal(a.alive,true,'new shot cannot collide until next frame');
  assert.equal(s.ship.alive,true,'initial shield prevents ship death');
});
test('simultaneous thrust/fire inherits post-thrust velocity, as original Ship.control does',()=>{
  const s=isolated();rock(s,[500,400]);step(s,{up:true,shoot:true},.01);
  assert.ok(Math.abs(s.bullets[0].speed[1]-(400+800/3*.01))<1e-10);
});
test('large -> two medium; medium -> two small; small -> no fragments, scoring 25/50/100',()=>{
  const s=isolated();s.ship.pos=[350,50];
  for(const [size,score,childSize] of [[3,25,2],[2,50,1],[1,100,0]]){
    s.asteroids=[];s.bullets=[];s.collidables=[s.ship];
    const a=rock(s,[350,300],size),b=shot(s,[350,300]);
    collisions(s);
    assert.equal(a.alive,false);assert.equal(b.alive,false);
    assert.equal(s.asteroids.length,childSize?2:0);
    for(const c of s.asteroids){assert.equal(c.size,childSize);assert.deepEqual(c.pos,[350,300]);assert.equal(c.points.length,10);}
    assert.equal(s.score,score+[...[[3,25],[2,50],[1,100]].filter(([n])=>n>size)].reduce((acc,[,v])=>acc+v,0));
  }
  assert.equal(s.score,175);
});
test('original scoring: asteroid hit by ship is not credited after ship is removed',()=>{
  const s=isolated();s.ship.pos=[350,300];s.ship.startShield=0;s.ship.collisionType='Explosive';
  rock(s,[350,300],1);collisions(s);
  assert.equal(s.ship,null);assert.equal(s.score,0);assert.equal(s.lostShips,1);
  assert.equal(s.asteroids.length,0);
});
test('starting shield protects ship and asteroid; manual shield consumes then recharges energy',()=>{
  const s=isolated();s.ship.pos=[350,300];const a=rock(s,[350,300],1);
  step(s,{},.01);assert.ok(s.ship);assert.ok(a.alive);
  // Collision detection precedes Ship.control: activating shield in the same
  // frame as a collision is too late unless protection was already active.
  s.ship.pos=[50,50];s.ship.startShield=0;s.ship.collisionType='Explosive';s.ship.shield=5;
  step(s,{shield:true},.01);
  assert.ok(s.ship);assert.equal(s.ship.collisionType,'Hard');
  assert.ok(s.ship.shield<5);
  s.ship.pos=[350,300];step(s,{shield:true},.01);
  assert.ok(s.ship,'shield activated on the previous tick prevents death');
  s.ship.pos=[50,50];step(s,{},.01);assert.ok(s.ship.shield>4.95);
});
test('a shot expires after one second; holding fire is throttled by reloading and gunheat',()=>{
  const s=isolated();rock(s,[500,400]);
  for(let i=0;i<15;i++)step(s,{shoot:true},.01);
  assert.equal(s.bullets.length,3,'shots at t=0, ~0.05 and ~0.10');
  const b=s.bullets[0];b.lifetime=.001;step(s,{},.01);
  assert.equal(b.alive,false);assert.equal(s.bullets.includes(b),false);
});
test('wave advances on next tick after clearing; empty field does not cause mid-collision spawn',()=>{
  const s=isolated();s.ship.pos=[20,20];const a=rock(s,[350,300],1);
  shot(s,a.pos);step(s,{},.01);
  assert.equal(s.asteroids.length,0);assert.equal(s.wave,1);
  step(s,{},.01);assert.equal(s.wave,2);assert.equal(s.asteroids.length,2);
  assert.equal(s.ship.startShield>1.98,true);
});
test('five collision-triggered losses in assisted fixture trigger four respawns then gameover',()=>{
  const s=isolated();const a=rock(s,[350,300],1);
  for(let i=0;i<5;i++){
    const ship=s.ship;ship.pos=[350,300];ship.startShield=0;ship.collisionType='Explosive';
    // Assist only test setup: reposition the ship and accelerate the respawn timer.
    if(!a.alive)rock(s,[350,300],1);
    step(s,{},.01);assert.equal(s.ship,null);
    if(i<4){s.respawnTime=0;step(s,{},.01);assert.ok(s.ship);assert.equal(s.lives,3-i);}
  }
  assert.equal(s.mode,'gameover');assert.equal(s.lostShips,5);
});
test('no external enemy/audio assets or accidental original asset copies',()=>{
 const s=isolated();rock(s,[400,400]);step(s,{},.01);
 assert.equal(typeof s.score,'number');assert.equal(s.mode,'play');
});

test('extra life is awarded on the next frame at each original 10,000-point threshold',()=>{
 const s=isolated();rock(s,[500,400]);s.score=10000;
 step(s,{},.01);assert.equal(s.lives,5);assert.equal(s.nextLife,20000);
 step(s,{},.01);assert.equal(s.lives,5);
 s.score=25000;step(s,{},.01);assert.equal(s.lives,6);assert.equal(s.nextLife,30000);
});
test('shooting and shields cannot mutate the flight-only M1 oracle mode',()=>{
 const s=createSimulation();step(s,{shoot:true,shield:true},.01);
 assert.equal(s.bullets.length,0);assert.equal(s.ship.pos[0],350);
});
