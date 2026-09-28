import assert from 'node:assert/strict';
import {planSnap2010,planSnap2012,neighborCorrection,collectSnapCandidates} from '../src/snapping.js';

// Exact algebra of Virtual Toybox 2010 weighted recentering.
const cs=[{group:10,size:4,dx:4,dy:-2,order:0,z:1},{group:20,size:2,dx:2,dy:3,order:1,z:2}];
const p10=planSnap2010(1,cs);
assert.deepEqual(p10.moving,{dx:2,dy:-0}); // trunc((4*4+2*2)/7)=2; trunc((-8+6)/7)=0
assert.deepEqual(p10.external.get(10),{dx:-2,dy:2});
assert.deepEqual(p10.external.get(20),{dx:0,dy:-3});

// Libre policy: largest on-board set is the immobile anchor.
const p12=planSnap2012(1,cs);
assert.equal(p12.anchorGroup,10);
assert.deepEqual(p12.moving,{dx:4,dy:-2});
assert.deepEqual(p12.external.get(10),{dx:0,dy:0});
assert.deepEqual(p12.external.get(20),{dx:2,dy:-5});


// Both policies produce exact relative alignment after applying their planned shifts.
for(const plan of [p10,p12]){
  const moved={x:plan.moving.dx,y:plan.moving.dy};
  for(const c of cs){
    const e=plan.external.get(c.group);
    // Candidate correction is (external - moving) error. After shifts it must be zero.
    assert.equal(c.dx+e.dx-moved.x,0);
    assert.equal(c.dy+e.dy-moved.y,0);
  }
}

// Strict five-pixel threshold, as in Java checkNeighbors().
const geom={shape:'square',spacingX:100,spacingY:100,rotationSteps:4};
const a={gx:0,gy:0,x:50,y:50,rotation:0,group:1,z:0};
assert.deepEqual(neighborCorrection(a,{gx:1,gy:0,x:154,y:48,rotation:0,group:2,z:1},geom),{dx:4,dy:-2});
assert.equal(neighborCorrection(a,{gx:1,gy:0,x:155,y:50,rotation:0,group:2,z:1},geom),null); // exactly +5 is rejected
assert.equal(neighborCorrection(a,{gx:1,gy:0,x:154,y:50,rotation:1,group:2,z:1},geom),null);

// Multiple neighboring tiles from the same connected set produce one candidate.
const pieces=[a,
 {gx:0,gy:1,x:50,y:150,rotation:0,group:1,z:1},
 {gx:1,gy:0,x:154,y:48,rotation:0,group:2,z:2},
 {gx:1,gy:1,x:154,y:148,rotation:0,group:2,z:3}
];
const found=collectSnapCandidates(pieces,1,geom);
assert.equal(found.length,1);
assert.equal(found[0].group,2);
assert.equal(found[0].size,2);
assert.equal(found[0].dx,4);
assert.equal(found[0].dy,-2);
console.log('snapping-smoke: OK');
