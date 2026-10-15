/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { makeDay5Map, makeDay5Stage, DAY5_ORACLE } from '../web/stage-day5.js';
import { Simulation } from '../src/simulation.js';
import { PHONE } from '../src/phone.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log(`PASS ${id} ${name}`);}catch(e){results.push({id,name,ok:false,error:e.stack||String(e)});console.error(`FAIL ${id} ${name}\n${e.stack||e}`);}}
function mapSha(map){return crypto.createHash('sha256').update(Buffer.from(map.cells)).digest('hex');}

// 1
test('ZS-M20-001','Day 5 semantic collision topology matches certified oracle',()=>{
  const map=makeDay5Map(); assert.equal(map.cells.length,704); assert.equal(mapSha(map),DAY5_ORACLE.collisionSha256);
});

// 2
test('ZS-M20-002','Day 5 stage configuration has 30 calls, four topics, three phones, coffee and Geek',()=>{
  const s=makeDay5Stage('en');
  assert.equal(s.name,'Day 5'); assert.equal(s.targetCalls,30); assert.equal(s.topicsActive,4); assert.equal(s.callDelay,275); assert.equal(s.missLimit,3);
  assert.equal(s.phones.length,3); assert.equal(s.topics.length,4); assert.equal(s.npc.type,'geek'); assert.ok(s.coffee); assert.equal(s.bonus,false);
});

// 3
test('ZS-M20-003','binary-real Day 5 initialization matches M12/M11 oracle',()=>{
  const sim=new Simulation(makeDay5Stage('en'),{seed:1});
  assert.equal(sim.rng.state,139); assert.equal(sim.phones.callDelay,245);
  assert.deepEqual(sim.phones.phones.map(p=>p.counter),[283,553,801]);
  assert.deepEqual(sim.phones.phones.map(p=>p.topic),[0,0,3]);
  assert.deepEqual(sim.topics.map(t=>t.messageIndex),[8,0,6,7]);
  assert.deepEqual({type:sim.npc.type,x:sim.npc.x,y:sim.npc.y,dir:sim.npc.dir},{type:'geek',x:216,y:120,dir:2});
});

// 4
test('ZS-M20-004','Day 5 side-floor discovery matches certified two accessible floors',()=>{
  assert.deepEqual(makeDay5Map().discoverSideFloors(),{left:[120,184],right:[120,184]});
});

// 5
test('ZS-M20-005','Day 5 phone initial ring ticks preserve source ordering',()=>{
  const sim=new Simulation(makeDay5Stage('en',99),{seed:1}); const rings=[];
  for(let t=0;t<820;t++) for(const e of sim.tick({})) if(e.type==='RING_START') rings.push({tick:t,id:e.id,topic:e.topic});
  assert.deepEqual(rings,[{tick:283,id:0,topic:0},{tick:553,id:1,topic:0},{tick:801,id:2,topic:3}]);
});

// 6
test('ZS-M20-006','all four cabinet topics and certified coordinates are present',()=>{
  const s=makeDay5Stage('en');
  assert.deepEqual(s.topics.map(({id,x,y})=>({id,x,y})),[
    {id:1,x:46,y:80},{id:3,x:190,y:80},{id:0,x:14,y:192},{id:2,x:222,y:192}
  ]);
  assert.deepEqual([...s.topics.map(t=>t.id)].sort((a,b)=>a-b),[0,1,2,3]);
});

// 7
test('ZS-M20-007','coffee uses corrected source Y and is initially unavailable for 150 ticks',()=>{
  const sim=new Simulation(makeDay5Stage('en'),{seed:1});
  assert.deepEqual({x:sim.coffee.x,y:sim.coffee.y,wait:sim.coffee.wait},{x:88,y:193,wait:150});
});

// 8
test('ZS-M20-008','real movement reaches Day 5 coffee and activates the full boost',()=>{
  const sim=new Simulation(makeDay5Stage('en'),{seed:1});
  for(let i=0;i<20;i++)sim.tick({RIGHT:true});
  for(let i=0;i<70;i++)sim.tick({DOWN:true});
  for(let i=0;i<25;i++)sim.tick({RIGHT:true});
  assert.deepEqual({x:sim.player.xFp>>4,y:sim.player.yFp>>4},{x:89,y:184});
  for(let i=0;i<35;i++)sim.tick({}); assert.equal(sim.coffee.wait,0); assert.equal(sim.player.coffee,0);
  const events=sim.tick({}); assert.ok(events.some(e=>e.type==='COFFEE_PICKUP')); assert.equal(sim.player.coffee,20); assert.equal(sim.player.speedTargetFp,34);
});

// 9
test('ZS-M20-009','real movement uses lower central wrap route to reach Space cabinet on upper floor',()=>{
  const sim=new Simulation(makeDay5Stage('en'),{seed:1});
  for(let i=0;i<20;i++)sim.tick({RIGHT:true});
  for(let i=0;i<70;i++)sim.tick({DOWN:true});
  for(let i=0;i<45;i++)sim.tick({RIGHT:true});
  for(let i=0;i<90;i++)sim.tick({DOWN:true});
  assert.equal(sim.player.yFp>>4,72);
  for(let i=0;i<50;i++)sim.tick({RIGHT:true});
  assert.equal(sim.player.topic,3); assert.ok((sim.player.xFp>>4)>=188);
});

// 10
test('ZS-M20-010','Geek moves one pixel every two gameplay ticks',()=>{
  const sim=new Simulation(makeDay5Stage('en'),{seed:1});
  assert.equal(sim.npc.x,216); sim.tick({}); assert.equal(sim.npc.x,216); sim.tick({}); assert.equal(sim.npc.x,217);
});

// 11
test('ZS-M20-011','Geek physically blocks an approaching player and backs away on odd frame',()=>{
  const sim=new Simulation(makeDay5Stage('en'),{seed:1});
  sim.player.xFp=208<<4; sim.player.yFp=120<<4; sim.player.dir=2;
  sim.npc.x=216; sim.npc.y=120; sim.npc.dir=1;
  sim.tick({RIGHT:true});
  assert.equal(sim.player.xFp>>4,208); assert.equal(sim.npc.x,217);
});

// 12
test('ZS-M20-012','Geek decorative hearts preserve two shared RNG consumptions every 32 frames',()=>{
  const sim=new Simulation(makeDay5Stage('en'),{seed:1});
  sim.player.xFp=180<<4; sim.player.yFp=120<<4; sim.npc.x=216; sim.npc.y=120; sim.npc.dir=1; sim.frameCnt=31;
  assert.equal(sim.rng.state,139); sim.tick({}); assert.equal(sim.frameCnt,32); assert.equal(sim.rng.state,125);
});

// 13
test('ZS-M20-013','Day 5 factory accepts Dream failure miss allowance 3',()=>{
  const sim=new Simulation(makeDay5Stage('en',3),{seed:1}); assert.equal(sim.missLimit,3); assert.equal(sim.stage.missLimit,3);
});

// 14
test('ZS-M20-014','Day 5 factory accepts Dream success miss allowance 5',()=>{
  const sim=new Simulation(makeDay5Stage('en',5),{seed:1}); assert.equal(sim.missLimit,5); assert.equal(sim.stage.missLimit,5);
});

// 15
test('ZS-M20-015','dynamic Day 5 loss threshold is enforced at 3 or 5 misses',()=>{
  for(const limit of [3,5]){
    const sim=new Simulation(makeDay5Stage('en',limit),{seed:1});
    sim.phones.callsMissed=limit-1; sim.phones.phones[0].level=PHONE.HEAT_3; sim.phones.phones[0].counter=0;
    const events=sim.tick({}); assert.equal(sim.phones.callsMissed,limit); assert.equal(sim.status,'LOST'); assert.ok(events.some(e=>e.type==='STAGE_LOST'));
  }
});

// 16
test('ZS-M20-016','Day 5 wins at 30 answered calls',()=>{
  const sim=new Simulation(makeDay5Stage('en',5),{seed:1}); sim.phones.callsCount=29;
  const p=sim.phones.phones[0]; p.level=PHONE.HEAT_1; p.counter=100; p.topic=0;
  sim.player.topic=0; sim.player.xFp=p.x<<4; sim.player.yFp=(p.y-8)<<4;
  const events=sim.tick({}); assert.equal(sim.phones.callsCount,30); assert.equal(sim.status,'WON'); assert.ok(events.some(e=>e.type==='STAGE_WON'));
});

// 17
test('ZS-M20-017','browser campaign connects both Dream outcomes to Day 5',()=>{
  const app=fs.readFileSync(path.join(root,'web/app.js'),'utf8');
  assert.match(app,/makeDay5Stage/); assert.match(app,/const DAY5_STAGE=6/); assert.match(app,/pendingDay=DAY5_STAGE/); assert.match(app,/next5/);
  assert.match(app,/futureMissLimit=5/); assert.match(app,/futureMissLimit=3/); assert.match(app,/Continue to Day 5/); assert.match(app,/Continua al Giorno 5/);
});

// 18
test('ZS-M20-018','browser passes the Dream-derived miss allowance into Day 5 and exposes it in the intro',()=>{
  const app=fs.readFileSync(path.join(root,'web/app.js'),'utf8');
  assert.match(app,/makeDay5Stage\(lang,futureMissLimit\)/); assert.match(app,/strings\.allowance/); assert.match(app,/startDay5/);
});

// 19
test('ZS-M20-019','renderer contains a new placeholder-only Geek treatment and four-topic HUD support',()=>{
  const renderer=fs.readFileSync(path.join(root,'web/renderer.js'),'utf8');
  assert.match(renderer,/geek=n\.type==='geek'/); assert.match(renderer,/drawTopicGlyph/); assert.match(renderer,/\['earth', 'history', 'books', 'space'\]/);
  assert.doesNotMatch(renderer,/\.png|\.gif|tileset\.chr|label_/i);
});

// 20
test('ZS-M20-020','package is M20+ and Day 5 remains semantic-only',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')); { const [maj,min]=pkg.version.split('.').map(Number); assert.ok(maj>=1 || (maj===0 && min>=20), pkg.version); } assert.match(pkg.scripts.test,/run-m20-tests/);
  const src=fs.readFileSync(path.join(root,'data/stage-day5-data.js'),'utf8'); assert.match(src,/historical semantic stage data/i); assert.doesNotMatch(src,/map5_nam|0x59|0x5a|tileset\.chr/i);
});

const failed=results.filter(r=>!r.ok); const report={baseline:'Zooming Secretary M20 Day 5 playable',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m20-test-report.json'),JSON.stringify(report,null,2)+'\n'); console.log(`\n${report.passed}/${report.total} M20 tests passed`); if(failed.length)process.exit(1);
