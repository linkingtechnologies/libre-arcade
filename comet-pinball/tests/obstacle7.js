const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const P=require('../public/js/physics.js');

global.window={};
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'../public/data/playfield.js'),'utf8'));
const pf=window.COMET_PLAYFIELD,DT=1/60;
const native={normal:{x:.894427240,y:.447213590},prePoint:{x:.120349690,y:1.049859643},postPoint:{x:.122466400,y:1.048753381},normalImpulse:.587020576,tangentImpulse:-.034159675,after:{x:.135121211,y:1.055080771,vx:.625701189,vy:-.222687155,omega:-36.236320496}};
function leftPressed(age){const p=age%96;return (p>=42&&p<49)||(p>=72&&p<78);}
function rightPressed(age){const p=age%96;return (p>=54&&p<61)||(p>=78&&p<84);}
const e=new P.Engine(pf);let plunged=false,down=false,ballsPlayed=0,resetFrame=0,plungeFrame=-1,drainFrame=-1,capture=null;
for(let frame=0;frame<=133;frame++){
  if(down&&ballsPlayed<3&&frame-drainFrame===12){e.reset();down=false;resetFrame=frame;}
  const age=plunged?frame-plungeFrame:-1;
  const input={left:age>=0&&leftPressed(age),right:age>=0&&rightPressed(age),plunge:!down&&!plunged&&frame-resetFrame>=12};
  e.step(DT,(frame+1)*1000/60,input,{onPlunge(){plunged=true;down=false;plungeFrame=frame;},onDrain(){if(down)return;down=true;drainFrame=frame;if(plunged)ballsPlayed++;plunged=false;},onHit(){},onBallPolygonPostSolve(label,r){if(frame===133&&label==='obstacle:7')capture=r;}});
}
assert(capture,'full-world obstacle:7 frame-133 TOI missing');
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
assert(d(capture.normal,native.normal)<1e-6,'obstacle:7 normal diverged');
assert(d(capture.pre.points[0],native.prePoint)<1e-6,'obstacle:7 preSolve point diverged');
assert(d(capture.post.points[0],native.postPoint)<1e-6,'obstacle:7 postSolve point diverged');
assert(Math.abs(capture.normalImpulse-native.normalImpulse)<1e-6,'obstacle:7 normal impulse diverged');
assert(Math.abs(capture.tangentImpulse-native.tangentImpulse)<1e-6,'obstacle:7 tangent impulse diverged');
const positionError=Math.hypot(e.ball.x-native.after.x,e.ball.y-native.after.y),velocityError=Math.hypot(e.ball.vx-native.after.vx,e.ball.vy-native.after.vy),omegaError=Math.abs(e.ball.omega-native.after.omega);
assert(positionError<1e-6,`obstacle:7 full-world position error ${positionError}`);assert(velocityError<3e-6,`obstacle:7 full-world velocity error ${velocityError}`);assert(omegaError<3e-4,`obstacle:7 full-world omega error ${omegaError}`);
console.log('M9 obstacle:7 full-world TOI regression passed');console.log(JSON.stringify({normalImpulse:capture.normalImpulse,tangentImpulse:capture.tangentImpulse,positionError,velocityError,omegaError},null,2));
