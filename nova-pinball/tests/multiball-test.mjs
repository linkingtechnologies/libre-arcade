import { circlePair } from '../public/src/physics.js';
import { lowestBallY } from '../public/src/camera.js';
import { HistoricalGameplay, POINTS } from '../public/src/gameplay.js';

const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

// Equal dynamic balls use Box2D's default zero restitution in upstream.
const a={x:0,y:0,vx:100,vy:0,r:15};
const b={x:20,y:0,vx:-100,vy:0,r:15};
assert(circlePair(a,b,0),'overlapping balls should collide');
assert(Math.abs(a.vx)<1e-9 && Math.abs(b.vx)<1e-9,'zero restitution equal-mass response mismatch');
assert(Math.hypot(b.x-a.x,b.y-a.y)>=29.99,'ball pair should be separated');

// Historical camera tracks the visually lowest active ball (largest Y).
assert(lowestBallY([{y:120},{y:730},{y:410}])===730,'multiball camera should follow lowest ball');

// Drive the first cycle quickly, then verify the dynamically inserted mission.
const g=new HistoricalGameplay();
const group=tags=>{let out=[];for(const tag of tags)out=out.concat(g.hit(tag,false));return out;};
const nova=()=>group(['n','o','v','a']);
const leftDots=()=>group(['dot4','dot5']);
const rightDots=()=>group(['dot1','dot2']);

nova();                          // red giant
g.hit('left ramp');g.hit('right ramp');
leftDots();g.hit('left ramp');g.hit('left bumper');
rightDots();g.hit('right ramp');g.hit('right bumper');
g.update(30.1);g.hit('left ramp');g.hit('right ramp');nova();
g.update(30.1);g.hit('left ramp');g.hit('right ramp');nova();
g.hit('left ramp');g.hit('right ramp');nova();
g.hit('black hole');g.hit('black hole');g.hit('black hole');
g.update(7.1);

assert(g.bonusInserted,'reset should dynamically insert Matter Jettison');
assert(g.mission.title==='red giant','bonus branch must start in the next cycle, not immediately');
assert(g.missions.map(m=>m.title).slice(0,5).join('|')==='red giant|hydrogen release|bonus ball notice|bonus ball|fusion stage 1','bonus missions inserted in wrong position');

// Reach the second-cycle Matter Jettison notice.
nova();g.hit('left ramp');g.hit('right ramp');
assert(g.mission.title==='bonus ball notice' && g.nextSignal==='wait','Matter Jettison notice must wait 30 seconds');
let events=g.update(30.1);
assert(events.some(e=>e.type==='mission-complete'&&e.title==='bonus ball notice'),'Matter Jettison notice did not complete');
assert(g.mission.title==='bonus ball' && g.nextSignal==='left bumper','multiball sequence did not start');

const before=g.score;
g.hit('left bumper');nova();g.hit('right bumper');nova();g.hit('middle bumper');leftDots();events=rightDots();
assert(events.some(e=>e.type==='multiball-release'),'bonus mission must request a second ball');
assert(g.safeMode>29,'multiball completion must activate 30 second Safe Mode');
assert(g.mission.title==='fusion stage 1','after Matter Jettison the historical chain returns to Fusion Stage 1');
assert(g.score-before===POINTS.multiballBonus + 3*POINTS.bumper + 2*POINTS.wordBonus + 2*POINTS.dotTargets,'Matter Jettison scoring mismatch');

console.log('OK — Matter Jettison insertion, multiball event, ball-ball collision and camera tracking');
