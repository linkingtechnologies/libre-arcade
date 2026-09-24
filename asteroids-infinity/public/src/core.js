import {updateParticle} from './particles.js';
import {stepSaucer} from './saucers.js';
import {stepAsteroid} from './asteroids.js';
import {makeShip,advanceCombat,integrateBullet,controlWeapons,controlExhaust} from './combat.js';
/* Asteroids Infinity HTML5 M1 — flight and camera reference port.
 * Copyright (C) 2026 Libre Arcade contributors. GPL-3.0-or-later.
 * Historical behavior traced to Ben Whittaker, AsteroidsInfinity.py v1.2:
 * Obj.update: 226–238; Obj.set_pos_screen: 250–264;
 * Ship.control: 347–370; main camera: 940–955, 992–994.
 * M2 adds asteroid drift. M3 adds collisions; M4 adds original saucers.
 */
export const SCREEN = Object.freeze([640, 480]);
export const WORLD = Object.freeze([700, 540]);
export const REFERENCE_HZ = 100;
export const REFERENCE_DT = 1 / REFERENCE_HZ;
export const EMPTY_INPUT = Object.freeze({left:false,right:false,up:false,down:false});

// Original uses while and strictly >, not modulo; keep exact-boundary behavior.
export function originalWrap(value, start, end) {
  if (!(Number.isFinite(value) && Number.isFinite(start) && Number.isFinite(end) && end > start)) {
    throw new RangeError('Invalid historical wrap arguments');
  }
  while (value < start) value += end - start;
  while (value > end) value -= end - start;
  return value;
}
export function screenCoordinates(position, camera) {
  const rx = (WORLD[0]-SCREEN[0])/2;
  const ry = (WORLD[1]-SCREEN[1])/2;
  return [originalWrap(position[0]-camera[0],-rx,SCREEN[0]+rx),
          originalWrap(position[1]-camera[1],-ry,SCREEN[1]+ry)];
}
export function createSimulation({position=[350,270], speed=[0,0], angle=0,
                                   viewpoint=[30,30], viewpointSpeed=[0,0],gameplay=false,rng=null}={}) {
  const ship=makeShip(position,speed,angle);
  return {ship,camera:{pos:[...viewpoint],speed:[...viewpointSpeed]}, asteroids:[], bullets:[], saucers:[], particles:[],
          collidables:[ship],wave:0,ticks:0,gameplay,rng,score:0,lives:4,mode:'play',
          objectSerial:0,respawnTime:2,lostShips:0,destroyed:0,destroyedSaucers:0,spawnedSaucers:0,nextLife:10000,justRespawned:false};
}
// Exactly one ORIGINAL main-loop update. dt comes from measured fps = 1/dt.
// M9 browser loop supplies measured variable dt; fixed 100-Hz oracle remains available in tests.
export function step(state, input=EMPTY_INPUT, dt=REFERENCE_DT) {
  if (!(dt > 0 && Number.isFinite(dt))) throw new RangeError('dt must be positive and finite');
  if(state.gameplay){
    if(!state.rng)throw new Error('A gameplay RNG adapter is required');
    advanceCombat(state,input,dt);
  }
  const {ship,camera} = state;
  // Ship.control() — both rotations may cancel; accelerate BEFORE angle update.
  if(ship&&!state.justRespawned) {
  ship.spin = 0;
  if (input.left){ship.spin += Math.PI;if(state.gameplay)controlExhaust(state,{left:true},dt);}
  if (input.right){ship.spin -= Math.PI;if(state.gameplay)controlExhaust(state,{right:true},dt);}
  if (input.down) {
    ship.speed[0] -= Math.sin(ship.angle)*400/3*dt;
    ship.speed[1] -= Math.cos(ship.angle)*400/3*dt;
    if(state.gameplay)controlExhaust(state,{down:true},dt);
  }
  if (input.up) {
    ship.speed[0] += Math.sin(ship.angle)*800/3*dt;
    ship.speed[1] += Math.cos(ship.angle)*800/3*dt;
    if(state.gameplay)controlExhaust(state,{up:true},dt);
  }
  }
  if(state.gameplay&&!state.justRespawned){
    controlWeapons(state,input,dt);
  }
  // main(): velocity tracking and position correction precede viewpoint movement.
  if(ship&&!state.justRespawned){
  const rx = originalWrap(camera.pos[0]-ship.pos[0],-WORLD[0],0)+SCREEN[0]/2;
  const ry = originalWrap(camera.pos[1]-ship.pos[1],-WORLD[1],0)+SCREEN[1]/2;
  const px = Math.min(1,Math.abs(rx/(SCREEN[0]/8)));
  const py = Math.min(1,Math.abs(ry/(SCREEN[1]/8)));
  camera.speed[0] -= (camera.speed[0]-ship.speed[0])*(1-Math.pow(1-px,dt));
  camera.speed[1] -= (camera.speed[1]-ship.speed[1])*(1-Math.pow(1-py,dt));
  const p = 1-Math.pow(0.1,dt);
  camera.pos[0] += -rx*p;
  camera.pos[1] += -ry*p;
  camera.pos[0] = originalWrap(camera.pos[0],0,WORLD[0]);
  camera.pos[1] = originalWrap(camera.pos[1],0,WORLD[1]);
  }
  // Original main loop (v1.2 lines 992-993) integrates viewpoint velocity
  // unconditionally, even while the ship is dead or has just respawned.
  camera.pos[0] += camera.speed[0]*dt;
  camera.pos[1] += camera.speed[1]*dt;
  // Objects.update() after viewpoint movement: spin, translation, SINGLE wrap.
  if(ship){
  ship.angle += ship.spin*dt;
  for (let a=0;a<2;a++) {
    ship.pos[a] += ship.speed[a]*dt;
    if (ship.pos[a]>WORLD[a]) ship.pos[a]-=WORLD[a];
    else if(ship.pos[a]<0) ship.pos[a]+=WORLD[a];
  }
  }
  // The original Objects.update advances both ship and asteroids after camera.
  for(const asteroid of state.asteroids)stepAsteroid(asteroid,dt);
  // Saucer.update runs as part of Objects/ProtoObjs after movement. The
  // bullets snapshot is taken before saucer fire: new saucer shots move next tick.
  for(const bullet of [...state.bullets])integrateBullet(bullet,dt);
  // Pygame Objects.update snapshots one insertion-ordered group. The proto
  // saucers belong to a separate ProtoObjs group updated AFTER Objects.
  // Bullet movement is processed above; saucer-created bullets wait one tick.
  const objects=[...state.particles.filter(p=>p.alive),
                 ...state.saucers.filter(s=>s.alive&&!s.proto)]
    .sort((a,b)=>(a.objectOrder??0)-(b.objectOrder??0));
  for(const obj of objects){
    if(obj.kind==='saucer')stepSaucer(state,obj,dt);
    else updateParticle(state,obj,dt);
  }
  for(const proto of [...state.saucers.filter(s=>s.alive&&s.proto)])stepSaucer(state,proto,dt);
  if(state.gameplay)state.particles=state.particles.filter(x=>x.alive);
  if(state.gameplay){state.bullets=state.bullets.filter(x=>x.alive);
    state.collidables=state.collidables.filter(x=>x.alive);}
  state.ticks++;
  return state;
}
export function snapshot(state) {
  return {tick:state.ticks,ship_pos:[...state.ship.pos],ship_vel:[...state.ship.speed],
          ship_angle:state.ship.angle,cam_pos:[...state.camera.pos],cam_vel:[...state.camera.speed]};
}
