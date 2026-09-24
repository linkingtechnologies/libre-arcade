import {saucerDebris} from './particles.js';
/* Asteroids Infinity v1.2 Saucer / BigSaucer / SmallSaucer (source lines 418–540).
 * Copyright (C) 2026 Libre Arcade contributors; GPL-3.0-or-later.
 * Proto saucers are not collidable until their original growth completes.
 * M5 implements the historic debris; original audio remains excluded.
 */
import {WORLD,screenCoordinates} from './core.js';
import {makeShot} from './combat.js';
export const SAUCER_SPAWN_ROLL=50;
const TAU=2*Math.PI;

export function createSaucer(state, type, position) {
  if(type!=='big'&&type!=='small')throw new RangeError('Unknown historic saucer type');
  const radius=type==='big'?15:10;
  const angle=state.rng.uniform(0,TAU),speed=state.rng.randint(40,160);
  const saucer={kind:'saucer',type, pos:[...position],speed:[Math.sin(angle)*speed,Math.cos(angle)*speed],
    angle:0,spin:0,radius:0.5,realRadius:radius,proto:true,alive:true,
    collisionType:'Explosive',shots:[],posScreen:screenCoordinates(position,state.camera.pos)};
  state.saucers.push(saucer);
  return saucer;
}

// After an asteroid is broken, a 1-in-51 draw decides whether to create a
// saucer. The type is chosen with randint(1,3) == 1 -> small, else big.
// Positions are sampled in SCREEN coordinates but stored as WORLD coordinates
// in the original constructor (an intentional historic quirk).
export function maybeSpawnSaucer(state) {
  if(state.rng.randint(0,SAUCER_SPAWN_ROLL)!==0)return null;
  const type=state.rng.randint(1,3)===1?'small':'big';
  const pos=[state.rng.randint(0,640),state.rng.randint(0,480)];
  return createSaucer(state,type,pos);
}

export function saucerGeometry(radius){
  const r=radius;
  return [
    [[Math.PI/2,r*4/3],[Math.PI/4,r*3/4],[-Math.PI/4,r*3/4],[-Math.PI/2,r*4/3]],
    [[3*Math.PI/4,r*3/4],[Math.PI/2,r*4/3],[-Math.PI/2,r*4/3],[-3*Math.PI/4,r*3/4]],
    [[11*Math.PI/12,r],[3*Math.PI/4,r*3/4],[-3*Math.PI/4,r*3/4],[-11*Math.PI/12,r]]
  ];
}

export function saucerShot(state,saucer,angle) {
  // Bullet created by source Big/SmallSaucer.update: speed of saucer + 400.
  const shot=makeShot({pos:saucer.pos,speed:saucer.speed,angle});
  shot.creator=saucer;
  saucer.shots.push(shot);
  state.bullets.push(shot);
  state.collidables.push(shot);
  return shot;
}

function singleWrap(position,velocity,dt){
  for(let a=0;a<2;a++){
    position[a]+=velocity[a]*dt;
    if(position[a]>WORLD[a])position[a]-=WORLD[a];
    else if(position[a]<0)position[a]+=WORLD[a];
  }
}

export function stepSaucer(state,saucer,dt){
  if(!saucer.alive)return;
  const rng=state.rng;
  // Saucer.update first; source uses 7**(1/fps), THEN tests next tick
  // whether its radius has reached real_radius.
  if(saucer.radius<saucer.realRadius){
    saucer.radius*=Math.pow(7,dt);
  }else if(saucer.proto){
    saucer.radius=saucer.realRadius;
    saucer.proto=false;
    // Joining Objects happens after its snapshot: inserted at the end of its
    // membership order, after particles already in the group.
    saucer.objectOrder=++state.objectSerial;
    state.collidables.push(saucer);
  }
  if(rng.random()>Math.pow(.35,dt)){
    saucer.speed=[...state.camera.speed];
    const angle=rng.uniform(0,TAU),speed=rng.randint(40,160);
    saucer.speed[0]+=Math.sin(angle)*speed;
    saucer.speed[1]+=Math.cos(angle)*speed;
  }
  singleWrap(saucer.pos,saucer.speed,dt);
  saucer.posScreen=screenCoordinates(saucer.pos,state.camera.pos);
  // Big/SmallSaucer.update calls Saucer.update then takes this draw EVEN
  // for a proto saucer, but fires only when it has joined Objects.
  const fire=rng.random()>Math.pow(.6,dt);
  if(!fire||saucer.proto)return;
  let angle;
  if(saucer.type==='big'){
    angle=rng.uniform(0,TAU);
  }else{
    // Source chooses ship when present, first asteroid otherwise, without
    // shortest-toroidal-path aiming. It has no target guard when both absent;
    // avoid throwing in that edge case while documenting the deviation.
    const target=state.ship||state.asteroids[0];
    if(!target)return;
    const targetScreen=target.posScreen||screenCoordinates(target.pos,state.camera.pos);
    angle=Math.atan2(targetScreen[0]-saucer.posScreen[0],targetScreen[1]-saucer.posScreen[1]);
    angle+=rng.uniform(-Math.PI/4,Math.PI/4);
  }
  saucerShot(state,saucer,angle);
}

export function saucerHit(state,saucer,victim){
  if(!saucer.alive || (victim.kind==='bullet'&&victim.creator===saucer))return;
  saucerDebris(state,saucer);
  const credited=victim===state.ship||(victim.kind==='bullet'&&victim.creator===state.ship);
  if(credited)state.score+=saucer.type==='small'?1000:250;
  saucer.alive=false;
  state.destroyedSaucers++;
}
