/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { makeDay6Map, makeDay6Stage, DAY6_ORACLE } from '../web/stage-day6.js';
import { Simulation } from '../src/simulation.js';
import { PHONE } from '../src/phone.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log(`PASS ${id} ${name}`);}catch(e){results.push({id,name,ok:false,error:e.stack||String(e)});console.error(`FAIL ${id} ${name}\n${e.stack||e}`);}}
function mapSha(map){return crypto.createHash('sha256').update(Buffer.from(map.cells)).digest('hex');}

// 1
test('ZS-M21-001','Day 6 semantic collision topology matches certified oracle',()=>{
  const map=makeDay6Map(); assert.equal(map.cells.length,704); assert.equal(mapSha(map),DAY6_ORACLE.collisionSha256);
});

// 2
test('ZS-M21-002','Day 6 stage configuration has 35 calls, four topics, four phones, coffee and ManBox',()=>{
  const s=makeDay6Stage('en');
  assert.equal(s.name,'Day 6'); assert.equal(s.targetCalls,35); assert.equal(s.topicsActive,4); assert.equal(s.callDelay,400); assert.equal(s.missLimit,3);
  assert.equal(s.phones.length,4); assert.equal(s.topics.length,4); assert.equal(s.npc.type,'manbox'); assert.ok(s.coffee); assert.equal(s.bonus,false);
});

// 3
test('ZS-M21-003','binary-real Day 6 initialization matches M12/M11 oracle',()=>{
  const sim=new Simulation(makeDay6Stage('en'),{seed:1});
  assert.equal(sim.rng.state,125); assert.equal(sim.phones.callDelay,360);
  assert.deepEqual(sim.phones.phones.map(p=>p.counter),[408,678,926,1163]);
  assert.deepEqual(sim.phones.phones.map(p=>p.topic),[0,0,3,1]);
  assert.deepEqual(sim.topics.map(t=>t.messageIndex),[8,0,6,17]);
  assert.deepEqual({type:sim.npc.type,x:sim.npc.x,y:sim.npc.y,dir:sim.npc.dir},{type:'manbox',x:184,y:120,dir:2});
});

// 4
test('ZS-M21-004','Day 6 side-floor discovery matches three certified ManBox re-entry floors',()=>{
  assert.deepEqual(makeDay6Map().discoverSideFloors(),{left:[56,120,184],right:[56,120,184]});
});

// 5
test('ZS-M21-005','Day 6 phone initial ring ticks preserve source ordering',()=>{
  const sim=new Simulation(makeDay6Stage('en',99),{seed:1}); const rings=[];
  for(let t=0;t<1180;t++) for(const e of sim.tick({})) if(e.type==='RING_START') rings.push({tick:t,id:e.id,topic:e.topic});
  assert.deepEqual(rings,[
    {tick:408,id:0,topic:0},{tick:678,id:1,topic:0},{tick:926,id:2,topic:3},{tick:1163,id:3,topic:1}
  ]);
});

// 6
test('ZS-M21-006','all four Day 6 cabinet topics and certified coordinates are present',()=>{
  const s=makeDay6Stage('en');
  assert.deepEqual(s.topics.map(({id,x,y})=>({id,x,y})),[
    {id:0,x:86,y:128},{id:2,x:150,y:128},{id:1,x:14,y:192},{id:3,x:222,y:192}
  ]);
  assert.deepEqual([...s.topics.map(t=>t.id)].sort((a,b)=>a-b),[0,1,2,3]);
});

// 7
test('ZS-M21-007','coffee uses corrected source Y and is initially unavailable for 150 ticks',()=>{
  const sim=new Simulation(makeDay6Stage('en'),{seed:1});
  assert.deepEqual({x:sim.coffee.x,y:sim.coffee.y,wait:sim.coffee.wait},{x:104,y:73,wait:150});
});

// 8
test('ZS-M21-008','real movement reaches Day 6 coffee through lower central vertical wrap',()=>{
  const sim=new Simulation(makeDay6Stage('en',99),{seed:1});
  for(let i=0;i<8;i++)sim.tick({RIGHT:true});
  for(let i=0;i<75;i++)sim.tick({DOWN:true});
  for(let i=0;i<42;i++)sim.tick({RIGHT:true});
  for(let i=0;i<100;i++)sim.tick({DOWN:true});
  assert.deepEqual({x:sim.player.xFp>>4,y:sim.player.yFp>>4},{x:128,y:64});
  for(let i=0;i<20;i++)sim.tick({LEFT:true});
  assert.equal(sim.player.coffee,20); assert.equal(sim.player.speedTargetFp,34); assert.ok((sim.player.xFp>>4)<=104);
});

// 9
test('ZS-M21-009','ManBox moves one pixel every two gameplay ticks',()=>{
  const sim=new Simulation(makeDay6Stage('en',99),{seed:1});
  assert.equal(sim.npc.x,184); sim.tick({}); assert.equal(sim.npc.x,184); sim.tick({}); assert.equal(sim.npc.x,185);
});

// 10
test('ZS-M21-010','ManBox collision knocks for 48 ticks and reverses direction',()=>{
  const sim=new Simulation(makeDay6Stage('en',99),{seed:1});
  sim.player.xFp=176<<4; sim.player.yFp=120<<4; sim.npc.x=184; sim.npc.y=120; sim.npc.dir=1;
  const events=sim.tick({RIGHT:true});
  assert.ok(events.some(e=>e.type==='KNOCK')); assert.equal(sim.player.knocked,48); assert.equal(sim.player.knockedAnim,8); assert.equal(sim.npc.dir,2);
});

// 11
test('ZS-M21-011','sustained ManBox overlap extends knock as in source order',()=>{
  const sim=new Simulation(makeDay6Stage('en',99),{seed:1});
  sim.player.xFp=176<<4; sim.player.yFp=120<<4; sim.npc.x=184; sim.npc.y=120; sim.npc.dir=1;
  sim.tick({RIGHT:true}); assert.equal(sim.player.knocked,48);
  sim.tick({}); assert.equal(sim.player.knocked,48);
});

// 12
test('ZS-M21-012','ManBox reverses at a platform edge after its even-frame move',()=>{
  const sim=new Simulation(makeDay6Stage('en',99),{seed:1});
  sim.player.xFp=0; sim.player.yFp=120<<4;
  sim.npc.x=171; sim.npc.y=64; sim.npc.dir=2; sim.npc.counter=0; sim.frameCnt=1;
  sim.tick({}); assert.equal(sim.npc.x,172); assert.equal(sim.npc.dir,1);
});

// 13
test('ZS-M21-013','ManBox right-edge exit re-enters inward with 50-tick wait and shared RNG floor choice',()=>{
  const sim=new Simulation(makeDay6Stage('en',99),{seed:1});
  sim.npc.x=247; sim.npc.y=120; sim.npc.dir=2; sim.npc.counter=0; sim.frameCnt=1;
  assert.equal(sim.rng.state,125); sim.tick({});
  assert.deepEqual({x:sim.npc.x,y:sim.npc.y,dir:sim.npc.dir,counter:sim.npc.counter},{x:248,y:120,dir:1,counter:50});
  assert.equal(sim.rng.state,250);
});

// 14
test('ZS-M21-014','ManBox left-edge exit selects one of the certified left floors and turns inward',()=>{
  const sim=new Simulation(makeDay6Stage('en',99),{seed:1});
  sim.npc.x=-7; sim.npc.y=120; sim.npc.dir=1; sim.npc.counter=0; sim.frameCnt=1;
  sim.tick({});
  assert.equal(sim.npc.x,-8); assert.equal(sim.npc.dir,2); assert.equal(sim.npc.counter,50);
  assert.ok([56,120,184].includes(sim.npc.y));
});

// 15
test('ZS-M21-015','Day 6 accepts and preserves Dream-derived miss allowance 3 or 5',()=>{
  for(const limit of [3,5]){const sim=new Simulation(makeDay6Stage('en',limit),{seed:1}); assert.equal(sim.missLimit,limit); assert.equal(sim.stage.missLimit,limit);}
});

// 16
test('ZS-M21-016','dynamic Day 6 loss threshold is enforced at 3 or 5 misses',()=>{
  for(const limit of [3,5]){
    const sim=new Simulation(makeDay6Stage('en',limit),{seed:1});
    sim.phones.callsMissed=limit-1; sim.phones.phones[0].level=PHONE.HEAT_3; sim.phones.phones[0].counter=0;
    const events=sim.tick({}); assert.equal(sim.phones.callsMissed,limit); assert.equal(sim.status,'LOST'); assert.ok(events.some(e=>e.type==='STAGE_LOST'));
  }
});

// 17
test('ZS-M21-017','Day 6 wins at 35 answered calls',()=>{
  const sim=new Simulation(makeDay6Stage('en',5),{seed:1}); sim.phones.callsCount=34;
  const p=sim.phones.phones[0]; p.level=PHONE.HEAT_1; p.counter=100; p.topic=0;
  sim.player.topic=0; sim.player.xFp=p.x<<4; sim.player.yFp=(p.y-8)<<4;
  const events=sim.tick({}); assert.equal(sim.phones.callsCount,35); assert.equal(sim.status,'WON'); assert.ok(events.some(e=>e.type==='STAGE_WON'));
});

// 18
test('ZS-M21-018','browser campaign connects Day 5 victory to Day 6 with inherited miss allowance',()=>{
  const app=fs.readFileSync(path.join(root,'web/app.js'),'utf8');
  assert.match(app,/makeDay6Stage/); assert.match(app,/const DAY6_STAGE=7/); assert.match(app,/pendingDay=DAY6_STAGE/); assert.match(app,/next6/);
  assert.match(app,/makeDay6Stage\(lang,futureMissLimit\)/); assert.match(app,/Continue to Day 6/); assert.match(app,/Continua al Giorno 6/);
});

// 19
test('ZS-M21-019','browser exposes ManBox feedback, Day 6 debug start and clean placeholder rendering',()=>{
  const app=fs.readFileSync(path.join(root,'web/app.js'),'utf8'); const renderer=fs.readFileSync(path.join(root,'web/renderer.js'),'utf8');
  assert.match(app,/e\.type==='KNOCK'/); assert.match(app,/startDay6/);
  assert.match(renderer,/manbox=n\.type==='manbox'/); assert.match(renderer,/c\.fillRect\(x,y\+7,16,14\)/); assert.doesNotMatch(renderer,/\.png|\.gif|tileset\.chr|label_/i);
});

// 20
test('ZS-M21-020','package is M21+ and Day 6 remains semantic-only',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')); { const [maj,min]=pkg.version.split('.').map(Number); assert.ok(maj>=1 || (maj===0 && min>=21), pkg.version); } assert.match(pkg.scripts.test,/run-m21-tests/);
  const src=fs.readFileSync(path.join(root,'data/stage-day6-data.js'),'utf8'); assert.match(src,/historical semantic stage data/i); assert.doesNotMatch(src,/map6_nam|0x59|0x5a|tileset\.chr/i);
});

const failed=results.filter(r=>!r.ok); const report={baseline:'Zooming Secretary M21 Day 6 playable',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m21-test-report.json'),JSON.stringify(report,null,2)+'\n'); console.log(`\n${report.passed}/${report.total} M21 tests passed`); if(failed.length)process.exit(1);
