const assert=require('assert');
const fs=require('fs');
const path=require('path');
const P=require('../public/js/physics.js');

assert(Math.abs(P.constants.LINEAR_SLOP-0.0005)<1e-12,'scaled linearSlop');
assert(Math.abs(P.constants.POLYGON_RADIUS-0.001)<1e-12,'scaled polygon skin radius');
assert.strictEqual(P.constants.VELOCITY_ITERATIONS,6,'velocity iterations');
assert.strictEqual(P.constants.POSITION_ITERATIONS,2,'position iterations');
assert(Math.abs(P.constants.BAUMGARTE-0.2)<1e-12,'Baumgarte');

function readContacts(name){
  const rows=fs.readFileSync(path.join(__dirname,'../reference/oracle',name),'utf8').trim().split(/\r?\n/);
  const head=rows.shift().split(',');
  return rows.map(line=>{const a=line.split(',');const o={};head.forEach((h,i)=>o[h]=a[i]);return o;});
}
const launchContacts=readContacts('launch-contact.csv');
const active56=launchContacts.filter(r=>+r.frame===56 && +r.normalImpulseScaled>0.001);
assert(active56.length>=1,'historical launch has an active upper-curve impulse at frame 56');
const strongest56=active56.reduce((a,b)=>+a.normalImpulseScaled>+b.normalImpulseScaled?a:b);
assert(Math.abs(+strongest56.normalImpulseScaled-0.123155251)<1e-6,'frame 56 historical normal impulse');
const wall147=launchContacts.find(r=>+r.frame===147 && +r.normalImpulseScaled>0.1);
assert(wall147,'historical left-wall rebound occurs at frame 147');

const flipperContacts=readContacts('flipper-contact.csv');
assert(flipperContacts.some(r=>+r.frame===0),'flipper starts in persistent contact');
assert(flipperContacts.some(r=>+r.frame===3 && +r.normalImpulseScaled>1),'pressed flipper contact impulse captured');

console.log('contact solver archaeology tests passed');
console.log(JSON.stringify({
  linearSlop:P.constants.LINEAR_SLOP,
  polygonRadius:P.constants.POLYGON_RADIUS,
  velocityIterations:P.constants.VELOCITY_ITERATIONS,
  positionIterations:P.constants.POSITION_ITERATIONS,
  frame56NormalImpulse:+strongest56.normalImpulseScaled,
  wallReboundFrame:+wall147.frame
},null,2));
