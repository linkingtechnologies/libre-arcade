import { FPS } from './constants.js';
import { Game } from './game.js';
import { HighScores } from './highscores.js';

export const SCREEN=Object.freeze({WARNING:'warning',TITLE:'title',CONTROLS:'controls',GAME:'game',CREDITS:'credits',HISCORE:'hiscore'});

export class AppFlow{
  constructor(random=Math.random,storage=globalThis.localStorage,{skipWarning=false}={}){
    this.storage=storage;
    this.game=new Game(random,storage);
    this.highscores=new HighScores(storage);
    this.screen=skipWarning?SCREEN.TITLE:SCREEN.WARNING;
    this.screenTime=0;
    this.firstGame=true;
    this.exitRequested=false;
    this.lastScore=0;
  }

  update(){
    this.screenTime++;
    if(this.screen===SCREEN.GAME)this.game.update();
  }

  setScreen(screen){this.screen=screen;this.screenTime=0;}

  startFromTitle(){
    if(this.firstGame){
      this.firstGame=false;
      this.setScreen(SCREEN.CONTROLS);
    }else this.startGame();
  }

  startGame(){
    this.game.resetGame();
    this.setScreen(SCREEN.GAME);
  }

  newGame(){
    this.firstGame=false;
    this.startGame();
  }

  finishRun(){
    this.lastScore=this.game.score;
    this.highscores.add(this.lastScore);
    if(this.game.final)this.setScreen(SCREEN.CREDITS);
    else this.setScreen(SCREEN.HISCORE);
  }

  anyKey(){
    if(this.screen===SCREEN.WARNING){this.setScreen(SCREEN.TITLE);return true;}
    if(this.screen===SCREEN.CONTROLS){this.startGame();return true;}
    if(this.screen===SCREEN.CREDITS){this.setScreen(SCREEN.HISCORE);return true;}
    if(this.screen===SCREEN.HISCORE&&this.highscores.editingIndex<0){this.setScreen(SCREEN.TITLE);return true;}
    return false;
  }

  enter(){
    if(this.screen===SCREEN.TITLE){this.startFromTitle();return true;}
    if(this.screen===SCREEN.GAME&&this.game.gameOver&&!this.game.final){this.game.retryCurrentLevel();return true;}
    if(this.screen===SCREEN.HISCORE&&this.highscores.editingIndex>=0){this.highscores.finishEntry();this.screenTime=0;return true;}
    return this.anyKey();
  }

  escape(){
    if(this.screen===SCREEN.TITLE){
      // The native program exits here. A web page cannot close itself reliably.
      this.exitRequested=true;
      return true;
    }
    if(this.screen===SCREEN.GAME){this.finishRun();return true;}
    return this.anyKey();
  }

  backspace(){
    return this.screen===SCREEN.HISCORE&&this.highscores.backspace();
  }

  printable(ch){
    return this.screen===SCREEN.HISCORE&&this.highscores.inputChar(ch);
  }

  titlePhase(){
    const t=this.screenTime;
    return {
      zooming:t<=FPS/2,
      logoSettled:t>FPS/2,
      backgroundIn:t>FPS&&t<=FPS*3/2,
      backgroundA:t>FPS*3/2&&t<FPS*2,
      backgroundB:t>=FPS*2&&t<FPS*3,
      backgroundA2:t>=FPS*3&&t<FPS*4,
      backgroundOut:t>=FPS*4&&t<FPS*9/2,
      prompt:t>FPS&&(t%FPS)<FPS/2
    };
  }
}
