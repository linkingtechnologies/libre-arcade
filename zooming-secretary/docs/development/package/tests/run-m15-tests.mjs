/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { makeDay1Map, makeDay1Stage, DAY1_ORACLE } from '../web/stage-day1.js';
import { Simulation } from '../src/simulation.js';
import { PHONE } from '../src/phone.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log(`PASS ${id} ${name}`);}catch(e){results.push({id,name,ok:false,error:e.stack||String(e)});console.error(`FAIL ${id} ${name}\n${e.stack||e}`);}}

function mapSha(map){return crypto.createHash('sha256').update(Buffer.from(map.cells)).digest('hex');}

test('ZS-M15-001','Day 1 semantic collision topology matches certified oracle',()=>{
  const map=makeDay1Map();
  assert.equal(map.cells.length,704);
  assert.equal(mapSha(map),DAY1_ORACLE.collisionSha256);
});

test('ZS-M15-002','Day 1 gameplay configuration matches v1.02 oracle',()=>{
  const s=makeDay1Stage('en');
  assert.equal(s.name,'Day 1');
  assert.equal(s.targetCalls,10);
  assert.equal(s.topicsActive,2);
  assert.equal(s.callDelay,250);
  assert.equal(s.missLimit,3);
  assert.deepEqual(s.spawn,{x:120,y:152,scanIndex:495});
  assert.equal(s.npc,null);
  assert.equal(s.coffee,null);
});

test('ZS-M15-003','Day 1 entity positions and scan order are certified',()=>{
  const s=makeDay1Stage('en');
  assert.deepEqual(s.phones.map(({x,y,scanIndex})=>({x,y,scanIndex})),[
    {x:56,y:96,scanIndex:199},{x:192,y:96,scanIndex:216}
  ]);
  assert.deepEqual(s.topics.map(({id,x,y,scanIndex})=>({id,x,y,scanIndex})),[
    {id:0,x:46,y:160,scanIndex:358},{id:1,x:190,y:160,scanIndex:376}
  ]);
  assert.equal(s.sourceOrderedInit,true);
});

test('ZS-M15-004','binary-real Day 1 initialization matches M12',()=>{
  const sim=new Simulation(makeDay1Stage('en'),{seed:1});
  assert.equal(sim.rng.state,64);
  assert.equal(sim.phones.callDelay,230);
  assert.deepEqual(sim.phones.phones.map(p=>p.counter),[252,504]);
  assert.deepEqual(sim.phones.phones.map(p=>p.topic),[0,0]);
  assert.deepEqual(sim.topics.map(t=>t.messageIndex),[2,7]);
});

test('ZS-M15-005','Day 1 side floor discovery matches oracle',()=>{
  const f=makeDay1Map().discoverSideFloors();
  assert.deepEqual(f,{left:[152],right:[152]});
});

test('ZS-M15-006','Day 1 natural 900-tick phone lifecycle matches M12',()=>{
  const sim=new Simulation(makeDay1Stage('en'),{seed:1});
  for(let i=0;i<900;i++) sim.tick({});
  assert.equal(sim.phones.callsMissed,1);
  assert.equal(sim.rng.state,207);
  assert.equal(sim.phones.callDelay,220);
  assert.deepEqual(sim.phones.phones.map(p=>p.counter),[186,6]);
  assert.deepEqual(sim.phones.phones.map(p=>p.level),[0,2]);
  assert.deepEqual(sim.phones.phones.map(p=>p.topic),[1,0]);
  assert.equal(sim.ringCnt,395);
});

test('ZS-M15-007','first ring tick is preserved on the playable stage',()=>{
  const sim=new Simulation(makeDay1Stage('en'),{seed:1});
  let ringTick=null;
  for(let i=0;i<300;i++){
    const events=sim.tick({});
    if(events.some(e=>e.type==='RING_START')){ringTick=i;break;}
  }
  assert.equal(ringTick,252);
});

test('ZS-M15-008','forced valid answers can complete Day 1 at exactly 10 calls',()=>{
  const sim=new Simulation(makeDay1Stage('en'),{seed:1});
  for(let n=0;n<10;n++){
    const p=sim.phones.phones[0];
    p.level=PHONE.HEAT_1; p.counter=100; p.topic=n&1;
    sim.player.topic=p.topic;
    sim.player.xFp=p.x<<4; sim.player.yFp=(p.y-16)<<4;
    sim.tick({});
  }
  assert.equal(sim.phones.callsCount,10);
  assert.equal(sim.status,'WON');
});

test('ZS-M15-009','three forced missed calls lose Day 1',()=>{
  const sim=new Simulation(makeDay1Stage('en'),{seed:1});
  for(let n=0;n<3;n++){
    const p=sim.phones.phones[0];
    p.level=PHONE.HEAT_3; p.counter=0;
    sim.tick({});
  }
  assert.equal(sim.phones.callsMissed,3);
  assert.equal(sim.status,'LOST');
});

test('ZS-M15-010','browser shell uses Day 1 rather than synthetic training as main stage',()=>{
  const app=fs.readFileSync(path.join(root,'web/app.js'),'utf8');
  assert.match(app,/makeDay1Stage/);
  assert.doesNotMatch(app,/makeTrainingStage/);
  assert.match(app,/Answer 10 calls before 3 are missed/);
  assert.match(app,/Rispondi a 10 chiamate prima di perderne 3/);
});

test('ZS-M15-011','Day 1 distributable contains semantic reconstruction, not original map/media files',()=>{
  const src=fs.readFileSync(path.join(root,'data/stage-day1-data.js'),'utf8');
  assert.match(src,/historical semantic stage data/i);
  assert.match(src,/for \(let col=0; col<32; col\+\+\)/);
  assert.doesNotMatch(src,/map1_nam|bonus_nam|tileset\.chr/i);
});

test('ZS-M15-012','package is M15 and keeps original-media policy tests enabled',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  { const [maj,min]=pkg.version.split('.').map(Number); assert.ok(maj>=1 || (maj===0 && min>=15), pkg.version); }
  assert.match(pkg.scripts.test,/run-m13-policy-tests/);
  assert.match(pkg.scripts.test,/run-m15-tests/);
});


test('ZS-M15-013','real movement reaches Earth cabinet on the lower floor',()=>{
  const sim=new Simulation(makeDay1Stage('en'),{seed:1});
  let picked=false;
  for(let i=0;i<80;i++){
    const events=sim.tick({LEFT:true});
    if(events.some(e=>e.type==='TOPIC' && e.topic===0)){picked=true;break;}
  }
  assert.equal(picked,true);
  assert.equal(sim.player.topic,0);
});

test('ZS-M15-014','real movement climbs the left ladder and can reach the upper phone',()=>{
  const sim=new Simulation(makeDay1Stage('en'),{seed:1});
  for(let i=0;i<30;i++) sim.tick({LEFT:true});
  for(let i=0;i<80;i++) sim.tick({UP:true});
  assert.equal(sim.player.yFp>>4,88);
  let reached=false;
  const p=sim.phones.phones[0];
  for(let i=0;i<20;i++){
    sim.tick({LEFT:true});
    const x=sim.player.xFp>>4, y=sim.player.yFp>>4;
    if(!(p.x>=x+16 || p.x+8<x || p.y>=y+24 || p.y+8<y)){reached=true;break;}
  }
  assert.equal(reached,true);
});

const failed=results.filter(r=>!r.ok);
const report={baseline:'Zooming Secretary M15 Day 1 playable',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m15-test-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`\n${report.passed}/${report.total} M15 tests passed`);
if(failed.length) process.exit(1);
