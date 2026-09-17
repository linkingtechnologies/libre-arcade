import { LOGICAL_HEIGHT, PARITY, VIEWPORT_HEIGHT } from './config.js';

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

export class VerticalFollowCamera {
  constructor(){
    this.maxY=Math.max(0,LOGICAL_HEIGHT-VIEWPORT_HEIGHT);
    this.y=this.maxY;
    this.targetY=this.maxY;
  }

  reset(){
    this.y=this.maxY;
    this.targetY=this.maxY;
  }

  update(snapshot,dt){
    const s=snapshot;
    let focusY=s.ball.y;
    let vy=s.ball.vy||0;

    if(!s.ball.active && s.tunnel){
      focusY=PARITY.tunnelExits[s.tunnel.exit]?.y ?? focusY;
      vy=0;
    }

    const lookAhead=clamp(-vy*0.08,-55,55);
    const zoneTop=205+lookAhead*0.45;
    const zoneBottom=395+lookAhead*0.45;
    const screenY=focusY-this.targetY;
    let target=this.targetY;

    if(screenY<zoneTop) target=focusY-zoneTop;
    else if(screenY>zoneBottom) target=focusY-zoneBottom;

    if(focusY>650 && Math.abs(vy)<80) target=this.maxY;
    this.targetY=clamp(target,0,this.maxY);

    const safeDt=clamp(dt,0,0.05);
    const followRate=9.5;
    const alpha=1-Math.exp(-followRate*safeDt);
    this.y += (this.targetY-this.y)*alpha;
    if(Math.abs(this.targetY-this.y)<0.02)this.y=this.targetY;
    return this.y;
  }
}
