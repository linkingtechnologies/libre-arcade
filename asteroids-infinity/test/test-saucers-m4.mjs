import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSimulation,step} from '../public/src/core.js';
import {createAsteroid,browserRandom} from '../public/src/asteroids.js';
import {makeShot,collisions} from '../public/src/combat.js';
import {createSaucer,maybeSpawnSaucer,saucerGeometry,stepSaucer,saucerShot} from '../public/src/saucers.js';
function rngOf(value=.25){return browserRandom(()=>value);}
function state(value=.25){return createSimulation({gameplay:true,rng:rngOf(value)});}
function rock(s,pos=[500,450],size=1){const a=createAsteroid(pos,[0,0],size,s.rng);s.asteroids.push(a);s.collidables.push(a);return a;}
function bullet(s,creator,pos){const b=makeShot(creator);b.pos=[...pos];s.bullets.push(b);s.collidables.push(b);return b;}

test('historical saucer constructors: radius, speed, proto group and three source polygons',()=>{
 const s=state(.25),big=createSaucer(s,'big',[200,300]),small=createSaucer(s,'small',[100,200]);
 assert.equal(big.realRadius,15);assert.equal(small.realRadius,10);
 assert.equal(big.radius,.5);assert.equal(big.proto,true);assert.equal(s.collidables.includes(big),false);
 assert.ok(Math.abs(big.speed[0]-70)<1e-10);assert.ok(Math.abs(big.speed[1])<1e-10); // uniform(0,2π)=π/2, randint(40,160)=70 at .25 -> 70
 assert.deepEqual(saucerGeometry(15).map(p=>p.length),[4,4,4]);
 assert.equal(saucerGeometry(15)[0][0][1],20);
 assert.throws(()=>createSaucer(s,'third',[0,0]),RangeError);
});

test('rare spawn uses randint(0,50), then type then SCREEN-bound coords, one RNG constructor pair',()=>{
 const calls=[],r={random:()=>.5,uniform:(a,b)=>{calls.push(['uniform',a,b]);return a;},randint:(a,b)=>{calls.push(['randint',a,b]);return a;}};
 const s=createSimulation({gameplay:true,rng:r});
 const u=maybeSpawnSaucer(s);
 assert.equal(u.type,'small');assert.deepEqual(u.pos,[0,0]);
 assert.deepEqual(calls.map(x=>x[0]),['randint','randint','randint','randint','uniform','randint']);
 assert.deepEqual(calls.slice(0,4).map(x=>x.slice(1)),[[0,50],[1,3],[0,640],[0,480]]);
 const absent=state(.25);assert.equal(maybeSpawnSaucer(absent),null);assert.equal(absent.saucers.length,0);
});

test('proto saucer grows before entering collisions and cannot hit ship while proto',()=>{
 const s=state(.25),b=createSaucer(s,'big',[350,270]);rock(s);
 s.ship.startShield=0;s.ship.collisionType='Explosive';
 // For a fully deterministic growth test keep the saucer fixed in place.
 b.speed=[0,0];s.rng={random:()=>.5,uniform:(a,b)=>a,randint:(a)=>a};
 for(let i=0;i<175;i++)step(s,{},.01);
 assert.equal(b.proto,true);assert.equal(s.ship.alive,true);
 step(s,{},.01);assert.equal(b.proto,false);assert.equal(b.radius,15);
 assert.equal(s.collidables.includes(b),true);
 assert.equal(s.ship.alive,true,'collision only on next tick after proto becomes collidable');
 step(s,{},.01);assert.equal(s.ship,null);
});

test('saucer steering uses camera velocity and single-axis original wrap',()=>{
 const s=state(.25),b=createSaucer(s,'big',[699,539]);
 s.camera.speed=[31,-12];s.rng={random:()=>1,uniform:(a,b)=>a,randint:(a,b)=>a};
 stepSaucer(s,b,.25);
 assert.deepEqual(b.speed,[31,-12+40]);
 assert.equal(b.pos[0],6.75);assert.equal(b.pos[1],6);
 assert.equal(b.proto,true);
});

test('big saucer random shot inherits saucer velocity and waits a tick before integration',()=>{
 const s=state(.25);rock(s);const b=createSaucer(s,'big',[100,100]);
 b.proto=false;b.radius=15;s.collidables.push(b);b.speed=[12,6];
 // Use a deterministic non-reorientation draw on first call, fire on second.
 let n=0;s.rng={random:()=>++n%2===1?0:1,uniform:(a,b)=>a,randint:(a,b)=>a};
 const original=[...b.pos];step(s,{},.01);
 assert.equal(s.bullets.length,1);
 const shot=s.bullets[0];assert.equal(shot.creator,b);assert.equal(shot.lifetime,1);
 assert.deepEqual(shot.pos,b.pos);
 assert.deepEqual(shot.speed,[12,406]);
 step(s,{},.01);assert.ok(shot.lifetime<1,'shot advances beginning next tick');
 assert.notDeepEqual(b.pos,original);
});

test('small saucer targets ship in screen coordinates with source atan2 x/y; no shortest toroidal aim',()=>{
 const s=state(.25),b=createSaucer(s,'small',[100,100]);rock(s,[300,300]);
 b.radius=10;b.proto=false;s.collidables.push(b);b.speed=[0,0];
 s.ship.pos=[200,100];s.camera.pos=[30,30];
 let n=0;s.rng={random:()=>++n===1?0:1,uniform:(a,b)=>a,randint:(a,b)=>a};
 stepSaucer(s,b,.01);
 assert.equal(s.bullets.length,1);
 assert.ok(Math.abs(s.bullets[0].angle-Math.PI/4)<1e-10,
   'The historic −π/4 accuracy offset applies to the π/2 rightwards bearing');
});

test('small saucer targets first asteroid when ship absent, no spontaneous new target type',()=>{
 const s=state(.25),b=createSaucer(s,'small',[100,100]);rock(s,[100,200]);s.ship=null;
 b.radius=10;b.proto=false;s.collidables.push(b);s.rng={random:()=>1,uniform:(a,b)=>a,randint:(a,b)=>a};
 stepSaucer(s,b,.01);
 assert.equal(s.bullets.length,1);
 assert.ok(Math.abs(s.bullets[0].angle+Math.PI/4)<1e-10);
});

test('own projectiles cannot destroy saucer; enemy/player bullets can; player receives 250/1000',()=>{
 for(const [type,points] of [['big',250],['small',1000]]){
   const s=state(.25);s.ship.pos=[500,500];rock(s);
   const b=createSaucer(s,type,[100,100]);b.proto=false;b.radius=b.realRadius;s.collidables.push(b);
   const self=saucerShot(s,b,0);self.speed=[0,0];collisions(s);
   assert.equal(b.alive,true);assert.equal(self.alive,true,'creator and self projectile ignore each other');
   const player=bullet(s,s.ship,[100,100]);player.speed=[0,0];collisions(s);
   assert.equal(b.alive,false);assert.equal(s.destroyedSaucers,1);assert.equal(s.score,points);
 }
});

test('a shielded ship survives saucer contact while saucer is removed',()=>{
 const s=state(.25);s.ship.pos=[100,100];rock(s);
 const b=createSaucer(s,'big',[100,100]);b.proto=false;b.radius=15;s.collidables.push(b);
 collisions(s);
 assert.equal(s.ship.alive,true);assert.equal(b.alive,false);assert.equal(s.score,250,'shielded ship remains eligible for source raise_score');
});

test('enemy bullet destroys unshielded ship; scoring excludes enemy bullets',()=>{
 const s=state(.25);rock(s);const b=createSaucer(s,'big',[80,80]);
 s.ship.pos=[100,100];s.ship.startShield=0;s.ship.collisionType='Explosive';
 const shot=saucerShot(s,b,0);shot.pos=[100,100];
 collisions(s);assert.equal(s.ship,null);assert.equal(s.score,0);
 assert.equal(s.lostShips,1);
});

test('asteroid destruction actually spawns live proto saucer on rare source roll',()=>{
 let randomInt=0;
 const s=createSimulation({gameplay:true,rng:{random:()=>.5, uniform:(a,b)=>a,randint:(a,b)=>randomInt++===0&&a===0&&b===50?0:a}});
 s.ship.pos=[500,500];rock(s,[100,100]);bullet(s,s.ship,[100,100]);collisions(s);
 assert.equal(s.asteroids.length,0);assert.equal(s.spawnedSaucers,1);assert.equal(s.saucers.length,1);
 assert.equal(s.saucers[0].proto,true);assert.equal(s.collidables.includes(s.saucers[0]),false);
});

test('flight-only M1 oracle mode never generates an enemy',()=>{
 const s=createSimulation();for(let i=0;i<200;i++)step(s,{},.01);
 assert.deepEqual(s.saucers,[]);
});
