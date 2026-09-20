const assert=require('assert');
const vm=require('vm'),fs=require('fs'),path=require('path');
const P=require('../public/js/physics.js');
const code=fs.readFileSync(path.join(__dirname,'../public/data/playfield.js'),'utf8');
const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(code,sandbox);
const pf=sandbox.window.COMET_PLAYFIELD;
const c=P.constants;
function near(a,b,eps=1e-9){assert(Math.abs(a-b)<=eps,`${a} != ${b}`);}

near(c.BALL_R,.0135);near(c.STEEL_E,.56);near(c.GROUND_E,.2);near(c.PLUNGE_DV,1.962,1e-12);
near(c.G,-9.81*Math.sin(7*Math.PI/180),1e-12);

const geo=P.makeGeometry(pf);
assert.equal(geo.circles.filter(x=>x.kind==='bumper').length,3);
assert.equal(geo.reactiveSlings.length,4);
assert.equal(geo.polygons.filter(x=>x.kind==='obstacle').length,3);
assert.equal(geo.polygons.filter(x=>x.kind==='top-right-curve').length,30);
assert.equal(geo.polygons.filter(x=>x.kind==='top-left-curve').length,30);

const fl=P.makeFlippers();
let sh=P.flipperWorldShape(fl.left);
assert(sh.tip.x>fl.left.pivot.x&&sh.tip.y<fl.left.pivot.y,'left rest flipper must point inward/down');
sh=P.flipperWorldShape(fl.right);
assert(sh.tip.x<fl.right.pivot.x&&sh.tip.y<fl.right.pivot.y,'right rest flipper must point inward/down');
P.updateFlipper(fl.left,true,1);P.updateFlipper(fl.right,true,1);
near(fl.left.bodyAngle,fl.left.max);near(fl.right.bodyAngle,fl.right.min);
sh=P.flipperWorldShape(fl.right);
assert(sh.tip.x<fl.right.pivot.x&&sh.tip.y>fl.right.pivot.y,'right active flipper must point inward/up');

const e=new P.Engine(pf);
e.ball.y=.0235; // after the reset ball settles onto the 1 cm ground box.
assert(e.plunge(0));near(e.ball.vy,c.PLUNGE_DV,1e-12);
assert(!e.plunge(500),'plunge cooldown must be one second');

// Free fall away from geometry: one 10 ms step should apply ramp gravity.
e.ball.x=.38;e.ball.y=.80;e.ball.vx=e.ball.vy=0;e.drainLatched=false;e.bumperContacts.clear();e.slingContacts.clear();
e.step(.01,2000,{left:false,right:false,plunge:false},{});
near(e.ball.vy,c.G*.01,2e-5);

// Source-level force conversion: historical BUMPER_FORCE gives ~0.728 m/s at 60 Hz.
near(c.BUMPER_ACCEL_PHYSICAL/60,.7277,5e-4);
console.log('physics parity tests passed');

// Bumper event must fire on contact end, not on contact begin.
const eb=new P.Engine(pf),bum=pf.bumpers[0];
eb.ball.x=bum.x;eb.ball.y=bum.y+bum.r+c.BALL_R-.0005;eb.ball.vx=eb.ball.vy=0;
let hits=[];eb.step(.001,3000,{left:false,right:false,plunge:false},{onHit:id=>hits.push(id)});
assert.equal(hits.length,0,'bumper must not score on begin contact');
assert(eb.bumperContacts.has(bum.id),'bumper contact should be tracked');
eb.ball.y=bum.y+bum.r+c.BALL_R+.02;
eb.step(.001,3001,{left:false,right:false,plunge:false},{onHit:id=>hits.push(id)});
assert.deepEqual(hits,[bum.id],'bumper must score exactly once on end contact');

// Drain sensor is x 0..0.70, y 0..0.04 and should not include the launch lane reset x=.735.
const ed=new P.Engine(pf);let drained=0;
ed.ball.x=.30;ed.ball.y=.0235;ed.step(.001,4000,{left:false,right:false,plunge:false},{onDrain:()=>drained++});
assert.equal(drained,1,'drain sensor should trigger in the lower main field');
const el=new P.Engine(pf);let launchDrain=0;
el.ball.x=.735;el.ball.y=.0235;el.step(.001,4000,{left:false,right:false,plunge:false},{onDrain:()=>launchDrain++});
assert.equal(launchDrain,0,'launch lane must stay outside the drain sensor');
