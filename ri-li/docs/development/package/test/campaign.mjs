import fs from 'node:fs';
import {LevelSet} from '../src/levels.mjs';
import {GameSession,STATE_PLAYING,STATE_QUIZ,STATE_QUIZ_RESULT,STATE_HIGH_SCORE,STATE_GAME_OVER} from '../src/session.mjs';

const levels=new LevelSet(fs.readFileSync('reference/levels.dat'));
let checks=0;const eq=(a,b,msg)=>{checks++;if(a!==b)throw Error(`${msg}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`)};
const truth=(v,msg)=>{checks++;if(!v)throw Error(msg)};

function completeCurrentLevel(s,correct=true){
  eq(s.state,STATE_PLAYING,`level ${s.levelNumber} starts playing`);
  s.oracle.won=true;s.oracle.mortUntil=s.oracle.clockMs-2;
  s.step(16,null,true);eq(s.state,STATE_QUIZ,`level ${s.levelNumber} enters quiz`);
  const completed=s.levelNumber;
  if(correct)s.quiz.pyE=0;else s.quiz.pyE=1;
  s.answerQuizSelected();eq(s.state,STATE_QUIZ_RESULT,`level ${completed} quiz result`);
  s.step(2000);eq(s.state,STATE_QUIZ_RESULT,`level ${completed} strict result timer`);
  s.step(1);
  return completed;
}

const s=new GameSession(levels,{seed:1,difficulty:'normal'});
const quizArticles=[];
for(let level=1;level<=50;level++){
  eq(s.levelNumber,level,`campaign level ${level}`);
  const completed=completeCurrentLevel(s,true);quizArticles.push(completed===50?50:s.transitions.filter(t=>t.event==='quiz_begin').at(-1).correctArticle);
  if(level<50){eq(s.state,STATE_PLAYING,`level ${level+1} loaded`);eq(s.levelNumber,level+1,`advanced to ${level+1}`);eq(s.maxUnlocked,level+1,`unlocked ${level+1}`);}
}
eq(s.state,STATE_HIGH_SCORE,'campaign ends at high score');
eq(s.levelNumber,50,'final level retained');eq(s.maxUnlocked,50,'max unlock 50');
eq(s.score,2800,'50 correct quizzes + 3-life completion bonus');eq(s.highScoreSlot,0,'final score inserted at #1');eq(s.highScores[0].score,2800,'top score value');truth(s.completedCampaign,'completed campaign flag');
const events=s.transitions.reduce((a,t)=>(a[t.event]=(a[t.event]||0)+1,a),{});
eq(events.load_level,50,'50 level loads');eq(events.quiz_begin,50,'50 quizzes');eq(events.quiz_answer,50,'50 quiz answers');eq(events.advance_level,49,'49 advances');eq(events.game_complete,1,'one game completion');eq(events.high_score,1,'one final high-score transition');

// Replay the exact shortcut campaign a second time: global RNG stream must end identically.
const s2=new GameSession(levels,{seed:1,difficulty:'normal'});for(let level=1;level<=50;level++)completeCurrentLevel(s2,true);
eq(s2.rng.callCount,s.rng.callCount,'campaign RNG calls deterministic');eq(s2.score,s.score,'campaign score deterministic');eq(JSON.stringify(s2.highScores),JSON.stringify(s.highScores),'high scores deterministic');

// Death with lives remaining reloads the same level and consumes the next life-marker RNG call.
const d=new GameSession(levels,{seed:1});const dCalls=d.rng.callCount;d.lives=2;d.oracle.lives=2;d.oracle.mortUntil=d.oracle.clockMs-2;d.step(16,null,true);
eq(d.state,STATE_PLAYING,'death with lives remaining reloads');eq(d.levelNumber,1,'death reload keeps level');eq(d.lives,2,'death reload keeps decremented lives');eq(d.rng.callCount,dCalls+1,'death reload consumes new life-marker RNG');

// Game-over path also enters the score table, just like Jeux::SDLMain -> mScoreEdit.
const g=new GameSession(levels,{seed:1,highScores:Array.from({length:8},()=>({score:0,name:''}))});g.score=125;g.oracle.score=125;g.lives=-1;g.oracle.lives=-1;g.oracle.mortUntil=g.oracle.clockMs-2;g.step(16,null,true);
eq(g.state,STATE_GAME_OVER,'death with NVie<0 ends run');eq(g.highScoreSlot,0,'game-over score inserted');eq(g.highScores[0].score,125,'game-over score stored');

// Original score insertion is strictly '<': an equal score does not replace an existing entry.
const tie=new GameSession(levels,{seed:1,highScores:Array.from({length:8},()=>({score:100,name:'OLD'}))});tie.score=100;tie.oracle.score=100;tie.lives=-1;tie.oracle.lives=-1;tie.oracle.mortUntil=tie.oracle.clockMs-2;tie.step(16,null,true);
eq(tie.state,STATE_GAME_OVER,'tie run ends');eq(tie.highScoreSlot,null,'equal score does not qualify');eq(tie.highScores[0].name,'OLD','tie leaves table untouched');

console.log(JSON.stringify({status:'PASS',checks,levels:50,final_score:s.score,final_rng_calls:s.rng.callCount,events,high_score_slot:s.highScoreSlot,game_over_score:g.highScores[0].score},null,2));
