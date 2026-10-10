/* Clean-room GPLv3 threat-space search inspired by Victor Allis' published method. */
const WIDTH=7,HEIGHT=6,CENTER_ORDER=[3,2,4,1,5,0,6];
const legal=board=>CENTER_ORDER.filter(column=>board[column][0]===0);
function drop(board,column,player){for(let row=HEIGHT-1;row>=0;row--)if(board[column][row]===0){board[column][row]=player;return row;}return -1;}
const undo=(board,column,row)=>{board[column][row]=0;};
function winner(board,player){for(let x=0;x<WIDTH;x++)for(let y=0;y<HEIGHT;y++)if(board[x][y]===player)for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){let n=1;while(n<4&&board[x+dx*n]?.[y+dy*n]===player)n++;if(n===4)return true;}return false;}
function winningMoves(board,player){const result=[];for(const column of legal(board)){const row=drop(board,column,player);if(winner(board,player))result.push(column);undo(board,column,row);}return result;}
function boardKey(board,attacker,remaining){let key=`${attacker}:${remaining}:`;for(let r=0;r<HEIGHT;r++)for(let c=0;c<WIDTH;c++)key+=board[c][r];return key;}

function findThreatMove(board,attacker,remaining,memo,stats,line=[]){
  stats.nodes++;
  if(remaining<=0)return null;
  const key=boardKey(board,attacker,remaining);if(memo.has(key))return memo.get(key);
  for(const column of legal(board)){
    const row=drop(board,column,attacker);
    const result=resolveThreat(board,attacker,remaining-1,memo,stats,[...line,column]);
    undo(board,column,row);
    if(result){memo.set(key,result);return result;}
  }
  memo.set(key,null);return null;
}
function resolveThreat(board,attacker,remaining,memo,stats,line){
  if(winner(board,attacker))return {line,kind:'win'};
  const defender=3-attacker;
  if(winningMoves(board,defender).length)return null;
  const threats=winningMoves(board,attacker);
  if(threats.length>=2)return {line,kind:'double-threat'};
  if(threats.length!==1||remaining<=0)return null;
  const block=threats[0],row=drop(board,block,defender);
  if(row<0||winner(board,defender)){if(row>=0)undo(board,block,row);return null;}
  const result=findThreatMove(board,attacker,remaining-1,memo,stats,[...line,block]);
  undo(board,block,row);return result;
}

function potential(board,player){let score=0;for(let x=0;x<WIDTH;x++)for(let y=0;y<HEIGHT;y++)for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){const cells=[];for(let n=0;n<4;n++){const xx=x+dx*n,yy=y+dy*n;if(xx<0||xx>=WIDTH||yy<0||yy>=HEIGHT){cells.length=0;break;}cells.push(board[xx][yy]);}if(!cells.length||cells.includes(3-player))continue;const stones=cells.filter(v=>v===player).length,empty=4-stones;if(stones===3&&empty===1)score+=18;else if(stones===2)score+=4;else if(stones===1)score+=1;}return score;}
function parityThreats(board,player){let score=0;for(const column of winningMoves(board,player)){let row=0;while(row<HEIGHT&&board[column][row]===0)row++;const landing=row-1;score+=landing>=0&&((HEIGHT-landing)&1)?3:2;}return score;}
function fallbackScore(board,player,column){return 6-Math.abs(3-column)+potential(board,player)-potential(board,3-player)+parityThreats(board,player)-parityThreats(board,3-player);}

function analyze(board,player,horizon){const copy=board.map(column=>column.slice()),opponent=3-player,immediate=winningMoves(copy,player),mustBlock=winningMoves(copy,opponent),stats={nodes:0};if(immediate.length)return {column:immediate[0],value:100000,kind:'immediate-win',line:[immediate[0]],nodes:stats.nodes,candidates:1};let best=null,candidates=[];const forcedBlocks=new Set(mustBlock);for(const column of legal(copy)){if(mustBlock.length===1&&!forcedBlocks.has(column))continue;const row=drop(copy,column,player);if(row<0)continue;const opponentWins=winningMoves(copy,opponent);let result=null;if(!opponentWins.length)result=resolveThreat(copy,player,horizon-1,new Map(),stats,[column]);const score=result?50000-result.line.length*100:fallbackScore(copy,player,column)-opponentWins.length*10000;undo(copy,column,row);const candidate={column,value:score,kind:result?.kind??(opponentWins.length?'unsafe':'positional'),line:result?.line??[column],nodes:0};if(!best||score>best.value){best=candidate;candidates=[candidate]}else if(score===best.value)candidates.push(candidate);}if(!best){const moves=legal(copy);return {column:moves[0]??-1,value:-100000,kind:'forced-loss',line:moves.length?[moves[0]]:[],nodes:stats.nodes,candidates:moves.length};}best.candidates=candidates.length;best.nodes=stats.nodes;return best;}

export const allisThreatSpacePlayer={
  id:'allis-threat-space-cleanroom',name:'Allis Threat-Space',source:'Clean-room from Victor Allis, A Knowledge-based Approach of Connect-Four (1988)',license:'GPL-3.0-only',family:'knowledge-based-threat-space-search',
  settings:{key:'horizon',label:'Threat horizon',values:[3,5,7],default:5},capabilities:{deterministic:true,supportsSeed:false,supportsDifficulty:true,reportsNodes:true,learnedWeights:false},
  create(options={}){const horizon=Number(options.horizon??5);if(![3,5,7].includes(horizon))throw new RangeError('Threat horizon must be 3, 5 or 7');return{id:`allis-threat-space-h${horizon}`,reset(){},chooseMove(position){const result=analyze(position.board,position.player,horizon);return {column:result.column,value:result.value,nodes:result.nodes,threatKind:result.kind,threatLine:result.line,horizon,tiedCandidates:result.candidates};}};}
};
export const _test={legal,drop,undo,winner,winningMoves,findThreatMove,resolveThreat,potential,parityThreats,analyze};
