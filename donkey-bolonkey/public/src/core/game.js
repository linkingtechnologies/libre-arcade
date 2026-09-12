// Faithful gameplay core for Donkey Bolonkey.
// Source model: reference/dkbk/{donkey.c,hand.c,player.c,level.c,crusher.c,particle.c,levels.h}

import { BLOCK_HEIGHT, BLOCK_WIDTH, COLOR, FLAG, FPS, HAND, LEVEL_HEIGHT, LEVEL_WIDTH, LOGICAL_HEIGHT, MAX_BUBBLES } from './constants.js';
import { LEVELS } from './levels.js';
import { ParticleSystem } from './particles.js';

const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function movePosition(flags,pos){ if(flags&FLAG.LEFT)pos.x--; if(flags&FLAG.UP)pos.y--; if(flags&FLAG.RIGHT)pos.x++; if(flags&FLAG.DOWN)pos.y++; return pos; }

export class Game {
  constructor(random=Math.random, storage=globalThis.localStorage){
    this.random=random;
    this.storage=storage;
    this.bestScore=Number(storage?.getItem?.('dkbk.bestScore')||0);
    this.eventSeq=0;
    this.particleSystem=new ParticleSystem(random);
    this.resetGame();
  }

  emit(type,data={}){
    const event={id:++this.eventSeq,type,...data};
    this.events.push(event);
    return event;
  }

  resetGame(){
    this.score=0;
    this.levelNumber=1;
    this.gameOver=false;
    this.gameOverTime=0;
    this.final=false;
    this.paused=false;
    this.tickCount=0;
    this.events=[];
    this.doorAnimation=-1;
    this.doors=0;
    this.particleSystem.reset();
    this.resetBanner();
    this.resetAlarm();
    this.crusher=null;
    this.resetLevel(1);
    this.initCrusher();
  }

  resetLevel(n){
    const src=LEVELS[n-1];
    if(!src)return false;
    this.levelNumber=n;
    this.level=src;
    this.grid=src.grid.map(r=>r.map(flags=>({flags,donkey:null})));
    this.counter=src.counter;
    this.moveFreq=src.moveFreqMax;
    this.moveTime=this.moveFreq;
    this.addFreq=src.addFreq;
    this.addTime=this.addFreq;
    this.donkeys=[];
    this.deaths=[];
    this.findBubbles();
    this.updateFunnel();
    return true;
  }

  getBlock(x,y){ return this.grid[clamp(y,0,LEVEL_HEIGHT-1)][clamp(x,0,LEVEL_WIDTH-1)]; }
  getFlags(x,y){ return this.getBlock(x,y).flags; }
  getDonkey(x,y){ return this.getBlock(x,y).donkey; }
  setDonkey(x,y,d){ const b=this.getBlock(x,y),old=b.donkey; b.donkey=d; return old; }

  findHome(){
    for(let y=0;y<LEVEL_HEIGHT;y++)for(let x=0;x<LEVEL_WIDTH;x++)if(this.getFlags(x,y)&FLAG.HOME)return{x,y};
    throw Error('Level has no HOME block');
  }

  findBubbles(){
    const found=[];
    for(let y=0;y<LEVEL_HEIGHT;y++)for(let x=0;x<LEVEL_WIDTH;x++)if(this.getFlags(x,y)&FLAG.BUBBLE)found.push({state:true,x,y,donkey:null});
    while(found.length<MAX_BUBBLES)found.push({state:false,x:0,y:0,donkey:null});
    this.bubbles=found.slice(0,MAX_BUBBLES);
    this.activeBubble=0;
  }

  exitCells(){
    const a=[];
    for(let y=0;y<LEVEL_HEIGHT;y++)for(let x=0;x<LEVEL_WIDTH;x++)if(this.getFlags(x,y)&FLAG.EXIT)a.push({x,y});
    return a;
  }

  updateFunnel(){
    const exits=this.exitCells();
    if(!exits.length){this.funnel={x1:-1,y1:-1,x2:-1,y2:-1};return;}
    const first=exits[0],last=exits[exits.length-1];
    this.funnel={
      x1:first.x*BLOCK_WIDTH,
      y1:first.y*BLOCK_HEIGHT+BLOCK_HEIGHT,
      x2:last.x*BLOCK_WIDTH+BLOCK_WIDTH,
      y2:last.y*BLOCK_HEIGHT+BLOCK_HEIGHT
    };
  }

  initCrusher(){
    // The original initializes the crusher once, after level 1 is selected.
    // Later levels update their funnel but continue to feed this same fixed machine.
    const w=32,h=32;
    this.crusher={
      w,h,
      x:this.funnel.x1+(this.funnel.x2-this.funnel.x1)/2-w/2,
      y:LOGICAL_HEIGHT-h-8,
      angle:0
    };
  }

  getHand(){
    const hand=this.exitCells().map(({x,y})=>{const d=this.getDonkey(x,y);return{x,y,color:d?d.color:-1};});
    let primaryColor=COLOR.JOKER;
    for(const h of hand)if(h.color!==COLOR.JOKER){primaryColor=h.color;break;}
    return{hand,primaryColor};
  }

  handState(info=this.getHand()){
    const {hand,primaryColor}=info;
    for(let c=0;c<hand.length;c++){
      if(hand[c].color<0)return HAND.GOOD;
      if(hand[c].color!==primaryColor)return c>=3?HAND.FULL:HAND.BAD;
    }
    return HAND.FULL;
  }

  killHand(info=this.getHand()){
    const {hand,primaryColor}=info;
    let c=0;
    while(c<hand.length&&hand[c].color===primaryColor)c++;
    const pts=c===3?50:c===4?150:c===5?400:c===6?1600:0;
    if(!this.gameOver)this.score+=pts;
    this.openDoors(c);

    for(let i=0;i<hand.length;i++){
      const cell=hand[i];
      const d=this.getDonkey(cell.x,cell.y);
      if(d&&d.color===primaryColor){
        this.deaths.push({
          time:0,color:d.color,x:d.x,y:d.y,
          clockwise:i<hand.length/2,
          flip:d.flip
        });
        this.removeDonkeyFromList(d);
        this.setDonkey(cell.x,cell.y,null);
      }else break;
    }
    this.emit('match',{count:c,score:pts});
  }

  openDoors(n){ this.doorAnimation=0; this.doors=n; }

  doorFrame(index){
    if(this.doorAnimation<0||index>=this.doors)return 0;
    const t=this.doorAnimation;
    let frame;
    if(t<FPS/2)frame=Math.trunc(2*t/(FPS/2));
    else frame=2-Math.trunc(2*(t-FPS/2)/(FPS/4));
    return clamp(frame,0,2);
  }

  randomColor(){
    const a=[];
    for(let c=0;c<COLOR.MAX;c++)if(this.level.colors[c])a.push(c);
    return a[Math.floor(this.random()*a.length)];
  }

  addDonkeyToList(d){ this.donkeys.unshift(d); }
  removeDonkeyFromList(d){
    const i=this.donkeys.indexOf(d);
    if(i>=0)this.donkeys.splice(i,1);
    if(this.getDonkey(d.x,d.y)===d)this.setDonkey(d.x,d.y,null);
  }

  addDonkey(){
    const h=this.findHome();
    if(this.getDonkey(h.x,h.y)){this.killPlayer();return;}
    const d={x:h.x,y:h.y,xold:h.x,yold:h.y,color:this.randomColor(),moved:false,flip:false};
    this.setDonkey(h.x,h.y,d);
    this.addDonkeyToList(d);
  }

  moveDonkeyPosition(d,flags){
    d.xold=d.x; d.yold=d.y;
    movePosition(flags,d);
    d.flip=d.xold===d.x?d.flip:d.xold>d.x;
  }

  moveDonkeys(){
    let hand=this.getHand();
    if(this.handState(hand)===HAND.FULL){
      this.killHand(hand);
      hand=this.getHand();
      this.moveFreq=Math.max(this.level.moveFreqMin,this.moveFreq-this.level.moveFreqCountdown);
    }

    // EXIT pass.
    for(const cell of hand.hand){
      const d=this.getDonkey(cell.x,cell.y);
      if(!d)continue;
      const ox=d.x,oy=d.y;
      this.moveDonkeyPosition(d,this.getFlags(d.x,d.y));
      const nf=this.getFlags(d.x,d.y);
      if(!(nf&FLAG.EXIT)){
        if(this.handState()!==HAND.BAD){d.x=ox;d.y=oy;}
      }else{
        const occ=this.getDonkey(d.x,d.y);
        if(occ&&occ!==d&&this.handState()!==HAND.BAD){d.x=ox;d.y=oy;}
      }
      if(this.getDonkey(ox,oy)===d)this.setDonkey(ox,oy,null);
      this.setDonkey(d.x,d.y,d);
      d.moved=true;
      d.flip=ox===d.x?d.flip:ox>d.x;
    }

    // OTHERS pass.
    for(const d of [...this.donkeys]){
      if(d.moved)continue;
      const f=this.getFlags(d.x,d.y);
      if(f&FLAG.STOP)continue;
      const ox=d.x,oy=d.y;
      this.moveDonkeyPosition(d,f);
      if(this.getDonkey(ox,oy)===d)this.setDonkey(ox,oy,null);
      this.setDonkey(d.x,d.y,d);
      d.moved=true;
      d.flip=ox===d.x?d.flip:ox>d.x;
    }

    // STOP pass.
    for(const d of [...this.donkeys]){
      if(d.moved){d.moved=false;continue;}
      const f=this.getFlags(d.x,d.y),ox=d.x,oy=d.y;
      this.moveDonkeyPosition(d,f);
      const occ=this.getDonkey(d.x,d.y);
      if(occ&&occ!==d){
        d.x=ox;d.y=oy;
        this.activeRedAlarm(100);
        this.emit('blocked');
      }
      if(this.getDonkey(ox,oy)===d)this.setDonkey(ox,oy,null);
      this.setDonkey(d.x,d.y,d);
      d.flip=ox===d.x?d.flip:ox>d.x;
    }
  }

  swapBubble(){
    // Historical update_player() still accepts SPACE/TAB while GAME OVER is set.
    const b=this.bubbles[this.activeBubble];
    if(!b?.state)return;
    const p=movePosition(this.getFlags(b.x,b.y),{x:b.x,y:b.y});
    const d=this.getDonkey(p.x,p.y);
    if(d)this.removeDonkeyFromList(d);
    if(b.donkey)this.addDonkeyToList(b.donkey);
    if(d||b.donkey)this.emit('bubble');
    this.setDonkey(p.x,p.y,b.donkey);
    if(b.donkey){b.donkey.x=p.x;b.donkey.y=p.y;b.donkey.xold=p.x;b.donkey.yold=p.y;}
    b.donkey=d;
  }

  nextBubble(){
    for(let c=this.activeBubble+1;c<MAX_BUBBLES*4;c++)if(this.bubbles[c%MAX_BUBBLES].state){this.activeBubble=c%MAX_BUBBLES;return;}
  }
  previousBubble(){
    const active=this.bubbles.map((b,i)=>b.state?i:-1).filter(i=>i>=0);
    if(!active.length)return;
    const p=active.indexOf(this.activeBubble);
    this.activeBubble=active[(p-1+active.length)%active.length];
  }

  retryCurrentLevel(){
    if(this.final)return;
    const n=this.levelNumber;
    this.gameOver=false;
    this.gameOverTime=0;
    this.score=0;
    this.resetLevel(n);
  }

  killPlayer(){
    if(!this.gameOver){
      this.gameOver=true;
      this.gameOverTime=0;
      this.emit('gameover');
      this.saveBest();
    }
  }

  saveBest(){
    if(this.score>this.bestScore){
      this.bestScore=this.score;
      this.storage?.setItem?.('dkbk.bestScore',String(this.bestScore));
    }
  }

  countdownCounter(){
    if(!this.gameOver)this.counter--;
    if(this.counter<=0){
      this.counter=0;
      const next=this.levelNumber+1;
      if(!this.resetLevel(next)){
        // player.c increments player->level before reset_level() fails on the final transition.
        this.levelNumber=next;
        this.final=true;
        this.killPlayer();
      }else{
        this.activeCrazyAlarm();
        this.emit('level',{level:this.levelNumber});
      }
    }
  }

  updateDeaths(){
    let completed=0;
    for(let i=0;i<this.deaths.length;i++){
      const d=this.deaths[i];
      d.time++;
      if(d.time>=FPS){
        completed++;
        this.deaths.splice(i,1); i--;
        this.countdownCounter();
        this.activeBlueAlarm(200);
      }
    }
    if(completed>0){
      this.emit('crush',{count:completed});
      this.particleSystem.createChain(
        this.crusher.x+this.crusher.w/2,
        this.crusher.y+BLOCK_HEIGHT,
        completed,
        completed*32
      );
    }
  }

  updateDonkeys(){
    this.moveTime++;
    if(this.moveTime>(FPS*this.moveFreq)/1000){
      this.moveTime=0;
      this.moveDonkeys();
      this.addTime++;
    }
    if(this.addTime>this.addFreq){
      this.addTime=0;
      this.addDonkey();
    }
    this.updateDeaths();
  }


  resetBanner(){
    // banner.c starts on BMP_BANNER5 and advances to BANNER1 at the first 6 s trigger.
    this.banner={time:0,drawTime:-1,type:4};
  }

  updateBanner(){
    const b=this.banner;
    b.time++;
    if(b.drawTime>=0)b.drawTime++;
    if(b.time>FPS*6){
      b.time=0;
      b.drawTime=0;
      b.type=(b.type+1)%5;
    }
    if(b.drawTime>FPS*5/2)b.drawTime=-1;
  }

  bannerFrame(){
    const t=this.banner.drawTime;
    if(t<0)return {visible:false,type:this.banner.type,phase:'hidden',amount:0};
    if(t<FPS)return {visible:true,type:this.banner.type,phase:'interference',amount:1-t/FPS};
    if(t<FPS*2)return {visible:true,type:this.banner.type,phase:'steady',amount:1};
    const amount=Math.max(0,1-(t-FPS*2)/(FPS/8));
    return {visible:true,type:this.banner.type,phase:'collapse',amount};
  }

  resetAlarm(){
    this.alarm={blueTime:-1,blueMsec:0,redTime:-1,redMsec:0,crazyTime:-1,crazySwitch:0};
  }
  activeBlueAlarm(msec){ if(this.alarm.crazyTime<0){this.alarm.blueTime=0;this.alarm.blueMsec=msec;} }
  activeRedAlarm(msec){ if(this.alarm.crazyTime<0){this.alarm.redTime=0;this.alarm.redMsec=msec;} }
  activeCrazyAlarm(){
    this.alarm.crazyTime=0;
    this.alarm.crazySwitch=0;
    this.alarm.blueTime=0;
    this.alarm.redTime=-1;
  }

  updateCrusher(){
    const a=this.alarm;
    if(a.crazyTime<0){
      if(a.blueTime>=0){a.blueTime++;if(Math.trunc(1000*a.blueTime/FPS)>a.blueMsec)a.blueTime=-1;}
      if(a.redTime>=0){a.redTime++;if(Math.trunc(1000*a.redTime/FPS)>a.redMsec)a.redTime=-1;}
    }else{
      a.crazyTime++;
      if(a.crazyTime>FPS*3/2){
        a.crazyTime=-1;a.blueTime=-1;a.redTime=-1;
      }else{
        a.crazySwitch++;
        if(a.crazySwitch>Math.trunc(FPS/8)){
          a.crazySwitch=0;
          if(a.blueTime>=0){a.blueTime=-1;a.redTime=0;}else{a.blueTime=0;a.redTime=-1;}
        }
      }
    }
    this.crusher.angle=(this.crusher.angle+16)%256;
  }

  updateLevelAnimation(){
    if(this.doorAnimation>=0){
      this.doorAnimation++;
      if(this.doorAnimation>FPS)this.doorAnimation=-1;
    }
  }

  deathPose(d){
    const half=FPS/2;
    const start={x:d.x*BLOCK_WIDTH+BLOCK_WIDTH/2,y:d.y*BLOCK_HEIGHT+BLOCK_HEIGHT/2-4};
    const drop={x:start.x,y:start.y+BLOCK_HEIGHT};
    const end={x:this.crusher.x+this.crusher.w/2,y:this.crusher.y+this.crusher.h/2};
    if(d.time<half){
      const k=d.time/half;
      return{x:start.x+(drop.x-start.x)*k,y:start.y+(drop.y-start.y)*k,angle:0};
    }
    const k=(d.time-half)/half;
    return{
      x:drop.x+(end.x-drop.x)*k,
      y:drop.y+(end.y-drop.y)*k,
      angle:(Math.PI*2*k)*(d.clockwise?1:-1)
    };
  }

  update(){
    if(this.paused)return;
    this.tickCount++;
    this.events.length=0;

    // Historical main loop order: level -> donkeys -> particles -> crusher -> player.
    this.updateLevelAnimation();
    this.updateDonkeys();
    this.particleSystem.update();
    this.updateCrusher();
    this.updateBanner();
    if(this.gameOver)this.gameOverTime++;
  }
}
