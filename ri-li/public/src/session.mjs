/* Ri-li 2.0.1 campaign/session wrapper. SPDX-License-Identifier: GPL-3.0-only */
import { Oracle, C_LIVE, C_RAIL } from './core.mjs';
import { GlibcRand } from './rng.mjs';

export const STATE_PLAYING='playing', STATE_DEATH_PAUSE='death_pause', STATE_WIN_PAUSE='win_pause',
  STATE_QUIZ='quiz', STATE_QUIZ_RESULT='quiz_result', STATE_GAME_OVER='game_over', STATE_HIGH_SCORE='high_score';

function normalizeScores(highScores){
  if(highScores==null)return Array.from({length:8},()=>({score:0,name:''}));
  if(highScores.length!==8)throw Error('Ri-li stores exactly 8 scores');
  return highScores.map(x=>Array.isArray(x)?{score:Number(x[0]),name:String(x[1]??'')}:{score:Number(x.score),name:String(x.name??'')});
}

export class GameSession {
  constructor(levels,{startLevel=1,difficulty='normal',seed=1,rng=null,highScores=null,keys=null}={}){
    if(startLevel<1||startLevel>levels.levels.length)throw Error(`bad start level ${startLevel}`);
    this.levels=levels;this.difficulty=difficulty;this.rng=rng??new GlibcRand(seed);
    this.levelNumber=startLevel;this.maxUnlocked=startLevel;this.score=0;this.lives=3;
    this.clockMs=0;this.gameMs=0;this.state=STATE_PLAYING;this.quiz=null;this.transitions=[];this.oracle=null;this.transitionDue=false;this.keysOrder=keys;
    this.highScores=normalizeScores(highScores);this.highScoreSlot=null;this.completedCampaign=false;
    this.loadLevel();
  }
  lifeDenominator(){return {easy:5,normal:9,hard:15}[this.difficulty];}
  loadLevel(){
    const keepLife=this.rng.randMod(this.lifeDenominator(),'life_marker_keep')===0;
    const o=new Oracle(this.levels.get(this.levelNumber),this.difficulty,this.rng,this.oracle?this.oracle.keys:this.keysOrder);
    if(!keepLife)o.board=o.board.map(c=>c===C_LIVE?C_RAIL:c);
    o.score=this.score;o.lives=this.lives;this.oracle=o;this.gameMs=0;this.state=STATE_PLAYING;
    this.transitions.push({at_clock_ms:this.clockMs,event:'load_level',level:this.levelNumber,life_marker_kept:keepLife,score:this.score,lives:this.lives,rng_calls:this.rng.callCount});
  }
  step(dtMs,key=null,renderAfter=true){
    if(dtMs<0)throw Error('negative dt');
    if(this.transitionDue){this.transitionDue=false;this.clockMs+=dtMs;this.finishPause();return this.snapshot();}
    if(this.state===STATE_QUIZ){this.clockMs+=dtMs;return this.snapshot();}
    if(this.state===STATE_QUIZ_RESULT){
      // Menu::SDLMain_HR tests Fini<Horloge at the start of a pass, with the clock of the pass before
      const over=this.quiz?.resultUntil!==null&&this.clockMs>this.quiz.resultUntil;
      this.clockMs+=dtMs;
      if(over)this.afterQuiz();
      return this.snapshot();
    }
    if(this.state===STATE_GAME_OVER||this.state===STATE_HIGH_SCORE){this.clockMs+=dtMs;return this.snapshot();}

    const beforeCollisions=this.oracle.collisionCount,beforeWon=this.oracle.won;
    const snap=this.oracle.step(dtMs,key,renderAfter);this.clockMs+=dtMs;this.gameMs=this.oracle.gameMs;this.score=this.oracle.score;this.lives=this.oracle.lives;
    if(this.oracle.won&&!beforeWon){this.state=STATE_WIN_PAUSE;this.transitions.push({at_clock_ms:this.clockMs,event:'last_wagon',level:this.levelNumber,score:this.score,lives:this.lives});}
    else if(this.oracle.collisionCount>beforeCollisions){this.state=STATE_DEATH_PAUSE;this.transitions.push({at_clock_ms:this.clockMs,event:'crash',level:this.levelNumber,score:this.score,lives:this.lives});}

    // Jeux::SDLMain tests Mort<Horloge after the frame has been drawn and flipped, so what follows (the quiz, the table of scores, the next set-up) starts with the next frame.
    if(this.oracle.mortUntil!==-1&&this.oracle.clockMs>this.oracle.mortUntil)this.transitionDue=true;
    return {...snap,...this.sessionFields()};
  }
  finishPause(){
    if(this.oracle.won)this.beginQuiz();
    else if(this.lives<0)this.enterHighScore(true);
    else {this.transitions.push({at_clock_ms:this.clockMs,event:'reload_after_death',level:this.levelNumber,score:this.score,lives:this.lives});this.loadLevel();}
  }
  // Jeux::SDLMain: Escape in the quiz goes on without an answer; "Exit game" in the menu of the game goes to the table of scores
  skipQuiz(){if(this.state===STATE_QUIZ)this.afterQuiz();}
  exitGame(){this.enterHighScore(false);}
  beginQuiz(){
    // Exact rand() consumption order from Menu::SDLMain_HR().
    const pyE=this.rng.randMod(2,'quiz_py_e');
    const n1=this.rng.randMod(30,'quiz_correct_article');
    let n2=this.rng.randMod(30,'quiz_decoy_article');while(n2===n1)n2=this.rng.randMod(30,'quiz_decoy_retry');
    const ordre=this.rng.randMod(2,'quiz_answer_order');
    const visual={locomotiveFrame:this.rng.randMod(320,'quiz_locomotive_frame'),decorations:[]};
    // Sprites[deco].Affiche(x,y+rand()%130,rand()%18,...): g++ evaluates the arguments of a call from the last to the first, so the frame takes the first number and the offset the second
    for(const slot of ['left_top','left_bottom','right_top','right_bottom']){const frame=this.rng.randMod(18,`quiz_deco_${slot}_frame`);const offset=this.rng.randMod(130,`quiz_deco_${slot}_offset`);visual.decorations.push({slot,offset,frame});}
    this.quiz={correctArticle:n1+1,decoyArticle:n2+1,correctOnLeft:Boolean(ordre),pyE,visual,answered:false,correct:null,resultUntil:null};
    this.state=STATE_QUIZ;
    this.transitions.push({at_clock_ms:this.clockMs,event:'quiz_begin',level:this.levelNumber,...structuredClone(this.quiz),rng_calls:this.rng.callCount});
  }
  quizSelectedLeft(){if(!this.quiz)return false;return this.quiz.correctOnLeft?this.quiz.pyE===0:this.quiz.pyE===1;}
  selectQuizLeft(){if(this.state!==STATE_QUIZ)return;this.quiz.pyE=this.quiz.correctOnLeft?0:1;}
  selectQuizRight(){if(this.state!==STATE_QUIZ)return;this.quiz.pyE=this.quiz.correctOnLeft?1:0;}
  toggleQuizSelection(){if(this.state!==STATE_QUIZ)return;this.quiz.pyE=this.quiz.pyE?0:1;}
  answerQuizSelected(){return this.answerQuiz(this.quiz?.pyE===0);}
  answerQuiz(correct){
    if(this.state!==STATE_QUIZ||!this.quiz)throw Error('quiz not active');
    this.quiz.answered=true;this.quiz.correct=Boolean(correct);if(correct)this.score+=50;
    this.quiz.resultUntil=this.clockMs+2000;this.state=STATE_QUIZ_RESULT;
    this.transitions.push({at_clock_ms:this.clockMs,event:'quiz_answer',level:this.levelNumber,correct:Boolean(correct),score:this.score});
    return this.snapshot();
  }
  afterQuiz(){
    const completed=this.levelNumber;
    if(completed===this.levels.levels.length){
      const lifeBonus=this.lives*100;this.score+=lifeBonus;this.completedCampaign=true;
      this.transitions.push({at_clock_ms:this.clockMs,event:'game_complete',level:completed,life_bonus:lifeBonus,score:this.score,lives:this.lives});
      this.quiz=null;this.enterHighScore(false);return;
    }
    this.levelNumber++;if(this.maxUnlocked<this.levelNumber)this.maxUnlocked=this.levelNumber;
    this.transitions.push({at_clock_ms:this.clockMs,event:'advance_level',level:this.levelNumber,max_unlocked:this.maxUnlocked,score:this.score,lives:this.lives});
    this.quiz=null;this.loadLevel();
  }
  enterHighScore(gameOver){
    this.state=gameOver?STATE_GAME_OVER:STATE_HIGH_SCORE;
    this.highScoreSlot=this.insertScore(this.score);
    this.transitions.push({at_clock_ms:this.clockMs,event:gameOver?'game_over':'high_score',score:this.score,slot:this.highScoreSlot,level:this.levelNumber});
  }
  insertScore(score){
    // Menu::SDLMain_Score: scan 7..0; strict '<'; final NEdit is the best qualifying slot.
    let slot=-1;for(let i=7;i>=0;i--)if(this.highScores[i].score<score)slot=i;
    if(slot===-1)return null;
    for(let i=7;i>slot;i--)this.highScores[i]={...this.highScores[i-1]};
    this.highScores[slot]={score,name:''};return slot;
  }
  sessionFields(){return {session_state:this.state,session_level:this.levelNumber,max_unlocked:this.maxUnlocked,quiz:this.quiz?structuredClone(this.quiz):null,high_score_slot:this.highScoreSlot,high_scores:this.highScores.map(x=>({...x})),completed_campaign:this.completedCampaign};}
  snapshot(){return {...this.oracle.snapshot(),...this.sessionFields()};}
}
