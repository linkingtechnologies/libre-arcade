/* Port of Aman Virmani's 2020 tabular Q-learning policy. Original: BSD-3-Clause. */
import { virmaniQBase64, virmaniQMetadata } from './aman-virmani-qlearning-knowledge.js';

const WIDTH=7, HEIGHT=6;
function decode(encoded){const binary=atob(encoded),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0)),view=new DataView(bytes.buffer);if(String.fromCharCode(...bytes.subarray(0,4))!=='C4QL'||view.getUint8(4)!==1)throw new Error('Invalid Q-learning payload');const episodes=view.getUint32(5,true),count=view.getUint32(9,true),tables=[new Map(),new Map()];let offset=13;for(let i=0;i<count;i++){const seat=view.getUint8(offset++);let key=0n;for(let shift=0;shift<9;shift++)key+=BigInt(view.getUint8(offset++))<<(8n*BigInt(shift));const value=view.getFloat32(offset,true);offset+=4;tables[seat].set(key,value)}if(offset!==bytes.length)throw new Error('Trailing Q-learning data');return {episodes,tables};}
const knowledge=decode(virmaniQBase64);
function stateId(board){let id=0n;for(let r=0;r<HEIGHT;r++)for(let c=0;c<WIDTH;c++)id=id*3n+BigInt(board[c][r]);return id;}
const legal=(board)=>Array.from({length:WIDTH},(_,c)=>c).filter(c=>board[c][0]===0);
const qkey=(state,action)=>state*7n+BigInt(action);
function historicalUpdate(oldQ,reward,nextMax,alpha=0.1,gamma=0.6){return (1-alpha)*oldQ+alpha*(reward+gamma*nextMax);}
function choose(board,player,rng){const state=stateId(board),table=knowledge.tables[player-1],moves=legal(board);let best=-Infinity,candidates=[];for(const action of moves){const value=table.get(qkey(state,action))??0;if(value>best){best=value;candidates=[action]}else if(value===best)candidates.push(action)}if(!candidates.length)return {column:-1,value:0,candidates:0,known:false};const random=rng?.next?rng.next():0,index=Math.min(candidates.length-1,Math.floor(random*candidates.length)),column=candidates[index];return {column,value:best,candidates:candidates.length,known:table.has(qkey(state,column))};}

export const amanVirmaniQlearningPlayer={
  id:'aman-virmani-qlearning',name:'Aman Virmani Q-learning',source:'AmanVirmani/Connect4-AI, commit 0d08f2b',license:'BSD-3-Clause',family:'reinforcement-learning-q-learning-tabular',
  settings:{key:'trainingGames',label:'Training games / seat',values:[10000],default:10000},
  capabilities:{deterministic:false,supportsSeed:true,supportsDifficulty:false,reportsNodes:false,learnedWeights:true},
  create(options={}){const trainingGames=Number(options.trainingGames??10000);if(trainingGames!==10000)throw new RangeError('Only the preserved 10,000-game-per-seat snapshot is available');return{id:'aman-virmani-qlearning-10k',reset(){},chooseMove(position,context={}){const result=choose(position.board,position.player,context.rng);return {column:result.column,value:result.value,tiedCandidates:result.candidates,knownStateAction:result.known,trainingGamesPerSeat:trainingGames};}};}
};
export const _test={stateId,qkey,historicalUpdate,choose,knowledge,metadata:virmaniQMetadata};
