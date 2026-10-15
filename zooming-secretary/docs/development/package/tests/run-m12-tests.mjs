/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Rng8, StageDefinition, StageMap, Simulation, PhoneSystem, PHONE,
  makeSyntheticOfficeMap, makePlayer, tickNpc, DIR, binaryFactoidIndex
} from '../src/index.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const vectors=JSON.parse(fs.readFileSync(path.join(here,'../docs/m12-runtime-vectors.json'),'utf8'));
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log(`PASS ${id} ${name}`)}catch(e){results.push({id,name,ok:false,error:e.stack||String(e)});console.error(`FAIL ${id} ${name}`);console.error(e.stack||e)}}
function advance(seed,n){const r=new Rng8(seed);for(let i=0;i<n;i++)r.rand8();return r.state}

// Binary-real cc65 quirk discovered by executing the certified ROM.
test('ZS-M12-001','Binary factoid modulo preserves stale-X cc65 behavior',()=>{
  assert.equal(binaryFactoidIndex(0x20,9),2); // 0x0620 % 9
  assert.equal(binaryFactoidIndex(0x40,9),7); // 0x0640 % 9
  assert.equal(binaryFactoidIndex(0xcf,9),6);
  assert.equal(binaryFactoidIndex(0x51,10),7);
});

test('ZS-M12-002','Binary-real initial factoid vectors are locked for all stages',()=>{
  assert.deepEqual(vectors.binary_factoid_init.map(x=>x.messageIndexByTopicId),[
    [2,7,0,0],[6,6,0,0],[1,5,0,0],[7,8,3,0],[0,0,0,0],[6,8,7,0],[8,6,0,17],[2,8,0,3]
  ]);
});

test('ZS-M12-003','Phone answer consumes reset RNG then factoid-advance RNG in source order',()=>{
  const st=new StageDefinition({name:'answer',map:makeSyntheticOfficeMap(),targetCalls:9,topicsActive:1,callDelay:250,spawn:{x:40,y:80},phones:[{x:40,y:96}],topics:[{x:200,y:200,id:0,messageIndex:2}],bonus:false,missLimit:9});
  const sim=new Simulation(st,{seed:1});
  sim.player.topic=0; Object.assign(sim.phones.phones[0],{level:PHONE.HEAT_1,counter:100,topic:0});
  const before=sim.rng.state; const r=new Rng8(before); r.rand8(); const second=r.rand8(); const expectedRng=r.state; const expectedMsg=(2+1+(second&3))%9;
  sim.tick({});
  assert.equal(sim.phones.callsCount,1); assert.equal(sim.phones.phones[0].counter,24);
  assert.equal(sim.rng.state,expectedRng); assert.equal(sim.topics[0].messageIndex,expectedMsg);
});

test('ZS-M12-004','Ring counter resets on RING_START exactly as ROM',()=>{
  const st=new StageDefinition({name:'ring',map:makeSyntheticOfficeMap(),targetCalls:9,topicsActive:1,callDelay:250,spawn:{x:40,y:80},phones:[{x:200,y:96}],topics:[],bonus:false,missLimit:9});
  const sim=new Simulation(st,{seed:1}); Object.assign(sim.phones.phones[0],{level:PHONE.IDLE,counter:0,topic:0}); sim.ringCnt=37;
  const e=sim.tick({}); assert.ok(e.some(x=>x.type==='RING_START')); assert.equal(sim.ringCnt,0);
});

test('ZS-M12-005','Chief speech bubble consumes two shared RNG values',()=>{
  const rng=new Rng8(37), expected=advance(37,2), player=makePlayer(90,80); const npc={type:'chief',x:100,y:80,dir:DIR.NONE,counter:0,wait:0,speed:0,dx:0,dy:0,ty:240};
  tickNpc(npc,player,StageMap.empty(),rng,1,2,[]); assert.equal(rng.state,expected); assert.equal(npc.counter,25); assert.equal(player.slowdown,true);
});

test('ZS-M12-006','Chief and Chatter visual-only choices still advance gameplay RNG',()=>{
  {const rng=new Rng8(5), player=makePlayer(0,0), npc={type:'chief',x:100,y:80,dir:DIR.NONE,counter:16,wait:0,speed:0,dx:0,dy:0,ty:240};tickNpc(npc,player,StageMap.empty(),rng,2,2,[]);assert.equal(rng.state,advance(5,1));assert.equal(npc.counter,15)}
  {const rng=new Rng8(7), player=makePlayer(0,0), npc={type:'chatter',x:100,y:80,dir:DIR.NONE,counter:32,wait:0,speed:0,dx:0,dy:0};tickNpc(npc,player,StageMap.empty(),rng,2,3,[]);assert.equal(rng.state,advance(7,1));assert.equal(npc.counter,31)}
});

test('ZS-M12-007','ManBox reverses on a missing post-step platform sample',()=>{
  const rng=new Rng8(1), player=makePlayer(0,56), npc={type:'manbox',x:91,y:120,dir:DIR.RIGHT,counter:0,wait:0,speed:0,dx:0,dy:0};
  tickNpc(npc,player,StageMap.empty(),rng,2,4,[],{left:[],right:[]}); assert.equal(npc.x,92); assert.equal(npc.dir,DIR.LEFT);
});

test('ZS-M12-008','Dibrov first wisdom contact consumes four RNG calls for two hearts',()=>{
  const rng=new Rng8(125), player=makePlayer(192,184), npc={type:'dibrov',x:200,y:184,dir:DIR.RIGHT,counter:0,wait:0,speed:1,dx:0,dy:0};
  tickNpc(npc,player,StageMap.empty(),rng,1,4,[],{left:[184],right:[184]}); assert.equal(player.wisdom,500); assert.equal(rng.state,advance(125,4));
});

test('ZS-M12-009','Non-bonus wisdom heart cadence consumes two RNG calls every eighth frame',()=>{
  const st=new StageDefinition({name:'wisdom',map:makeSyntheticOfficeMap(),targetCalls:99,topicsActive:1,callDelay:250,spawn:{x:40,y:80},phones:[],topics:[],bonus:false,missLimit:99});
  const sim=new Simulation(st,{seed:1}); sim.frameCnt=7; sim.player.wisdom=10; const before=sim.rng.state; sim.tick({}); assert.equal(sim.rng.state,advance(before,2)); assert.equal(sim.player.wisdom,9);
});

test('ZS-M12-010','Dream teleport raises runaway max before reloading cooldown',()=>{
  const tables=[{x:40,y:64},{x:80,y:64},{x:120,y:64},{x:40,y:128},{x:80,y:128},{x:176,y:192}];
  const st=new StageDefinition({name:'dream',map:StageMap.empty(),targetCalls:1,topicsActive:0,callDelay:0,spawn:{x:176,y:184},phones:[],topics:[],tables,bonus:true,missLimit:3});
  const sim=new Simulation(st,{seed:1}); sim.player.xFp=176<<4;sim.player.yFp=184<<4;sim.phoneRunaway=0;sim.processDreamRunaway(); assert.equal(sim.phoneRunawayMax,15);assert.equal(sim.phoneRunaway,15);assert.notEqual(sim.tableCurrent,5);
});

test('ZS-M12-011','Eight ROM-vs-JS natural runtime trace hashes are certified',()=>{
  assert.equal(vectors.natural_traces.length,8); const ticks=vectors.natural_traces.map(x=>x.ticks); assert.deepEqual(ticks,[64,64,64,64,200,64,64,64]);
  for(const x of vectors.natural_traces) assert.match(x.traceSha256,/^[0-9a-f]{64}$/);
});

test('ZS-M12-012','Runtime micro-suite and long phone lifecycle certificates are locked',()=>{
  assert.equal(vectors.micro_scenarios.length,14); for(const x of vectors.micro_scenarios) assert.match(x.finalStateSha256,/^[0-9a-f]{64}$/);
  const l=vectors.long_phone_lifecycle; assert.equal(l.ticks,900);assert.equal(l.callsMissed,1);assert.equal(l.rng,207);assert.equal(l.callDelay,220);assert.deepEqual(l.phoneLevels,[0,2]);assert.deepEqual(l.phoneTopics,[1,0]);
});

const failed=results.filter(r=>!r.ok);const report={baseline:vectors.baseline,milestone:'M12-public',total:results.length,passed:results.length-failed.length,failed:failed.length,results};fs.writeFileSync(path.join(here,'../docs/m12-public-test-report.json'),JSON.stringify(report,null,2));console.log(`\n${report.passed}/${report.total} M12 public tests passed`);if(failed.length)process.exit(1);
