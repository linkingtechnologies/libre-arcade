/* Asteroids Infinity M3–M4 — historical radius collision, shot, destruction, saucers.
 * Copyright (C) 2026 Libre Arcade contributors. GPL-3.0-or-later.
 * Source v1.2: collision loop 829–847; Asteroid.collide 294–314;
 * Ship.control 375–398; Ship.collide 409–416; Bullet 568–590.
 * M4 adds saucers; M5 adds source-derived particles (still no audio/high scores).
 */
import {WORLD} from './core.js';
import {createAsteroid,spawnWave} from './asteroids.js';
import {maybeSpawnSaucer,saucerHit} from './saucers.js';
import {explosion,shipDebris,bulletDebris,exhaust} from './particles.js';
export const SHOT_SPEED=400, SHOT_LIFETIME=1;

export function makeShot(ship) {
  return {kind:'bullet',pos:[...ship.pos],speed:[ship.speed[0]+Math.sin(ship.angle)*SHOT_SPEED,
    ship.speed[1]+Math.cos(ship.angle)*SHOT_SPEED],angle:ship.angle,radius:4,
    lifetime:SHOT_LIFETIME,creator:ship,collisionType:'Explosive',alive:true};
}
export function integrateBullet(b,dt){
  b.lifetime-=dt;
  if(b.lifetime<=0)b.alive=false; // original kills before moving, yet calls Obj.update
  b.pos[0]+=b.speed[0]*dt;b.pos[1]+=b.speed[1]*dt;
  for(let i=0;i<2;i++){
    if(b.pos[i]>WORLD[i])b.pos[i]-=WORLD[i];
    else if(b.pos[i]<0)b.pos[i]+=WORLD[i];
  }
}
export function pairOverlaps(first,second){
  // Original copies positions, and uses strict radius comparison.
  const p1=[...first.pos],p2=[...second.pos];
  for(let axis=0;axis<2;axis++){
    if(p1[axis]-p2[axis]>WORLD[axis]/2)p1[axis]-=WORLD[axis];
    if(p2[axis]-p1[axis]>WORLD[axis]/2)p2[axis]-=WORLD[axis];
  }
  return Math.hypot(p1[0]-p2[0],p1[1]-p2[1])<first.radius+second.radius;
}
function kill(s,obj){obj.alive=false;if(obj.kind==='ship')s.ship=null;}
function rockHit(state,rock,victim){
  if(victim.collisionType!=='Explosive'||!rock.alive)return;
  explosion(state,rock.pos,rock.speed,50);
  for(let i=0;i<2&&rock.size>1;i++){
    const angle=state.rng.uniform(0,2*Math.PI),speed=state.rng.uniform(0,100);
    const child=createAsteroid(rock.pos,[rock.speed[0]+Math.sin(angle)*speed,
      rock.speed[1]+Math.cos(angle)*speed],rock.size-1,state.rng);
    child.kind='asteroid';child.collisionType='hard';child.alive=true;
    state.asteroids.push(child);state.collidables.push(child);
  }
  const points=25*Math.pow(2,3-rock.size);
  if(victim===state.ship||(victim.kind==='bullet'&&victim.creator===state.ship))state.score+=points;
  // Original rare 1-in-51 spawn, including type and coordinate RNG draws.
  if(maybeSpawnSaucer(state))state.spawnedSaucers++;
  kill(state,rock);state.destroyed++;
}
function shipHit(state,ship,victim){
  if(!ship.alive||ship.collisionType!=='Explosive')return;
  if(victim.kind==='bullet'&&victim.creator===ship)return;
  shipDebris(state,ship);
  kill(state,ship);state.lostShips++;
  state.respawnTime=2;
}
function bulletHit(state,bullet,victim){
  if(!bullet.alive||victim===bullet.creator)return;
  if(victim.kind==='bullet'&&victim.creator===bullet.creator)return;
  bulletDebris(state,bullet,victim);
  kill(state,bullet);
}
function collide(state,first,second){
  if(first.kind==='asteroid')rockHit(state,first,second);
  else if(first.kind==='bullet')bulletHit(state,first,second);
  else if(first.kind==='ship')shipHit(state,first,second);
  else if(first.kind==='saucer')saucerHit(state,first,second);
}
export function collisions(state){
  // Pygame Group.sprites() snapshots membership on each access. Retain object
  // registration order, including newly fragmented asteroids. A historical
  // quirk mutates pos1 across the inner loop; handled separately below.
  let a=0;
  while(a<state.collidables.filter(x=>x.alive).length){
    const first=state.collidables.filter(x=>x.alive)[a];
    const p1=[...first.pos];
    const later=state.collidables.filter(x=>x.alive).slice(a+1);
    for(const second of later){
      const p2=[...second.pos];
      for(let axis=0;axis<2;axis++){
        if(p1[axis]-p2[axis]>WORLD[axis]/2)p1[axis]-=WORLD[axis];
        if(p2[axis]-p1[axis]>WORLD[axis]/2)p2[axis]-=WORLD[axis];
      }
      if(Math.hypot(p1[0]-p2[0],p1[1]-p2[1])<first.radius+second.radius){
        collide(state,first,second);collide(state,second,first);
      }
      if(!first.alive)break;
    }
    a++;
  }
  state.collidables=state.collidables.filter(x=>x.alive);
  state.asteroids=state.asteroids.filter(x=>x.alive);
  state.bullets=state.bullets.filter(x=>x.alive);
  state.saucers=state.saucers.filter(x=>x.alive);
}
export function controlExhaust(state,input,dt){
  const ship=state.ship;if(!ship)return;
  // Original control order: left, right, down, up. Conditional RNG draws
  // happen even if a particle is not spawned. random.random() < rate/fps.
  if(input.left&&state.rng.random()<20*dt)
    exhaust(state,ship,Math.PI,[Math.PI/2,ship.radius*1.2]);
  if(input.right&&state.rng.random()<20*dt)
    exhaust(state,ship,Math.PI,[Math.PI*3/2,ship.radius*1.2]);
  if(input.down&&state.rng.random()<20*dt){
    exhaust(state,ship,Math.PI,[Math.PI/2,ship.radius*1.2]);
    exhaust(state,ship,Math.PI,[Math.PI*3/2,ship.radius*1.2]);
  }
  if(input.up&&state.rng.random()<60*dt)
    exhaust(state,ship,0,[0,-ship.radius/2]);
}
export function controlWeapons(state,input,dt){
  const ship=state.ship;
  if(!ship)return;
  if(input.shoot&&ship.gunheat<40&&ship.reloading<=0){
    const bullet=makeShot(ship);state.bullets.push(bullet);state.collidables.push(bullet);
    ship.gunheat+=10;ship.reloading+=1;
  }
  if(ship.reloading>0)ship.reloading-=20*dt;
  if(ship.gunheat>0)ship.gunheat-=20*dt;
  if(ship.startShield>0)ship.startShield-=dt;
  else if(ship.collisionType==='Hard')ship.collisionType='Explosive';
  if(input.shield&&ship.shield>0){
    if(ship.shield>5)ship.shield=5;
    ship.collisionType='Hard';ship.shield-=2.5*dt;
  }else if(ship.shield<5){
    ship.shield+=0.5*dt;
    ship.collisionType='Explosive';
  }
}
export function advanceCombat(state,input,dt){
  if(!state.gameplay)return;
  state.justRespawned=false;
  // Source main 'play' branch checks the extra-life threshold once per tick.
  if(state.mode==='play'&&state.score>=state.nextLife){state.lives++;state.nextLife+=10000;}
  // Source checks for a cleared wave at the START of the main loop, before
  // collisions; fragments created this tick are not advanced until Obj.update.
  if(state.asteroids.length===0&&state.mode==='play'){
    const next=state.wave+1;
    for(const obj of [...state.collidables,...state.particles])if(obj.alive){obj.speed[0]-=state.camera.speed[0];obj.speed[1]-=state.camera.speed[1];}
    spawnWave(state,next,state.rng); // M3 variant preserves existing live collidables
    if(state.ship){state.ship.startShield=2;state.ship.collisionType='Hard';}
    state.camera.speed=[0,0];
  }
  if(state.mode==='play')collisions(state);
  if(!state.ship&&state.mode==='play'){
    if(state.lives===0){state.mode='gameover';}
    else if(state.respawnTime<=0){
      const newShip=makeShip([state.rng.randint(0,WORLD[0]),state.rng.randint(0,WORLD[1])]);
      state.ship=newShip;state.collidables.push(newShip);state.lives--;state.respawnTime=2;state.justRespawned=true;
    }else state.respawnTime-=dt;
  }
}
// Imported into createSimulation; no changes to the original source file.
export function makeShip(pos,speed=[0,0],angle=0){return {kind:'ship',pos:[...pos],speed:[...speed],angle,spin:0,
  radius:10,alive:true,collisionType:'Hard',startShield:2,shield:5,gunheat:0,reloading:0};}
