/* GCompris 2005–2008 port of Jeroen Vloothuis' 4st Attack 2 AI. GPL-3.0-or-later. */
const WIDTH=7, HEIGHT=6;

class PythonRandom {
  constructor(seed=0){this.mt=new Uint32Array(624);this.index=624;this.seed(seed);}
  seed(seed){let value=BigInt.asUintN(64,BigInt(Number(seed)>>>0)),key=[];do{key.push(Number(value&0xffffffffn));value>>=32n;}while(value);this.initByArray(key);}
  initGenRand(seed){this.mt[0]=seed>>>0;for(let i=1;i<624;i++){const x=this.mt[i-1]^(this.mt[i-1]>>>30);this.mt[i]=(Math.imul(x,1812433253)+i)>>>0;}this.index=624;}
  initByArray(key){this.initGenRand(19650218);let i=1,j=0,k=Math.max(624,key.length);for(;k;k--){const x=this.mt[i-1]^(this.mt[i-1]>>>30);this.mt[i]=((this.mt[i]^Math.imul(x,1664525))+key[j]+j)>>>0;i++;j++;if(i>=624){this.mt[0]=this.mt[623];i=1}if(j>=key.length)j=0;}for(k=623;k;k--){const x=this.mt[i-1]^(this.mt[i-1]>>>30);this.mt[i]=((this.mt[i]^Math.imul(x,1566083941))-i)>>>0;i++;if(i>=624){this.mt[0]=this.mt[623];i=1;}}this.mt[0]=0x80000000;this.index=624;}
  twist(){for(let i=0;i<624;i++){const y=(this.mt[i]&0x80000000)|(this.mt[(i+1)%624]&0x7fffffff);this.mt[i]=(this.mt[(i+397)%624]^(y>>>1)^((y&1)?0x9908b0df:0))>>>0;}this.index=0;}
  uint32(){if(this.index>=624)this.twist();let y=this.mt[this.index++];y^=y>>>11;y^=(y<<7)&0x9d2c5680;y^=(y<<15)&0xefc60000;y^=y>>>18;return y>>>0;}
  random(){const a=this.uint32()>>>5,b=this.uint32()>>>6;return (a*67108864+b)/9007199254740992;}
}

const legal=board=>Array.from({length:WIDTH},(_,c)=>c).filter(c=>board[c][0]===0);
function drop(board,column,player){for(let row=HEIGHT-1;row>=0;row--)if(board[column][row]===0){board[column][row]=player;return row;}throw new Error('Column is full');}
function undo(board,column,row){board[column][row]=0;}
function winner(board,player){for(let x=0;x<WIDTH;x++)for(let y=0;y<HEIGHT;y++)if(board[x][y]===player)for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){let n=1;while(n<4&&board[x+dx*n]?.[y+dy*n]===player)n++;if(n===4)return true;}return false;}
function leafScore(random,depth){return Math.floor((Math.floor(random.random()*100)-50)/(depth+1));}

function search(board,depth,toMove,root,opponent,maxDepth,random,stats){
  stats.nodes++;
  if(winner(board,opponent))return -10000+depth;
  if(winner(board,root))return 10000-depth;
  const moves=legal(board);
  if(depth>=maxDepth||moves.length===0)return leafScore(random,depth);
  const values=[];
  for(const column of moves){const row=drop(board,column,toMove);values.push(search(board,depth+1,3-toMove,root,opponent,maxDepth,random,stats));undo(board,column,row);}
  return toMove===root?Math.max(...values):Math.min(...values);
}

function choose(board,player,depth,seedOrRandom){const random=seedOrRandom instanceof PythonRandom?seedOrRandom:new PythonRandom(seedOrRandom),copy=board.map(column=>column.slice()),opponent=3-player,stats={nodes:1};let best=-100000,candidates=[];const scores=[];for(const column of legal(copy)){const row=drop(copy,column,player);const value=search(copy,1,opponent,player,opponent,depth,random,stats);undo(copy,column,row);scores.push([column,value]);if(value>best){best=value;candidates=[column]}else if(value===best)candidates.push(column);}if(!candidates.length)return {column:-1,value:0,nodes:stats.nodes,candidates:0,scores};const column=candidates[Math.floor(random.random()*candidates.length)];return {column,value:best,nodes:stats.nodes,candidates:candidates.length,scores};}

export const gcompris4stattackPlayer={
  id:'gcompris-4stattack-random-minimax',name:'GCompris 4st Attack',source:'GCompris Connect4 / 4st Attack 2, archive commit 09adaa1',license:'GPL-3.0-or-later',family:'stochastic-random-leaf-minimax',
  settings:{key:'depth',label:'Depth',min:1,max:4,default:4},capabilities:{deterministic:false,supportsSeed:true,supportsDifficulty:true,reportsNodes:true,learnedWeights:false},
  create(options={}){const depth=Number(options.depth??4);if(!Number.isInteger(depth)||depth<1||depth>4)throw new RangeError('Depth must be 1..4');let random=null;return{id:`gcompris-4stattack-d${depth}`,reset(){random=null;},chooseMove(position,context={}){if(!random){const seed=context.seed!==undefined?Number(context.seed)>>>0:Math.floor((context.rng?.next?.()??0)*0x100000000)>>>0;random=new PythonRandom(seed);}const result=choose(position.board,position.player,depth,random);return {column:result.column,value:result.value,nodes:result.nodes,tiedCandidates:result.candidates,depth};}};}
};
export const _test={PythonRandom,leafScore,search,choose,winner};
