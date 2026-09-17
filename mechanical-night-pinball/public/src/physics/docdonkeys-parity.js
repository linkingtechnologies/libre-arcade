import { PhysicsAdapter } from './physics-adapter.js';
import { CALIBRATION, FIXED_DT, LOGICAL_HEIGHT, PARITY, RESTORATION } from '../config.js';
import { GEOMETRY } from './docdonkeys-geometry.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dot = (ax, ay, bx, by) => ax*bx + ay*by;
const cross = (ax, ay, bx, by) => ax*by - ay*bx;
const EPS = 1e-8;
const PPM = PARITY.pixelsPerMeter;
const RESTITUTION_THRESHOLD_PX = CALIBRATION.box2d.velocityThresholdPixelsPerSecond;

function rotatePoint(p, pivotLocal, bodyOrigin, angle) {
  const x=p[0]-pivotLocal.x, y=p[1]-pivotLocal.y, c=Math.cos(angle), s=Math.sin(angle);
  return {x:bodyOrigin.x+pivotLocal.x+x*c-y*s,y:bodyOrigin.y+pivotLocal.y+x*s+y*c};
}
function closestPointOnSegment(px,py,ax,ay,bx,by){const abx=bx-ax,aby=by-ay,d=abx*abx+aby*aby;const t=d>EPS?clamp(((px-ax)*abx+(py-ay)*aby)/d,0,1):0;return{x:ax+abx*t,y:ay+aby*t,t};}
function pointInPolygon(x,y,v){let inside=false;for(let i=0,j=v.length-1;i<v.length;j=i++){const a=v[i],b=v[j];if(((a.y>y)!=(b.y>y))&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y||EPS)+a.x)inside=!inside;}return inside;}
function clampBallSpeeds(ball){const m=CALIBRATION.box2d.maxLinearSpeedPixelsPerSecond,s=Math.hypot(ball.vx,ball.vy);if(s>m){ball.vx*=m/s;ball.vy*=m/s;}ball.omega=clamp(ball.omega,-CALIBRATION.box2d.maxAngularSpeedRadiansPerSecond,CALIBRATION.box2d.maxAngularSpeedRadiansPerSecond);}

// Static-contact impulse calibrated against the exact vendored Box2D 2.3.2.
// The 1/3 tangential effective mass is essential: the ball can spin, so friction
// is shared between translation and rotation instead of simply damping vx/vy.
export function applyStaticContactResponse(ball,normal,restitution,friction,surfaceV={x:0,y:0}){
  const rvx=ball.vx-surfaceV.x,rvy=ball.vy-surfaceV.y,vn=dot(rvx,rvy,normal.x,normal.y);
  if(vn>=0)return;
  const e=Math.abs(vn)<RESTITUTION_THRESHOLD_PX?0:Math.max(PARITY.ballRestitution,restitution),normalDelta=-(1+e)*vn;
  ball.vx+=normalDelta*normal.x;ball.vy+=normalDelta*normal.y;
  const tx=-normal.y,ty=normal.x,mu=Math.sqrt(PARITY.ballFriction*friction);
  const relT=dot(ball.vx-surfaceV.x,ball.vy-surfaceV.y,tx,ty)-ball.omega*ball.r;
  const tangentDelta=clamp(-relT/3,-mu*Math.abs(normalDelta),mu*Math.abs(normalDelta));
  ball.vx+=tangentDelta*tx;ball.vy+=tangentDelta*ty;ball.omega+=-2*tangentDelta/ball.r;
  clampBallSpeeds(ball);
}
function flipperHeldAtStop(f){
  const cfg=PARITY.flippers[f.side],sl=CALIBRATION.box2d.angularSlopRadians,eps=.35*Math.PI/180;
  if(f.maxTorque<=0)return false;
  if(f.side==='left')return f.motorSpeed<0&&f.angle<=cfg.lower-sl+eps;
  return f.motorSpeed>0&&f.angle>=(CALIBRATION.referenceHarness.rightFlipperFullTableHeldStopDeg-.08)*Math.PI/180;
}
function applyFlipperContactResponse(ball,f,q,normal,restitution,friction){
  // At a powered hard stop Box2D solves motor + joint limit + contact together.
  // The clean-room sequential solver cannot let a slow resting contact kick the
  // flipper away from that stop between substeps, or the flipper pumps energy
  // back into the ball. Treat slow contacts at a powered stop as a static support.
  const surfaceV0={x:-f.omega*(q.y-f.pivot.y),y:f.omega*(q.x-f.pivot.x)};
  const relN0=dot(ball.vx-surfaceV0.x,ball.vy-surfaceV0.y,normal.x,normal.y);
  if(flipperHeldAtStop(f)&&Math.abs(relN0)<RESTITUTION_THRESHOLD_PX){
    f.omega=0;
    applyStaticContactResponse(ball,normal,restitution,friction,{x:0,y:0});
    return;
  }
  const bp=CALIBRATION.ball,fp=CALIBRATION.flipper[f.side],tx=-normal.y,ty=normal.x;
  const rx=(q.x-f.pivot.x)/PPM,ry=(q.y-f.pivot.y)/PPM;
  let svx=-f.omega*(q.y-f.pivot.y),svy=f.omega*(q.x-f.pivot.x);
  const vn=dot((ball.vx-svx)/PPM,(ball.vy-svy)/PPM,normal.x,normal.y);if(vn>=0)return;
  const rn=cross(rx,ry,normal.x,normal.y),denN=1/bp.massKg+(rn*rn)/fp.inertiaAboutPivotKgM2;
  const e=Math.abs(vn)<1?0:Math.max(PARITY.ballRestitution,restitution);
  const jn=-(1+e)*vn/denN;
  ball.vx+=(jn/bp.massKg)*PPM*normal.x;ball.vy+=(jn/bp.massKg)*PPM*normal.y;
  f.omega+=(-jn*rn)/fp.inertiaAboutPivotKgM2;
  svx=-f.omega*(q.y-f.pivot.y);svy=f.omega*(q.x-f.pivot.x);
  const rBall=ball.r/PPM,relT=(dot(ball.vx-svx,ball.vy-svy,tx,ty)-ball.omega*ball.r)/PPM;
  const rt=cross(rx,ry,tx,ty),denT=1/bp.massKg+(rBall*rBall)/bp.inertiaKgM2+(rt*rt)/fp.inertiaAboutPivotKgM2;
  const mu=Math.sqrt(PARITY.ballFriction*friction),jt=clamp(-relT/denT,-mu*Math.abs(jn),mu*Math.abs(jn));
  ball.vx+=(jt/bp.massKg)*PPM*tx;ball.vy+=(jt/bp.massKg)*PPM*ty;ball.omega+=(-rBall*jt)/bp.inertiaKgM2;f.omega+=(-jt*rt)/fp.inertiaAboutPivotKgM2;
  clampBallSpeeds(ball);
}
function applyKickerContactResponse(ball,k,normal,restitution,friction){
  const bp=CALIBRATION.ball,mk=CALIBRATION.kicker.massKg,tx=-normal.y,ty=normal.x;
  const vn=dot((ball.vx)/PPM,(ball.vy-k.vy)/PPM,normal.x,normal.y);if(vn>=0)return;
  const denN=1/bp.massKg+(normal.y*normal.y)/mk,e=Math.abs(vn)<1?0:Math.max(PARITY.ballRestitution,restitution),jn=-(1+e)*vn/denN;
  ball.vx+=(jn/bp.massKg)*PPM*normal.x;ball.vy+=(jn/bp.massKg)*PPM*normal.y;k.vy+=(-jn*normal.y/mk)*PPM;
  const rBall=ball.r/PPM,relT=(dot(ball.vx,ball.vy-k.vy,tx,ty)-ball.omega*ball.r)/PPM;
  const denT=1/bp.massKg+(rBall*rBall)/bp.inertiaKgM2+(ty*ty)/mk,mu=Math.sqrt(PARITY.ballFriction*friction),jt=clamp(-relT/denT,-mu*Math.abs(jn),mu*Math.abs(jn));
  ball.vx+=(jt/bp.massKg)*PPM*tx;ball.vy+=(jt/bp.massKg)*PPM*ty;ball.omega+=(-rBall*jt)/bp.inertiaKgM2;k.vy+=(-jt*ty/mk)*PPM;clampBallSpeeds(ball);
}
function collideCircleSegment(ball,a,b,restitution=0,friction=.2){const q=closestPointOnSegment(ball.x,ball.y,a.x,a.y,b.x,b.y);let dx=ball.x-q.x,dy=ball.y-q.y,d2=dx*dx+dy*dy;if(d2>=ball.r*ball.r)return false;let d=Math.sqrt(Math.max(d2,EPS)),nx=dx/d,ny=dy/d;if(d2<EPS){const sx=b.x-a.x,sy=b.y-a.y,sl=Math.hypot(sx,sy)||1;nx=-sy/sl;ny=sx/sl;d=0;if(dot(ball.vx,ball.vy,nx,ny)>0){nx=-nx;ny=-ny;}}const pen=ball.r-d;ball.x+=nx*(pen+.01);ball.y+=ny*(pen+.01);applyStaticContactResponse(ball,{x:nx,y:ny},restitution,friction);return true;}
export function collideCircleChain(ball,p,restitution=0,friction=.2){let hit=false;for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];hit=collideCircleSegment(ball,{x:a[0],y:a[1]},{x:b[0],y:b[1]},restitution,friction)||hit;}return hit;}
function collideCircleCircle(ball,c,restitution=0,friction=.2){let dx=ball.x-c.x,dy=ball.y-c.y,min=ball.r+c.radius,d2=dx*dx+dy*dy;if(d2>=min*min)return false;let d=Math.sqrt(Math.max(d2,EPS)),nx=dx/d,ny=dy/d;if(d2<EPS){nx=1;ny=0;d=0;}const pen=min-d;ball.x+=nx*(pen+.01);ball.y+=ny*(pen+.01);applyStaticContactResponse(ball,{x:nx,y:ny},restitution,friction);return true;}
function aabbContact(ball,r){const l=r.x-r.width/2,rr=r.x+r.width/2,t=r.y-r.height/2,bb=r.y+r.height/2,qx=clamp(ball.x,l,rr),qy=clamp(ball.y,t,bb);let dx=ball.x-qx,dy=ball.y-qy,d2=dx*dx+dy*dy,nx,ny,pen;if(d2<EPS&&ball.x>=l&&ball.x<=rr&&ball.y>=t&&ball.y<=bb){const ds=[{d:ball.x-l,nx:-1,ny:0},{d:rr-ball.x,nx:1,ny:0},{d:ball.y-t,nx:0,ny:-1},{d:bb-ball.y,nx:0,ny:1}].sort((a,b)=>a.d-b.d);({nx,ny}=ds[0]);pen=ball.r+ds[0].d;}else{const d=Math.sqrt(Math.max(d2,EPS));if(d>=ball.r)return null;nx=dx/d;ny=dy/d;pen=ball.r-d;}return{normal:{x:nx,y:ny},pen};}
function collideCircleAabb(ball,r,restitution=0,friction=.2){const c=aabbContact(ball,r);if(!c)return false;ball.x+=c.normal.x*(c.pen+.01);ball.y+=c.normal.y*(c.pen+.01);applyStaticContactResponse(ball,c.normal,restitution,friction);return true;}
function collideCircleKicker(ball,k,restitution=0,friction=.2){const c=aabbContact(ball,k);if(!c)return false;ball.x+=c.normal.x*(c.pen+.01);ball.y+=c.normal.y*(c.pen+.01);applyKickerContactResponse(ball,k,c.normal,restitution,friction);return true;}
function collideCircleFlipper(ball,verts,f,restitution=0,friction=.2){let best=null;for(let i=0;i<verts.length;i++){const a=verts[i],b=verts[(i+1)%verts.length],q=closestPointOnSegment(ball.x,ball.y,a.x,a.y,b.x,b.y),dx=ball.x-q.x,dy=ball.y-q.y,d2=dx*dx+dy*dy;if(!best||d2<best.d2)best={q,d2};}const inside=pointInPolygon(ball.x,ball.y,verts),d=Math.sqrt(Math.max(best.d2,EPS));if(!inside&&d>=ball.r)return false;let nx,ny,pen;if(inside){nx=(best.q.x-ball.x)/d;ny=(best.q.y-ball.y)/d;pen=ball.r+d;}else{nx=(ball.x-best.q.x)/d;ny=(ball.y-best.q.y)/d;pen=ball.r-d;}if(best.d2<EPS){nx=0;ny=-1;}ball.x+=nx*(pen+.01);ball.y+=ny*(pen+.01);applyFlipperContactResponse(ball,f,best.q,{x:nx,y:ny},restitution,friction);return true;}
function overlapsSensor(ball,s){const l=s.x-s.width/2,r=s.x+s.width/2,t=s.y-s.height/2,b=s.y+s.height/2,qx=clamp(ball.x,l,r),qy=clamp(ball.y,t,b),dx=ball.x-qx,dy=ball.y-qy;return dx*dx+dy*dy<=ball.r*ball.r;}

const BASE_SENSORS=[['topLeft0',43,166,7,19],['topLeft1',67,166,7,19],['topLeft2',93,166,7,19],['topLeft3',117,166,7,19],['top0',190,228,13,2],['top1',214,231,13,2],['top2',239,231,13,2],['top3',264,228,13,2],['middle0',36,480,3,14],['middle1',364,480,3,14],['down0',45,606,7,19],['down1',355,606,7,19],['rampActivate0',91,108,6,15],['rampActivate1',178,143,6,15],['rampActivate2',262,180,6,16],['rampDeactivate0',60,105,6,15],['rampDeactivate1',210,175,6,16],['rampDeactivate2',250,143,6,15],['thirdRamp',250,25,6,15],['tunnelLeft',48,422,18,4],['tunnelRight',420,315,4,18],['loseBall',199,812,64,8]].map(([id,x,y,width,height])=>({id,x,y,width,height}));
const RAMP_SENSORS=[['rampFinishLeft',50,556,12,10],['rampFinishRight',355,580,12,10]].map(([id,x,y,width,height])=>({id,x,y,width,height}));

export class DocDonkeysParityPhysics extends PhysicsAdapter {
  constructor({flipperProfile='docdonkeys'}={}){super();this.internalSubsteps=4;this.flipperProfile=flipperProfile==='flash-enhanced'?'flash-enhanced':'docdonkeys';this.reset();}
  reset(){
    this.ball={x:PARITY.ballStart.x,y:PARITY.ballStart.y,vx:0,vy:0,omega:0,r:PARITY.ballRadius,active:true,asleep:false,sleepTime:0};
    this.flippers={left:{side:'left',angle:0,omega:0,motorSpeed:0,maxTorque:0,pivot:{...PARITY.flippers.left.pivot}},right:{side:'right',angle:0,omega:0,motorSpeed:0,maxTorque:0,pivot:{...PARITY.flippers.right.pivot}}};
    this.kicker={x:PARITY.kicker.x,y:PARITY.kicker.y,vy:0,width:PARITY.kicker.width,height:PARITY.kicker.height,motorSpeed:0,maxForce:0};
    this.controlPrev={left:false,right:false,launch:false};
    this.flags={lightsTopLeft:[false,false,false,false],lightsTop:[false,false,false,false],lightsMiddle:[false,false],lightsDown:[false,false],rampsActive:false,rampDone:[false,false],rampEventDone:[false,false],thirdRamp:false,arrows:[false,false,false],tunnels:[false,false],pegs:[false,false,false]};
    this.pegsActive=[true,true,true];this.topRightBumperActive=true;this.tunnel=null;this.sensorContacts=new Set();this.solidContacts=new Set();
    this.collisionRampsActive=false;this.collisionPegsActive=[true,true,true];this.collisionTopRightBumperActive=true;this.lastSubsteps=this.internalSubsteps;this.restTracker={x:this.ball.x,y:this.ball.y,time:0};
  }
  resetBall(){Object.assign(this.ball,{x:PARITY.ballStart.x,y:PARITY.ballStart.y,vx:0,vy:0,omega:0,active:true,asleep:false,sleepTime:0});this.sensorContacts.clear();this.solidContacts.clear();this.tunnel=null;this.restTracker={x:this.ball.x,y:this.ball.y,time:0};}
  restartTable(){this.reset();}
  wakeBall(){if(this.ball.asleep){this.ball.asleep=false;this.ball.sleepTime=0;this.restTracker={x:this.ball.x,y:this.ball.y,time:0};}}
  updateSleepState(dt,hadContact){
    if(!this.ball.active||this.tunnel){this.ball.asleep=false;this.ball.sleepTime=0;return;}
    const lin=Math.hypot(this.ball.vx,this.ball.vy),ang=Math.abs(this.ball.omega);
    if(hadContact&&lin<=CALIBRATION.box2d.linearSleepTolerancePixelsPerSecond&&ang<=CALIBRATION.box2d.angularSleepToleranceRadiansPerSecond){
      this.ball.sleepTime+=dt;
      if(this.ball.sleepTime>=CALIBRATION.box2d.timeToSleepSeconds){this.ball.asleep=true;this.ball.vx=0;this.ball.vy=0;this.ball.omega=0;}
    }else{this.ball.sleepTime=0;this.ball.asleep=false;}
  }
  stabilizePoweredFlipperRest(contacts){
    if(!this.ball.active||this.tunnel||contacts.size===0)return false;
    const persistent=[];
    for(const id of contacts){
      if(id.startsWith('flipper:')&&this.solidContacts.has(id))persistent.push(id.slice('flipper:'.length));
    }
    if(!persistent.length)return false;
    // This is a numerical projection, not a new gameplay rule. Box2D solves the
    // flipper motor, joint limit and ball contact in one iterative constraint
    // system. Our sequential clean-room solver leaves sub-pixel residual motion.
    // Only collapse that residual when a powered flipper is already at its hard
    // stop and the ball is effectively stationary.
    if(!persistent.every(side=>flipperHeldAtStop(this.flippers[side])&&Math.abs(this.flippers[side].omega)<.08))return false;
    const lin=Math.hypot(this.ball.vx,this.ball.vy),ang=Math.abs(this.ball.omega);
    if(lin>1.0||ang>.10)return false;
    this.ball.vx=0;this.ball.vy=0;this.ball.omega=0;
    return true;
  }
  updateConstraintRest(dt,contacts){
    if(!this.ball.active||this.tunnel||this.ball.asleep){this.restTracker={x:this.ball.x,y:this.ball.y,time:0};return false;}
    const ids=[...new Set([...contacts,...this.solidContacts])],heldSides=ids.filter(id=>id.startsWith('flipper:')).map(id=>id.slice(8)).filter(side=>flipperHeldAtStop(this.flippers[side]));
    const hasSecondSupport=ids.some(id=>id.startsWith('wall:')||id.startsWith('attacher')||id==='kicker')||heldSides.length>=2;
    const dx=this.ball.x-this.restTracker.x,dy=this.ball.y-this.restTracker.y,drift=Math.hypot(dx,dy);
    const candidate=heldSides.length>0&&hasSecondSupport&&drift<=0.015&&Math.abs(this.ball.omega)<=0.5&&Math.hypot(this.ball.vx,this.ball.vy)<=5;
    if(candidate)this.restTracker.time+=dt;else this.restTracker.time=0;
    this.restTracker.x=this.ball.x;this.restTracker.y=this.ball.y;
    if(this.restTracker.time>=CALIBRATION.box2d.timeToSleepSeconds){this.ball.asleep=true;this.ball.sleepTime=CALIBRATION.box2d.timeToSleepSeconds;this.ball.vx=0;this.ball.vy=0;this.ball.omega=0;return true;}
    return false;
  }
  frameSubsteps(dt){
    const travel=Math.hypot(this.ball.vx,this.ball.vy)*dt;
    return clamp(Math.max(this.internalSubsteps,Math.ceil(travel/Math.max(1,this.ball.r*.8))),this.internalSubsteps,16);
  }
  flipperLimitState(side){const a=this.flippers[side].angle,c=PARITY.flippers[side],sl=CALIBRATION.box2d.angularSlopRadians;if(side==='left'){const lower=this.controlPrev.left?c.lower:c.lower-sl;return a<=lower?'lower':a>=c.upper?'upper':'inactive';}return a<=c.lower?'lower':a>=c.upper?'upper':'inactive';}
  kickerLimitState(){const min=PARITY.kicker.y+PARITY.kicker.lowerTranslation*PPM,max=PARITY.kicker.y+PARITY.kicker.upperTranslation*PPM;return this.kicker.y<=min?'lower':this.kicker.y>=max?'upper':'inactive';}
  prepareFlipperVelocity(side,dt,limitState){const f=this.flippers[side],cfg=CALIBRATION.flipper[side],g=PARITY.gravityMetersPerSecond2,c=Math.cos(f.angle),sn=Math.sin(f.angle),d=cfg.comFromPivotMeters,rx=d.x*c-d.y*sn;f.omega+=(cfg.massKg*g*rx/cfg.inertiaAboutPivotKgM2)*dt;if(f.maxTorque>0){const md=f.maxTorque/cfg.inertiaAboutPivotKgM2*dt;f.omega+=clamp(f.motorSpeed-f.omega,-md,md);}if(limitState==='lower'&&f.omega<0)f.omega=0;if(limitState==='upper'&&f.omega>0)f.omega=0;f.omega=clamp(f.omega,-CALIBRATION.box2d.maxAngularSpeedRadiansPerSecond,CALIBRATION.box2d.maxAngularSpeedRadiansPerSecond);}
  correctFlipperLimit(side,limitState){if(limitState==='inactive')return;const f=this.flippers[side],cfg=PARITY.flippers[side],sl=CALIBRATION.box2d.angularSlopRadians,frac=CALIBRATION.flipper.limitCorrectionFraction,mx=CALIBRATION.flipper.maxLimitCorrectionRadians;if(limitState==='lower'){const target=cfg.lower-sl;if(f.angle<target)f.angle+=Math.min((target-f.angle)*frac,mx);}else{const target=(side==='right'?CALIBRATION.referenceHarness.rightFlipperFullTableHeldStopDeg*Math.PI/180:cfg.upper+sl);if(f.angle>target)f.angle-=Math.min((f.angle-target)*frac,mx);}}
  prepareKickerVelocity(dt,limitState){const k=this.kicker,m=CALIBRATION.kicker.massKg;k.vy+=PARITY.gravityPixelsPerSecond2*dt;if(k.maxForce<0){k.vy+=(Math.abs(k.maxForce)/m)*PPM*dt;}else if(k.maxForce>0){const md=(k.maxForce/m)*PPM*dt,target=k.motorSpeed*PPM;k.vy+=clamp(target-k.vy,-md,md);}if(limitState==='lower'&&k.vy<0)k.vy=0;if(limitState==='upper'&&k.vy>0)k.vy=0;}
  correctKickerLimit(_limitState){const sl=CALIBRATION.box2d.linearSlopPixels,min=PARITY.kicker.y+PARITY.kicker.lowerTranslation*PPM,max=PARITY.kicker.y+PARITY.kicker.upperTranslation*PPM;if(this.kicker.y<min-sl)this.kicker.y=min-sl;if(this.kicker.y>max+sl)this.kicker.y=max+sl;}
  applyFlashPressSnap(side){
    if(this.flipperProfile!=='flash-enhanced')return;
    const f=this.flippers[side],dir=side==='left'?-1:1;
    f.omega=clamp(f.omega+dir*RESTORATION.flashFlipperSnap.angularVelocityAssistRadiansPerSecond,-CALIBRATION.box2d.maxAngularSpeedRadiansPerSecond,CALIBRATION.box2d.maxAngularSpeedRadiansPerSecond);
    this.wakeBall();
  }
  updateControlCommands(input){for(const side of ['left','right']){const down=!!input.down[side],prev=this.controlPrev[side],f=this.flippers[side],cfg=PARITY.flippers[side];if(down&&!prev){f.maxTorque=cfg.activeTorque;f.motorSpeed=cfg.activeSpeed;this.applyFlashPressSnap(side);}else if(!down&&prev){f.maxTorque=cfg.returnTorque;f.motorSpeed=cfg.returnSpeed;}else if(!down&&!prev){f.maxTorque=0;f.motorSpeed=0;}this.controlPrev[side]=down;}const down=!!input.down.launch,prev=this.controlPrev.launch;if(down&&!prev){this.kicker.maxForce=PARITY.kicker.heldMaxMotorForce;}else if(!down&&prev){/* KEY_UP only played audio in the C++ */}else if(!down&&!prev){this.kicker.maxForce=this.kicker.y/PPM+5;this.kicker.motorSpeed=PARITY.kicker.returnMotorSpeedMetersPerSecond;}this.controlPrev.launch=down;}
  update(dt,input,state,hooks={}){
    const fls={left:this.flipperLimitState('left'),right:this.flipperLimitState('right')},ks=this.kickerLimitState(),contacts=new Set(),sensors=new Set();
    const inputChanged=['left','right','launch'].some(k=>!!input.down[k]!==!!this.controlPrev[k]);
    if(this.ball.asleep&&(inputChanged||Math.abs(this.flippers.left.omega)>.01||Math.abs(this.flippers.right.omega)>.01||Math.abs(this.kicker.vy)>.5))this.wakeBall();
    this.prepareFlipperVelocity('left',dt,fls.left);this.prepareFlipperVelocity('right',dt,fls.right);this.prepareKickerVelocity(dt,ks);
    const steps=this.frameSubsteps(dt),subdt=dt/steps;this.lastSubsteps=steps;
    for(let step=0;step<steps;step++){
      this.flippers.left.angle+=this.flippers.left.omega*subdt;this.flippers.right.angle+=this.flippers.right.omega*subdt;this.kicker.y+=this.kicker.vy*subdt;
      if(!state.gameOver&&!this.tunnel&&this.ball.active&&!this.ball.asleep){this.ball.vy+=PARITY.gravityPixelsPerSecond2*subdt;clampBallSpeeds(this.ball);this.ball.x+=this.ball.vx*subdt;this.ball.y+=this.ball.vy*subdt;this.solveSolids(contacts,hooks);this.solveSensors(sensors,hooks);if(this.ball.y>LOGICAL_HEIGHT+80||this.ball.x<-80||this.ball.x>508)this.triggerLoseBall(hooks,'outOfBounds');}
    }
    this.correctFlipperLimit('left',fls.left);this.correctFlipperLimit('right',fls.right);this.correctKickerLimit(ks);
    if(this.tunnel){this.tunnel.remaining-=dt;if(this.tunnel.remaining<=0)this.finishTunnel();}
    if(!this.ball.asleep){if(!this.updateConstraintRest(dt,contacts))this.updateSleepState(dt,contacts.size>0);}
    this.solidContacts=contacts;this.sensorContacts=sensors;
    // Match the C++ module order: collision callbacks happen during Box2D::Step, while
    // ramp/peg/bumper body creation-destruction is applied by ModuleSceneIntro afterwards.
    this.collisionRampsActive=this.flags.rampsActive;this.collisionPegsActive=[...this.pegsActive];this.collisionTopRightBumperActive=this.topRightBumperActive;
    this.updateControlCommands(input);
  }
  flipperVertices(side){const raw=side==='left'?GEOMETRY.leftFlipper:GEOMETRY.rightFlipper,pivotLocal=side==='left'?{x:10,y:70}:{x:110,y:70},pivot=this.flippers[side].pivot,bodyOrigin={x:pivot.x-pivotLocal.x,y:pivot.y-pivotLocal.y};return raw.map(p=>rotatePoint(p,pivotLocal,bodyOrigin,this.flippers[side].angle));}
  hit(id,contacts,callback){const firstThisFrame=!contacts.has(id);contacts.add(id);if(firstThisFrame&&!this.solidContacts.has(id))callback?.();}
  solveSolids(contacts,hooks){const b=this.ball,sets=this.collisionRampsActive?[GEOMETRY.leftRampWalls,GEOMETRY.rightRampWalls]:[GEOMETRY.outsideWalls,GEOMETRY.topLeftWalls,GEOMETRY.downLeftWalls,GEOMETRY.downRightWalls];sets.push(GEOMETRY.leftBumperHugger,GEOMETRY.rightBumperHugger);sets.forEach((p,i)=>{if(collideCircleChain(b,p,0,.2))this.hit(`wall:${i}`,contacts,()=>hooks.onSfx?.('ballCollision'));});if(!this.collisionRampsActive)[[55,165,3,23],[80,165,4,23],[105,165,4,23]].forEach((r,i)=>{if(collideCircleAabb(b,{x:r[0],y:r[1],width:r[2],height:r[3]},0,.2))this.hit(`topPost:${i}`,contacts,()=>hooks.onSfx?.('ballCollision'));});if(collideCircleChain(b,GEOMETRY.leftBumper,1.75,.2))this.hit('bigBumperLeft',contacts,()=>{hooks.onScore?.(PARITY.scores.bumper,'bigBumperLeft');hooks.onSfx?.('bigBumper');hooks.onSfx?.('ballCollision');});if(collideCircleChain(b,GEOMETRY.rightBumper,1.75,.2))this.hit('bigBumperRight',contacts,()=>{hooks.onScore?.(PARITY.scores.bumper,'bigBumperRight');hooks.onSfx?.('bigBumper');hooks.onSfx?.('ballCollision');});if(collideCircleAabb(b,{x:10,y:470,width:40,height:20},4,.2))this.hit('leftKicker',contacts,()=>{hooks.onScore?.(PARITY.scores.leftKicker,'leftKicker');hooks.onSfx?.('leftKicker');hooks.onSfx?.('ballCollision');});const small=[{id:'small0',x:61,y:212,radius:10},{id:'small1',x:102,y:217,radius:8},{id:'small2',x:77,y:250,radius:10}];for(let i=0;i<small.length;i++){if(this.collisionRampsActive&&i>0)continue;const c=small[i];if(collideCircleCircle(b,c,.75,.2))this.hit(c.id,contacts,()=>{hooks.onScore?.(PARITY.scores.smallBumper,'smallBumper');hooks.onSfx?.('smallBumper');hooks.onSfx?.('ballCollision');});}if(this.collisionTopRightBumperActive&&collideCircleCircle(b,{x:400,y:153,radius:11},.75,.2))this.hit('topRightBumper',contacts,()=>{hooks.onScore?.(PARITY.scores.smallBumper,'smallBumper');hooks.onSfx?.('smallBumper');hooks.onSfx?.('ballCollision');});const pegs=[{x:25,y:520,radius:5},{x:200,y:764,radius:5},{x:375,y:520,radius:5}];for(let i=0;i<3;i++)if(this.collisionPegsActive[i]&&collideCircleCircle(b,pegs[i],.75,.2))this.hit(`peg${i}`,contacts,()=>{this.pegsActive[i]=false;this.flags.pegs[i]=true;hooks.onSfx?.('peg');hooks.onSfx?.('ballCollision');});
    // CreateAttacherBody() gives each joint a 9px-diameter static circle.
    // These bearings are visible in the clean-room artwork because they collide in Box2D.
    for(const [id,x,y] of [['attacherLeft',147,745],['attacherRight',252,745],['attacherKicker',412,801]])if(collideCircleCircle(b,{x,y,radius:4.5},0,.2))this.hit(id,contacts,()=>hooks.onSfx?.('ballCollision'));
    for(const side of ['left','right']){const f=this.flippers[side];if(collideCircleFlipper(b,this.flipperVertices(side),f,0,.2))this.hit(`flipper:${side}`,contacts,()=>hooks.onSfx?.('ballCollision'));}if(collideCircleKicker(b,this.kicker,0,.2))this.hit('kicker',contacts,()=>{hooks.onSfx?.('ballCollision');if(this.kicker.vy<-30)hooks.onLaunch?.();});}
  solveSensors(sensorSet,hooks) {
    const sensors=this.collisionRampsActive?BASE_SENSORS.concat(RAMP_SENSORS):BASE_SENSORS;
    for(const s of sensors) {
      if(!overlapsSensor(this.ball,s)) continue;
      const firstThisFrame=!sensorSet.has(s.id);
      sensorSet.add(s.id);
      if(firstThisFrame&&!this.sensorContacts.has(s.id)) this.onSensorEnter(s.id,hooks);
      if(!this.ball.active || this.tunnel) break;
    }
  }

  onSensorEnter(id,hooks) {
    hooks.onSfx?.('ballCollision');
    if(id.startsWith('topLeft')) {
      if(this.flags.rampsActive)return;
      const i=Number(id.slice(-1)); this.flags.lightsTopLeft[i]=true; hooks.onScore?.(PARITY.scores.topLeftLight,id); hooks.onSfx?.('light'); this.checkThirdRamp(hooks); return;
    }
    if(/^top\d$/.test(id)) {
      const i=Number(id.slice(-1)); this.flags.lightsTop[i]=true; hooks.onScore?.(PARITY.scores.topLights,id); hooks.onSfx?.('light'); this.checkMultiplier(hooks); return;
    }
    if(id==='middle0'||id==='middle1') {
      const i=Number(id.slice(-1));this.flags.lightsMiddle[i]=true;hooks.onScore?.(PARITY.scores.topLights,id);hooks.onSfx?.('lateralLight');this.checkRampEventStart();return;
    }
    if(id==='down0'||id==='down1') {
      const i=Number(id.slice(-1));hooks.onScore?.(PARITY.scores.pegRecovery,id);
      if(this.flags.rampDone[i]) {
        if(!this.flags.lightsDown[i]) this.flags.lightsDown[i]=true;
        else {this.restorePegs(hooks,true);this.flags.lightsDown[i]=false;}
        this.flags.rampDone[i]=false;
      } return;
    }
    if(id.startsWith('rampActivate')) {
      if(!this.flags.rampsActive){this.flags.rampsActive=true;hooks.onScore?.(PARITY.scores.rampEntrance,id);hooks.onSfx?.('rampEntrance');hooks.onEvent?.('rampEntrance');} return;
    }
    if(id.startsWith('rampDeactivate')) {if(this.flags.rampsActive)this.flags.rampsActive=false;return;}
    if(id==='rampFinishLeft'||id==='rampFinishRight') {
      const i=id==='rampFinishLeft'?0:1;this.flags.rampDone[i]=true;
      const arrowIndex=i===0?1:0;
      if(this.flags.arrows[arrowIndex]){this.flags.arrows[arrowIndex]=false;this.flags.rampEventDone[i]=true;this.checkRampEventEnd(hooks);}
      this.flags.rampsActive=false; hooks.onSfx?.('rampExit'); hooks.onEvent?.(i===0?'rampLeft':'rampRight'); return;
    }
    if(id==='thirdRamp') {
      this.flags.thirdRamp=false;this.flags.arrows[2]=false;this.topRightBumperActive=true;hooks.onScore?.(PARITY.scores.thirdRamp,id);hooks.onSfx?.('thirdRamp');hooks.onEvent?.('thirdRamp');return;
    }
    if(id==='tunnelLeft'||id==='tunnelRight') {
      hooks.onScore?.(PARITY.scores.tunnel,id);hooks.onSfx?.('tunnel');hooks.onEvent?.('tunnel');this.ball.active=false;
      const fromLeft=id==='tunnelLeft';this.flags.tunnels[fromLeft?0:1]=true;this.tunnel={remaining:PARITY.tunnelTimeSeconds,exit:fromLeft?'right':'left',flagIndex:fromLeft?0:1};return;
    }
    if(id==='loseBall'){this.triggerLoseBall(hooks,'sensor');}
  }

  checkMultiplier(hooks){if(this.flags.lightsTop.every(Boolean)){hooks.onMultiplier?.();this.flags.lightsTop.fill(false);}}
  checkThirdRamp(hooks){
    if(!this.flags.lightsTopLeft.every(Boolean))return;
    if(this.flags.thirdRamp) hooks.onMultiplier?.();
    else {this.flags.thirdRamp=true;this.flags.arrows[2]=true;this.topRightBumperActive=false;hooks.onEvent?.('thirdRampReady');}
    this.flags.lightsTopLeft.fill(false);
  }
  checkRampEventStart(){if(this.flags.lightsMiddle.every(Boolean)&&!this.flags.arrows[0]&&!this.flags.arrows[1]){this.flags.arrows[0]=this.flags.arrows[1]=true;}}
  checkRampEventEnd(hooks){if(this.flags.rampEventDone.every(Boolean)){hooks.onAddBall?.();this.flags.lightsMiddle.fill(false);this.flags.rampEventDone.fill(false);this.flags.arrows[0]=this.flags.arrows[1]=false;}}

  restorePegs(hooks,awardMissing){
    if(awardMissing){const missing=this.pegsActive.filter(v=>!v).length;for(let i=0;i<missing;i++)hooks.onScore?.(PARITY.scores.pegRecovery,'pegRestore');}
    this.pegsActive.fill(true);this.flags.pegs.fill(false);
  }

  triggerLoseBall(hooks,reason){if(!this.ball.active)return;this.ball.active=false;this.restorePegs(hooks,false);hooks.onLoseBall?.(reason);}

  finishTunnel(){
    const t=this.tunnel, exit=PARITY.tunnelExits[t.exit];this.flags.tunnels[t.flagIndex]=false;this.tunnel=null;
    Object.assign(this.ball,{x:exit.x,y:exit.y,vx:exit.vx,vy:exit.vy,omega:0,active:true,asleep:false,sleepTime:0});this.sensorContacts.clear();this.solidContacts.clear();
  }

  // Diagnostic-only event injector. It deliberately routes through the same
  // transition functions used by real sensor contacts instead of mutating the
  // challenge flags from the UI. This is enabled only by ?debug=states.
  debugInject(action,hooks={}){
    const sensor=/^(?:topLeft[0-3]|top[0-3]|middle[01]|down[01]|rampActivate[0-2]|rampDeactivate[0-2]|rampFinishLeft|rampFinishRight|thirdRamp|tunnelLeft|tunnelRight)$/.test(action);
    if(sensor){this.onSensorEnter(action,hooks);return true;}
    const peg=/^peg([0-2])$/.exec(action);
    if(peg){const i=Number(peg[1]);this.pegsActive[i]=false;this.flags.pegs[i]=true;hooks.onSfx?.('peg');return true;}
    if(action==='drain'){this.triggerLoseBall(hooks,'debug');return true;}
    if(action==='tunnelTimeout'&&this.tunnel){this.tunnel.remaining=0;this.finishTunnel();return true;}
    return false;
  }

  snapshot(){return {ball:{...this.ball},flippers:{left:{...this.flippers.left,vertices:this.flipperVertices('left')},right:{...this.flippers.right,vertices:this.flipperVertices('right')}},kicker:{...this.kicker},flags:JSON.parse(JSON.stringify(this.flags)),pegsActive:[...this.pegsActive],topRightBumperActive:this.topRightBumperActive,tunnel:this.tunnel?{...this.tunnel}:null,solver:{name:'MechanicalNightPhysics1.0',flipperProfile:this.flipperProfile,substeps:this.lastSubsteps,fixedDt:FIXED_DT,contacts:this.solidContacts.size}};}
}
