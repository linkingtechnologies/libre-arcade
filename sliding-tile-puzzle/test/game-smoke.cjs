const assert=require('assert');
const G=require('../src/game.js');
function rngFrom(seed){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
for(const size of [3,4,5]){
  const st=G.mix(size,rngFrom(12345+size));
  assert.equal(st.board.length,size*size);
  assert.equal(new Set(st.board).size,size*size);
  assert(st.blank>=0&&st.blank<st.board.length);
  const b=st.blank; const p={x:b%size,y:Math.floor(b/size)};
  let legal=-1;
  if(p.x>0) legal=b-1; else legal=b+1;
  const before=st.board.slice();
  assert.equal(G.slide(st,legal),true);
  assert.notDeepEqual(st.board,before);
  // A non-adjacent click must be ignored.
  const current=st.blank;
  let far=-1;
  for(let i=0;i<st.board.length;i++) if(!G.areAdjacent(i,current,size)&&i!==current){far=i;break;}
  const snapshot=st.board.slice();
  assert.equal(G.slide(st,far),false);
  assert.deepEqual(st.board,snapshot);
}
// Layout must reproduce SquareTileManager's centered square grid.
let l=G.layout(800,600,4); assert.deepEqual({tile:l.tile,ox:l.offsetX,oy:l.offsetY,w:l.puzzleWidth},{tile:150,ox:100,oy:0,w:600});
l=G.layout(600,800,5); assert.deepEqual({tile:l.tile,ox:l.offsetX,oy:l.offsetY,w:l.puzzleWidth},{tile:120,ox:0,oy:100,w:600});
// Resize is display-only: viewport never changes game topology.
const v=G.computeViewport(390,700,1000,700,16); assert(v.scale>0&&v.scale<1);
// Keyboard input must map to one legal neighbor of the blank.
assert.equal(G.keyboardTarget(4,3,'ArrowLeft'),3);
assert.equal(G.keyboardTarget(4,3,'ArrowRight'),5);
assert.equal(G.keyboardTarget(4,3,'ArrowUp'),1);
assert.equal(G.keyboardTarget(4,3,'ArrowDown'),7);
assert.equal(G.keyboardTarget(0,3,'ArrowLeft'),-1);
assert.equal(G.keyboardTarget(0,3,'ArrowUp'),-1);
console.log('game-smoke: ok');
