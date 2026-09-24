import {particleScreenPosition} from './particles.js';
/* Vector-only source-derived ship and asteroid geometry, 640×480 Canvas.
 * Original v1.2: Ship.normal_points 328–336, Asteroid.image_points 280–291,
 * Obj.draw 264–277. No original font/audio or external assets are loaded.
 * Simple score/lives/wave overlay replaces the earlier developer diagnostic HUD.
 */
import {SCREEN,WORLD,screenCoordinates} from './core.js';
import {asteroidScreenPosition} from './asteroids.js';
import {saucerGeometry} from './saucers.js';
const SHIP_POINTS = [[0,13],[Math.PI/2,5],[Math.PI/2,12],[5*Math.PI/6,10],
                     [7*Math.PI/6,10],[3*Math.PI/2,12],[3*Math.PI/2,5]];
function outline(ctx,polar,angle,origin,color='#f3f7fa'){
  ctx.beginPath();
  polar.forEach(([a,r],i)=>{
    const x=Math.sin(a+angle)*r+origin[0], y=Math.cos(a+angle)*r+origin[1];
    if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
  });
  ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.stroke();
}
export function render(ctx, state, {labels=true,grid=false,language="en"}={}) {
  const [w,h]=SCREEN;
  ctx.fillStyle='#070d16';ctx.fillRect(0,0,w,h);
  const camera=state.camera.pos;
  if(grid){
    ctx.strokeStyle='#1a3145';ctx.lineWidth=1;
    for(let x=0;x<WORLD[0];x+=70){
      const sx=screenCoordinates([x,0],camera)[0];
      if(sx>=0&&sx<=w){ctx.beginPath();ctx.moveTo(sx,0);ctx.lineTo(sx,h);ctx.stroke();}
    }
    for(let y=0;y<WORLD[1];y+=54){
      const sy=screenCoordinates([0,y],camera)[1];
      if(sy>=0&&sy<=h){ctx.beginPath();ctx.moveTo(0,sy);ctx.lineTo(w,sy);ctx.stroke();}
    }
  }
  // Original Obj rendering uses each asteroid's one wrapped screen position.
  for(const rock of state.asteroids){
    outline(ctx,rock.points,rock.angle,asteroidScreenPosition(rock,camera));
  }
  // A growing saucer is rendered from ProtoObjs before it can collide.
  for(const saucer of state.saucers||[]){
    const pos=screenCoordinates(saucer.pos,camera);
    for(const polar of saucerGeometry(saucer.radius))outline(ctx,polar,0,pos,'#d8f1fc');
  }
  for(const bullet of state.bullets||[]){
    const pos=screenCoordinates(bullet.pos,camera);
    outline(ctx,[[0,4],[8*Math.PI/9,4],[10*Math.PI/9,4]],bullet.angle,pos,'#ebf7fa');
  }
  // Historical Particle.draw sets exactly one integer-truncated screen pixel;
  // Stick.draw draws a closed three-point polar outline (a line with r=0).
  for(const effect of state.particles||[]){
    const pos=particleScreenPosition(effect,camera);
    if(effect.kind==='particle'){
      const x=Math.trunc(pos[0]),y=Math.trunc(pos[1]);
      if(x>=0&&x<w&&y>=0&&y<h){ctx.fillStyle='#f3f7fa';ctx.fillRect(x,y,1,1);}
    }else if(effect.kind==='stick'){
      outline(ctx,[[0,0],[0,effect.radius],[Math.PI,effect.radius]],effect.angle,pos);
    }
  }
  const ship=state.ship;
  if(ship){outline(ctx,SHIP_POINTS,ship.angle,screenCoordinates(ship.pos,camera));
    if(state.gameplay&&ship.collisionType==='Hard'){
      const [sx,sy]=screenCoordinates(ship.pos,camera);ctx.beginPath();ctx.arc(sx,sy,15,0,Math.PI*2);
      ctx.strokeStyle='#91c9ec';ctx.stroke();
    }
  }
  if(labels && state.gameplay){
    const it=language==='it';
    ctx.font='15px system-ui,sans-serif';ctx.fillStyle='#e4f1f9';
    ctx.fillText(`${it?'Punti':'Score'} ${state.score}`,12,23);
    ctx.textAlign='center';ctx.fillText(`${it?'Livello':'Level'} ${state.wave}`,w/2,23);
    ctx.textAlign='right';ctx.fillText(`${it?'Vite':'Lives'} ${state.lives}`,w-12,23);
    ctx.textAlign='left';
    if(state.mode==='gameover'){
      ctx.textAlign='center';ctx.font='28px system-ui,sans-serif';ctx.fillText('GAME OVER',w/2,h/2);ctx.textAlign='left';
    }
  }
}
