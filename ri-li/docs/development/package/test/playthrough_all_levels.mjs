import fs from 'node:fs';
import {LevelSet} from '../src/levels.mjs';
import {GameSession,STATE_PLAYING,STATE_WIN_PAUSE,STATE_QUIZ,STATE_QUIZ_RESULT,STATE_HIGH_SCORE,STATE_GAME_OVER} from '../src/session.mjs';
import {D_UP,D_RIGHT,D_DOWN,D_LEFT} from '../src/core.mjs';
const DIRS=[D_UP,D_RIGHT,D_DOWN,D_LEFT];
const levels=new LevelSet(fs.readFileSync('reference/levels.dat'));
const solutionDoc=JSON.parse(fs.readFileSync('test/playthrough_solutions.json'));
const solutions=new Map(Object.entries(solutionDoc.levels).map(([k,v])=>[Number(k),v.directions]));
function choices(s){return DIRS.filter(d=>s.oracle.testDir(d));}
function advance(s,dir=null,maxFrames=20000){let first=true,lastP=s.oracle.history.at(-1).p,lastD=s.oracle.history.at(-1).d;for(let f=0;f<maxFrames;f++){
 const key=first?dir:null; first=false; s.step(16,key,true);
 if(s.state!==STATE_PLAYING)return f+1;
 const h=s.oracle.history.at(-1); if(h.p!==lastP||h.d!==lastD){lastP=h.p;lastD=h.d;if(choices(s).length>1)return f+1;}
 }throw Error('advance timeout');}
const s=new GameSession(levels,{startLevel:1,difficulty:'normal',seed:1});s.oracle.renderFrame();
const per=[];let totalFrames=0,totalDecision=0,totalWagons=0,totalCrashes=0;
for(let level=1;level<=50;level++){
 if(s.levelNumber!==level||s.state!==STATE_PLAYING)throw Error(`expected level ${level}, got ${s.levelNumber}/${s.state}`);
 s.oracle.renderFrame();const path=solutions.get(level);let pi=0,startClock=s.clockMs,startScore=s.score,startLives=s.lives,startPick=s.oracle.collectedEvents.length,startCrashes=s.oracle.collisionCount;
 if(choices(s).length<=1)totalFrames+=advance(s,choices(s)[0]??null);
 while(s.state===STATE_PLAYING){const cs=choices(s);if(cs.length>1){if(pi>=path.length)throw Error(`level ${level}: solution path exhausted`);const d=path[pi++];if(!cs.includes(d))throw Error(`level ${level}: illegal decision ${d} at ${pi-1}, choices ${cs}`);totalFrames+=advance(s,d);}else totalFrames+=advance(s,cs[0]??null);}
 if(s.state!==STATE_WIN_PAUSE)throw Error(`level ${level}: ended ${s.state}, crashes=${s.oracle.collisionCount}`);
 const wag=s.oracle.collectedEvents.filter(e=>e.object==='wagon').length; const crashes=s.oracle.collisionCount-startCrashes;
 if(s.oracle.board.some(v=>v===2))throw Error(`level ${level}: wagons remain after win`);if(crashes!==0)throw Error(`level ${level}: collision during certified route`);
 while(s.state===STATE_WIN_PAUSE){s.step(16,null,true);totalFrames++;}
 if(s.state!==STATE_QUIZ)throw Error(`level ${level}: no quiz, state=${s.state}`);
 const article=s.quiz.correctArticle;s.answerQuiz(true);
 while(s.state===STATE_QUIZ_RESULT){s.step(16,null,true);totalFrames++;}
 const completed=(level===50?s.completedCampaign:s.levelNumber===level+1);
 if(!completed)throw Error(`level ${level}: progression failed state=${s.state} next=${s.levelNumber}`);
 per.push({level,gameplayMs:s.transitions.findLast?.(t=>t.event==='last_wagon'&&t.level===level)?.at_clock_ms-startClock ?? null,decisions:pi,wagons:wag,crashes,scoreBefore:startScore,scoreAfterQuiz:s.score,livesBefore:startLives,livesAfter:s.lives,quizArticle:article,rngCalls:s.rng.callCount});
 totalDecision+=pi;totalWagons+=wag;totalCrashes+=crashes;
 if(level<50)s.oracle.renderFrame();
}
if(s.state!==STATE_HIGH_SCORE)throw Error(`campaign did not end at high score: ${s.state}`);
if(!s.completedCampaign)throw Error('completedCampaign false');
const report={status:'PASS',levelsCompleted:50,totalWagons,totalDecisions:totalDecision,totalCrashes,totalFrames,finalScore:s.score,finalLives:s.lives,finalState:s.state,completedCampaign:s.completedCampaign,maxUnlocked:s.maxUnlocked,rngCalls:s.rng.callCount,highScoreSlot:s.highScoreSlot,levels:per};
fs.writeFileSync('reports/FULL_CAMPAIGN_PLAYTHROUGH.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,levels:undefined},null,2));
