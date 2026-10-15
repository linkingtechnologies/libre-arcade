/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { makeDay7Map, makeDay7Stage, DAY7_ORACLE } from '../web/stage-day7.js';
import { Simulation } from '../src/simulation.js';
import { PHONE } from '../src/phone.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log(`PASS ${id} ${name}`);}catch(e){results.push({id,name,ok:false,error:e.stack||String(e)});console.error(`FAIL ${id} ${name}\n${e.stack||e}`);}}
function mapSha(map){return crypto.createHash('sha256').update(Buffer.from(map.cells)).digest('hex');}

// 1
test('ZS-M22-001','Day 7 semantic collision topology matches certified oracle',()=>{
  const map=makeDay7Map(); assert.equal(map.cells.length,704); assert.equal(mapSha(map),DAY7_ORACLE.collisionSha256);
});

// 2
test('ZS-M22-002','Day 7 stage has 40 calls, four topics, four phones, coffee and Dibrov',()=>{
  const s=makeDay7Stage('en'); assert.equal(s.name,'Day 7'); assert.equal(s.targetCalls,40); assert.equal(s.topicsActive,4); assert.equal(s.callDelay,450); assert.equal(s.missLimit,3);
  assert.equal(s.phones.length,4); assert.equal(s.topics.length,4); assert.equal(s.npc.type,'dibrov'); assert.ok(s.coffee); assert.equal(s.bonus,false);
});

// 3
test('ZS-M22-003','binary-real Day 7 initialization matches M12/M11 oracle',()=>{
  const sim=new Simulation(makeDay7Stage('en'),{seed:1});
  assert.equal(sim.rng.state,125); assert.equal(sim.phones.callDelay,410);
  assert.deepEqual(sim.phones.phones.map(p=>p.counter),[452,704,959,1199]);
  assert.deepEqual(sim.phones.phones.map(p=>p.topic),[0,0,2,1]);
  assert.deepEqual(sim.topics.map(t=>t.messageIndex),[2,0,8,3]);
  assert.deepEqual({type:sim.npc.type,x:sim.npc.x,y:sim.npc.y,dir:sim.npc.dir},{type:'dibrov',x:248,y:184,dir:1});
});

// 4
test('ZS-M22-004','Day 7 side-floor discovery matches certified Dibrov re-entry floors',()=>{
  assert.deepEqual(makeDay7Map().discoverSideFloors(),{left:[56,120,184],right:[56,120,184]});
});

// 5
test('ZS-M22-005','Day 7 phone initial ring ticks preserve source ordering',()=>{
  const sim=new Simulation(makeDay7Stage('en',99),{seed:1}); const rings=[];
  for(let t=0;t<1210;t++) for(const e of sim.tick({})) if(e.type==='RING_START') rings.push({tick:t,id:e.id,topic:e.topic});
  assert.deepEqual(rings,[
    {tick:452,id:0,topic:0},{tick:704,id:1,topic:0},{tick:959,id:2,topic:2},{tick:1199,id:3,topic:1}
  ]);
});

// 6
test('ZS-M22-006','all four Day 7 cabinet topics and certified coordinates are present',()=>{
  const s=makeDay7Stage('en');
  assert.deepEqual(s.topics.map(({id,x,y})=>({id,x,y})),[
    {id:0,x:70,y:128},{id:2,x:166,y:128},{id:1,x:70,y:192},{id:3,x:166,y:192}
  ]);
  assert.deepEqual([...s.topics.map(t=>t.id)].sort((a,b)=>a-b),[0,1,2,3]);
});

// 7
test('ZS-M22-007','coffee uses corrected source Y and initial 150-tick wait',()=>{
  const sim=new Simulation(makeDay7Stage('en'),{seed:1});
  assert.deepEqual({x:sim.coffee.x,y:sim.coffee.y,wait:sim.coffee.wait},{x:136,y:193,wait:150});
});

// 8
test('ZS-M22-008','real movement reaches Day 7 coffee through the left descent',()=>{
  const sim=new Simulation(makeDay7Stage('en',99),{seed:1});
  let guard=100; while((sim.player.xFp>>4)>52 && guard-- >0) sim.tick({LEFT:true});
  for(let i=0;i<80;i++) sim.tick({DOWN:true});
  assert.equal(sim.player.yFp>>4,184);
  guard=100; while((sim.player.xFp>>4)<130 && guard-- >0) sim.tick({RIGHT:true});
  assert.equal(sim.player.coffee,20); assert.equal(sim.player.speedTargetFp,34);
});

// 9
test('ZS-M22-009','Dibrov same-floor movement is 1px on odd frame then 2px on even frame',()=>{
  const sim=new Simulation(makeDay7Stage('en',99),{seed:1});
  sim.player.xFp=80<<4; sim.player.yFp=120<<4; sim.npc.x=180; sim.npc.y=120; sim.npc.dir=1; sim.npc.counter=0;
  sim.tick({}); assert.equal(sim.npc.x,181); assert.equal(sim.npc.speed,2); assert.equal(sim.npc.dir,2);
  sim.tick({}); assert.equal(sim.npc.x,183);
});

// 10
test('ZS-M22-010','first Dibrov contact grants 500 wisdom and consumes four RNG calls for two hearts',()=>{
  const sim=new Simulation(makeDay7Stage('en',99),{seed:1});
  sim.player.xFp=192<<4; sim.player.yFp=120<<4; sim.npc.x=200; sim.npc.y=120; sim.npc.dir=1; sim.npc.counter=0;
  assert.equal(sim.rng.state,125); const events=sim.tick({});
  assert.ok(events.some(e=>e.type==='WISDOM')); assert.equal(sim.player.wisdom,500); assert.equal(sim.rng.state,236);
  assert.equal(sim.npc.dir,2); assert.equal(sim.npc.x,201);
});

// 11
test('ZS-M22-011','wisdom lets Day 7 answer a ringing phone with the wrong remembered topic',()=>{
  const sim=new Simulation(makeDay7Stage('en',99),{seed:1});
  sim.npc.counter=255; // keep Dibrov out of this phone-only interaction
  const p=sim.phones.phones[0]; p.level=PHONE.HEAT_1; p.counter=100; p.topic=3;
  sim.player.topic=0; sim.player.wisdom=10; sim.player.xFp=p.x<<4; sim.player.yFp=(p.y-8)<<4;
  const events=sim.tick({}); assert.ok(events.some(e=>e.type==='ANSWER')); assert.equal(sim.phones.callsCount,1);
});

// 12
test('ZS-M22-012','non-bonus wisdom decays and periodic decorative hearts advance shared RNG',()=>{
  const sim=new Simulation(makeDay7Stage('en',99),{seed:1});
  sim.npc.counter=255; sim.player.wisdom=10; sim.frameCnt=7;
  assert.equal(sim.rng.state,125); sim.tick({});
  assert.equal(sim.player.wisdom,9); assert.equal(sim.rng.state,59); // two rand8 calls at frame 8
});

// 13
test('ZS-M22-013','Dibrov moves away from the player on the same floor',()=>{
  const sim=new Simulation(makeDay7Stage('en',99),{seed:1});
  sim.player.xFp=100<<4; sim.player.yFp=120<<4; sim.npc.x=180; sim.npc.y=120; sim.npc.counter=0;
  sim.tick({}); assert.equal(sim.npc.dir,2); assert.ok(sim.npc.x>180);
  sim.player.xFp=220<<4; sim.npc.x=180; sim.frameCnt=1; sim.tick({}); assert.equal(sim.npc.dir,1); assert.ok(sim.npc.x<180);
});

// 14
test('ZS-M22-014','Dibrov edge exit without wisdom re-enters inward after 25 ticks on a certified floor',()=>{
  const sim=new Simulation(makeDay7Stage('en',99),{seed:1});
  sim.player.xFp=0; sim.player.yFp=120<<4; sim.npc.x=247; sim.npc.y=120; sim.npc.dir=2; sim.npc.counter=0;
  sim.tick({}); assert.deepEqual({x:sim.npc.x,dir:sim.npc.dir,counter:sim.npc.counter},{x:248,dir:1,counter:25});
  assert.equal(sim.npc.y,120); assert.equal(sim.rng.state,250);
});

// 15
test('ZS-M22-015','Dibrov edge exit while wisdom is active waits wisdom+25 ticks',()=>{
  const sim=new Simulation(makeDay7Stage('en',99),{seed:1});
  sim.player.xFp=0; sim.player.yFp=120<<4; sim.player.wisdom=100; sim.npc.x=247; sim.npc.y=120; sim.npc.dir=2; sim.npc.counter=0;
  sim.tick({}); assert.equal(sim.player.wisdom,99); assert.equal(sim.npc.counter,124); assert.equal(sim.npc.x,248); assert.equal(sim.npc.dir,1);
  assert.ok([56,120,184].includes(sim.npc.y));
});

// 16
test('ZS-M22-016','Day 7 accepts Dream-derived miss allowance 3 or 5',()=>{
  for(const limit of [3,5]){const sim=new Simulation(makeDay7Stage('en',limit),{seed:1}); assert.equal(sim.missLimit,limit); assert.equal(sim.stage.missLimit,limit);}
});

// 17
test('ZS-M22-017','dynamic Day 7 loss threshold is enforced at 3 or 5 misses',()=>{
  for(const limit of [3,5]){
    const sim=new Simulation(makeDay7Stage('en',limit),{seed:1}); sim.npc.counter=255;
    sim.phones.callsMissed=limit-1; sim.phones.phones[0].level=PHONE.HEAT_3; sim.phones.phones[0].counter=0;
    const events=sim.tick({}); assert.equal(sim.phones.callsMissed,limit); assert.equal(sim.status,'LOST'); assert.ok(events.some(e=>e.type==='STAGE_LOST'));
  }
});

// 18
test('ZS-M22-018','Day 7 wins at 40 answered calls',()=>{
  const sim=new Simulation(makeDay7Stage('en',5),{seed:1}); sim.npc.counter=255; sim.phones.callsCount=39;
  const p=sim.phones.phones[0]; p.level=PHONE.HEAT_1; p.counter=100; p.topic=0;
  sim.player.topic=0; sim.player.xFp=p.x<<4; sim.player.yFp=(p.y-8)<<4;
  const events=sim.tick({}); assert.equal(sim.phones.callsCount,40); assert.equal(sim.status,'WON'); assert.ok(events.some(e=>e.type==='STAGE_WON'));
});

// 19
test('ZS-M22-019','browser campaign connects Day 6 to Day 7 and Day 7 victory to a clean ending/restart',()=>{
  const app=fs.readFileSync(path.join(root,'web/app.js'),'utf8');
  assert.match(app,/makeDay7Stage/); assert.match(app,/const DAY7_STAGE=8/); assert.match(app,/pendingDay=DAY7_STAGE/); assert.match(app,/next7/);
  assert.match(app,/makeDay7Stage\(lang,futureMissLimit\)/); assert.match(app,/endingTitle/); assert.match(app,/endingText/); assert.match(app,/pendingDay=1; futureMissLimit=3/);
  assert.match(app,/Continue to Day 7/); assert.match(app,/Continua al Giorno 7/);
});

// 20
test('ZS-M22-020','browser exposes wisdom feedback, Dibrov placeholder, Day 7 debug start and semantic-only packaging',()=>{
  const app=fs.readFileSync(path.join(root,'web/app.js'),'utf8'); const renderer=fs.readFileSync(path.join(root,'web/renderer.js'),'utf8');
  assert.match(app,/e\.type==='WISDOM'/); assert.match(app,/startDay7/);
  assert.match(renderer,/dibrov=n\.type==='dibrov'/); assert.match(renderer,/sim\.player\.wisdom/); assert.doesNotMatch(renderer,/\.png|\.gif|tileset\.chr|label_/i);
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')); { const [maj,min]=pkg.version.split('.').map(Number); assert.ok(maj>=1 || (maj===0 && min>=22), pkg.version); } assert.match(pkg.scripts.test,/run-m22-tests/);
  const src=fs.readFileSync(path.join(root,'data/stage-day7-data.js'),'utf8'); assert.match(src,/historical semantic stage data/i); assert.doesNotMatch(src,/map7_nam|0x59|0x5a|tileset\.chr/i);
});

const failed=results.filter(r=>!r.ok); const report={baseline:'Zooming Secretary M22 Day 7 + ending playable',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m22-test-report.json'),JSON.stringify(report,null,2)+'\n'); console.log(`\n${report.passed}/${report.total} M22 tests passed`); if(failed.length)process.exit(1);
