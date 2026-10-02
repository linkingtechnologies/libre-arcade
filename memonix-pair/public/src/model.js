import { FACE_IDS } from './assets.js';

export function createRng(seed=0x6d2b79f5){
 let s=(seed>>>0)||1;
 return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};
}
export function emptyMatrix(value=null){return Array.from({length:8},()=>Array(8).fill(value));}
export function activeBounds(size){const lo=4-size/2;return{lo,hi:lo+size};}
function rint(random,maxExclusive){return Math.floor(random()*maxExclusive);}
export function generatePair({size=4,difficulty=0,random=Math.random}={}){
 if(![2,4,6,8].includes(size))throw new Error('invalid size');
 if(![0,1,2].includes(difficulty))throw new Error('invalid difficulty');
 const board=emptyMatrix(null), status=emptyMatrix('inactive');
 // eslint-disable-next-line no-unused-vars -- hi is part of activeBounds' public shape; placement below only needs lo
 const {lo,hi}=activeBounds(size);
 const copies=(difficulty===0&&size>2)?4:2;
 const symbols=size*size/copies;
 const chosen=[];
 while(chosen.length<symbols){
  const face=FACE_IDS[rint(random,FACE_IDS.length)];
  if(!chosen.includes(face))chosen.push(face);
 }
 for(const face of chosen){
  let left=copies;
  while(left){
   const x=lo+rint(random,size), y=lo+rint(random,size);
   if(board[x][y]===null){board[x][y]=face;status[x][y]='hidden';left--;}
  }
 }
 return{board,status,copies,symbols,faces:chosen};
}
export function cloneStatus(s){return s.map(col=>col.slice());}
export function activeCells(board){const out=[];for(let x=0;x<8;x++)for(let y=0;y<8;y++)if(board[x][y])out.push([x,y]);return out;}
export function clickCard(state,x,y,now=0){
 if(state.pending||!state.board[x]?.[y]||state.status[x][y]!=='hidden')return{accepted:false};
 state.status[x][y]='up';
 if(!state.first){state.first={x,y,face:state.board[x][y]};return{accepted:true,kind:'first'};}
 const a=state.first,b={x,y,face:state.board[x][y]};state.first=null;
 const kind=a.face===b.face?'match':'mismatch';
 state.pending={kind,a,b,due:now+500};
 return{accepted:true,kind};
}
export function resolvePending(state,now){
 const p=state.pending;if(!p||now<p.due)return null;
 if(p.kind==='match'){
  state.status[p.a.x][p.a.y]='removed';state.status[p.b.x][p.b.y]='removed';
 }else{
  if(state.difficulty===2){
   for(let x=0;x<8;x++)for(let y=0;y<8;y++)if(state.board[x][y])state.status[x][y]='hidden';
  }else{
   for(let x=0;x<8;x++)for(let y=0;y<8;y++)if(state.status[x][y]==='up')state.status[x][y]='hidden';
  }
 }
 state.pending=null;return p.kind;
}
export function isSolved(state){
 for(let x=0;x<8;x++)for(let y=0;y<8;y++)if(state.board[x][y]&&state.status[x][y]!=='removed')return false;
 return true;
}
export function secondsFromMs(ms){return Math.floor(Math.max(0,ms)/1000);}
