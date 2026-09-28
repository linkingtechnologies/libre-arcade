const assert=require('assert');
const G=require('../src/game.js');

function rng(seed){let x=seed>>>0;return()=>{x=(1664525*x+1013904223)>>>0;return x/0x100000000;};}
function validate(s){
  assert.equal(s.originalIndex.length,7);
  assert.equal(s.rotation.length,7);
  assert.deepEqual([...s.originalIndex].sort((a,b)=>a-b),[0,1,2,3,4,5,6]);
  for(const r of s.rotation) assert(Number.isInteger(r)&&r>=0&&r<6);
}

let spins=0;
for(let session=1;session<=600;session++){
  const r=rng(session*2654435761);
  const s=G.createSolvedState();
  const history=[];
  for(let i=0;i<120;i++){
    const v=Math.floor(r()*6),d=r()<.5?G.SPIN_CW:G.SPIN_CCW;
    G.spin(s,v,d);history.push([v,d]);validate(s);spins++;
  }
  for(let i=history.length-1;i>=0;i--){const [v,d]=history[i];G.spin(s,v,-d);validate(s);spins++;}
  assert(G.isSolved(s),`session ${session} did not reverse to solved`);
}

for(let seed=1;seed<=250;seed++){
  const s=G.mix(rng(seed));validate(s);
}

for(let v=0;v<6;v++){
  for(const d of [G.SPIN_CW,G.SPIN_CCW]){
    const s=G.createSolvedState();
    G.spin(s,v,d);G.spin(s,v,d);G.spin(s,v,d);
    assert(G.isSolved(s),`three spins should restore vertex ${v}, direction ${d}`);
  }
}
console.log(`spin-stress: ok (${spins} validated spins + 250 mixes)`);
