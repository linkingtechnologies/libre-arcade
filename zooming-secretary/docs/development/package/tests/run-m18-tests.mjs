/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { makeDay4Map, makeDay4Stage, DAY4_ORACLE } from '../web/stage-day4.js';
import { Simulation } from '../src/simulation.js';
import { PHONE } from '../src/phone.js';
import { DIR } from '../src/npc.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log(`PASS ${id} ${name}`);}catch(e){results.push({id,name,ok:false,error:e.stack||String(e)});console.error(`FAIL ${id} ${name}\n${e.stack||e}`);}}
function mapSha(map){return crypto.createHash('sha256').update(Buffer.from(map.cells)).digest('hex');}

test('ZS-M18-001','Day 4 semantic collision topology matches certified oracle',()=>{
  const map=makeDay4Map(); assert.equal(map.cells.length,704); assert.equal(mapSha(map),DAY4_ORACLE.collisionSha256);
});

test('ZS-M18-002','Day 4 configuration matches v1.02 oracle',()=>{
  const s=makeDay4Stage('en');
  assert.equal(s.name,'Day 4'); assert.equal(s.targetCalls,25); assert.equal(s.topicsActive,3); assert.equal(s.callDelay,250); assert.equal(s.missLimit,3);
  assert.deepEqual(s.spawn,{x:24,y:56,scanIndex:99}); assert.deepEqual(s.coffee,{x:120,y:129,scanIndex:335});
  assert.deepEqual(s.npc,{type:'chatter',x:152,y:120,scanIndex:371});
});

test('ZS-M18-003','Day 4 phones and cabinets preserve binary scan order',()=>{
  const s=makeDay4Stage('en');
  assert.deepEqual(s.phones.map(({x,y,scanIndex})=>({x,y,scanIndex})),[{x:56,y:64,scanIndex:71},{x:192,y:64,scanIndex:88}]);
  assert.deepEqual(s.topics.map(({id,x,y,scanIndex})=>({id,x,y,scanIndex})),[{id:0,x:22,y:192,scanIndex:483},{id:1,x:118,y:192,scanIndex:495},{id:2,x:214,y:192,scanIndex:507}]);
  assert.equal(s.sourceOrderedInit,true);
});

test('ZS-M18-004','binary-real Day 4 initialization matches M12',()=>{
  const sim=new Simulation(makeDay4Stage('en'),{seed:1});
  assert.equal(sim.rng.state,207); assert.equal(sim.phones.callDelay,230);
  assert.deepEqual(sim.phones.phones.map(p=>p.counter),[252,504]); assert.deepEqual(sim.phones.phones.map(p=>p.topic),[1,1]);
  assert.deepEqual(sim.topics.map(t=>t.messageIndex),[7,8,3]);
  assert.equal(sim.npc.type,'chatter'); assert.equal(sim.npc.dir,DIR.NONE); assert.equal(sim.npc.counter,20); assert.equal(sim.npc.wait,0);
});

test('ZS-M18-005','Day 4 preserves three side-accessible floors',()=>{
  assert.deepEqual(makeDay4Map().discoverSideFloors(),{left:[56,120,184],right:[56,120,184]});
});

test('ZS-M18-006','first two Day 4 rings occur at certified ticks',()=>{
  const sim=new Simulation(makeDay4Stage('en'),{seed:1}); const rings=[];
  for(let i=0;i<700&&rings.length<2;i++) for(const e of sim.tick({})) if(e.type==='RING_START') rings.push({id:e.id,tick:i,topic:e.topic});
  assert.deepEqual(rings,[{id:0,tick:252,topic:1},{id:1,tick:504,topic:1}]);
});

test('ZS-M18-007','Chatter overwrites the memorized topic on close same-floor contact',()=>{
  const sim=new Simulation(makeDay4Stage('en'),{seed:1});
  sim.player.topic=2; sim.player.xFp=140<<4; sim.player.yFp=120<<4;
  const before=sim.rng.state; const events=sim.tick({});
  assert.equal(before,207); assert.equal(sim.player.topic,0); assert.equal(sim.rng.state,81);
  assert.ok(events.some(e=>e.type==='CHATTER_TOPIC'&&e.topic===0));
  assert.equal(sim.npc.wait,100); assert.equal(sim.npc.counter,50); assert.equal(sim.npc.dir,DIR.NONE);
});

test('ZS-M18-008','Chatter holds 50 talk ticks then 100 cooldown ticks without retrigger',()=>{
  const sim=new Simulation(makeDay4Stage('en'),{seed:1}); sim.player.topic=2; sim.player.xFp=140<<4; sim.player.yFp=120<<4; sim.tick({});
  for(let i=0;i<50;i++) sim.tick({}); assert.equal(sim.npc.counter,0); assert.equal(sim.npc.wait,100);
  const topic=sim.player.topic; for(let i=0;i<100;i++) sim.tick({}); assert.equal(sim.npc.wait,0); assert.equal(sim.player.topic,topic);
});

test('ZS-M18-009','Chatter can immediately disrupt a route decision after a cabinet pickup',()=>{
  const sim=new Simulation(makeDay4Stage('en'),{seed:1});
  sim.player.topic=1; sim.player.xFp=140<<4; sim.player.yFp=120<<4;
  sim.tick({}); assert.notEqual(sim.player.topic,1); assert.equal(sim.player.topic,0);
});

test('ZS-M18-010','real movement can descend from spawn to the middle floor',()=>{
  const sim=new Simulation(makeDay4Stage('en'),{seed:1});
  // Spawn x=24 is aligned with the left upper ladder (columns 3-4).
  for(let i=0;i<60;i++) sim.tick({DOWN:true});
  assert.equal(sim.player.yFp>>4,120);
});

test('ZS-M18-011','real movement can continue to the lower cabinet floor',()=>{
  const sim=new Simulation(makeDay4Stage('en'),{seed:1});
  for(let i=0;i<60;i++) sim.tick({DOWN:true});
  for(let i=0;i<18;i++) sim.tick({RIGHT:true});
  for(let i=0;i<60;i++) sim.tick({DOWN:true});
  assert.equal(sim.player.yFp>>4,184);
});

test('ZS-M18-012','Day 4 coffee is active on the Chatter floor',()=>{
  const sim=new Simulation(makeDay4Stage('en'),{seed:1}); for(let i=0;i<150;i++) sim.tick({});
  assert.equal(sim.coffee.wait,0); sim.player.xFp=108<<4; sim.player.yFp=120<<4;
  const events=sim.tick({}); assert.ok(events.some(e=>e.type==='COFFEE_PICKUP')); assert.equal(sim.player.coffee,20);
});

test('ZS-M18-013','25 answers win Day 4 and three misses lose it',()=>{
  const win=new Simulation(makeDay4Stage('en'),{seed:1}); win.npc=null;
  for(let n=0;n<25;n++){const p=win.phones.phones[n%2];p.level=PHONE.HEAT_1;p.counter=100;p.topic=n%3;win.player.topic=p.topic;win.player.xFp=p.x<<4;win.player.yFp=(p.y-16)<<4;win.tick({});}
  assert.equal(win.phones.callsCount,25);assert.equal(win.status,'WON');
  const lose=new Simulation(makeDay4Stage('en'),{seed:1});lose.npc=null;
  for(let n=0;n<3;n++){const p=lose.phones.phones[n%2];p.level=PHONE.HEAT_3;p.counter=0;lose.tick({});}
  assert.equal(lose.phones.callsMissed,3);assert.equal(lose.status,'LOST');
});

test('ZS-M18-014','browser campaign wires Day 1 through Day 4 bilingually and surfaces Chatter event',()=>{
  const app=fs.readFileSync(path.join(root,'web/app.js'),'utf8');
  assert.match(app,/makeDay4Stage/); assert.match(app,/Continue to Day 4/); assert.match(app,/Continua al Giorno 4/);
  assert.match(app,/CHATTER_TOPIC/); assert.match(app,/Chatter changed it/); assert.match(app,/Chatter lo ha cambiato/); assert.match(app,/startDay4/);
});

test('ZS-M18-015','renderer gives Chatter a distinct placeholder-only treatment',()=>{
  const renderer=fs.readFileSync(path.join(root,'web/renderer.js'),'utf8');
  assert.match(renderer,/chatter=n\.type==='chatter'/); assert.match(renderer,/c\.fillRect\(x\+4,y\+5,3,2\)/);
  assert.doesNotMatch(renderer,/\.png|\.gif|tileset\.chr|label_/i);
});

test('ZS-M18-016','package is M18 and Day 4 remains semantic-only',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')); { const [maj,min]=pkg.version.split('.').map(Number); assert.ok(maj>=1 || (maj===0 && min>=18), pkg.version); } assert.match(pkg.scripts.test,/run-m18-tests/);
  const src=fs.readFileSync(path.join(root,'data/stage-day4-data.js'),'utf8'); assert.match(src,/historical semantic stage data/i); assert.doesNotMatch(src,/map4_nam|0x59|0x5a|tileset\.chr/i);
});


test('ZS-M18-017','real movement reaches Chatter and triggers a topic overwrite',()=>{
  const sim=new Simulation(makeDay4Stage('en'),{seed:1}); sim.player.topic=2;
  for(let i=0;i<60;i++) sim.tick({DOWN:true});
  let hit=null;
  for(let i=0;i<100&&!hit;i++) hit=sim.tick({RIGHT:true}).find(e=>e.type==='CHATTER_TOPIC')||null;
  assert.ok(hit); assert.equal(sim.player.yFp>>4,120); assert.notEqual(sim.player.topic,2);
});

test('ZS-M18-018','Day 4 lower ladder tail performs the certified vertical wrap to the upper floor',()=>{
  const sim=new Simulation(makeDay4Stage('en'),{seed:1});
  sim.player.xFp=80<<4; sim.player.yFp=184<<4; sim.player.speedFp=24; sim.player.speedTargetFp=24;
  for(let i=0;i<80;i++) sim.tick({DOWN:true});
  assert.equal(sim.player.xFp>>4,80); assert.equal(sim.player.yFp>>4,56);
});

const failed=results.filter(r=>!r.ok); const report={baseline:'Zooming Secretary M18 Day 4 playable',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m18-test-report.json'),JSON.stringify(report,null,2)+'\n'); console.log(`\n${report.passed}/${report.total} M18 tests passed`); if(failed.length)process.exit(1);
