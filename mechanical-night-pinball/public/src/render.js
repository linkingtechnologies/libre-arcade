import { LOGICAL_HEIGHT, LOGICAL_WIDTH, VIEWPORT_HEIGHT } from './config.js';
import { GEOMETRY } from './physics/docdonkeys-geometry.js';
import { VerticalFollowCamera } from './camera.js';

function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});}
function polygon(ctx,verts,fill,stroke){ctx.beginPath();ctx.moveTo(verts[0].x,verts[0].y);for(let i=1;i<verts.length;i++)ctx.lineTo(verts[i].x,verts[i].y);ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=1.7;ctx.stroke();}

export class Renderer {
  constructor(canvas){
    this.canvas=canvas;
    this.ctx=canvas.getContext('2d',{alpha:false});
    this.images={};
    this.dpr=1;
    const debugMode=new URLSearchParams(location.search).get('debug');
    this.debug=debugMode==='1'||debugMode==='colliders';
    this.debugColliders=debugMode==='colliders';
    this.camera=new VerticalFollowCamera();
    this.lastCameraTime=performance.now()/1000;
  }
  async load(){
    const [playfield,ramps]=await Promise.all([
      loadImage('assets/graphics/playfield.svg'),
      loadImage('assets/graphics/ramps.svg')
    ]);
    this.images={playfield,ramps};
    this.resize();
  }
  resize(){
    this.dpr=Math.min(3,window.devicePixelRatio||1);
    this.canvas.width=Math.round(LOGICAL_WIDTH*this.dpr);
    this.canvas.height=Math.round(VIEWPORT_HEIGHT*this.dpr);
    this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    this.ctx.imageSmoothingEnabled=true;
  }
  resetCamera(){
    this.camera.reset();
    this.lastCameraTime=performance.now()/1000;
  }
  updateCamera(s){
    const now=performance.now()/1000;
    const dt=now-this.lastCameraTime;
    this.lastCameraTime=now;
    return this.camera.update(s,dt);
  }
  render(physics){
    const ctx=this.ctx,s=physics.snapshot();
    this.updateCamera(s);

    // Screen space clear.
    ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    ctx.clearRect(0,0,LOGICAL_WIDTH,VIEWPORT_HEIGHT);
    ctx.fillStyle='#0a0f14';
    ctx.fillRect(0,0,LOGICAL_WIDTH,VIEWPORT_HEIGHT);

    // World space: only this transform scrolls. Physics remains in the full 428×822 table.
    ctx.save();
    ctx.translate(0,-this.camera.y);
    ctx.drawImage(this.images.playfield,0,0,LOGICAL_WIDTH,LOGICAL_HEIGHT);
    if(s.flags.rampsActive)ctx.drawImage(this.images.ramps,0,0,LOGICAL_WIDTH,LOGICAL_HEIGHT);
    this.drawTableState(ctx,s);
    this.drawFlipper(ctx,s.flippers.left);
    this.drawFlipper(ctx,s.flippers.right);
    this.drawKicker(ctx,s.kicker);
    this.drawBall(ctx,s.ball);
    if(this.debugColliders)this.drawColliderOverlay(ctx,s);
    ctx.restore();

    // Debug is screen-space so it remains readable while the table scrolls.
    if(this.debug)this.drawDebug(ctx,s,physics);
  }
  drawBall(ctx,b){if(!b.active)return;const g=ctx.createRadialGradient(b.x-3,b.y-4,1,b.x,b.y,b.r+2);g.addColorStop(0,'#fff');g.addColorStop(.35,'#dce3e8');g.addColorStop(1,'#788791');ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#f4e8c1';ctx.lineWidth=1;ctx.stroke();}
  drawFlipper(ctx,f){polygon(ctx,f.vertices,'#b8c1c8','#f4e8c1');ctx.beginPath();ctx.arc(f.pivot.x,f.pivot.y,5,0,Math.PI*2);ctx.fillStyle='#e9c46a';ctx.fill();}
  drawKicker(ctx,k){
    ctx.save();
    const top=k.y-k.height/2,bottom=k.y+k.height/2;
    // Visuals are centered on the physical x=412 body: cap, shaft and spring all
    // share the same axis so the shooter no longer looks offset from the ball.
    ctx.strokeStyle='rgba(244,232,193,.38)';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(k.x,Math.min(821,bottom));ctx.lineTo(k.x,801);ctx.stroke();
    ctx.strokeStyle='#78909a';ctx.lineWidth=1.15;ctx.beginPath();
    const sy=Math.min(818,bottom+2),ey=818,turns=5,amp=4;
    ctx.moveTo(k.x,sy);for(let i=1;i<=turns*2;i++){const t=i/(turns*2);ctx.lineTo(k.x+(i%2?amp:-amp),sy+(ey-sy)*t);}ctx.stroke();
    const g=ctx.createLinearGradient(k.x-6,0,k.x+6,0);g.addColorStop(0,'#718087');g.addColorStop(.45,'#eef1ef');g.addColorStop(1,'#78868d');
    ctx.fillStyle=g;ctx.strokeStyle='#f4e8c1';ctx.lineWidth=1.3;
    ctx.beginPath();ctx.roundRect(k.x-k.width/2,top,k.width,k.height,3);ctx.fill();ctx.stroke();
    ctx.fillStyle='#d8dedc';ctx.strokeStyle='#f4e8c1';ctx.beginPath();ctx.roundRect(k.x-7,top-3,14,6,3);ctx.fill();ctx.stroke();
    ctx.restore();
  }
  drawTableState(ctx,s){
    const lamp=(x,y,on,color)=>{if(!on)return;ctx.save();ctx.shadowBlur=14;ctx.shadowColor=color;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();ctx.restore();};
    [[46,144],[72,144],[98,144],[124,144]].forEach((p,i)=>lamp(p[0],p[1],s.flags.lightsTopLeft[i],'#e9c46a'));
    [[190,245],[215,245],[240,245],[265,245]].forEach((p,i)=>lamp(p[0],p[1],s.flags.lightsTop[i],'#2a9d8f'));
    [[42,486],[364,486]].forEach((p,i)=>lamp(p[0],p[1],s.flags.lightsMiddle[i],'#2a9d8f'));
    [[48,585],[358,585]].forEach((p,i)=>lamp(p[0],p[1],s.flags.lightsDown[i],'#e9c46a'));
    const pegs=[[25,520],[200,764],[375,520]];pegs.forEach((p,i)=>{if(!s.pegsActive[i]){ctx.fillStyle='#0a0f14';ctx.beginPath();ctx.arc(p[0],p[1],11,0,Math.PI*2);ctx.fill();}});
    if(!s.topRightBumperActive){ctx.fillStyle='#101820';ctx.beginPath();ctx.arc(400,153,27,0,Math.PI*2);ctx.fill();lamp(400,153,s.flags.thirdRamp,'#e76f51');}
    if(s.flags.arrows[0]||s.flags.arrows[1]){ctx.fillStyle='rgba(42,157,143,.24)';ctx.fillRect(20,548,380,52);}if(s.flags.arrows[2]){ctx.fillStyle='rgba(231,111,81,.34)';ctx.fillRect(230,8,42,38);}
    if(s.tunnel){ctx.fillStyle='rgba(120,215,240,.18)';ctx.fillRect(0,0,LOGICAL_WIDTH,LOGICAL_HEIGHT);}
  }

  drawColliderOverlay(ctx,s){
    const chain=(points,color)=>{ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.strokeStyle=color;ctx.lineWidth=1.35;ctx.stroke();};
    ctx.save();
    ctx.globalAlpha=.9;
    const base=s.flags.rampsActive?[GEOMETRY.leftRampWalls,GEOMETRY.rightRampWalls]:[GEOMETRY.outsideWalls,GEOMETRY.topLeftWalls,GEOMETRY.downLeftWalls,GEOMETRY.downRightWalls];
    base.forEach(c=>chain(c,'#ff3bd4'));
    chain(GEOMETRY.leftBumperHugger,'#ff9f43');chain(GEOMETRY.rightBumperHugger,'#ff9f43');
    chain(GEOMETRY.leftBumper,'#ff5e57');chain(GEOMETRY.rightBumper,'#ff5e57');
    const circles=[[61,212,10],[102,217,8],[77,250,10],[400,153,11],[25,520,5],[200,764,5],[375,520,5],[147,745,4.5],[252,745,4.5],[412,801,4.5]];
    ctx.strokeStyle='#00f5d4';ctx.lineWidth=1.2;for(const [x,y,r] of circles){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();}
    const rects=[[55,165,3,23],[80,165,4,23],[105,165,4,23],[10,470,40,20]];
    ctx.strokeStyle='#f9c74f';for(const [x,y,w,h] of rects)ctx.strokeRect(x-w/2,y-h/2,w,h);
    const sensors=[[43,166,7,19],[67,166,7,19],[93,166,7,19],[117,166,7,19],[190,228,13,2],[214,231,13,2],[239,231,13,2],[264,228,13,2],[36,480,3,14],[364,480,3,14],[45,606,7,19],[355,606,7,19],[91,108,6,15],[178,143,6,15],[262,180,6,16],[60,105,6,15],[210,175,6,16],[250,143,6,15],[250,25,6,15],[48,422,18,4],[420,315,4,18],[199,812,64,8]];
    if(s.flags.rampsActive)sensors.push([50,556,12,10],[355,580,12,10]);
    ctx.setLineDash([4,3]);ctx.strokeStyle='#7df9ff';ctx.globalAlpha=.7;for(const [x,y,w,h] of sensors)ctx.strokeRect(x-w/2,y-h/2,w,h);ctx.setLineDash([]);
    ctx.restore();
  }
  drawDebug(ctx,s){
    ctx.save();
    ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    ctx.font='10px ui-monospace,monospace';
    ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(6,6,268,76);
    ctx.fillStyle='#fff';ctx.fillText(s.solver.name,12,20);
    ctx.fillText(`ball ${s.ball.x.toFixed(1)},${s.ball.y.toFixed(1)} v ${s.ball.vx.toFixed(0)},${s.ball.vy.toFixed(0)}`,12,34);
    ctx.fillText(`camera y ${this.camera.y.toFixed(1)} -> ${this.camera.targetY.toFixed(1)}`,12,48);
    ctx.fillText(`ramps ${s.flags.rampsActive}  substeps ${s.solver.substeps}`,12,62);
    ctx.fillText(`sleep ${s.ball.asleep?'yes':'no'}  contacts ${s.solver.contacts??0}`,12,76);
    ctx.restore();
  }
}
