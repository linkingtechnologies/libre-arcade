/* Asteroids Infinity v1.2 visual particle subsystem (M5).
 * Historical source: explosion lines 208-213; Ship.exaust 398-405;
 * Particle/Stick 542-566; Obj.update 226-240. GPL-3.0-or-later.
 * No original WAV/font assets are needed or redistributed.
 */
import {WORLD,screenCoordinates} from './core.js';
const TAU=2*Math.PI;

function spawn(state,kind,pos,speed,radius=0){
  const obj={kind,pos:[...pos],speed:[...speed],radius,angle:0,spin:0,alive:true,
    objectOrder:++state.objectSerial};
  if(kind==='stick')obj.spin=state.rng.uniform(-TAU,TAU);
  state.particles.push(obj);
  return obj;
}
export function particle(state,pos,speed){return spawn(state,'particle',pos,speed);}
export function stick(state,pos,speed,radius){return spawn(state,'stick',pos,speed,radius);}

// Source explosion(): two uniform calls per particle, and one excluded sound.
export function explosion(state,pos,relativeSpeed,count,addedSpeed=200){
  for(let i=0;i<count;i++){
    const angle=state.rng.uniform(0,TAU),speed=state.rng.uniform(0,addedSpeed);
    particle(state,pos,[relativeSpeed[0]+Math.sin(angle)*speed,relativeSpeed[1]+Math.cos(angle)*speed]);
  }
}

// Ship.exaust: coordinate offset is (polar angle, radius), including negative
// radius for forward thrust. The historical spelling is retained as an alias.
export function exhaust(state,ship,relativeAngle,relativePosition,count=1){
  for(let i=0;i<count;i++){
    const angle=ship.angle+relativeAngle+state.rng.uniform(-Math.PI/12,Math.PI/12);
    const speed=state.rng.uniform(100,200);
    const pos=[ship.pos[0]+Math.sin(relativePosition[0]+ship.angle)*relativePosition[1],
               ship.pos[1]+Math.cos(relativePosition[0]+ship.angle)*relativePosition[1]];
    particle(state,pos,[ship.speed[0]-Math.sin(angle)*speed,ship.speed[1]-Math.cos(angle)*speed]);
  }
}
export const exaust=exhaust;

export function shipDebris(state,ship){
  for(let i=0;i<7;i++){
    const a=state.rng.uniform(0,TAU),v=state.rng.uniform(0,200);
    stick(state,ship.pos,[ship.speed[0]+Math.sin(a)*v,ship.speed[1]+Math.cos(a)*v],7);
  }
  explosion(state,ship.pos,ship.speed,25);
}
export function saucerDebris(state,saucer){
  explosion(state,saucer.pos,saucer.speed,25);
  for(let i=0;i<10;i++){
    const a=state.rng.uniform(0,TAU),v=state.rng.uniform(0,200);
    stick(state,saucer.pos,[saucer.speed[0]+Math.sin(a)*v,saucer.speed[1]+Math.cos(a)*v],saucer.radius/2);
  }
}
export function bulletDebris(state,bullet,victim){
  explosion(state,bullet.pos,[(bullet.speed[0]+victim.speed[0])/2,
    (bullet.speed[1]+victim.speed[1])/2],25,100);
}

// Original calls random.random() first even if this frame kills the particle,
// then Obj.update advances it once; pygame's sprite groups omit it from draw.
export function updateParticle(state,p,dt){
  if(!p.alive)return p;
  if(state.rng.random()>Math.pow(p.kind==='stick'?.5:.35,dt))p.alive=false;
  p.angle+=p.spin*dt;
  for(let axis=0;axis<2;axis++){
    p.pos[axis]+=p.speed[axis]*dt;
    if(p.pos[axis]>WORLD[axis])p.pos[axis]-=WORLD[axis];
    else if(p.pos[axis]<0)p.pos[axis]+=WORLD[axis];
  }
  return p;
}
export function advanceParticles(state,dt){
  // Snapshot Objects.update membership. New particles generated during a frame
  // before this call are updated; newly generated after it wait until next tick.
  for(const p of [...state.particles])updateParticle(state,p,dt);
  state.particles=state.particles.filter(p=>p.alive);
}
export function particleScreenPosition(p,camera){return screenCoordinates(p.pos,camera);}
