import { HistoricalGameplay, POINTS } from '../public/src/gameplay.js';
const g=new HistoricalGameplay();
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const hitGroup=(tags,tilt=false)=>{let out=[];for(const tag of tags)out=out.concat(g.hit(tag,tilt));return out;};
const nova=()=>hitGroup(['n','o','v','a']);

// Direct scoring.
g.hit('left bumper',false); assert(g.score===POINTS.bumper,'bumper score mismatch');
g.hit('left kicker',false); assert(g.score===POINTS.bumper+POINTS.kicker,'kicker score mismatch');

// NOVA -> Red Giant.
g.reset();
for(const tag of ['n','o','v']) g.hit(tag,false);
assert(g.score===0,'individual NOVA letters must not score');
let events=g.hit('a',false);
assert(g.score===POINTS.wordBonus+POINTS.redGiant,'NOVA + red giant score mismatch');
assert(g.star==='red','red giant should turn star red');
assert(g.nextSignal==='left ramp','hydrogen mission should request left ramp next');
assert(events.some(e=>e.type==='mission-complete'&&e.title==='red giant'),'red giant mission did not complete');

// Hydrogen release is ordered.
g.hit('right ramp',false); assert(g.nextSignal==='left ramp','mission order must be enforced');
g.hit('left ramp',false); assert(g.nextSignal==='right ramp','left ramp should advance hydrogen mission');
g.hit('right ramp',false); assert(g.nextSignal==='left targets','fusion stage 1 should start');

// Fusion stage 1: left target bank -> left ramp -> left bumper.
hitGroup(['dot4','dot5']); assert(g.nextSignal==='left ramp','left target bank should advance fusion stage 1');
g.hit('left ramp'); assert(g.nextSignal==='left bumper','fusion stage 1 should request left bumper');
g.hit('left bumper'); assert(g.fusion1,'fusion stage 1 visual state missing'); assert(g.nextSignal==='right targets','fusion stage 2 should start');

// Fusion stage 2 mirrors the right side.
hitGroup(['dot1','dot2']); g.hit('right ramp'); g.hit('right bumper');
assert(g.fusion2,'fusion stage 2 visual state missing');
assert(g.nextSignal==='wait' && Math.ceil(g.waitSeconds)===30,'fusion burn should begin with 30 second wait');

// Wait expiry, ramps and NOVA for fusion burn.
g.update(29); assert(g.nextSignal==='wait','fusion burn wait expired too early');
events=g.update(1.1); assert(g.nextSignal==='left ramp','fusion burn should request left ramp after wait');
g.hit('left ramp');g.hit('right ramp');nova();
assert(g.nextSignal==='wait' && Math.ceil(g.waitSeconds)===30,'fusion unstable should begin with 30 second wait');

// Second timed phase turns rays on.
g.update(30.1);g.hit('left ramp');g.hit('right ramp');nova();
assert(g.unstable,'fusion unstable visual state missing');
assert(g.nextSignal==='left ramp','collapse star should start');

// Collapse creates black hole and awards 22,500.
g.hit('left ramp');g.hit('right ramp');nova();
assert(g.blackHole,'collapse star should create black hole');
assert(g.nextSignal==='black hole','wormhole mission should request black hole');

// Each visible black-hole contact gives gravity-lock score and a one-second lock.
const scoreBeforeLock=g.score;
events=g.hit('black hole');
assert(g.score===scoreBeforeLock+POINTS.gravityLock,'gravity lock score mismatch');
assert(events.some(e=>e.type==='black-hole-lock'),'black hole must request ball lock');
g.hit('black hole');events=g.hit('black hole');
assert(g.wormhole,'three black-hole hits should open wormhole');
assert(g.nextSignal==='wait' && Math.ceil(g.waitSeconds)===7,'wormhole should lead to seven-second reset wait');
assert(g.safeMode>29,'wormhole should activate 30 second safe mode');

// Reset awards the historical Supergravity bonus and restores stable-star presentation.
const beforeReset=g.score;
g.update(7.1);
assert(g.score===beforeReset+POINTS.supergravityBonus,'supergravity reset bonus mismatch');
assert(!g.wormhole&&!g.blackHole&&!g.fusion1&&!g.fusion2&&!g.unstable&&g.star==='stable','reset visual state mismatch');
assert(g.nextSignal==='nova word','main mission cycle should restart at NOVA');
assert(g.bonusInserted,'first reset should insert Matter Jettison for the next cycle');
assert(g.missions.some(m=>m.title==='bonus ball'),'bonus ball mission missing after reset');

// Tilt suppresses scoring and mission progress but stationary targets still toggle/reset.
g.reset();
g.hit('left bumper',true); assert(g.score===0,'tilt must suppress bumper score');
for(const tag of ['n','o','v','a']) g.hit(tag,true);
assert(g.score===0,'tilt must suppress word/mission score');
assert(g.nextSignal==='nova word','tilt must suppress mission progress');

console.log('OK — full historical main mission chain through wormhole/reset');
