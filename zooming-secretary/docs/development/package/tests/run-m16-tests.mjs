/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { makeDay2Map, makeDay2Stage, DAY2_ORACLE } from '../web/stage-day2.js';
import { Simulation } from '../src/simulation.js';
import { PHONE } from '../src/phone.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log(`PASS ${id} ${name}`);}catch(e){results.push({id,name,ok:false,error:e.stack||String(e)});console.error(`FAIL ${id} ${name}\n${e.stack||e}`);}}
function mapSha(map){return crypto.createHash('sha256').update(Buffer.from(map.cells)).digest('hex');}

test('ZS-M16-001','Day 2 semantic collision topology matches certified oracle',()=>{
  const map=makeDay2Map();
  assert.equal(map.cells.length,704);
  assert.equal(mapSha(map),DAY2_ORACLE.collisionSha256);
});

test('ZS-M16-002','Day 2 configuration matches v1.02 oracle',()=>{
  const s=makeDay2Stage('en');
  assert.equal(s.name,'Day 2');
  assert.equal(s.targetCalls,15);
  assert.equal(s.topicsActive,2);
  assert.equal(s.callDelay,250);
  assert.equal(s.missLimit,3);
  assert.deepEqual(s.spawn,{x:16,y:120,scanIndex:354});
  assert.deepEqual(s.coffee,{x:56,y:65,scanIndex:71});
  assert.deepEqual(s.npc,{type:'chief',x:224,y:120,scanIndex:380});
});

test('ZS-M16-003','Day 2 three phones and two cabinets preserve scan order',()=>{
  const s=makeDay2Stage('en');
  assert.deepEqual(s.phones.map(({x,y,scanIndex})=>({x,y,scanIndex})),[
    {x:192,y:64,scanIndex:88},{x:56,y:128,scanIndex:327},{x:192,y:128,scanIndex:344}
  ]);
  assert.deepEqual(s.topics.map(({id,x,y,scanIndex})=>({id,x,y,scanIndex})),[
    {id:0,x:62,y:192,scanIndex:488},{id:1,x:174,y:192,scanIndex:502}
  ]);
  assert.equal(s.sourceOrderedInit,true);
});

test('ZS-M16-004','binary-real Day 2 initialization matches M12',()=>{
  const sim=new Simulation(makeDay2Stage('en'),{seed:1});
  assert.equal(sim.rng.state,81);
  assert.equal(sim.phones.callDelay,220);
  assert.deepEqual(sim.phones.phones.map(p=>p.counter),[252,504,774]);
  assert.deepEqual(sim.phones.phones.map(p=>p.topic),[0,0,0]);
  assert.deepEqual(sim.topics.map(t=>t.messageIndex),[6,6]);
  assert.equal(sim.npc.type,'chief');
  assert.equal(sim.npc.dir,0);
});

test('ZS-M16-005','Day 2 side floors match certified three-floor topology',()=>{
  assert.deepEqual(makeDay2Map().discoverSideFloors(),{left:[56,120,184],right:[56,120,184]});
});

test('ZS-M16-006','first three phone rings occur at certified ticks',()=>{
  const sim=new Simulation(makeDay2Stage('en'),{seed:1});
  const rings=[];
  for(let i=0;i<900 && rings.length<3;i++){
    for(const e of sim.tick({})) if(e.type==='RING_START') rings.push({id:e.id,tick:i});
  }
  assert.deepEqual(rings,[{id:0,tick:252},{id:1,tick:504},{id:2,tick:774}]);
});

test('ZS-M16-007','coffee ready timing and pickup boost are active in Day 2',()=>{
  const sim=new Simulation(makeDay2Stage('en'),{seed:1});
  let readyTick=null;
  for(let i=0;i<150;i++){
    const events=sim.tick({});
    if(events.some(e=>e.type==='COFFEE_READY')) readyTick=i;
  }
  assert.equal(readyTick,133);
  assert.equal(sim.coffee.wait,0);
  sim.player.xFp=42<<4; sim.player.yFp=56<<4;
  const events=sim.tick({});
  assert.ok(events.some(e=>e.type==='COFFEE_PICKUP'));
  assert.equal(sim.player.coffee,20);
  assert.equal(sim.coffee.wait,1000);
  assert.equal(sim.player.speedTargetFp,34);
});

test('ZS-M16-008','Chief slowdown follows v1.02 one-frame source ordering',()=>{
  const sim=new Simulation(makeDay2Stage('en'),{seed:1});
  sim.player.xFp=205<<4; sim.player.yFp=120<<4;
  sim.player.speedFp=24; sim.player.speedTargetFp=24;
  sim.tick({});
  assert.equal(sim.player.slowdown,true);
  assert.equal(sim.player.speedTargetFp,24);
  sim.tick({});
  assert.equal(sim.player.speedTargetFp,16);
  assert.equal(sim.player.speedFp,23);
});

test('ZS-M16-009','real movement can climb to and collect Day 2 coffee',()=>{
  const sim=new Simulation(makeDay2Stage('en'),{seed:1});
  for(let i=0;i<43;i++) sim.tick({RIGHT:true});
  for(let i=0;i<60;i++) sim.tick({UP:true});
  for(let i=0;i<25;i++) sim.tick({LEFT:true});
  for(let i=0;i<30;i++) sim.tick({});
  let picked=false;
  for(let i=0;i<20;i++){
    const events=sim.tick({RIGHT:true});
    if(events.some(e=>e.type==='COFFEE_PICKUP')){picked=true;break;}
  }
  assert.equal(picked,true);
  assert.equal(sim.player.yFp>>4,56);
  assert.equal(sim.player.coffee,20);
});

test('ZS-M16-010','15 valid answers win Day 2 and three misses lose it',()=>{
  const win=new Simulation(makeDay2Stage('en'),{seed:1});
  for(let n=0;n<15;n++){
    const p=win.phones.phones[n%3];
    p.level=PHONE.HEAT_1;p.counter=100;p.topic=n&1;
    win.player.topic=p.topic;win.player.xFp=p.x<<4;win.player.yFp=(p.y-16)<<4;
    win.tick({});
  }
  assert.equal(win.phones.callsCount,15);assert.equal(win.status,'WON');

  const lose=new Simulation(makeDay2Stage('en'),{seed:1});
  for(let n=0;n<3;n++){
    const p=lose.phones.phones[n];p.level=PHONE.HEAT_3;p.counter=0;lose.tick({});
  }
  assert.equal(lose.phones.callsMissed,3);assert.equal(lose.status,'LOST');
});

test('ZS-M16-011','browser campaign wires Day 1 to Day 2 and surfaces coffee events',()=>{
  const app=fs.readFileSync(path.join(root,'web/app.js'),'utf8');
  assert.match(app,/makeDay1Stage/);assert.match(app,/makeDay2Stage/);
  assert.match(app,/Continue to Day 2/);assert.match(app,/Continua al Giorno 2/);
  assert.match(app,/COFFEE_READY/);assert.match(app,/COFFEE_PICKUP/);
  assert.match(app,/The Chief slows you/);assert.match(app,/Il Capo ti rallenta/);
});

test('ZS-M16-012','renderer exposes Chief proximity and coffee boost without original art',()=>{
  const renderer=fs.readFileSync(path.join(root,'web/renderer.js'),'utf8');
  assert.match(renderer,/chief=n\.type==='chief'/);
  assert.match(renderer,/sim\.player\.slowdown/);
  assert.match(renderer,/sim\.player\.coffee/);
  assert.doesNotMatch(renderer,/\.png|\.gif|tileset\.chr|label_/i);
});

test('ZS-M16-013','Day 2 distributable is semantic reconstruction only',()=>{
  const src=fs.readFileSync(path.join(root,'data/stage-day2-data.js'),'utf8');
  assert.match(src,/historical semantic stage data/i);
  assert.match(src,/fill\(map,4,0,9,TILE\.WALL\)/);
  assert.doesNotMatch(src,/map2_nam|0x59|0x5a|tileset\.chr/i);
});

test('ZS-M16-014','package is M16 and full archaeology policy regression remains enabled',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  { const [maj,min]=pkg.version.split('.').map(Number); assert.ok(maj>=1 || (maj===0 && min>=16), pkg.version); }
  assert.match(pkg.scripts.test,/run-m13-policy-tests/);
  assert.match(pkg.scripts.test,/run-m15-tests/);
  assert.match(pkg.scripts.test,/run-m16-tests/);
});

const failed=results.filter(r=>!r.ok);
const report={baseline:'Zooming Secretary M16 Day 2 playable',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m16-test-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`\n${report.passed}/${report.total} M16 tests passed`);
if(failed.length)process.exit(1);
