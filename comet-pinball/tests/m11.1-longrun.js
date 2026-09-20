'use strict';
// M11.1 follow-up: the first 3600 frames exactly reuse M11 control scripts.
// The second 3600 frames use pulses in both modes, with NO forced drains or reposition.
const P=require('../public/js/physics.js'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
global.window={};require('../public/data/playfield.js');const table=window.COMET_PLAYFIELD;
const N=process.argv.includes('--sample')?20:100,BOUNDARY=3600,END=7200,mode=process.argv.includes('--reactive-to-pulse')?'reactive-to-pulse':'pulse-only';
function random(seed){let s=(seed+0x9e3779b9)>>>0;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};}
const rows=[];
for(let ix=0;ix<N;ix++){ const seed=(process.argv.includes('--sample')&&ix===N-1)?34:ix;
 const engine=new P.Engine(table),rng=random(seed);
 let balls=0,score=0,launches=0,lastLaunch=-10000,drainFrame=-1,plunged=false;
 let stillFrames=0,firstPhysicalStall=null,activeFrames2=0,travel2=0,lowFrames2=0,upperFrames2=0;
 let firstCut=null,drains=[],maxSpeed2=0,minSpeed2=Infinity,frames=0;
 for(let frame=0;frame<END;frame++){
  frames=frame+1;
  if(frame===BOUNDARY)firstCut={balls,score,launches,x:engine.ball.x,y:engine.ball.y};
  if(drainFrame>=0){if(balls>=3)break;if(frame-drainFrame<12)continue;engine.reset();plunged=false;drainFrame=-1;stillFrames=0;}
  const b=engine.ball,beforeX=b.x,beforeY=b.y;
  const lane=b.x>.70&&b.y<.05,launch=lane&&frame-lastLaunch>68;
  const phase=(frame+seed*7)%141,jitter=rng();
  const pulse=mode==='pulse-only'||frame>=BOUNDARY;
  const left=pulse?(phase>=10&&phase<19):((b.y<.48&&b.x<.42&&jitter>.12)||(phase>=10&&phase<19));
  const right=pulse?(phase>=47&&phase<56):((b.y<.48&&b.x>.29&&jitter>.16)||(phase>=47&&phase<56));
  engine.step(1/60,(frame+1)*1000/60,{left,right,plunge:launch},{
    onPlunge(){launches++;lastLaunch=frame;plunged=true;},
    onDrain(){if(drainFrame!==-1)return;drainFrame=frame;drains.push(frame);if(plunged)balls++;},
    onHit(id){score+=table.scores[id]||0;}
  });
  const speed=Math.hypot(b.vx,b.vy),dist=Math.hypot(b.x-beforeX,b.y-beforeY);
  if(plunged&&speed<1e-4&&dist<1e-7&&!engine.drainLatched&&!lane)stillFrames++;
  else stillFrames=0;
  if(firstPhysicalStall===null&&stillFrames>=300)firstPhysicalStall={frame,x:b.x,y:b.y,speed};
  if(frame>=BOUNDARY){if(speed>1e-3)activeFrames2++;travel2+=dist;if(b.y<.40)lowFrames2++;if(b.y>1.1)upperFrames2++;maxSpeed2=Math.max(maxSpeed2,speed);minSpeed2=Math.min(minSpeed2,speed);}
  assert(Number.isFinite(b.x)&&Number.isFinite(b.y)&&Number.isFinite(b.vx)&&Number.isFinite(b.vy)&&Number.isFinite(score),'nonfinite ball or score');
  assert(balls<=3,'invalid drain count');
 }
 if(!firstCut)firstCut={balls,score,launches,x:engine.ball.x,y:engine.ball.y,completedBeforeCut:true};
 assert.equal(drains.length,balls);
 rows.push({seed,frames,ballAt60:firstCut.balls,ballAt120:balls,scoreAt60:firstCut.score,scoreAt120:score,launches,drainFrames:drains,firstPhysicalStall,secondMinute:{activeFrames:activeFrames2,travelMeters:travel2,lowFrames:lowFrames2,upperFrames:upperFrames2,maxSpeed:maxSpeed2,minSpeed:Number.isFinite(minSpeed2)?minSpeed2:0},final:{x:engine.ball.x,y:engine.ball.y,vx:engine.ball.vx,vy:engine.ball.vy}});
}
const r={mode,seedCount:N,framesPerRun:END,completionAt60:rows.filter(x=>x.ballAt60===3).length,completionAt120:rows.filter(x=>x.ballAt120===3).length,startedIncomplete:rows.filter(x=>x.ballAt60<3).length,completedInSecondMinute:rows.filter(x=>x.ballAt60<3&&x.ballAt120===3).length,stillUnfinishedAt120:rows.filter(x=>x.ballAt120<3).length,stalled:rows.filter(x=>x.firstPhysicalStall).map(x=>({seed:x.seed,...x.firstPhysicalStall})),secondMinuteActiveUnfinished:rows.filter(x=>x.ballAt120<3&&x.secondMinute.activeFrames>120).length,rows};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(__dirname,'../reports/M11.1-'+mode+(N===100?'':'-sample'+N)+'-120s.json'),JSON.stringify(r,null,2)+'\n');
console.log(`M11.1 ${mode}: complete by 60s=${r.completionAt60}/${N}; by 120s=${r.completionAt120}/${N}; newly completed=${r.completedInSecondMinute}; physical stillness >=5s=${r.stalled.length} (${r.stalled.map(x=>x.seed).join(',')}); unfinished with >2s active movement in second minute=${r.secondMinuteActiveUnfinished}`);
