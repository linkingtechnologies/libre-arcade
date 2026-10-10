import { UCI_NB } from './uci-naive-bayes-knowledge.js';
import { isWinningBoard } from '../core/game.js';

const CENTER_ORDER = [3,2,4,1,5,0,6];
const VALUE_INDEX = {1:0,2:1,0:2};
const legal = board => CENTER_ORDER.filter(column => board[column][0] === 0);
function drop(board,column,player){for(let row=5;row>=0;row--)if(board[column][row]===0){board[column][row]=player;return row;}return -1;}
const undo=(board,column,row)=>{board[column][row]=0;};

export function encodeUci(board){
  const encoded=[];
  for(let column=0;column<7;column++)for(let uciRow=0;uciRow<6;uciRow++)encoded.push(VALUE_INDEX[board[column][5-uciRow]]);
  return encoded;
}

export function posterior(board,alpha=1){
  const features=encodeUci(board),total=UCI_NB.rows,logs=[];
  for(let k=0;k<3;k++){
    let value=Math.log((UCI_NB.classCounts[k]+alpha)/(total+3*alpha));
    const denominator=UCI_NB.classCounts[k]+3*alpha;
    for(let i=0;i<42;i++)value+=Math.log((UCI_NB.counts[k][i*3+features[i]]+alpha)/denominator);
    logs.push(value);
  }
  const peak=Math.max(...logs),weights=logs.map(value=>Math.exp(value-peak)),sum=weights.reduce((a,b)=>a+b,0);
  return weights.map(value=>value/sum);
}

function choose(board,player,alpha){
  const copy=board.map(column=>column.slice()),moves=legal(copy),opponent=3-player;
  for(const column of moves){const row=drop(copy,column,player);const win=isWinningBoard(copy,player);undo(copy,column,row);if(win)return {column,kind:'immediate-win',probabilities:[1,0,0]};}
  const opponentWins=[];
  for(const column of moves){const row=drop(copy,column,opponent);if(isWinningBoard(copy,opponent))opponentWins.push(column);undo(copy,column,row);}
  const candidates=opponentWins.length===1?opponentWins:moves;
  let best=null;
  for(const column of candidates){
    const row=drop(copy,column,player),probabilities=posterior(copy,alpha);undo(copy,column,row);
    const firstUtility=probabilities[0]-probabilities[1],utility=player===1?firstUtility:-firstUtility;
    if(!best||utility>best.utility)best={column,utility,probabilities,kind:opponentWins.length===1?'forced-block':'classifier'};
  }
  return best??{column:-1,utility:0,probabilities:[0,0,1],kind:'no-move'};
}

export const uciNaiveBayesPlayer={
  id:'uci-connect4-naive-bayes',name:'UCI Naive Bayes',source:'John Tromp, UCI Connect-4 dataset (1995)',license:'CC-BY-4.0 data; GPL-3.0-only adapter',family:'supervised-categorical-naive-bayes',
  settings:{key:'alpha',label:'Laplace α',values:[0.5,1,2],default:1},capabilities:{deterministic:true,supportsSeed:false,supportsDifficulty:true,reportsNodes:false,learnedWeights:true},
  create(options={}){const alpha=Number(options.alpha??1);if(![0.5,1,2].includes(alpha))throw new RangeError('Laplace alpha must be 0.5, 1 or 2');return{id:`uci-naive-bayes-a${alpha}`,reset(){},chooseMove(position){const result=choose(position.board,position.player,alpha);return {...result,modelRows:UCI_NB.rows,alpha};}};}
};
export const _test={legal,drop,undo,choose};
