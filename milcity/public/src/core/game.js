// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

import {JavaRandom,splitMix64,browserSeeds} from './rng.js';
import {buildRandomWalkGrid,Grid} from './grid.js';
import {Player} from './player.js';
import {HistoricalAI} from '../ai/historical-ai.js';
import {expireShields} from './combat.js';
import {CONFIG} from './config.js';

export class Game {
 constructor({seed,seeds,levels=[null,3],moneyAtStart=CONFIG.moneyAtStart,scoreToWin=CONFIG.scoreToWin,waterPercent=CONFIG.waterPercent}={}){
   // Where the seeds of the new generators come from: the browser's random numbers, unless a seed (or a source) is given.
   this.seeds=seeds??(seed!==undefined?splitMix64(seed):browserSeeds());this.fresh=()=>new JavaRandom(this.seeds.next());
   this.time=0;this.nextPass=0;this.vibrations=[];this.players=[];this.ais=[];this.ended=false;
   this.moneyAtStart=moneyAtStart;this.scoreToWin=scoreToWin;this.waterPercent=waterPercent;
   // Solo mode in MilCity 1.0.5 creates one RandomWalk grid and gives the AI
   // a copy of that terrain. Cities differ, coastline does not.
   const baseGrid=buildRandomWalkGrid(this.fresh,CONFIG.gridWidth,CONFIG.gridHeight,waterPercent);
   for(let i=0;i<levels.length;i++){
     const g=i===0?baseGrid:baseGrid.cloneTerrain();
     const p=new Player(i,g,scoreToWin,moneyAtStart);p.game=this;this.players.push(p);
     if(levels[i]!==null&&levels[i]!==undefined)this.ais.push(new HistoricalAI(p,levels[i],this.fresh));
   }
 }
 // Time moves in milliseconds. The original gives each player a thread that settles the accounts the moment the game starts and
 // again every second; a thread starts a pass only if the game is still being played, so once a pass ends the game the players
 // after it do not run.
 // Game.vibrate(): the handset is asked to vibrate for `ms` milliseconds; the page decides whether it can and whether the person wants it.
 vibrate(ms){this.vibrations.push({time:this.time,ms});if(this.onVibrate)this.onVibrate(ms);}
 advance(ms){
   const target=this.time+ms;
   while(!this.ended&&this.nextPass<=target){this.time=this.nextPass;this.pass();this.nextPass+=1000;}
   this.time=target;
 }
 pass(){
     // Mirrors LocalPlayer/AIPlayer.run order: energy, acceleration, money,
     // shields, buildings, lose, win; AI play() follows its own player update.
     for(const p of this.players){
       if(this.ended)break;
       expireShields(p,this.time);
       p.computeEnergy(this.time);
       p.computeAcceleration();
       p.computeMoney();
       p.updateBuildings(this.time);
       p.checkLoss(this.time);
       // Game.end() when the only player loses (PlayerAbstract.hasLoose)
       if(p.lost&&this.players.length===1)this.ended=true;
       this.checkWin(p);
       const ai=this.ais.find(a=>a.player===p);
       // AIPlayer.run() plays after settling its accounts whether or not it has just won or lost
       if(ai)ai.tick(this,this.time);
     }
 }
 // PlayerAbstract.hasWon(): each player decides for itself, in its own pass; a win ends the game (the WIN command sets the status to END).
 checkWin(p){
   if(p.won)return;
   if(p.score>=p.scoreToWin)p.won=true;
   else p.won=this.players.length>1&&this.players.filter(q=>q!==p&&q.lost).length===this.players.length-1;
   if(p.won)this.ended=true;
 }

 saveState(){
   return {
     format:2,
     time:this.time,
     nextPass:this.nextPass,
     ended:this.ended,
     moneyAtStart:this.moneyAtStart,
     scoreToWin:this.scoreToWin,
     waterPercent:this.waterPercent,
     players:this.players.map(p=>({
       index:p.index,scoreToWin:p.scoreToWin,money:p.money,score:p.score,energy:p.energy,acceleration:p.acceleration,
       ammo:{...p.ammo},status:p.status.map(r=>[...r]),cannotFireBefore:p.cannotFireBefore,belowZeroSince:p.belowZeroSince,
       energyBelowZero:p.energyBelowZero,lost:p.lost,won:p.won,constructedBuildings:p.constructedBuildings,
       destroyedBuildings:p.destroyedBuildings,destroyedCells:p.destroyedCells,
       grid:{w:p.grid.w,h:p.grid.h,cells:p.grid.cells.map(r=>[...r]),shields:p.grid.shields.map(s=>({...s})),
         buildings:p.grid.buildings.map(b=>({key:b.key,x:b.x,y:b.y,state:b.state,createdAt:b.createdAt,updatedAt:b.updatedAt,
           destroyed:b.destroyed,cells:b.cells.map(c=>({...c}))}))}
     })),
     ais:this.ais.map(a=>({playerIndex:a.player.index,level:a.level,turn:a.turn}))
   };
 }
 static fromState(state){
   if(!state||state.format!==2||!Array.isArray(state.players))throw new Error('Unsupported MilCity save state');
   const game=Object.create(Game.prototype);
   game.seeds=browserSeeds();game.fresh=()=>new JavaRandom(game.seeds.next());
   game.time=state.time;game.nextPass=state.nextPass;game.vibrations=[];game.ended=!!state.ended;game.moneyAtStart=state.moneyAtStart;game.scoreToWin=state.scoreToWin;game.waterPercent=state.waterPercent;
   game.players=state.players.map(ps=>{
     const gs=ps.grid;const grid=new Grid(gs.w,gs.h);grid.cells=gs.cells.map(r=>[...r]);grid.shields=(gs.shields||[]).map(s=>({...s}));
     grid.buildings=(gs.buildings||[]).map(bs=>({key:bs.key,def:CONFIG.buildings[bs.key],x:bs.x,y:bs.y,state:bs.state,createdAt:bs.createdAt,updatedAt:bs.updatedAt,destroyed:!!bs.destroyed,cells:bs.cells.map(c=>({...c}))}));
     const p=new Player(ps.index,grid,ps.scoreToWin,ps.money);p.game=game;
     p.score=ps.score;p.energy=ps.energy;p.acceleration=ps.acceleration;p.ammo={...ps.ammo};p.status=ps.status.map(r=>[...r]);
     p.cannotFireBefore=ps.cannotFireBefore;p.belowZeroSince=ps.belowZeroSince;p.energyBelowZero=!!ps.energyBelowZero;p.lost=!!ps.lost;p.won=!!ps.won;
     p.constructedBuildings=ps.constructedBuildings;p.destroyedBuildings=ps.destroyedBuildings;p.destroyedCells=ps.destroyedCells;return p;
   });
   game.ais=(state.ais||[]).map(as=>{const ai=new HistoricalAI(game.players[as.playerIndex],as.level,game.fresh);ai.turn=as.turn;return ai;});
   return game;
 }
 snapshot(){return {time:this.time,moneyAtStart:this.moneyAtStart,scoreToWin:this.scoreToWin,waterPercent:this.waterPercent,ended:this.ended,players:this.players.map((p)=>({index:p.index,level:this.ais.find(a=>a.player===p)?.level??null,money:p.money,energy:p.energy,acceleration:p.acceleration,score:p.score,ammo:{...p.ammo},cannotFireBefore:p.cannotFireBefore,buildings:p.grid.buildings.map(b=>({key:b.key,x:b.x,y:b.y,state:b.state,destroyed:b.destroyed,createdAt:b.createdAt,updatedAt:b.updatedAt,cells:b.cells.map(c=>({x:c.x,y:c.y,hit:c.hit}))})),lost:p.lost,won:p.won}))};}
}
