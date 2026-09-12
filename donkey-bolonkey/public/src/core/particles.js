import { FPS, LOGICAL_HEIGHT, LOGICAL_WIDTH } from './constants.js';

export const PARTICLE = Object.freeze({ BLOOD:1, BODY1:2, BODY2:3, BODY3:4 });
const MAX_PARTICLES = 1024;
const MAX_CHAINS = 4;

export class ParticleSystem {
  constructor(random=Math.random){ this.random=random; this.reset(); }
  reset(){ this.particles=[]; this.chains=[]; }

  position(p){
    const time=6*p.time/FPS;
    return { x:p.x+p.xspeed*time, y:p.y-p.yspeed*time+p.weight*time*time };
  }

  lateralSpeed(){
    for(let guard=0;guard<2048;guard++){
      const x=Math.floor(this.random()*5001)/50-25;
      const r=Math.floor(this.random()*256);
      if(r<=255*Math.abs(x)/25)continue;
      return x;
    }
    return 0;
  }

  createBlood(x,y){
    if(this.particles.length>=MAX_PARTICLES)return false;
    this.particles.push({
      type:PARTICLE.BLOOD,time:0,x,y,
      xspeed:this.lateralSpeed(),
      yspeed:40+Math.floor(this.random()*21)-10,
      size:Math.floor(this.random()*4),
      weight:4+Math.floor(this.random()*20)/10
    });
    return true;
  }

  createBody(x,y,acceptHead){
    if(this.particles.length>=MAX_PARTICLES)return false;
    const c=Math.floor(this.random()*3);
    this.particles.push({
      type:(c===2&&acceptHead)?PARTICLE.BODY3:(c===1?PARTICLE.BODY2:PARTICLE.BODY1),
      time:0,x,y,
      xspeed:this.lateralSpeed(),
      yspeed:60+Math.floor(this.random()*21)-10,
      size:Math.floor(this.random()*4),
      weight:4+Math.floor(this.random()*20)/10
    });
    return true;
  }

  createChain(x,y,num,cant){
    if(this.chains.length>=MAX_CHAINS)return false;
    // Historical code initializes time to FPS, so the first burst is emitted
    // by update_particles() in the same game tick in which the chain is added.
    this.chains.push({time:FPS,x,y,num,cant:cant*2});
    return true;
  }

  update(){
    for(let i=0;i<this.particles.length;i++){
      const p=this.particles[i];
      p.time++;
      const {x,y}=this.position(p);
      if(x < -4 || x >= LOGICAL_WIDTH+4 || y >= LOGICAL_HEIGHT+4){
        this.particles.splice(i,1); i--;
      }
    }

    for(let i=0;i<this.chains.length;i++){
      const chain=this.chains[i];
      chain.time++;
      if(chain.time>Math.floor(FPS/8)){
        chain.time=0;
        if(chain.num>0){
          for(let j=0;j<chain.cant;j++)this.createBlood(chain.x,chain.y);
          this.createBody(chain.x,chain.y,false);
          this.createBody(chain.x,chain.y,true);
          chain.num--;
        }else{
          this.chains.splice(i,1); i--;
        }
      }
    }
  }
}
