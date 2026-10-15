/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  StageMap, TILE, makeSyntheticOfficeMap, StageDefinition, stageFromBehaviorFixture,
  Simulation, InputState, BUTTON, makePlayer, tickPlayerMotion, DIR,
  processTopics, processCoffee, Rng8, PHONE
} from '../src/index.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const m9=JSON.parse(fs.readFileSync(path.join(here,'../fixtures/m9-vectors.json'),'utf8'));
const results=[];
function test(id,name,fn){
  try{fn(); results.push({id,name,ok:true}); console.log(`PASS ${id} ${name}`);}
  catch(e){results.push({id,name,ok:false,error:e.stack||String(e)});console.error(`FAIL ${id} ${name}`);console.error(e.stack||e);}
}

function basicStage(overrides={}){
  return new StageDefinition({
    name:'Synthetic Office', map:makeSyntheticOfficeMap(), targetCalls:1, topicsActive:2,
    callDelay:250, spawn:{x:16,y:80}, phones:[{x:80,y:80}],
    topics:[{x:40,y:80,id:0},{x:160,y:80,id:1}], coffee:{x:120,y:80},
    npc:null, tables:[], bonus:false, missLimit:3, ...overrides
  });
}

// M10-001 map coordinate contract
test('ZS-M10-001','Map origin and tile lookup',()=>{
  const m=StageMap.empty(); m.set(3,7,TILE.WALL); m.set(7,6,TILE.LADDER);
  assert.equal(m.atPixel(24,104),TILE.WALL);
  assert.equal(m.atPixel(56,96),TILE.LADDER);
  assert.equal(m.atPixel(24,40),m.get(3,0));
});

// M10-002 fall/land
test('ZS-M10-002','Player fall and landing',()=>{
  const m=StageMap.empty();
  for(let x=0;x<32;x++) m.set(x,10,TILE.WALL); // screen y=128
  const p=makePlayer(40,80); const input=new InputState().sample({});
  const ev=[]; tickPlayerMotion(p,m,input,ev);
  assert.equal(p.yFp,84<<4); assert.ok(ev.some(e=>e.type==='FALL_START'));
  for(let i=0;i<6;i++) tickPlayerMotion(p,m,input,[]);
  assert.ok((p.yFp>>4)>=104);
});

// M10-003 horizontal movement + wrap
test('ZS-M10-003','Horizontal movement and wrap',()=>{
  const m=makeSyntheticOfficeMap(); const p=makePlayer(239,80); p.speedFp=32;
  const input=new InputState().sample({RIGHT:true}); tickPlayerMotion(p,m,input,[]);
  assert.equal(p.xFp,0); assert.equal(p.dir,DIR.RIGHT);
  p.xFp=0; input.sample({LEFT:true}); tickPlayerMotion(p,m,input,[]);
  assert.equal(p.xFp,240<<4); assert.equal(p.dir,DIR.LEFT);
});

// M10-004 ladder acquisition
test('ZS-M10-004','Ladder acquisition and vertical motion',()=>{
  const m=makeSyntheticOfficeMap(); const p=makePlayer(50,80); p.speedFp=16;
  const input=new InputState().sample({UP:true}); tickPlayerMotion(p,m,input,[]);
  assert.equal(p.ladder,true); assert.equal(p.dir,DIR.UP); assert.equal(p.dirCountFp,16<<4);
  const y=p.yFp; tickPlayerMotion(p,m,input,[]); assert.ok(p.yFp<y || p.yFp>y+1000);
});

// M10-005 topic geometry
test('ZS-M10-005','Cabinet replaces single remembered topic',()=>{
  const p=makePlayer(35,80); p.topic=255;
  const ev=[]; processTopics(p,[{x:40,y:80,id:0}],ev);
  assert.equal(p.topic,0); assert.ok(ev.some(e=>e.type==='TOPIC'));
  p.xFp=155<<4; processTopics(p,[{x:160,y:80,id:1}],[]); assert.equal(p.topic,1);
});

// M10-006 wisdom blocks cabinet overwrite
test('ZS-M10-006','Wisdom blocks cabinet overwrite',()=>{
  const p=makePlayer(35,80); p.topic=1; p.wisdom=10;
  processTopics(p,[{x:40,y:80,id:0}],[]); assert.equal(p.topic,1);
});

// M10-007 coffee integrated timer/pickup
test('ZS-M10-007','Coffee ready and pickup in integrated core',()=>{
  const p=makePlayer(115,80); const coffee={x:120,y:80,wait:2};
  const e1=[]; processCoffee(p,coffee,e1); assert.equal(coffee.wait,1);
  const e2=[]; processCoffee(p,coffee,e2); assert.equal(coffee.wait,0);
  const e3=[]; processCoffee(p,coffee,e3); assert.equal(p.coffee,20); assert.equal(coffee.wait,1000);
});

// M10-008 correct phone answer completes stage
test('ZS-M10-008','Correct-topic phone answer completes stage',()=>{
  const sim=new Simulation(basicStage(),{seed:1});
  sim.player.xFp=75<<4; sim.player.yFp=80<<4; sim.player.topic=0;
  sim.phones.phones[0].level=PHONE.HEAT_1; sim.phones.phones[0].counter=100; sim.phones.phones[0].topic=0;
  const ev=sim.tick({});
  assert.equal(sim.phones.callsCount,1); assert.equal(sim.status,'WON');
  assert.ok(ev.some(e=>e.type==='STAGE_WON'));
});

// M10-009 wrong topic doesn't answer
test('ZS-M10-009','Wrong topic does not answer',()=>{
  const sim=new Simulation(basicStage(),{seed:1});
  sim.player.xFp=75<<4; sim.player.yFp=80<<4; sim.player.topic=1;
  sim.phones.phones[0].level=PHONE.HEAT_1; sim.phones.phones[0].counter=100; sim.phones.phones[0].topic=0;
  sim.tick({}); assert.equal(sim.phones.callsCount,0); assert.equal(sim.status,'PLAYING');
});

// M10-010 misses drive stage loss
test('ZS-M10-010','Miss limit drives stage loss',()=>{
  const sim=new Simulation(basicStage({missLimit:1}),{seed:1});
  sim.phones.phones[0].level=PHONE.HEAT_3; sim.phones.phones[0].counter=0; sim.phones.phones[0].topic=0;
  const ev=sim.tick({}); assert.equal(sim.phones.callsMissed,1); assert.equal(sim.status,'LOST');
  assert.ok(ev.some(e=>e.type==='STAGE_LOST'));
});

// M10-011 corrected by M11: NPC phase is after speed calculation in v1.02.
test('ZS-M10-011','Chief slowdown is latched for the following frame',()=>{
  const stage=basicStage({npc:{type:'chief',x:30,y:80}}); const sim=new Simulation(stage,{seed:1});
  sim.player.xFp=35<<4; sim.player.yFp=80<<4; sim.player.coffee=0;
  sim.tick({}); assert.equal(sim.player.slowdown,true); assert.equal(sim.player.speedTargetFp,24);
  sim.tick({}); assert.equal(sim.player.slowdown,true); assert.equal(sim.player.speedTargetFp,16);
});

// M10-012 Dream success path in simulation
test('ZS-M10-012','Dream forced wisdom answers phone',()=>{
  const stage=basicStage({
    name:'Dream',bonus:true,targetCalls:1,topicsActive:0,callDelay:0,missLimit:3,
    phones:[{x:80,y:80}],topics:[],coffee:null,npc:null,
    tables:[{x:24,y:80},{x:56,y:80},{x:88,y:80},{x:120,y:80},{x:152,y:80},{x:80,y:80}]
  });
  const sim=new Simulation(stage,{seed:1});
  sim.player.xFp=75<<4; sim.player.yFp=80<<4;
  sim.phones.phones[0].level=PHONE.HEAT_1; sim.phones.phones[0].counter=100;
  sim.tick({}); assert.equal(sim.status,'WON'); assert.ok(sim.player.wisdom>0);
});

// M10-013 Dream caught path
test('ZS-M10-013','Dream ghost catch ends as DREAM_CAUGHT',()=>{
  const stage=basicStage({
    name:'Dream',bonus:true,targetCalls:1,topicsActive:0,callDelay:0,phones:[{x:200,y:80}],topics:[],coffee:null,
    npc:{type:'ghost',x:16,y:240}, tables:[{x:200,y:80},{x:210,y:80},{x:220,y:80},{x:230,y:80},{x:240,y:80},{x:200,y:80}]
  });
  const sim=new Simulation(stage,{seed:1});
  sim.npc.wait=0; sim.npc.xFp=sim.player.xFp; sim.npc.yFp=sim.player.yFp; sim.npc.x=sim.player.xFp>>4; sim.npc.y=sim.player.yFp>>4;
  sim.tick({}); assert.equal(sim.status,'DREAM_CAUGHT'); assert.equal(sim.player.caught,true);
});

// M10-014 external original behavioral fixture can be wired without original map bytes
test('ZS-M10-014','Behavior fixture adapter keeps original entity coordinates external',()=>{
  const day1=m9.maps['Day 1']; const stage=stageFromBehaviorFixture({
    map:makeSyntheticOfficeMap(), stage:'Day 1', entities:day1.entities,
    targetCalls:10,topicsActive:2,callDelay:250
  });
  assert.equal(stage.spawn.x,120); assert.equal(stage.spawn.y,152);
  assert.equal(stage.phones.length,2); assert.deepEqual(stage.phones[0],{x:56,y:96});
});

// M10-015 deterministic full-core replay
test('ZS-M10-015','Full simulation deterministic replay',()=>{
  const stage=basicStage();
  function run(seed){
    const sim=new Simulation(stage,{seed}); const trace=[];
    for(let i=0;i<500 && sim.status==='PLAYING';i++){
      const input=i<40?{RIGHT:true}:i<80?{LEFT:true}:{};
      const ev=sim.tick(input);
      if(ev.length||i%25===0) trace.push(sim.snapshot());
    }
    return trace;
  }
  assert.deepEqual(run(23),run(23)); assert.notDeepEqual(run(23),run(24));
});

const failed=results.filter(r=>!r.ok);
const report={baseline:'Zooming Secretary NES v1.02',milestone:'M10',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(here,'../docs/m10-test-report.json'),JSON.stringify(report,null,2));
console.log(`\n${report.passed}/${report.total} M10 tests passed`);
if(failed.length) process.exit(1);
