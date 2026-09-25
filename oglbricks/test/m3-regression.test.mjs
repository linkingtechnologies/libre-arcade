import test from 'node:test';
import assert from 'node:assert/strict';
import {Game, pieceCells, normalizeSettings} from '../public/js/engine.js';
import {SHAPES} from '../public/js/shapes.js';

function assertPlayable(g) {
  assert.equal(g.board.length, g.settings.height);
  assert.ok(g.board.every(row => row.length === g.settings.width));
  if (g.gameOver) {
    assert.equal(g.current, null);
    return;
  }
  assert.ok(g.current, 'non-game-over session has a live piece');
  assert.ok(g.fits(g.current), 'live piece fits the logical field');
  assert.ok(g.allowedIds().includes(g.current.id));
  assert.ok(g.allowedIds().includes(g.next));
  assert.equal(pieceCells(g.current).length, SHAPES[g.current.id - 1].count);
  assert.ok(g.board.flat().every(n => Number.isInteger(n) && n >= 0 && n <= 27));
}

test('M3: save/restore round-trip across original field limits and all piece-size groups', () => {
  for (const [w,h] of [[10,10],[10,15],[20,20],[50,10],[50,50]]) {
    for (const enabled of [[1],[2],[3],[4],[5],[1,2,3,4],[1,2,3,4,5]]) {
      for (let seed = 1; seed <= 6; seed++) {
        const original = new Game({width:w,height:h,enabled},seed);
        assertPlayable(original);
        for(let k=0;k<12 && !original.gameOver;k++){
          original.move(k%2 ? 1 : -1,0);
          original.rotate();
          original.tick(80,{down:k%3===0});
          assertPlayable(original);
        }
        const data = JSON.parse(JSON.stringify(original.snapshot()));
        const copy = new Game({},999);
        copy.restore(data);
        assert.deepEqual(copy.snapshot(),data);
        assertPlayable(copy);
      }
    }
  }
});

test('M3: corrupt saves are rejected atomically (including an impossible empty turn)', () => {
  const g=new Game({width:10,height:15,enabled:[1,2,3,4,5]},42);
  const good=g.snapshot();
  const changes=[
    {rngState:0},{rngState:'not a number'},{seed:-1},{lastType:99},
    {current:null},{next:null},{current:{...good.current,id:27},settings:{...good.settings,enabled:[1]}},
    {paused:'false'},{gameOver:'no'},{speed:1.5},{score:1.75},
    {settings:null},{board:good.board.map(row=>row.slice(1))},
    {current:{...good.current,x:999}},{next:999},
  ];
  for (const edit of changes) {
    const invalid={...good,...edit};
    assert.throws(()=>g.restore(invalid),undefined,`expected rejection for ${JSON.stringify(edit).slice(0,90)}`);
    assert.deepEqual(g.snapshot(),good,'failed restore must not change current play');
  }
  // A valid terminal state must still be reloadable (no current or preview).
  g.board[g.settings.height-1]=Array(g.settings.width).fill(1);
  g.spawn();assert.equal(g.gameOver,true);
  const terminal=g.snapshot();
  const reloaded=new Game({},56);reloaded.restore(terminal);
  assert.deepEqual(reloaded.snapshot(),terminal);
});

test('M3: 27 shapes retain their original four orientations and stay inside a 50x50 empty field', () => {
  const g=new Game({width:50,height:50,enabled:[1,2,3,4,5]},77);
  for(const shape of SHAPES){
    g.current={id:shape.id,x:25,y:25,rotation:0};
    const initial=pieceCells(g.current).map(p=>p.join(',')).sort();
    for(let n=0;n<4;n++){
      assert.equal(g.rotate(),true,`rotation ${n} type ${shape.id}`);
      assertPlayable(g);
    }
    assert.deepEqual(pieceCells(g.current).map(p=>p.join(',')).sort(),initial);
  }
});

test('M3: pause, grounded lock delay, and clearing to an empty field',()=>{
  const g=new Game({width:10,height:10,enabled:[1],lockDelay:300},5);
  g.board[0]=Array(10).fill(1);g.board[0][2]=0;
  g.current={id:1,x:2,y:0,rotation:0};
  g.tick(100);assert.equal(g.totalLines,0);
  g.togglePause(); const frozen=g.snapshot();
  for(let k=0;k<50;k++)g.tick(100,{down:true});
  assert.deepEqual(g.snapshot(),frozen);
  g.togglePause();g.tick(100);assert.equal(g.totalLines,0);
  g.tick(100);assert.equal(g.totalLines,1);
  assert.equal(g.board.flat().filter(Boolean).length,0);
  assertPlayable(g);
});

test('M3: board size and category normalization do not create new original piece types',()=>{
  const settings=normalizeSettings({width:2,height:800,enabled:[1,2,3,4,5,6,6,0]});
  assert.equal(settings.width,10); assert.equal(settings.height,50);
  assert.deepEqual(settings.enabled,[1,2,3,4,5]);
  const g=new Game(settings,61);
  assert.equal(g.allowedIds().length,27);
  assertPlayable(g);
});