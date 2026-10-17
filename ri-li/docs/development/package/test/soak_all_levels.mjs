import fs from 'node:fs';
import {LevelSet} from '../src/levels.mjs';
import {GameSession,STATE_PLAYING,STATE_QUIZ,STATE_QUIZ_RESULT,STATE_GAME_OVER,STATE_HIGH_SCORE} from '../src/session.mjs';
import {D_UP,D_DOWN,D_LEFT,D_RIGHT} from '../src/core.mjs';

const levels=new LevelSet(fs.readFileSync('reference/levels.dat'));
const dirs=[D_UP,D_RIGHT,D_DOWN,D_LEFT];
function lcg(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x;};}
function finite(n,name){if(!Number.isFinite(n))throw Error(`${name} is not finite: ${n}`);}

function runOne(level){
  const pick=lcg(0x52494c49^level);
  const s=new GameSession(levels,{startLevel:level,seed:level,difficulty:'normal'});
  let frames=0,pickups=0,crashes=0,maxHistory=0,maxWagons=0,completed=false;
  const frameLimit=Math.ceil(60000/16);
  while(frames<frameLimit){
    let key=null;
    if((frames%7)===0)key=dirs[pick()%4];
    const beforePick=s.oracle?.collectedEvents.length??0;
    const beforeCrash=s.oracle?.collisionCount??0;
    const snap=s.step(16,key,true);
    frames++;
    if(s.oracle){
      finite(s.oracle.d,'D');finite(s.oracle.spacing,'spacing');finite(s.oracle.speed,'speed');
      if(s.oracle.board.length!==255)throw Error(`level ${level}: board length ${s.oracle.board.length}`);
      if(s.oracle.history.length>256)throw Error(`level ${level}: history overflow ${s.oracle.history.length}`);
      maxHistory=Math.max(maxHistory,s.oracle.history.length);maxWagons=Math.max(maxWagons,s.oracle.wagonLengths.length);
      for(const g of s.oracle.lastRenderGeometry??[]){for(const [k,v] of Object.entries(g)){if(typeof v==='number')finite(v,`geometry.${k}`);}}
      pickups+=(s.oracle.collectedEvents.length-beforePick);
      crashes+=(s.oracle.collisionCount-beforeCrash);
    }
    if(s.state===STATE_QUIZ){completed=true;break;}
    if(s.state===STATE_GAME_OVER||s.state===STATE_HIGH_SCORE)break;
    if(s.state===STATE_QUIZ_RESULT)throw Error(`level ${level}: unexpected quiz_result`);
    if(![STATE_PLAYING,'death_pause','win_pause'].includes(s.state))throw Error(`level ${level}: unexpected state ${s.state}`);
    if(snap&&snap.geometry){for(const g of snap.geometry){finite(g.center_x,'center_x');finite(g.center_y,'center_y');}}
  }
  return {level,frames,pickups,crashes,maxHistory,maxWagons,completed,state:s.state,score:s.score,lives:s.lives,rngCalls:s.rng.callCount};
}
function run(){return Array.from({length:50},(_,i)=>runOne(i+1));}
const a=run(), b=run();
if(JSON.stringify(a)!==JSON.stringify(b))throw Error('soak run is not deterministic');
const summary={status:'PASS',levels:50,simulatedFrames:a.reduce((n,x)=>n+x.frames,0),pickups:a.reduce((n,x)=>n+x.pickups,0),crashes:a.reduce((n,x)=>n+x.crashes,0),levelsCompletedDuringSoak:a.filter(x=>x.completed).length,maxHistory:Math.max(...a.map(x=>x.maxHistory)),maxWagons:Math.max(...a.map(x=>x.maxWagons)),deterministicReplay:true};
console.log(JSON.stringify(summary,null,2));
