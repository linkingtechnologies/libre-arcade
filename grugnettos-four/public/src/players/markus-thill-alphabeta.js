/*
 * Bounded browser adaptation of Markus Thill's MIT-licensed AlphaBetaAgent.
 * It retains the upstream 42-bit field layout, alpha-beta search and
 * transposition-table design, but deliberately omits the optional databases.
 */
const WIDTH=7,HEIGHT=6,CELLS=42,WIN=1000000,ORDER=[3,2,4,1,5,0,6];
// ConnectFour.fieldMask[col][row] stores row 0 at the physical bottom.
const bit=(x,yTop)=>1n<<BigInt((6-x)*6+yTop);
const masks=[];
for(let x=0;x<WIDTH;x++)for(let y=0;y<HEIGHT;y++)for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){const cells=Array.from({length:4},(_,i)=>[x+dx*i,y+dy*i]);if(cells.every(([a,b])=>a>=0&&a<WIDTH&&b>=0&&b<HEIGHT))masks.push(cells.reduce((m,[a,b])=>m|bit(a,b),0n));}
const columnMasks=Array.from({length:WIDTH},(_,x)=>Array.from({length:HEIGHT},(_,y)=>bit(x,y)).reduce((a,b)=>a|b,0n));
class SearchLimit extends Error{}
const popcount=value=>{let n=0;for(let v=value;v;v&=v-1n)n++;return n;};
const won=bits=>masks.some(mask=>(bits&mask)===mask);
const legalColumns=(occupied)=>ORDER.filter(x=>(occupied&bit(x,0))===0n);
function landingBit(occupied,x){for(let y=HEIGHT-1;y>=0;y--){const b=bit(x,y);if(!(occupied&b))return b;}return 0n;}
function openGroups(me,them){let score=0;for(const mask of masks){if(mask&them)continue;const n=popcount(mask&me);score+=n===3?80:n===2?9:n===1?1:0;}return score;}
function heuristic(me,them){return openGroups(me,them)-openGroups(them,me)+2*(popcount(me&columnMasks[3])-popcount(them&columnMasks[3]));}
export function boardToThillBits(board){let p1=0n,p2=0n;for(let x=0;x<WIDTH;x++)for(let y=0;y<HEIGHT;y++){if(board[x][y]===1)p1|=bit(x,y);else if(board[x][y]===2)p2|=bit(x,y);}return[p1,p2];}
export function thillBitsToBoard(p1,p2){const board=Array.from({length:WIDTH},()=>Array(HEIGHT).fill(0));for(let x=0;x<WIDTH;x++)for(let y=0;y<HEIGHT;y++){const b=bit(x,y);board[x][y]=(p1&b)?1:(p2&b)?2:0;}return board;}
class Solver{
  constructor(limit){this.limit=limit;this.nodes=0;this.hits=0;this.table=new Map();}
  visit(){if(++this.nodes>this.limit)throw new SearchLimit();}
  negamax(me,them,depth,alpha,beta,ply){this.visit();const occupied=me|them,legal=legalColumns(occupied);if(!legal.length)return 0;if(depth===0)return heuristic(me,them);const key=`${me.toString(16)}/${them.toString(16)}/${depth}`,cached=this.table.get(key),start=alpha;if(cached){this.hits++;if(cached.flag==='exact')return cached.value;if(cached.flag==='lower')alpha=Math.max(alpha,cached.value);else beta=Math.min(beta,cached.value);if(alpha>=beta)return cached.value;}let value=-Infinity;for(const x of legal){const move=landingBit(occupied,x);let score;if(won(me|move))score=WIN-ply;else score=-this.negamax(them,me|move,depth-1,-beta,-alpha,ply+1);if(score>value)value=score;if(value>alpha)alpha=value;if(alpha>=beta)break;}this.table.set(key,{value,flag:value<=start?'upper':value>=beta?'lower':'exact'});return value;}
  root(p1,p2){const count=popcount(p1|p2),me=popcount(p1)===popcount(p2)?p1:p2,them=me===p1?p2:p1,remaining=CELLS-count,legal=legalColumns(me|them);if(!legal.length)return{column:-1,value:0,nodes:0,depth:0,exact:true,ttHits:0};for(const x of legal)if(won(me|landingBit(me|them,x)))return{column:x,value:WIN,nodes:0,depth:1,exact:true,ttHits:0};let best=legal[0],value=-Infinity,completed=0;for(let depth=1;depth<=remaining;depth++){let roundBest=best,roundValue=-Infinity;try{for(const x of legal){const move=landingBit(me|them,x),score=-this.negamax(them,me|move,depth-1,-WIN,WIN,1);if(score>roundValue){roundValue=score;roundBest=x;}}best=roundBest;value=roundValue;completed=depth;}catch(error){if(!(error instanceof SearchLimit))throw error;break;}}return{column:best,value,nodes:Math.min(this.nodes,this.limit),depth:completed,exact:completed===remaining,ttHits:this.hits};}
}
export function solveThillBits(p1,p2,nodeLimit=10000){if(p1&p2)throw new Error('Overlapping Thill bitboards');return new Solver(nodeLimit).root(p1,p2);}
export const markusThillAlphaBetaPlayer={id:'markus-thill-alphabeta',name:'Markus Thill AlphaBeta',source:'Markus Thill Connect-Four AlphaBetaAgent.java, commit 2a588445',license:'MIT',family:'bitboard-alpha-beta-transposition',settings:{key:'nodes',label:'Node budget',values:[1000,10000,100000],default:10000},capabilities:{deterministic:true,supportsSeed:false,supportsDifficulty:true,reportsNodes:true,perfectPlay:false,exactEndgames:true,openingDatabase:false},create(options={}){const nodes=Number(options.nodes??10000);if(![1000,10000,100000].includes(nodes))throw new RangeError('Node budget must be 1000, 10000 or 100000');return{id:`markus-thill-alphabeta-n${nodes}`,reset(){},chooseMove(position){const [p1,p2]=boardToThillBits(position.board);return solveThillBits(p1,p2,nodes);}};}};
export const _test={bit,masks,popcount,won,landingBit,legalColumns,heuristic,Solver};
