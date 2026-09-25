/*
 * OGLBricks HTML5 engine (Libre Arcade port), GPL-3.0-or-later.
 * Original rules/shape geometry: OGLBricks (c) 2012 Alexey Markarov, MIT.
 * See THIRD_PARTY_NOTICES.md and specs/AUDIT.md for verified differences.
 */
import { SHAPES } from './shapes.js';
export const WIDTH_MIN = 10, WIDTH_MAX = 50;
export const DEFAULT_SETTINGS = Object.freeze({ width:20, height:20, enabled:[1,2,3,4], initialSpeed:1, increaseSpeed:true, immediateFall:true, lockDelay:300 });
const clone = x => JSON.parse(JSON.stringify(x));
export function normalizeSettings(s={}) {
 const enabled = [...new Set(Array.isArray(s.enabled)?s.enabled.map(Number):DEFAULT_SETTINGS.enabled)].filter(v=>Number.isInteger(v)&&v>=1&&v<=5).sort();
 return {width:limit(s.width,20,10,50),height:limit(s.height,20,10,50),enabled: enabled.length?enabled:[1,2,3,4],initialSpeed:limit(s.initialSpeed,1,1,10),increaseSpeed:s.increaseSpeed!==false,immediateFall:s.immediateFall!==false,lockDelay:limit(s.lockDelay,300,0,3000)};
}
function limit(v,f,min,max) {let n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):f;}
function makeRng(seed){ let state=seed>>>0 || 0x6d2b79f5; return { next(){state^=state<<13;state^=state>>>17;state^=state<<5;state >>>= 0; return state/4294967296;}, get state(){return state},set state(value){state=value>>>0 || 0x6d2b79f5} }; }
export function pieceCells(piece){ if(!piece)return []; const shape=SHAPES[piece.id-1]; if(!shape)throw new Error('Invalid original piece type');return shape.cells[piece.rotation].map(([x,y])=>[x+piece.x,y+piece.y]);}
export class Game {
 constructor(settings={},seed=Date.now()){this.onChange=null;this.onEvent=null;this.newGame(settings,seed);}
 emit(event){if(typeof this.onEvent==='function')this.onEvent(event);}
 changed(){if(typeof this.onChange==='function')this.onChange(this);}
 newGame(settings=this.settings,seed=Date.now()){
  this.settings=normalizeSettings(settings);this.seed=seed>>>0;this.rng=makeRng(this.seed);
  this.board=Array.from({length:this.settings.height},()=>Array(this.settings.width).fill(0));
  this.current=null;this.next=null;this.lastType=0;this.score=0;this.speed=this.settings.initialSpeed;this.linesAtLevel=0;this.totalLines=0;
  this.elapsed=0;this.gravityElapsed=0;this.lockElapsed=0;this.paused=false;this.gameOver=false;this.pendingClear=[];
  this.next=this.pickShape();this.spawn();this.changed();
 }
 allowedIds(){return SHAPES.filter(x=>this.settings.enabled.includes(x.count)).map(x=>x.id);}
 pickShape(){const enabled=this.allowedIds();let available=enabled.filter(x=>x!==this.lastType);
  // Explicit port-only safety: historical C++ can return InvalidType with a single shape.
  if(!available.length)available=enabled;
  const id=available[Math.floor(this.rng.next()*available.length)];if(!id)throw new Error('No enabled original shapes');return id;
 }
 fits(piece){return pieceCells(piece).every(([x,y])=>x>=0&&x<this.settings.width&&y>=0&&y<this.settings.height&&!this.board[y][x]);}
 spawn(){
  const id=this.next; this.lastType=id;
  this.current={id,x:Math.floor(this.settings.width/2),y:this.settings.height-1,rotation:0};
  const start=this.current.x;let located=false;
  for(let x=start;x<this.settings.width;x++){this.current.x=x;if(pieceCells(this.current).some(p=>p[0]<0||p[0]>=this.settings.width||p[1]<0||p[1]>=this.settings.height))break;if(this.fits(this.current)){located=true;break;}}
  if(!located){for(let x=start-1;x>=0;x--){this.current.x=x;if(pieceCells(this.current).some(p=>p[0]<0||p[0]>=this.settings.width||p[1]<0||p[1]>=this.settings.height))break;if(this.fits(this.current)){located=true;break;}}}
  if(!located){this.gameOver=true;this.current=null;this.next=null;this.emit('gameOver');return false;}
  this.next=this.pickShape();this.lockElapsed=0;this.gravityElapsed=0;this.changed();return true;
 }
 move(dx,dy){if(this.paused||this.gameOver||!this.current)return false;const p={...this.current,x:this.current.x+dx,y:this.current.y+dy};if(!this.fits(p))return false;this.current=p;if(dy<0)this.lockElapsed=0;this.changed();if(dx!==0)this.emit('move');return true;}
 rotate(){if(this.paused||this.gameOver||!this.current)return false;const p={...this.current,rotation:(this.current.rotation+1)%4};if(!this.fits(p))return false;this.current=p;this.changed();this.emit('rotate');return true;}
 land(){if(this.paused||this.gameOver||!this.current)return 0;
  for(const [x,y] of pieceCells(this.current))this.board[y][x]=this.current.id;
  let full=[];for(let y=0;y<this.settings.height;y++)if(this.board[y].every(Boolean))full.push(y);
  if(full.length){ const n=full.length, frozen=new Set(full);
   this.board=this.board.filter((row,y)=>!frozen.has(y));while(this.board.length<this.settings.height)this.board.push(Array(this.settings.width).fill(0));
   // Historical C++ formula; independently reported +10 for two rows on a width-10 field
   // is not yet reconciled. Keep this deviation visible in audit documentation.
   this.score += n*n*this.settings.width*this.speed;this.linesAtLevel+=n;this.totalLines+=n;
   if(this.settings.increaseSpeed&&this.linesAtLevel>=this.settings.width*this.settings.height*this.speed){this.speed=Math.min(10,this.speed+1);this.linesAtLevel=0;}
  }
  this.current=null;this.pendingClear=full;this.emit(full.length?'clear':'land');this.spawn();this.changed();return full.length;
 }
 tick(ms,controls={}) {if(this.paused||this.gameOver||!this.current)return;
  const dt=Math.max(0,Math.min(100,Number(ms)||0));this.elapsed+=dt;
  if(this.settings.immediateFall || controls.down){this.gravityElapsed+=dt;const step=controls.down?65:1000/this.speed;
   if(this.gravityElapsed>=step){this.gravityElapsed%=step;this.move(0,-1);}
  }
  const grounded=!this.fits({...this.current,y:this.current.y-1});
  if(grounded){this.lockElapsed+=dt;if(this.lockElapsed>=this.settings.lockDelay)this.land();}
  else this.lockElapsed=0;
 }
 togglePause(){if(this.gameOver)return;this.paused=!this.paused;this.changed();}
 snapshot(){return {format:'oglbricks-libre-arcade',version:1,settings:clone(this.settings),seed:this.seed,rngState:this.rng.state,board:clone(this.board),current:clone(this.current),next:this.next,lastType:this.lastType,score:this.score,speed:this.speed,linesAtLevel:this.linesAtLevel,totalLines:this.totalLines,elapsed:this.elapsed,gravityElapsed:this.gravityElapsed,lockElapsed:this.lockElapsed,paused:this.paused,gameOver:this.gameOver};}
 restore(data){ if(!data||typeof data!=='object'||data.format!=='oglbricks-libre-arcade'||data.version!==1)throw new Error('FORMAT');
  if(!data.settings||typeof data.settings!=='object'||!Array.isArray(data.settings.enabled))throw new Error('SETTINGS');
  const settings=normalizeSettings(data.settings);const ids=SHAPES.map(x=>x.id);
  const enabledIds=SHAPES.filter(s=>settings.enabled.includes(s.count)).map(s=>s.id);
  if(!Array.isArray(data.board)||data.board.length!==settings.height||data.board.some(row=>!Array.isArray(row)||row.length!==settings.width||row.some(cell=>!Number.isInteger(cell)||cell<0||cell>27)))throw new Error('BOARD');
  if(data.current!==null && (!data.current||typeof data.current!=='object'||!enabledIds.includes(data.current.id)||!Number.isInteger(data.current.x)||!Number.isInteger(data.current.y)||!Number.isInteger(data.current.rotation)||data.current.rotation<0||data.current.rotation>3))throw new Error('PIECE');
  if(!enabledIds.includes(data.next)&&data.next!==null)throw new Error('NEXT');
  if(!Number.isInteger(data.lastType)||!ids.includes(data.lastType))throw new Error('LAST_TYPE');
  if(!Number.isInteger(data.seed)||data.seed<0||data.seed>0xffffffff||!Number.isInteger(data.rngState)||data.rngState<1||data.rngState>0xffffffff)throw new Error('RNG');
  for(const k of ['score','linesAtLevel','totalLines'])if(!Number.isSafeInteger(data[k])||data[k]<0)throw new Error('STATE');
  for(const k of ['speed','elapsed','gravityElapsed','lockElapsed'])if(!Number.isFinite(data[k])||data[k]<0||data[k]>1e12)throw new Error('STATE');
  if(!Number.isInteger(data.speed)||data.speed>10||data.speed<1)throw new Error('STATE');
  if(typeof data.paused!=='boolean'||typeof data.gameOver!=='boolean')throw new Error('STATE');
  // A save with no live piece but no game-over would load into an unplayable session.
  if(data.gameOver ? (data.current!==null||data.next!==null) : (data.current===null||data.next===null||data.lastType!==data.current.id))throw new Error('TURN');
  const old=this.snapshot();try{
   this.settings=settings;this.seed=data.seed>>>0;this.rng=makeRng(this.seed);this.rng.state=data.rngState;
   this.board=clone(data.board);this.current=clone(data.current);this.next=data.next;this.lastType=data.lastType;
   for(const k of ['score','speed','linesAtLevel','totalLines','elapsed','gravityElapsed','lockElapsed','paused','gameOver'])this[k]=data[k];
   if(this.current&&!this.fits(this.current))throw new Error('COLLISION');this.pendingClear=[];this.changed();
  }catch(error){this.restoreUnchecked(old);throw error;}
 }
 restoreUnchecked(d){this.settings=d.settings;this.seed=d.seed;this.rng=makeRng(d.seed);this.rng.state=d.rngState;this.board=d.board;this.current=d.current;this.next=d.next;this.lastType=d.lastType;for(const k of ['score','speed','linesAtLevel','totalLines','elapsed','gravityElapsed','lockElapsed','paused','gameOver'])this[k]=d[k];}
}
