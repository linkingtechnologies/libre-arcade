/* Asteroids Infinity M2 — Asteroid geometry, generation and drift.
 * Copyright (C) 2026 Libre Arcade contributors. GPL-3.0-or-later.
 * Port of Asteroid.__init__ (original v1.2: lines 280–291),
 * first playable wave (lines 810–821) and Obj.update (226–238).
 * M3 adds collisions and M4 saucers; M2 source-method oracle retained.
 */
import {WORLD, originalWrap} from './core.js';
export const LARGE_ASTEROID_SIZE = 3;
export const ORIGINAL_ASTEROID_SPIN = -2 * Math.PI;

// Adapter separates the historical sequence of calls (randint/uniform)
// from the underlying random-number generator. Browser default Math.random
// DOES NOT have Python's seeded PRNG sequence; see specs/AUDIT.md (M2).
export function browserRandom(random=Math.random) {
  return {
    random,
    randint(a,b) {
      if (!Number.isInteger(a)||!Number.isInteger(b)||b<a) throw new RangeError('Invalid randint bounds');
      return a+Math.floor(random()*(b-a+1));
    },
    uniform(a,b) {return a+(b-a)*random();},
  };
}

export function createAsteroid(position, velocity, size, rng=browserRandom()) {
  if (![1,2,3].includes(size)) throw new RangeError('Historical asteroid size must be 1, 2 or 3');
  const radius=3*Math.pow(2,size);
  // Even the degenerate historical uniform(-2π,-2π) is CALLED: consume its RNG draw.
  const spin=rng.uniform(-2*Math.PI,-2*Math.PI);
  const points=[];
  for(let a=0;a<10;a++){
    const angle=a*Math.PI/5+rng.uniform(0,Math.PI/5);
    const distance=rng.uniform(radius*0.7,radius*1.4);
    points.push([angle,distance]);
  }
  return {kind:'asteroid',collisionType:'hard',alive:true,pos:[...position],speed:[...velocity],size,radius,angle:0,spin,points};
}

export function spawnWave(state, level=1, rng=browserRandom()) {
  if (!Number.isInteger(level)||level<1) throw new RangeError('Level must be positive');
  // Original playstart removes previous collidable objects; level=0 -> 1
  // and immediately spawns `level` LARGE asteroids, including the first wave.
  // A cleared-wave call keeps bullets and ship registered as original Pygame groups do.
  if(state.collidables)state.collidables=state.collidables.filter(x=>x.alive&&x.kind!=='asteroid');
  state.asteroids=[];
  for(let i=0;i<level;i++){
    const position=[rng.randint(0,WORLD[0]),rng.randint(0,WORLD[1])];
    const velocity=[rng.randint(-100,100),rng.randint(-100,100)];
    const rock=createAsteroid(position,velocity,LARGE_ASTEROID_SIZE,rng);
    state.asteroids.push(rock);
    if(state.collidables)state.collidables.push(rock);
  }
  state.wave=level;
  return state;
}

export function stepAsteroid(asteroid,dt){
  if (!(dt>0&&Number.isFinite(dt))) throw new RangeError('Invalid dt');
  asteroid.angle+=asteroid.spin*dt;
  for(let i=0;i<2;i++){
    asteroid.pos[i]+=asteroid.speed[i]*dt;
    // Obj.update: SINGLE wrap per axis; no modulo normalization.
    if(asteroid.pos[i]>WORLD[i])asteroid.pos[i]-=WORLD[i];
    else if(asteroid.pos[i]<0)asteroid.pos[i]+=WORLD[i];
  }
  return asteroid;
}

export function asteroidScreenPosition(asteroid,camera){
  // Obj.set_pos_screen historically wraps into [-30,670] x [-30,510],
  // identically to the ship's screen conversion.
  return [originalWrap(asteroid.pos[0]-camera[0],-30,670),
          originalWrap(asteroid.pos[1]-camera[1],-30,510)];
}
