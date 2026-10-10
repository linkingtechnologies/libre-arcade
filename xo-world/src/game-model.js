'use strict';
const {XOWorldEngine}=require('./xoworld-engine');

class XOWorldGame {
  constructor({randomFn=Math.random}={}) {
    this.engine=new XOWorldEngine(randomFn);
    this.newGame();
  }
  newGame(){this.engine.reset();return this.snapshot();}
  snapshot(){return {board:this.engine.t[0].slice(),turn:this.engine.potez,status:this.engine.st,lastCpuMove:this.engine.LastMove,winner:this.engine.pobeda()};}
  playHuman(index){
    if(!Number.isInteger(index)||index<0||index>99)return {ok:false,reason:'out-of-range',...this.snapshot()};
    const e=this.engine;
    if(e.t[0][index]!==0||e.st!==0||e.potez>49)return {ok:false,reason:'illegal',...this.snapshot()};
    e.potez++;
    e.t[0][index]=XOWorldEngine.znakX;
    if(e.pobeda()===0){
      const x=index%10,y=Math.trunc(index/10);
      e.LastMove=e.igraj(x,y);
      if(e.LastMove!==XOWorldEngine.NONE)e.t[0][e.LastMove]=XOWorldEngine.znakO;
      e.st=0;
    }
    if(e.pobeda()===XOWorldEngine.znakO)e.st=3;
    if(e.pobeda()===XOWorldEngine.znakX)e.st=2;
    return {ok:true,humanMove:index,cpuMove:e.LastMove,...this.snapshot()};
  }
}
module.exports={XOWorldGame};
