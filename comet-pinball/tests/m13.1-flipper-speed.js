'use strict';
const assert=require('node:assert/strict');
const P=require('../public/js/physics.js');
const fl=P.makeFlippers();
assert.equal(P.flipperTarget(fl.left,true),50);
assert.equal(P.flipperTarget(fl.left,false),-15);
assert.equal(P.flipperTarget(fl.right,true),-50);
assert.equal(P.flipperTarget(fl.right,false),15);
P.beginFlipperStep(fl.left,true,1/60);P.beginFlipperStep(fl.right,true,1/60);
assert.equal(fl.left.omega,50);assert.equal(fl.right.omega,-50);
P.beginFlipperStep(fl.left,false,1/60);P.beginFlipperStep(fl.right,false,1/60);
assert.equal(fl.left.omega,-15);assert.equal(fl.right.omega,15);
// The original whole-file M13.1 checksum is archived in the historical report.
// M13.9 deliberately changes static wall CCD: the obsolete whole-file digest
// must not turn an approved wall fix into a false flipper regression.
console.log('PASS historical flipper behavior: up 50 rad/s / return 15 rad/s; no input-strength change');
