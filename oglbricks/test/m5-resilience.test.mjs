import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,pieceCells} from '../public/js/engine.js';

// These are web-port resilience checks, not behavioral equivalence to Windows.
test('M5: playable sessions across every piece-category selection and min/default/max fields',()=>{
 let sessions=0,steps=0;
 for(const [width,height] of [[10,10],[20,20],[50,50]])for(let mask=1;mask<32;mask++){
  const enabled=[1,2,3,4,5].filter((_,i)=>mask&(1<<i));
  const game=new Game({width,height,enabled},(mask*1299709+width)>>>0);
  for(let i=0;i<250;i++){
   if(game.gameOver){game.newGame(game.settings,mask+i+1);}
   const action=(i*7+mask)%9;
   if(action===0)game.rotate();
   else if(action===1)game.move(-1,0);
   else if(action===2)game.move(1,0);
   else if(action===3)game.tick(67,{down:true});
   else if(action===4)game.tick(100);
   else if(action===5)game.move(0,-1);
   else if(action===6)game.land();
   else if(action===7){const data=game.snapshot();const copy=new Game({},123);copy.restore(data);assert.deepEqual(copy.snapshot(),data);}
   else game.tick(33);
   assert.equal(game.board.length,height);
   assert.ok(game.board.every(r=>r.length===width&&r.every(c=>Number.isInteger(c)&&c>=0&&c<=27)));
   assert.ok(game.score>=0&&Number.isSafeInteger(game.score));
   assert.ok(game.speed>=1&&game.speed<=10);
   if(!game.gameOver){assert.ok(game.current);assert.ok(game.allowedIds().includes(game.current.id));assert.ok(game.fits(game.current));assert.ok(game.allowedIds().includes(game.next));assert.ok(pieceCells(game.current).length>=1);}
   steps++;
  }
  sessions++;
 }
 assert.equal(sessions,93);assert.equal(steps,23250);
});

test('M5: failed imports never change game state (extended malformed input matrix)',()=>{
 const game=new Game({width:10,height:15,enabled:[3,4]},101);
 const good=game.snapshot();
 const malformed=[
  {...good,board:good.board.map((r,i)=>i===0?[...r.slice(0,1),-1,...r.slice(2)]:r)},
  {...good,current:{...good.current,id:999}},
  {...good,current:{...good.current,x:-999}},
  {...good,current:{...good.current,rotation:4}},
  {...good,current:null,gameOver:false},
  {...good,next:1},
  {...good,rngState:0},
  {...good,score:Infinity},
  {...good,speed:1.5},
  {...good,paused:'false'},
  {...good,board:good.board.slice(1)},
  {...good,version:99},
 ];
 for(const bad of malformed){assert.throws(()=>game.restore(bad));assert.deepEqual(game.snapshot(),good);}
});
