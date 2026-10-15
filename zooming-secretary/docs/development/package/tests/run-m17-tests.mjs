/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { makeDay3Map, makeDay3Stage, DAY3_ORACLE } from '../web/stage-day3.js';
import { Simulation } from '../src/simulation.js';
import { PHONE } from '../src/phone.js';
import { DIR } from '../src/npc.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log(`PASS ${id} ${name}`);}catch(e){results.push({id,name,ok:false,error:e.stack||String(e)});console.error(`FAIL ${id} ${name}\n${e.stack||e}`);}}
function mapSha(map){return crypto.createHash('sha256').update(Buffer.from(map.cells)).digest('hex');}

test('ZS-M17-001','Day 3 semantic collision topology matches certified oracle',()=>{
  const map=makeDay3Map();
  assert.equal(map.cells.length,704);
  assert.equal(mapSha(map),DAY3_ORACLE.collisionSha256);
});

test('ZS-M17-002','Day 3 configuration matches v1.02 oracle',()=>{
  const s=makeDay3Stage('en');
  assert.equal(s.name,'Day 3');
  assert.equal(s.targetCalls,20); assert.equal(s.topicsActive,3); assert.equal(s.callDelay,250); assert.equal(s.missLimit,3);
  assert.deepEqual(s.spawn,{x:40,y:56,scanIndex:101});
  assert.deepEqual(s.coffee,{x:120,y:65,scanIndex:79});
  assert.deepEqual(s.npc,{type:'bouncer',x:200,y:56,scanIndex:121});
});

test('ZS-M17-003','Day 3 phones and three cabinets preserve binary scan order',()=>{
  const s=makeDay3Stage('en');
  assert.deepEqual(s.phones.map(({x,y,scanIndex})=>({x,y,scanIndex})),[
    {x:120,y:128,scanIndex:335},{x:32,y:192,scanIndex:580},{x:216,y:192,scanIndex:603}
  ]);
  assert.deepEqual(s.topics.map(({id,x,y,scanIndex})=>({id,x,y,scanIndex})),[
    {id:0,x:38,y:128,scanIndex:229},{id:1,x:198,y:128,scanIndex:249},{id:2,x:118,y:192,scanIndex:495}
  ]);
  assert.equal(s.sourceOrderedInit,true);
});

test('ZS-M17-004','binary-real Day 3 initialization matches M12',()=>{
  const sim=new Simulation(makeDay3Stage('en'),{seed:1});
  assert.equal(sim.rng.state,DAY3_ORACLE.expectedInit.rng);
  assert.equal(sim.phones.callDelay,DAY3_ORACLE.expectedInit.callDelay);
  assert.deepEqual(sim.phones.phones.map(p=>p.counter),[266,496,759]);
  assert.deepEqual(sim.phones.phones.map(p=>p.topic),[2,0,0]);
  assert.deepEqual(sim.topics.map(t=>t.messageIndex),[1,5,0]);
  assert.equal(sim.npc.type,'bouncer'); assert.equal(sim.npc.dir,DIR.LEFT);
});

test('ZS-M17-005','Day 3 side floors preserve certified three-floor topology',()=>{
  assert.deepEqual(makeDay3Map().discoverSideFloors(),{left:[56,120,184],right:[56,120,184]});
});

test('ZS-M17-006','first three Day 3 rings occur at certified binary ticks',()=>{
  const sim=new Simulation(makeDay3Stage('en'),{seed:1}); const rings=[];
  for(let i=0;i<900&&rings.length<3;i++) for(const e of sim.tick({})) if(e.type==='RING_START') rings.push({id:e.id,tick:i,topic:e.topic});
  assert.deepEqual(rings,[{id:0,tick:266,topic:2},{id:1,tick:496,topic:0},{id:2,tick:759,topic:0}]);
});

test('ZS-M17-007','Bouncer moves one pixel every fourth frame and starts left',()=>{
  const sim=new Simulation(makeDay3Stage('en'),{seed:1});
  assert.equal(sim.npc.x,200); assert.equal(sim.npc.dir,DIR.LEFT);
  sim.tick({});sim.tick({});sim.tick({}); assert.equal(sim.npc.x,200);
  sim.tick({}); assert.equal(sim.npc.x,199);
});

test('ZS-M17-008','Bouncer is a physical obstacle, not decorative',()=>{
  const sim=new Simulation(makeDay3Stage('en'),{seed:1});
  sim.player.xFp=190<<4; sim.player.yFp=56<<4; sim.player.speedFp=24; sim.player.speedTargetFp=24; sim.frameCnt=1;
  for(let i=0;i<5;i++) sim.tick({RIGHT:true});
  assert.ok((sim.player.xFp>>4) < sim.npc.x);
  assert.ok((sim.player.xFp>>4) <= 192);
});

test('ZS-M17-009','descending ladder entry uses source y+24 sample',()=>{
  const sim=new Simulation(makeDay3Stage('en'),{seed:1});
  for(let i=0;i<16;i++) sim.tick({LEFT:true});
  assert.equal(sim.player.yFp>>4,56);
  for(let i=0;i<60;i++) sim.tick({DOWN:true});
  assert.equal(sim.player.yFp>>4,120);
});

test('ZS-M17-010','real movement can descend two floors and memorize Books',()=>{
  const sim=new Simulation(makeDay3Stage('en'),{seed:1});
  for(let i=0;i<16;i++) sim.tick({LEFT:true});
  for(let i=0;i<60;i++) sim.tick({DOWN:true});
  for(let i=0;i<30;i++) sim.tick({RIGHT:true});
  for(let i=0;i<60;i++) sim.tick({DOWN:true});
  let books=false;
  for(let i=0;i<35;i++){
    const events=sim.tick({RIGHT:true});
    if(events.some(e=>e.type==='TOPIC'&&e.topic===2)){books=true;break;}
  }
  assert.equal(books,true); assert.equal(sim.player.yFp>>4,184); assert.equal(sim.player.topic,2);
});

test('ZS-M17-011','Day 3 coffee remains active before the Bouncer',()=>{
  const sim=new Simulation(makeDay3Stage('en'),{seed:1});
  for(let i=0;i<150;i++) sim.tick({});
  assert.equal(sim.coffee.wait,0);
  sim.player.xFp=108<<4; sim.player.yFp=56<<4;
  const events=sim.tick({});
  assert.ok(events.some(e=>e.type==='COFFEE_PICKUP'));
  assert.equal(sim.player.coffee,20); assert.equal(sim.player.speedTargetFp,34);
});

test('ZS-M17-012','20 valid answers win Day 3 and three misses lose it',()=>{
  const win=new Simulation(makeDay3Stage('en'),{seed:1});
  for(let n=0;n<20;n++){
    const p=win.phones.phones[n%3]; p.level=PHONE.HEAT_1;p.counter=100;p.topic=n%3;
    win.player.topic=p.topic;win.player.xFp=p.x<<4;win.player.yFp=(p.y-16)<<4;win.tick({});
  }
  assert.equal(win.phones.callsCount,20);assert.equal(win.status,'WON');
  const lose=new Simulation(makeDay3Stage('en'),{seed:1});
  for(let n=0;n<3;n++){const p=lose.phones.phones[n];p.level=PHONE.HEAT_3;p.counter=0;lose.tick({});}
  assert.equal(lose.phones.callsMissed,3);assert.equal(lose.status,'LOST');
});

test('ZS-M17-013','browser campaign wires Day 1 to Day 2 to Day 3 bilingually',()=>{
  const app=fs.readFileSync(path.join(root,'web/app.js'),'utf8');
  assert.match(app,/makeDay1Stage/);assert.match(app,/makeDay2Stage/);assert.match(app,/makeDay3Stage/);
  assert.match(app,/Continue to Day 3/);assert.match(app,/Continua al Giorno 3/);
  assert.match(app,/Books joins Earth and History/);assert.match(app,/si aggiungono i Libri/);
  assert.match(app,/startDay3/);
});

test('ZS-M17-014','renderer distinguishes Books and Bouncer using new placeholder drawing',()=>{
  const renderer=fs.readFileSync(path.join(root,'web/renderer.js'),'utf8');
  assert.match(renderer,/\['E','H','B','S'\]/);
  assert.match(renderer,/bouncer=n\.type==='bouncer'/);
  assert.doesNotMatch(renderer,/\.png|\.gif|tileset\.chr|label_/i);
});

test('ZS-M17-015','Day 3 distributable is semantic reconstruction only',()=>{
  const src=fs.readFileSync(path.join(root,'data/stage-day3-data.js'),'utf8');
  assert.match(src,/historical semantic stage data/i);
  assert.match(src,/fill\(map,4,0,1,TILE\.WALL\)/);
  assert.doesNotMatch(src,/map3_nam|0x59|0x5a|tileset\.chr/i);
});

test('ZS-M17-016','package is M17 and full archaeology policy regression remains enabled',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  { const [maj,min]=pkg.version.split('.').map(Number); assert.ok(maj>=1 || (maj===0 && min>=17), pkg.version); }
  assert.match(pkg.scripts.test,/run-m13-policy-tests/);assert.match(pkg.scripts.test,/run-m16-tests/);assert.match(pkg.scripts.test,/run-m17-tests/);
});

const failed=results.filter(r=>!r.ok);
const report={baseline:'Zooming Secretary M17 Day 3 playable',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m17-test-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`\n${report.passed}/${report.total} M17 tests passed`);
if(failed.length)process.exit(1);
