import assert from 'node:assert/strict';
import { createGame, playMove } from '../public/src/core/game.js';
import { boardToThillBits, thillBitsToBoard, solveThillBits, markusThillAlphaBetaPlayer } from '../public/src/players/markus-thill-alphabeta.js';

// Exact fieldMask orientation from ConnectFour.java: column 0, bottom row = 2^41.
const board=Array.from({length:7},()=>Array(6).fill(0));board[0][5]=1;board[6][0]=2;
assert.deepEqual(boardToThillBits(board),[1n<<41n,1n]);
assert.deepEqual(thillBitsToBoard(1n<<41n,1n),board);

// Assertions copied from the preserved AlphaBetaAgentTest.java. The browser
// search reaches these historical choices without the optional opening books.
for(const [a,b,expected] of [
  ['804C10800','20038020000',3],['20A10220800','10428C00000',3],
  ['10820020400','20410000800',3],['30000820800','20018400',6],
  ['18800820000','20600000800',2],['20020018800','18820000',2],
  ['2002C010000','10020C00',3],['A20020800','20400010400',3],
  ['830210800','400C28000',4],['20C00800400','20030800',4],
]) assert.equal(solveThillBits(BigInt(`0x${a}`),BigInt(`0x${b}`),10000).column,expected);

// A six-empty-square game is completely searched, rather than merely cut off.
const game=createGame();
for(const column of [0,5,5,1,3,2,1,0,1,6,5,5,6,0,1,1,5,2,1,3,2,3,6,0,2,3,2,5,4,6,0,2,3,0,6,4])playMove(game,column);
const exact=solveThillBits(...boardToThillBits(game.board),10000);
assert.deepEqual({column:exact.column,exact:exact.exact,depth:exact.depth},{column:3,exact:true,depth:6});
assert(exact.nodes>0&&exact.ttHits>0);

const actor=markusThillAlphaBetaPlayer.create({nodes:1000});
assert.equal(actor.chooseMove({board,player:1,moves:[],over:false}).column>=0,true);
assert.throws(()=>markusThillAlphaBetaPlayer.create({nodes:99}),/1000/);
console.log('Markus Thill AlphaBeta: field mapping, upstream vectors and exact endgame passed.');
