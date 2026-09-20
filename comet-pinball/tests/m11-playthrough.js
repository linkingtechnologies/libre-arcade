'use strict';
// Deterministic gameplay soak against the ORIGINAL M10.1 Engine; no synthetic drains,
// teleports, forced reset inside step(), or changes to gravity/collisions/score.
const P=require('../public/js/physics.js');
const assert=require('node:assert/strict');
global.window={};require('../public/data/playfield.js');const table=global.window.COMET_PLAYFIELD;
const MAX_FRAMES=3600,SEEDS=100;const rows=[];const PULSE=process.argv.includes('--pulse');
function random(seed){let s=(seed+0x9e3779b9)>>>0;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};}
for(let seed=0;seed<SEEDS;seed++){
  const engine=new P.Engine(table),rng=random(seed);let balls=0,score=0,launches=0,hitCount=0;
  let lastLaunch=-10000,drainFrame=-1,plunged=false,invalid=0,maxLaneStreak=0,laneStreak=0,lastMovedFrame=0,lastX=engine.ball.x,lastY=engine.ball.y;
  const drains=[],launchFrames=[];let frames=0;
  // Input policy is deterministic, independently seeded and based on ball position.
  // This is neither a bot trained to win nor evidence of realistic human play.
  for(let frame=0;frame<MAX_FRAMES;frame++){
    frames=frame+1;
    if(drainFrame>=0){
      if(balls>=3)break;
      if(frame-drainFrame<12)continue;
      engine.reset();plunged=false;drainFrame=-1;
    }
    const b=engine.ball;
    const lane=b.x>.70&&b.y<.05;
    const launch=lane && frame-lastLaunch>68;
    const phase=(frame+seed*7)%141;
    const jitter=rng();
    // Interleave reaction to low ball and varied human-like alternating presses.
    const left=PULSE?(phase>=10&&phase<19):((b.y<.48&&b.x<.42&&jitter>.12)||(phase>=10&&phase<19));
    const right=PULSE?(phase>=47&&phase<56):((b.y<.48&&b.x>.29&&jitter>.16)||(phase>=47&&phase<56));
    const beforeLaunches=launches;
    engine.step(1/60,(frame+1)*1000/60,{left,right,plunge:launch},{
      onPlunge(){launches++;lastLaunch=frame;plunged=true;launchFrames.push(frame);},
      onDrain(){if(drainFrame!==-1)return;drainFrame=frame;drains.push(frame);if(plunged)balls++;},
      onHit(id){score+=table.scores[id]||0;hitCount++;}
    });
    if(!Number.isFinite(b.x)||!Number.isFinite(b.y)||!Number.isFinite(b.vx)||!Number.isFinite(b.vy)||!Number.isFinite(score))invalid++;
    if(launches===beforeLaunches&&lane)laneStreak++;else laneStreak=0;
    maxLaneStreak=Math.max(maxLaneStreak,laneStreak);
    if(Math.hypot(b.x-lastX,b.y-lastY)>1e-6)lastMovedFrame=frame;
    lastX=b.x;lastY=b.y;
  }
  assert.equal(invalid,0,`seed ${seed}: invalid state`);
  assert(balls<=3,`seed ${seed}: > 3 balls`);
  assert.equal(drains.length,balls,`seed ${seed}: invalid drain accounting`);
  for(let i=1;i<drains.length;i++)assert(drains[i]-drains[i-1]>=12,`seed ${seed}: duplicate drain`);
  assert(score>=0&&Number.isFinite(score),`seed ${seed}: invalid score`);
  rows.push({seed,frames,completed:balls===3,balls,score,launches,hits:hitCount,drainFrames:drains,maxLaneStreak,idleFrames:frames-1-lastMovedFrame,final:{x:+engine.ball.x.toFixed(6),y:+engine.ball.y.toFixed(6),vx:+engine.ball.vx.toFixed(6),vy:+engine.ball.vy.toFixed(6)}});
}
const report={method:(PULSE?'pulse-only':'reactive-hold')+'; 100 seeded control scripts, 3600-frame ceiling (60 s) each; real M10.1 physics; reset deferred by 12 frames; manual relaunch simulated whenever physical ball is in launcher, with 68-frame cooldown; no synthetic drains or forced score',seedCount:SEEDS,maxFrames:MAX_FRAMES,complete:rows.filter(x=>x.completed).length,partial:rows.filter(x=>!x.completed).length,byBalls:Object.fromEntries([0,1,2,3].map(i=>[i,rows.filter(x=>x.balls===i).length])),longestIdle:Math.max(...rows.map(r=>r.idleFrames)),maxLaunches:Math.max(...rows.map(r=>r.launches)),rows};
const text=JSON.stringify(report,null,2)+'\n';
if(process.argv.includes('--write'))require('node:fs').writeFileSync(require('node:path').join(__dirname,'../reports/M11-playthrough-100-'+(PULSE?'pulse':'reactive')+'.json'),text);
console.log(`M11 ${PULSE?'pulse':'reactive-hold'} 100 seeded gameplay scripts: ${report.complete}/100 ended naturally within 60s; ${report.partial}/100 did not; balls ${JSON.stringify(report.byBalls)}; longest idle ${report.longestIdle} frames; max launches ${report.maxLaunches}`);
