/* Ri-li 2.0.1 browser gameplay core. SPDX-License-Identifier: GPL-3.0-only */
import { LT, HT } from './levels.mjs';
import { GlibcRand } from './rng.mjs';

export const D_LEFT=0, D_RIGHT=1, D_UP=2, D_DOWN=3;
export const DIR_NAMES={0:'LEFT',1:'RIGHT',2:'UP',3:'DOWN'};
const ADD_DIR=[-1,1,-LT,LT];
const D_CASE=40.0, D_CASER=31.416, PIQ=Math.PI/2;
export const C_NONE=0,C_RAIL=1,C_WAGON=2,C_STRETCH=3,C_SHRINK=4,C_SPEED=5,C_LIVE=6,C_END=7;
const SPEEDS={easy:80.0,normal:120.0,hard:180.0};
const SPACING_MIN=4.0,SPACING_NORMAL=13.0,SPACING_MAX=27.0,DURATION_POWER=10000,RAYON_TOUCHE=32*32;
const WAGON_TYPES=['buches','balles','moteur','citerne'];
const WAGON_ENUM={locomotive:0,charbon:1,buches:2,balles:3,moteur:4,citerne:5};
const N_SPR_START=50.0;
export const f32 = Math.fround;

export class Oracle {
  constructor(level, difficulty='normal', rng=new GlibcRand(1), keys=null) {
    this.level=level; this.board=level.cells.slice(); this.rng=rng;
    this.collectedEvents=[]; this.frameEvents=[]; this.difficulty=difficulty;
    this.baseSpeed=SPEEDS[difficulty]; this.speed=this.baseSpeed; this.spacing=SPACING_NORMAL;
    this.score=0; this.lives=3; this.won=false;
    this.shrinkUntil=0; this.stretchUntil=0; this.speedUntil=0;
    this.gameMs=0; this.clockMs=0; this.mortUntil=-1;
    this.renderedWagonPoints=[[-10,-10,-10,-10],[-10,-10,-10,-10]];
    this.collisionCount=0; this.historyCompactions=0; this.history=[];
    this.pInter=-1; this.pEntree=0; this.keyMask=false;
    this.keys=keys?[...keys]:[D_UP,D_DOWN,D_LEFT,D_RIGHT];
    this.wagonLengths=[40.0,36.0]; this.wagonTypes=['locomotive','charbon']; this.wagonSprStart=[N_SPR_START,N_SPR_START];
    this.memoDt=0.0; this.lastRenderGeometry=null;
    this.#initLoco(level.startY*LT+level.startX,level.startDir);
    this.bufferKey(level.startDir);
  }
  #initLoco(pos,direction){
    let ar;
    if(direction===D_UP){pos+=LT;ar=D_DOWN;} else if(direction===D_DOWN){pos-=LT;ar=D_UP;}
    else if(direction===D_LEFT){pos+=1;ar=D_RIGHT;} else {pos-=1;ar=D_LEFT;}
    this.d=f32(D_CASE*1.99); this.history=[{p:pos,d:f32(D_CASE),arrive:ar,sortie:direction}];
    this.go(direction); this.go(direction);
  }
  bufferKey(tou){
    let n=this.keys.indexOf(tou);
    if(n>0){this.keys=[tou,...this.keys.slice(0,n),...this.keys.slice(n+1)];}
    const opp={[D_UP]:D_DOWN,[D_DOWN]:D_UP,[D_LEFT]:D_RIGHT,[D_RIGHT]:D_LEFT}[tou];
    n=this.keys.indexOf(opp);
    if(n<3){this.keys=[...this.keys.slice(0,n),...this.keys.slice(n+1),opp];}
  }
  testDir(fdir){
    const cur=this.history[this.history.length-1];
    if((cur.sortie===D_UP&&fdir===D_DOWN)||(cur.sortie===D_DOWN&&fdir===D_UP)||(cur.sortie===D_LEFT&&fdir===D_RIGHT)||(cur.sortie===D_RIGHT&&fdir===D_LEFT)) return false;
    let p=cur.p+ADD_DIR[cur.sortie], x=p%LT, y=Math.floor(p/LT);
    if(fdir===D_UP&&y===0)return false; if(fdir===D_DOWN&&y+1===HT)return false; if(fdir===D_LEFT&&x===0)return false; if(fdir===D_RIGHT&&x+1===LT)return false;
    p+=ADD_DIR[fdir]; return this.board[p]!==C_NONE;
  }
  go(futureDir){
    if(this.history.length===256){this.history=this.history.slice(50);this.historyCompactions++;}
    const prev=this.history[this.history.length-1]; let p=prev.p, arrive;
    if(prev.sortie===D_UP){p-=LT;arrive=D_DOWN;} else if(prev.sortie===D_DOWN){p+=LT;arrive=D_UP;} else if(prev.sortie===D_LEFT){p-=1;arrive=D_RIGHT;} else {p+=1;arrive=D_LEFT;}
    const mask=arrive*4+futureDir;
    const straight=[D_LEFT*4+D_RIGHT,D_RIGHT*4+D_LEFT,D_UP*4+D_DOWN,D_DOWN*4+D_UP].includes(mask);
    const nd=f32(prev.d+(straight?D_CASE:D_CASER));
    this.history.push({p,d:nd,arrive,sortie:futureDir}); return !straight;
  }
  doArrow(){
    const cur=this.history[this.history.length-1]; if(cur.p!==this.pInter&&this.pInter!==-1)return;
    let sortie=cur.sortie; this.pInter=cur.p;
    while(true){
      if(sortie===D_UP){this.pInter-=LT;this.pEntree=D_DOWN;} else if(sortie===D_LEFT){this.pInter-=1;this.pEntree=D_RIGHT;} else if(sortie===D_DOWN){this.pInter+=LT;this.pEntree=D_UP;} else {this.pInter+=1;this.pEntree=D_LEFT;}
      const memoS=sortie, x=this.pInter%LT, y=Math.floor(this.pInter/LT), opts=[];
      if(y>0&&this.pEntree!==D_UP&&this.board[this.pInter-LT]!==0)opts.push(D_UP);
      if(y+1<HT&&this.pEntree!==D_DOWN&&this.board[this.pInter+LT]!==0)opts.push(D_DOWN);
      if(x>0&&this.pEntree!==D_LEFT&&this.board[this.pInter-1]!==0)opts.push(D_LEFT);
      if(x+1<LT&&this.pEntree!==D_RIGHT&&this.board[this.pInter+1]!==0)opts.push(D_RIGHT);
      if(opts.length!==1){
        const i=this.keys.indexOf(memoS); if(i>0&&!this.keyMask){const tou=this.keys[i];this.keys=[tou,...this.keys.slice(0,i),...this.keys.slice(i+1)];}
        break;
      }
      sortie=opts[0];
    }
  }
  findPoint(dist){
    let np=this.history.length-1; while(np>0&&this.history[np-1].d>dist)np--;
    const s=this.history[np], p=s.p; let rest=f32(s.d-dist); if(rest===0)rest=f32(D_CASE/1000.0);
    const bx=(p%LT)*D_CASE, by=Math.floor(p/LT)*D_CASE, m=s.arrive*4+s.sortie;
    let x,y;
    if(m===D_LEFT*4+D_RIGHT){x=f32(bx+D_CASE-rest);y=by+D_CASE/2;}
    else if(m===D_LEFT*4+D_UP){x=bx+Math.cos(rest*PIQ/D_CASER)*(D_CASE/2);y=by+Math.sin(rest*PIQ/D_CASER)*(D_CASE/2);}
    else if(m===D_LEFT*4+D_DOWN){x=bx+Math.cos(rest*PIQ/D_CASER)*(D_CASE/2);y=by+D_CASE-Math.sin(rest*PIQ/D_CASER)*(D_CASE/2);}
    else if(m===D_RIGHT*4+D_LEFT){x=f32(bx+rest);y=by+D_CASE/2;}
    else if(m===D_RIGHT*4+D_UP){x=bx+D_CASE-Math.cos(rest*PIQ/D_CASER)*(D_CASE/2);y=by+Math.sin(rest*PIQ/D_CASER)*(D_CASE/2);}
    else if(m===D_RIGHT*4+D_DOWN){x=bx+D_CASE-Math.cos(rest*PIQ/D_CASER)*(D_CASE/2);y=by+D_CASE-Math.sin(rest*PIQ/D_CASER)*(D_CASE/2);}
    else if(m===D_DOWN*4+D_UP){x=bx+D_CASE/2;y=f32(by+rest);}
    else if(m===D_DOWN*4+D_LEFT){x=bx+Math.sin(rest*PIQ/D_CASER)*(D_CASE/2);y=by+D_CASE-Math.cos(rest*PIQ/D_CASER)*(D_CASE/2);}
    else if(m===D_DOWN*4+D_RIGHT){x=bx+D_CASE-Math.sin(rest*PIQ/D_CASER)*(D_CASE/2);y=by+D_CASE-Math.cos(rest*PIQ/D_CASER)*(D_CASE/2);}
    else if(m===D_UP*4+D_DOWN){x=bx+D_CASE/2;y=f32(by+D_CASE-rest);}
    else if(m===D_UP*4+D_LEFT){x=bx+Math.sin(rest*PIQ/D_CASER)*(D_CASE/2);y=by+Math.cos(rest*PIQ/D_CASER)*(D_CASE/2);}
    else if(m===D_UP*4+D_RIGHT){x=bx+D_CASE-Math.sin(rest*PIQ/D_CASER)*(D_CASE/2);y=by+Math.cos(rest*PIQ/D_CASER)*(D_CASE/2);}
    else throw new Error(`illegal arrival/exit ${s.arrive}->${s.sortie}`);
    return [Math.trunc(x),Math.trunc(y)];
  }
  trainGeometry(){
    const out=[]; let ltrain=0.0;
    for(let i=0;i<this.wagonLengths.length;i++){
      const length=this.wagonLengths[i], p1=f32(ltrain+11.0),p2=f32(f32(ltrain+length)-11.0);   // ltrain, p1, p2 and the angle are floats in Loco::Affiche
      const [x1,y1]=this.findPoint(f32(this.d-p1)),[x2,y2]=this.findPoint(f32(this.d-p2));
      let vy,vx,a;
      if(x1<=x2){vy=x2-x1;vx=y2-y1;a=f32(vx!==0?f32(Math.atan(f32(vy/vx)))*180/Math.PI:90.0);if(vx<0)a=f32(180+a);}
      else {vy=x1-x2;vx=y1-y2;a=f32(vx!==0?f32(Math.atan(f32(vy/vx)))*180/Math.PI+180.0:270.0);if(vx<0)a=f32(180+a);}
      out.push({i,type:this.wagonTypes[i],sprite_enum:WAGON_ENUM[this.wagonTypes[i]],front_x:x1,front_y:y1,rear_x:x2,rear_y:y2,center_x:Math.trunc((x1+x2)/2),center_y:Math.trunc((y1+y2)/2),angle:a,spr_start:this.wagonSprStart[i],newwagon_overlay_frame:null});
      ltrain=f32(f32(ltrain+length)+this.spacing);
    }
    return out;
  }
  renderFrame(){
    const geom=this.trainGeometry();
    for(let i=0;i<geom.length;i++) if(this.wagonSprStart[i]<N_SPR_START){this.wagonSprStart[i]=f32(this.wagonSprStart[i]+this.memoDt*N_SPR_START/750.0);if(this.wagonSprStart[i]<N_SPR_START)geom[i].newwagon_overlay_frame=Math.trunc(this.wagonSprStart[i]);geom[i].spr_start=this.wagonSprStart[i];}
    this.renderedWagonPoints=geom.map(g=>[g.front_x,g.front_y,g.rear_x,g.rear_y]); this.lastRenderGeometry=geom.map(g=>({...g})); return geom;
  }
  #addWagon(){
    const idx=this.rng.randMod(4,'wagon_type'); let typ=WAGON_TYPES[idx]; if(typ===this.wagonTypes[this.wagonTypes.length-1])typ=WAGON_TYPES[(idx+1)%4];
    this.wagonTypes.push(typ);this.wagonLengths.push(40.0);this.wagonSprStart.push(0.0);return typ;
  }
  #recordPickup(p,object,wagonType=null){const ev={event:'pickup',frame_clock_ms:this.clockMs+Math.trunc(this.memoDt),game_ms_before:this.gameMs-this.memoDt,cell:p,cell_x:p%LT,cell_y:Math.floor(p/LT),object,wagon_type:wagonType,score:this.score,lives:this.lives};this.collectedEvents.push(ev);this.frameEvents.push(ev);}
  #collisionFromPreviousRender(){
    if(this.renderedWagonPoints.length<2)return false; const [ldx,ldy]=this.renderedWagonPoints[0];let hit=false;
    for(let i=1;i<Math.min(this.wagonLengths.length,this.renderedWagonPoints.length);i++){
      const [dx,dy,fx,fy]=this.renderedWagonPoints[i],ec1=(dx-ldx)**2+(dy-ldy)**2,ec2=(fx-ldx)**2+(fy-ldy)**2;
      if(this.mortUntil<this.clockMs&&(ec1<RAYON_TOUCHE||ec2<=RAYON_TOUCHE)){this.lives--;this.mortUntil=this.clockMs+Math.trunc(this.memoDt)+3000;this.collisionCount++;hit=true;}
    } return hit;
  }
  #testCase(dist){
    if(this.history.length<2)return; const dm=f32((this.history.at(-1).d+this.history.at(-2).d)/2.0);
    if(this.d<=dm&&f32(this.d+dist)>=dm){
      const p=this.history.at(-1).p,cell=this.board[p];
      if(cell===C_WAGON){this.board[p]=C_RAIL;this.score+=5;const typ=this.#addWagon();this.#recordPickup(p,'wagon',typ);this.won=!this.board.some(v=>v===C_WAGON);if(this.won)this.mortUntil=this.clockMs+Math.trunc(this.memoDt)+3000;}
      else if(cell===C_STRETCH){this.board[p]=C_RAIL;this.score+=20;this.#recordPickup(p,'stretch');if(this.shrinkUntil>this.gameMs)this.shrinkUntil=this.gameMs-1;else this.stretchUntil=this.gameMs+DURATION_POWER;}
      else if(cell===C_SHRINK){this.board[p]=C_RAIL;this.#recordPickup(p,'shrink');if(this.stretchUntil>this.gameMs)this.stretchUntil=this.gameMs-1;else this.shrinkUntil=this.gameMs+DURATION_POWER;}
      else if(cell===C_SPEED){this.board[p]=C_RAIL;this.score+=30;this.speedUntil=this.gameMs+DURATION_POWER;this.#recordPickup(p,'speed');}
      else if(cell===C_LIVE){this.board[p]=C_RAIL;this.lives++;this.#recordPickup(p,'life');}
      this.#collisionFromPreviousRender();
    }
  }
  step(dtMs,key=null,renderAfter=true){
    this.frameEvents=[];this.memoDt=Number(dtMs);if(key!==null)this.bufferKey(key);
    if(this.mortUntil!==-1){this.clockMs+=dtMs;if(!(this.mortUntil>this.clockMs))this.gameMs+=dtMs;if(renderAfter)this.renderFrame();return this.snapshot();}
    this.gameMs+=dtMs; let dist=f32(this.speed*Number(dtMs)/1000.0); this.#testCase(dist);
    const nw=this.wagonLengths.length;
    if(this.shrinkUntil>this.gameMs){if(this.spacing>SPACING_MIN){this.spacing=f32(this.spacing-Number(dtMs)*(this.speed*0.8/(nw-1))/1000.0);if(this.spacing<SPACING_MIN)this.spacing=SPACING_MIN;}}
    else if(this.spacing<SPACING_NORMAL){this.spacing=f32(this.spacing+Number(dtMs)*(this.speed*0.8/nw)/1000.0);if(this.spacing>SPACING_NORMAL)this.spacing=SPACING_NORMAL;}
    if(this.stretchUntil>this.gameMs){if(this.spacing<SPACING_MAX){this.spacing=f32(this.spacing+Number(dtMs)*(this.speed*0.8/nw)/1000.0);if(this.spacing>SPACING_MAX)this.spacing=SPACING_MAX;}}
    else if(this.spacing>SPACING_NORMAL){this.spacing=f32(this.spacing-Number(dtMs)*(this.speed*0.8/(nw-1))/1000.0);if(this.spacing<SPACING_NORMAL)this.spacing=SPACING_NORMAL;}
    if(this.speedUntil>this.gameMs){if(this.speed<this.baseSpeed*2)this.speed=Math.min(this.baseSpeed*2,this.speed+Number(dtMs)/40.0);} else if(this.speed>this.baseSpeed)this.speed=Math.max(this.baseSpeed,this.speed-Number(dtMs)/40.0);
    while(f32(this.d+dist)>this.history.at(-1).d){dist=f32(dist-f32(this.history.at(-1).d-this.d));this.d=this.history.at(-1).d;const choices=this.keys.filter(k=>this.testDir(k));if(!choices.length)throw new Error('No legal direction');this.go(choices[0]);this.doArrow();this.#testCase(dist);}
    this.d=f32(this.d+dist);if(this.pInter===-1)this.doArrow();this.clockMs+=dtMs;if(renderAfter)this.renderFrame();return this.snapshot();
  }
  snapshot(){
    const g=this.lastRenderGeometry?this.lastRenderGeometry.map(x=>({...x})):this.trainGeometry(),cur=this.history.at(-1),board=this.board.slice();
    return {time_ms:this.gameMs,clock_ms:this.clockMs,D:this.d,cell:cur.p,cell_x:cur.p%LT,cell_y:Math.floor(cur.p/LT),exit:DIR_NAMES[cur.sortie],history_n:this.history.length,keys:this.keys.map(k=>DIR_NAMES[k]).join('/'),wagons:this.wagonLengths.length,wagon_types:this.wagonTypes.slice(),remaining:this.board.filter(v=>v===C_WAGON).length,spacing:this.spacing,speed:this.speed,score:this.score,lives:this.lives,won:this.won,collision_count:this.collisionCount,mort_until:this.mortUntil,pause_expired:this.mortUntil!==-1&&this.clockMs>this.mortUntil,history_compactions:this.historyCompactions,geometry:g,board,frame_events:this.frameEvents.map(x=>({...x})),collected_count:this.collectedEvents.length,rng_calls:this.rng.callCount};
  }
}
