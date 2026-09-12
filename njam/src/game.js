/*
 * Njam Web Archaeology Port
 * New web-port code: GPL-3.0-or-later.
 * Behavioural reference: Njam 1.21 AmigaOS4 source by Milan Babuskov
 * (GPL-2.0-or-later), especially Source/njamgame.cpp, njammap.cpp and njamedit.cpp.
 */
import { COOP_LEVELSETS, DUEL_LEVELSETS } from './levels-data.js';

export const TILE = Object.freeze({
  WALL:0, EMPTY:1, GHOUSE:2, DOOR:3, JUICE:4, COOKIE:5,
  FREEZER:6, TRAP:7, TELEPORT:8, INVISIBLE:9, POINTS:10, GHOUSE_ACTIVE:11
});
export const MODE = Object.freeze({ ONE:'one', TWO:'two', DUEL:'duel' });
export const MAPW=28, MAPH=24, MAPSIZE=MAPW*MAPH, MAPS=20;
export const MAXDELAY=120, GHOSTMAX=8, FRAME_MS=34;
export const GHOST = Object.freeze({ SMART:0, STUPID:1, CHASER:2 });

class RNG {
  constructor(seed){ this.reset(seed); }
  reset(seed){ this.s=(Number(seed)>>>0)||0x6d2b79f5; }
  next(){ let x=this.s; x^=x<<13; x^=x>>>17; x^=x<<5; this.s=x>>>0; return this.s/4294967296; }
  int(n){ return n>0 ? Math.floor(this.next()*n) : 0; }
}

export class LevelSet {
  constructor(def){
    this.def=def;
    const bin=atob(def.bytesBase64);
    this.bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) this.bytes[i]=bin.charCodeAt(i);
  }
  rawMap(index){
    const out=new Uint8Array(MAPSIZE),base=index*MAPSIZE;
    for(let x=0;x<MAPW;x++) for(let y=0;y<MAPH;y++) out[y*MAPW+x]=this.bytes[base+x*MAPH+y];
    return out;
  }
  // NjamMap::SetCurrentMap() copies the selected map into the gameplay buffer and
  // clears the three corners reserved for players 1..3. (Player 0 corner is deliberately untouched.)
  runtimeMap(index){
    const out=this.rawMap(index);
    out[(MAPH-2)*MAPW+1]=TILE.EMPTY;
    out[1*MAPW+(MAPW-2)]=TILE.EMPTY;
    out[(MAPH-2)*MAPW+(MAPW-2)]=TILE.EMPTY;
    return out;
  }
  map(index){ return this.runtimeMap(index); }
}

function player(index){
  const starts=[[1,1],[MAPW-2,MAPH-2],[MAPW-2,1],[1,MAPH-2]];
  const [x,y]=starts[index];
  return {
    index,playing:false,x,y,xo:0,yo:0,vx:0,vy:0,rotate:(index===1||index===2)?2:0,
    juice:0,invisible:0,freeze:0,frame:0,framemax:5,delay:0,mapPoints:0,gamePoints:0,
    stats:{cookies:0,juices:0,kills:0,playerKills:0,deaths:0,invisibles:0}
  };
}

export class NjamGame extends EventTarget {
  constructor(opts={}){
    super();
    this.coopLevelsets=COOP_LEVELSETS;
    this.duelLevelsets=DUEL_LEVELSETS;
    this.levelsets=this.coopLevelsets; // compatibility with early tests/UI
    this.fixedSeed=opts.seed ?? null;
    this.seed=this.fixedSeed ?? Date.now();
    this.rng=new RNG(this.seed);
    this.levelSetIndex=0;
    this.skinOption=-1;
    this.soundEnabled=true;
    this.resetState();
  }

  resetState(){
    this.running=false;this.paused=false;this.mode=MODE.ONE;
    this.level=0;this.currentMap=0;this.lives=4;this.bonus=0;this.freeze=0;this.cookies=0;
    this.map=null;this.players=[0,1,2,3].map(player);this.ghosts=[];this.ghostCount=5;
    this.frame=0;this.status='menu';this.result=null;this.pendingFinal=false;this.lifeAwarded=false;
    this.postReadyUpdate=false;this.currentMusic='ritam';this.currentSkin=0;this.roundWinner=null;
    this.tripleDinged=false;this.editorTest=false;
  }

  get player(){ return this.players[0]; }
  get score(){ return this.players[0].gamePoints; }
  set score(v){ this.players[0].gamePoints=Number(v)||0; }
  get mapPoints(){ return this.players[0].mapPoints; }
  set mapPoints(v){ this.players[0].mapPoints=Number(v)||0; }
  get stats(){ return this.players[0].stats; }
  get isDuel(){ return this.mode===MODE.DUEL; }
  get isCoop(){ return this.mode===MODE.ONE||this.mode===MODE.TWO; }

  levelsetsForMode(mode=this.mode){ return mode===MODE.DUEL?this.duelLevelsets:this.coopLevelsets; }
  selectLevelSet(i){
    const sets=this.levelsetsForMode();
    this.levelSetIndex=Math.max(0,Math.min(sets.length-1,Number(i)||0));
    this.levelsets=sets;
  }
  setSkin(i){ this.skinOption=Number(i); }
  setSoundEnabled(on){ this.soundEnabled=!!on; }
  activeSkin(){ return this.currentSkin; }

  reseed(){ this.seed=this.fixedSeed ?? Date.now();this.rng.reset(this.seed); }

  start(mode=this.mode){
    this.reseed();
    this.mode=Object.values(MODE).includes(mode)?mode:MODE.ONE;
    this.levelsets=this.levelsetsForMode(this.mode);
    if(this.levelSetIndex>=this.levelsets.length)this.levelSetIndex=0;
    this.lives=4;this.level=0;this.currentMap=-1;this.frame=0;this.result=null;this.pendingFinal=false;
    this.running=true;this.paused=false;this.roundWinner=null;this.tripleDinged=false;this.editorTest=false;
    this.players=[0,1,2,3].map(player);
    this.players[0].playing=true;
    if(this.mode===MODE.TWO||this.mode===MODE.DUEL)this.players[1].playing=true;
    this.ghostCount=this.mode===MODE.DUEL?8:5;
    this.loadRound();
    this.status='ready';this.emit('start');this.emit('ready');
  }

  startEditorTest(def,mapIndex=0,kind='COOP'){
    this.reseed();
    this.mode=MODE.DUEL;this.editorTest=true;this.levelsets=[def];this.levelSetIndex=0;
    this.lives=4;this.level=this.currentMap=Math.max(0,Math.min(MAPS-1,mapIndex|0));this.frame=0;
    this.result=null;this.pendingFinal=false;this.running=true;this.paused=false;this.roundWinner=null;this.tripleDinged=false;
    this.players=[0,1,2,3].map(player);this.players[0].playing=this.players[1].playing=true;
    const duel=String(kind).toUpperCase()==='DUEL';this.ghostCount=duel?8:5;
    this.map=new LevelSet(def).runtimeMap(this.currentMap);
    if(duel)this.addPowerups(6);
    this.cookies=this.count(TILE.COOKIE);this.bonus=0;this.freeze=0;this.lifeAwarded=false;this.postReadyUpdate=false;
    this.setupMap();
    // njamedit.cpp forces skin #1 only when the editor is configured for random skin.
    this.currentSkin=this.skinOption>=0?Math.max(0,Math.min(3,this.skinOption|0)):0;
    this.status='ready';this.emit('editorteststart',{kind:duel?'DUEL':'COOP'});this.emit('ready');
  }

  chooseCurrentMap(){
    const max=this.levelsets[this.levelSetIndex].validMaps;
    if(this.mode===MODE.DUEL)this.currentMap=this.rng.int(max);
    else this.currentMap++;
    this.level=this.currentMap;
  }

  loadRound(){
    this.chooseCurrentMap();
    const def=this.levelsets[this.levelSetIndex],set=new LevelSet(def);
    this.map=set.runtimeMap(this.currentMap);

    // StartGame chooses music before PlayMap(). Keep that RNG call/order.
    this.currentMusic=this.rng.int(4)>0?'ritam':'dali';

    // PlayMap(true) adds six random powerups only in duel mode.
    if(this.mode===MODE.DUEL)this.addPowerups(6);

    this.cookies=this.count(TILE.COOKIE);
    this.bonus=this.mode===MODE.ONE?1850:(this.mode===MODE.TWO?1000:0);
    if(this.bonus&&this.cookies>260)this.bonus+=(this.mode===MODE.ONE?7:4)*(this.cookies-250);
    this.freeze=0;this.lifeAwarded=false;this.result=null;this.pendingFinal=false;this.postReadyUpdate=false;
    this.roundWinner=null;this.tripleDinged=false;
    this.setupMap();

    if(this.skinOption>=0)this.currentSkin=Math.max(0,Math.min(3,this.skinOption|0));
    else if(this.mode===MODE.DUEL)this.currentSkin=this.rng.int(4);
    else{
      const max=def.validMaps||1;
      this.currentSkin=Math.max(0,Math.min(3,Math.floor(4*this.currentMap/max)));
    }
    this.emit('level');
  }

  setupMap(){
    const starts=[[1,1],[MAPW-2,MAPH-2],[MAPW-2,1],[1,MAPH-2]];
    for(let i=0;i<4;i++){
      const p=this.players[i],[x,y]=starts[i];
      Object.assign(p,{x,y,xo:0,yo:0,vx:0,vy:0,frame:0,framemax:5,delay:0,rotate:(i===1||i===2)?2:0,juice:0,invisible:0,freeze:0,mapPoints:0});
    }
    const gh=this.ghostHouse();this.ghosts=[];
    for(let n=0;n<this.ghostCount;n++){
      const slot=n+4;
      this.ghosts.push({slot,type:slot%3,x:gh.x,y:gh.y,xo:0,yo:0,vx:0,vy:0,frame:0,framemax:0,delay:slot*(MAXDELAY/GHOSTMAX),special:0});
    }
  }

  addPowerups(howMuch){
    const allowed=[TILE.JUICE,TILE.FREEZER,TILE.TRAP,TILE.INVISIBLE,TILE.COOKIE];
    for(let i=0;i<howMuch;i++){
      let x=0,y=0,guard=0;
      do{x=this.rng.int(MAPW);y=this.rng.int(MAPH);if(++guard>10000)return;}while(this.tile(x,y)!==TILE.COOKIE);
      this.setTile(x,y,allowed[this.rng.int(5)]);
    }
  }

  beginPlaying(){
    if(this.status!=='ready')return;
    if(this.postReadyUpdate){this.updateWorld();this.postReadyUpdate=false;}
    this.status='playing';this.paused=false;this.emit('playing');
  }

  tile(x,y){ if(x<0||y<0||x>=MAPW||y>=MAPH)return TILE.WALL;return this.map[y*MAPW+x]; }
  setTile(x,y,t){ if(x>=0&&y>=0&&x<MAPW&&y<MAPH)this.map[y*MAPW+x]=t; }
  count(t){ let n=0;for(const v of this.map)if(v===t)n++;return n; }
  find(t){for(let x=0;x<MAPW;x++)for(let y=0;y<MAPH;y++)if(this.tile(x,y)===t)return{x,y};return{x:0,y:0,invalid:true};}
  ghostHouse(){for(let x=0;x<MAPW;x++)for(let y=0;y<MAPH;y++){const t=this.tile(x,y);if(t===TILE.GHOUSE||t===TILE.GHOUSE_ACTIVE)return{x,y};}return{x:0,y:0,invalid:true};}
  otherTeleport(x,y){
    let count=0;for(let xx=0;xx<MAPW;xx++)for(let yy=0;yy<MAPH;yy++)if(this.tile(xx,yy)===TILE.TELEPORT)count++;
    if(count<2)return{x,y};let selected=this.rng.int(count-1);
    for(let xx=0;xx<MAPW;xx++)for(let yy=0;yy<MAPH;yy++){
      if(xx===x&&yy===y)continue;if(this.tile(xx,yy)===TILE.TELEPORT)selected--;if(selected<0)return{x:xx,y:yy};
    }return{x,y,invalid:true};
  }

  input(rot,playerIndex=0){
    const p=this.players[playerIndex];if(!p||!p.playing)return;
    p.rotate=rot;
    if(rot===0&&p.vx===-1)p.vx=1;else if(rot===1&&p.vy===-1)p.vy=1;else if(rot===2&&p.vx===1)p.vx=-1;else if(rot===3&&p.vy===1)p.vy=-1;
  }

  tick(){
    if(!this.running||this.paused||this.status!=='playing')return;
    this.frame++;this.animate();this.moveGhosts();this.movePlayers();
    if(this.cookies<=0){this.finishRound();this.emit('tick');return;}
    this.collide();
    if(this.status==='playing'){this.updateWorld();this.updateDuelRaceState();}
    this.emit('tick');
  }

  animate(){for(const p of this.players){p.frame++;if(p.frame>p.framemax)p.frame=0;}for(const g of this.ghosts){g.frame++;if(g.frame>g.framemax)g.frame=0;}}

  processTile(p=this.player){
    const t=this.tile(p.x,p.y);
    switch(t){
      case TILE.POINTS:this.setTile(p.x,p.y,TILE.EMPTY);p.gamePoints+=50;this.emit('points',{player:p.index});break;
      case TILE.WALL:{p.vx=p.vy=p.xo=p.yo=0;p.delay=MAXDELAY*2;const d=this.find(TILE.DOOR);p.x=d.x;p.y=d.y;this.emit('trapDeath',{player:p.index});break;}
      case TILE.COOKIE:this.cookies--;p.mapPoints++;if(this.mode===MODE.ONE)p.gamePoints++;p.stats.cookies++;this.setTile(p.x,p.y,TILE.EMPTY);this.emit('cookie',{player:p.index});break;
      case TILE.FREEZER:this.freeze+=MAXDELAY;this.setTile(p.x,p.y,TILE.EMPTY);this.emit('freeze',{player:p.index});break;
      case TILE.TRAP:this.setTile(p.x,p.y,TILE.WALL);this.emit('trap',{player:p.index});break;
      case TILE.INVISIBLE:p.invisible=MAXDELAY*3;this.setTile(p.x,p.y,TILE.EMPTY);p.stats.invisibles++;this.emit('invisible',{player:p.index});break;
      case TILE.JUICE:
        if(p.juice){
          if(this.mode===MODE.DUEL){
            let xc=1,yc=1;if(p.x<MAPW/2)xc=MAPW-2;if(p.y<MAPH/2)yc=MAPH-2;
            this.setTile(p.x,p.y,TILE.EMPTY);this.setTile(xc,yc,TILE.JUICE);this.emit('teleport',{player:p.index,juiceRelocation:true});
          }
          break;
        }
        p.juice=MAXDELAY*2;this.setTile(p.x,p.y,TILE.EMPTY);p.stats.juices++;this.emit('juice',{player:p.index});break;
    }
  }

  movePlayers(){for(const p of this.players)if(p.playing)this.movePlayer(p);}
  movePlayer(p=this.player){
    if(p.delay>0)return;if(p.freeze>0){p.freeze--;return;}
    const wasMoving=!!(p.vx||p.vy);
    if(p.xo===0&&p.yo===0){if(this.tile(p.x+p.vx,p.y+p.vy)===TILE.WALL)p.vx=p.vy=0;this.processTile(p);}
    p.xo+=p.vx;p.yo+=p.vy;
    if(p.xo>4){p.xo=0;p.x++;}else if(p.xo<0){p.xo=4;p.x--;}
    if(p.yo>4){p.yo=0;p.y++;}else if(p.yo<0){p.yo=4;p.y--;}
    if(p.xo===0&&p.yo===0){const d=[[1,0],[0,1],[-1,0],[0,-1]][p.rotate];if(this.tile(p.x+d[0],p.y+d[1])!==TILE.WALL){p.vx=d[0];p.vy=d[1];}}
    if(p.xo===0&&p.yo===0){
      if(wasMoving&&this.tile(p.x,p.y)===TILE.TELEPORT){const q=this.otherTeleport(p.x,p.y);p.x=q.x;p.y=q.y;this.emit('teleport',{player:p.index});}
      if(this.tile(p.x+p.vx,p.y+p.vy)===TILE.WALL)p.vx=p.vy=0;
    }
  }

  crossroads(x,y){let r=0;if(this.tile(x-1,y)!==TILE.WALL)r++;if(this.tile(x+1,y)!==TILE.WALL)r++;if(this.tile(x,y-1)!==TILE.WALL)r++;if(this.tile(x,y+1)!==TILE.WALL)r++;return r;}
  turnOnCrossroads(g,choice){let r=0;if(g.vx!==1&&this.tile(g.x-1,g.y)!==TILE.WALL){if(r===choice){g.vx=-1;g.vy=0;return;}r++;}if(g.vx!==-1&&this.tile(g.x+1,g.y)!==TILE.WALL){if(r===choice){g.vx=1;g.vy=0;return;}r++;}if(g.vy!==1&&this.tile(g.x,g.y-1)!==TILE.WALL){if(r===choice){g.vx=0;g.vy=-1;return;}r++;}if(g.vy!==-1&&this.tile(g.x,g.y+1)!==TILE.WALL){if(r===choice){g.vx=0;g.vy=1;}}}

  nearestVisiblePlayer(g){
    let nearest=-1,distance=1000,byX=false;
    for(let k=0;k<4;k++){
      const p=this.players[k];if(!p.playing||p.delay||p.invisible>0)continue;
      if(g.x===p.x){
        const from=Math.min(g.y,p.y),to=Math.max(g.y,p.y);let ok=true;
        for(let j=from;j<to;j++)if(this.tile(g.x,j)===TILE.WALL){ok=false;break;}
        if(ok&&distance>to-from){distance=to-from;nearest=k;byX=true;}continue;
      }
      if(g.y===p.y){
        const from=Math.min(g.x,p.x),to=Math.max(g.x,p.x);let ok=true;
        for(let j=from;j<to;j++)if(this.tile(j,g.y)===TILE.WALL){ok=false;break;}
        if(ok&&distance>to-from){distance=to-from;nearest=k;byX=false;}
      }
    }
    return nearest<0?null:{player:this.players[nearest],byX};
  }

  moveGhosts(){
    const gh=this.ghostHouse();this.setTile(gh.x,gh.y,TILE.GHOUSE);
    for(const g of this.ghosts){
      if(g.delay>0){
        if(g.delay===1){g.x=gh.x;g.y=gh.y;g.xo=g.yo=0;g.vx=0;g.vy=1;}else this.setTile(gh.x,gh.y,TILE.GHOUSE_ACTIVE);
        if(this.freeze>0){if(g.delay%2)g.delay--;else g.delay++;continue;}g.delay--;
      }
      if(g.delay||this.freeze>0)continue;
      g.xo+=g.vx;g.yo+=g.vy;
      if(g.xo>4){g.xo=0;g.x++;}else if(g.xo<0){g.xo=4;g.x--;}
      if(g.yo>4){g.yo=0;g.y++;}else if(g.yo<0){g.yo=4;g.y--;}
      if(g.xo===0&&g.yo===0&&(g.type===GHOST.STUPID||(g.type===GHOST.SMART&&g.special===0))){const paths=this.crossroads(g.x,g.y);if((paths>1&&g.type===GHOST.SMART)||paths>2)this.turnOnCrossroads(g,this.rng.int(paths-1));}
      if(g.xo===0&&g.yo===0){
        const seen=this.nearestVisiblePlayer(g);
        if(seen){const p=seen.player;
          if(seen.byX){
            if(p.juice===0){if(g.type!==GHOST.STUPID){g.vy=g.y<p.y?1:-1;g.vx=0;if(g.type===GHOST.SMART)g.special=1;}}
            else{const j=g.y+(g.y<p.y?-1:1);if(this.tile(g.x,j)!==TILE.WALL){g.vy=g.y<p.y?-1:1;g.vx=0;}}
          }else{
            if(p.juice===0){if(g.type!==GHOST.STUPID){g.vx=g.x<p.x?1:-1;g.vy=0;if(g.type===GHOST.SMART)g.special=1;}}
            else{const j=g.x+(g.x<p.x?-1:1);if(this.tile(j,g.y)!==TILE.WALL){g.vx=g.x<p.x?-1:1;g.vy=0;}}
          }
        }
      }
      let guard=0;while(g.xo===0&&g.yo===0&&this.tile(g.x+g.vx,g.y+g.vy)===TILE.WALL){if(g.type===GHOST.SMART)g.special=0;g.vx=g.vy=0;if(this.rng.int(2)===0)g.vx=-1+2*this.rng.int(2);else g.vy=-1+2*this.rng.int(2);if(++guard>128){g.vx=g.vy=0;this.emit('paritySafety',{reason:'surrounded-ghost'});break;}}
    }
  }

  collide(){
    if(this.mode===MODE.DUEL)this.collidePlayers();
    for(const g of this.ghosts){
      if(g.delay)continue;const gx=g.x*5+g.xo,gy=g.y*5+g.yo;
      for(const p of this.players){
        if(!p.playing||p.delay)continue;const px=p.x*5+p.xo,py=p.y*5+p.yo;
        if(Math.abs(gx-px)+Math.abs(gy-py)>=4)continue;
        if(p.juice){g.delay=MAXDELAY;p.mapPoints+=5;if(this.mode===MODE.ONE)p.gamePoints+=5;p.stats.kills++;const variant=this.soundEnabled?this.rng.int(3):0;this.emit('kill',{variant,player:p.index});}
        else{p.delay=MAXDELAY;p.stats.deaths++;const variant=this.soundEnabled?this.rng.int(3):0;this.emit('deathSound',{variant,player:p.index});
          if(this.isCoop){this.handleCoopGhostDeath(p,variant);return;}
          this.respawnDuelPlayer(p);this.emit('duelDeath',{player:p.index,variant});
        }
      }
    }
  }

  collidePlayers(){
    for(let i=0;i<3;i++){const a=this.players[i];if(!a.playing||a.delay)continue;const ax=a.x*5+a.xo,ay=a.y*5+a.yo;
      for(let j=i+1;j<4;j++){const b=this.players[j];if(!b.playing||b.delay)continue;const bx=b.x*5+b.xo,by=b.y*5+b.yo;if(Math.abs(ax-bx)+Math.abs(ay-by)>=4)continue;
        if(a.juice&&!b.juice){this.killPlayer(a,b);}else if(!a.juice&&b.juice){this.killPlayer(b,a);}
      }
    }
  }

  killPlayer(killer,victim){
    const d=this.find(TILE.DOOR);Object.assign(victim,{xo:0,yo:0,vx:0,vy:0,delay:MAXDELAY,x:d.x,y:d.y});killer.stats.playerKills++;this.emit('playerKill',{killer:killer.index,victim:victim.index});
  }
  respawnDuelPlayer(p){const d=this.find(TILE.DOOR);Object.assign(p,{xo:0,yo:0,vx:0,vy:0,x:d.x,y:d.y});if(p.invisible<1.5*MAXDELAY)p.invisible=1.5*MAXDELAY;}

  handleCoopGhostDeath(p,variant){
    this.lives--;if(this.lives<0){this.result='gameover';this.status='map-result';this.emit('mapresult',{result:'gameover'});return;}
    p.delay=0;this.status='life-lost';this.emit('death',{variant,player:p.index});
  }

  forfeitLife(){
    if(this.status!=='playing')return;
    if(this.mode===MODE.DUEL){this.finishRound(true);return;}
    this.lives--;if(this.lives<0){this.result='gameover';this.status='map-result';this.emit('mapresult',{result:'gameover'});return;}
    this.status='life-lost';this.emit('forfeit');
  }
  abandonFromLifeLost(){if(this.status!=='life-lost')return;this.result='gameover';this.status='map-result';this.emit('mapresult',{result:'gameover'});}
  continueAfterDeath(){
    if(this.status!=='life-lost')return;const d=this.find(TILE.DOOR),gh=this.ghostHouse();
    for(const p of this.players){if(!p.playing)continue;Object.assign(p,{x:d.x,y:d.y,xo:0,yo:0,vx:0,vy:0,delay:0,rotate:0});}
    this.ghosts.forEach(g=>Object.assign(g,{x:gh.x,y:gh.y,xo:0,yo:0,vx:0,vy:0,delay:g.slot*(MAXDELAY/GHOSTMAX),special:0}));
    this.status='ready';this.postReadyUpdate=true;this.emit('ready');
  }

  updateWorld(){
    if(this.freeze>0)this.freeze--;
    if(this.bonus>0){this.bonus--;if(this.bonus===0)this.emit('bonusExpired');if(this.mode===MODE.ONE&&this.bonus%180===120&&this.rng.int(5)===1){let guard=0;while(guard++<10000){const x=1+this.rng.int(MAPW-2),y=1+this.rng.int(MAPH-2);if(this.tile(x,y)===TILE.EMPTY){this.setTile(x,y,TILE.POINTS);break;}}}}
    for(const p of this.players){if(!p.playing)continue;if(p.juice>0)p.juice--;if(p.invisible>0)p.invisible--;if(p.delay>0)p.delay--;}
  }

  updateDuelRaceState(){
    if(this.mode!==MODE.DUEL)return;
    const active=this.players.filter(p=>p.playing);
    if(active.length<2)return;
    let maxp=0;for(const p of active)if(p.mapPoints>maxp)maxp=p.mapPoints;
    let dinger=0;
    for(const p of active){
      if(p.mapPoints!==maxp && p.mapPoints+this.cookies<maxp)dinger++;
    }
    if(!this.tripleDinged && dinger+1===active.length){
      this.tripleDinged=true;this.emit('tripleDing');
    }else if(this.tripleDinged && active.length-dinger>1){
      this.tripleDinged=false;this.emit('raceReopened');
    }
  }

  finishRound(escaped=false){
    if(this.status!=='playing')return;
    if(this.editorTest){
      this.running=false;this.status='editor-test-done';this.escaped=escaped;
      this.emit('editortestdone',{escaped});return;
    }
    if(this.isCoop){
      const max=this.levelsets[this.levelSetIndex].validMaps;this.pendingFinal=this.currentMap+1>=max;this.result='levelwon';
      if(this.bonus>0){this.lives++;this.lifeAwarded=true;this.status='bonus-life';this.emit('bonuslife');}else this.enterMapResult();
      return;
    }
    let max=-1,winner=0,total=0;for(const p of this.players)if(p.mapPoints>max){max=p.mapPoints;winner=p.index;}
    for(const p of this.players)if(p.mapPoints===max)total++;
    this.roundWinner=total>1?-1:winner;this.result=this.roundWinner<0?'draw':'duelwon';
    if(this.roundWinner>=0)this.players[this.roundWinner].gamePoints++;
    this.pendingFinal=this.roundWinner>=0&&this.players[this.roundWinner].gamePoints>=4;
    this.escaped=escaped;this.enterMapResult();
  }

  finishBonusLife(){if(this.status==='bonus-life')this.enterMapResult();}
  enterMapResult(){
    this.status='map-result';
    let endSfx=0;
    if(this.result==='gameover')endSfx=1;
    else if(this.result==='levelwon')endSfx=0;
    else endSfx=this.soundEnabled?this.rng.int(2):0;
    this.emit('mapresult',{result:this.result,final:this.pendingFinal,winner:this.roundWinner,endSfx});
  }
  continueMapResult(){
    if(this.status!=='map-result')return;
    if(this.result==='gameover'){this.status='gameover';this.running=false;this.emit('gameover');return;}
    if(this.mode===MODE.DUEL){
      if(this.pendingFinal){this.status='duel-won';this.running=false;this.emit('duelwon',{winner:this.roundWinner});return;}
      this.loadRound();this.status='ready';this.emit('ready');return;
    }
    if(this.pendingFinal){this.status='won';this.running=false;this.emit('won');return;}
    this.loadRound();this.status='ready';this.emit('ready');
  }

  emit(name,extra={}){this.dispatchEvent(new CustomEvent(name,{detail:{game:this,...extra}}));}
}
