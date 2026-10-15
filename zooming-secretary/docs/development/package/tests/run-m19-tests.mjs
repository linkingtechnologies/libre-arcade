/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { makeDreamMap, makeDreamStage, DREAM_ORACLE } from '../web/stage-dream.js';
import { Simulation } from '../src/simulation.js';
import { Campaign } from '../src/campaign.js';
import { PHONE } from '../src/phone.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log(`PASS ${id} ${name}`);}catch(e){results.push({id,name,ok:false,error:e.stack||String(e)});console.error(`FAIL ${id} ${name}\n${e.stack||e}`);}}
function mapSha(map){return crypto.createHash('sha256').update(Buffer.from(map.cells)).digest('hex');}

test('ZS-M19-001','Dream semantic collision topology matches certified oracle',()=>{
  const map=makeDreamMap(); assert.equal(map.cells.length,704); assert.equal(mapSha(map),DREAM_ORACLE.collisionSha256);
});

test('ZS-M19-002','Dream configuration preserves six tables, spawn and Ghost oracle',()=>{
  const s=makeDreamStage('en');
  assert.equal(s.name,'Dream'); assert.equal(s.targetCalls,1); assert.equal(s.topicsActive,0); assert.equal(s.callDelay,0); assert.equal(s.bonus,true);
  assert.deepEqual(s.spawn,{x:120,y:120,scanIndex:367});
  assert.deepEqual(s.npc,{type:'ghost',x:16,y:240,scanIndex:256});
  assert.deepEqual(s.tables.map(({x,y,scanIndex})=>({x,y,scanIndex})),[
    {x:72,y:64,scanIndex:73},{x:176,y:64,scanIndex:86},{x:72,y:128,scanIndex:329},
    {x:176,y:128,scanIndex:342},{x:72,y:192,scanIndex:585},{x:176,y:192,scanIndex:598}
  ]);
});

test('ZS-M19-003','binary-real Dream initialization matches M12/M11 oracle',()=>{
  const sim=new Simulation(makeDreamStage('en'),{seed:1});
  assert.equal(sim.rng.state,8); assert.equal(sim.phones.callDelay,0); assert.equal(sim.tableCurrent,5);
  assert.equal(sim.phoneRunaway,5); assert.equal(sim.phoneRunawayMax,5);
  assert.deepEqual(sim.phones.phones.map(p=>p.counter),[29]); assert.deepEqual(sim.phones.phones.map(p=>p.topic),[null]);
  assert.equal(sim.phones.phones[0].x,176); assert.equal(sim.phones.phones[0].y,192);
  assert.equal(sim.npc.type,'ghost'); assert.equal(sim.npc.x,16); assert.equal(sim.npc.y,240); assert.equal(sim.npc.counter,50); assert.equal(sim.npc.wait,150); assert.equal(sim.npc.dx,0); assert.equal(sim.npc.dy,0);
});

test('ZS-M19-004','Dream keeps the intentional modulo-zero safety divergence explicit',()=>{
  const sim=new Simulation(makeDreamStage('en'),{seed:1});
  assert.equal(sim.phones.phones[0].topic,null); assert.equal(sim.rng.state,8);
  assert.ok(!Number.isNaN(sim.phones.phones[0].topic));
});

test('ZS-M19-005','Dream side-floor discovery matches certified lower floor',()=>{
  assert.deepEqual(makeDreamMap().discoverSideFloors(),{left:[184],right:[184]});
});

test('ZS-M19-006','Dream phone starts ringing at certified tick 29 and never enters normal miss lifecycle',()=>{
  const sim=new Simulation(makeDreamStage('en'),{seed:1}); sim.npc=null; const rings=[];
  for(let i=0;i<900;i++) for(const e of sim.tick({})) if(e.type==='RING_START') rings.push({tick:i,id:e.id,topic:e.topic});
  assert.deepEqual(rings,[{tick:29,id:0,topic:null}]); assert.equal(sim.phones.callsMissed,0); assert.equal(sim.phones.phones[0].level,PHONE.HEAT_2);
});

test('ZS-M19-007','Dream forces wisdom continuously without cabinet interaction',()=>{
  const sim=new Simulation(makeDreamStage('en'),{seed:1});
  for(let i=0;i<20;i++){sim.tick({});assert.equal(sim.player.wisdom,99);assert.equal(sim.player.topic,255);}
});

test('ZS-M19-008','Ghost waits 150 ticks and then begins fixed-point pursuit',()=>{
  const sim=new Simulation(makeDreamStage('en'),{seed:1});
  for(let i=0;i<150;i++) sim.tick({}); assert.equal(sim.npc.wait,0); assert.equal(sim.npc.x,16); assert.equal(sim.npc.y,240);
  sim.tick({}); assert.ok(sim.npc.dy<0); assert.ok(sim.npc.yFp < (240<<4));
});

test('ZS-M19-009','200-tick natural Dream state matches the M12-certified evolution',()=>{
  const sim=new Simulation(makeDreamStage('en'),{seed:1}); for(let i=0;i<200;i++)sim.tick({});
  assert.equal(sim.status,'PLAYING'); assert.equal(sim.rng.state,8); assert.equal(sim.ringCnt,170); assert.equal(sim.player.wisdom,99);
  assert.equal(sim.phones.callsCount,0); assert.equal(sim.phones.callsMissed,0); assert.equal(sim.phones.phones[0].level,PHONE.HEAT_2);
  assert.deepEqual({x:sim.npc.x,y:sim.npc.y,dx:sim.npc.dx,dy:sim.npc.dy,counter:sim.npc.counter,wait:sim.npc.wait},{x:57,y:206,dx:16,dy:-12,counter:0,wait:0});
});

test('ZS-M19-010','Dream runaway cooldown starts at five and counts down source-order',()=>{
  const sim=new Simulation(makeDreamStage('en'),{seed:1}); for(let i=0;i<5;i++)sim.tick({}); assert.equal(sim.phoneRunaway,0); assert.equal(sim.tableCurrent,5);
});

test('ZS-M19-011','approaching the phone after cooldown emits teleport and raises cooldown 5→15',()=>{
  const sim=new Simulation(makeDreamStage('en'),{seed:1});
  sim.player.xFp=128<<4; sim.player.yFp=184<<4; sim.phoneRunaway=0;
  const events=sim.tick({}); const tele=events.find(e=>e.type==='PHONE_TELEPORT');
  assert.ok(tele); assert.equal(tele.table,4); assert.equal(sim.tableCurrent,4); assert.equal(sim.phoneRunawayMax,15); assert.equal(sim.phoneRunaway,15); assert.equal(sim.rng.state,16);
  assert.deepEqual({x:sim.phones.phones[0].x,y:sim.phones.phones[0].y},{x:72,y:192});
});

test('ZS-M19-012','real movement reaches the lower floor and triggers the runaway phone',()=>{
  const sim=new Simulation(makeDreamStage('en'),{seed:1});
  for(let i=0;i<60;i++)sim.tick({LEFT:true});
  for(let i=0;i<60;i++)sim.tick({DOWN:true});
  assert.equal(sim.player.yFp>>4,184);
  let tele=null; for(let i=0;i<100&&!tele&&sim.status==='PLAYING';i++)tele=sim.tick({RIGHT:true}).find(e=>e.type==='PHONE_TELEPORT')||null;
  assert.ok(tele); assert.equal(sim.tableCurrent,4); assert.equal(sim.player.xFp>>4,128);
});

test('ZS-M19-013','answering the ringing Dream phone wins immediately via forced wisdom',()=>{
  const sim=new Simulation(makeDreamStage('en'),{seed:1}); for(let i=0;i<30;i++)sim.tick({});
  sim.phoneRunaway=15; sim.player.xFp=176<<4; sim.player.yFp=184<<4;
  const events=sim.tick({}); assert.ok(events.some(e=>e.type==='ANSWER')); assert.ok(events.some(e=>e.type==='STAGE_WON'&&e.bonus));
  assert.equal(sim.phones.callsCount,1); assert.equal(sim.status,'WON'); assert.equal(sim.player.topic,255);
});

test('ZS-M19-014','Ghost contact ends Dream but is not a normal stage loss',()=>{
  const sim=new Simulation(makeDreamStage('en'),{seed:1}); sim.npc.wait=0; sim.npc.xFp=sim.player.xFp; sim.npc.yFp=sim.player.yFp; sim.npc.x=120; sim.npc.y=120;
  const events=sim.tick({}); assert.ok(events.some(e=>e.type==='GHOST_CAUGHT')); assert.ok(events.some(e=>e.type==='DREAM_CAUGHT'));
  assert.equal(sim.status,'DREAM_CAUGHT'); assert.equal(sim.phones.callsMissed,0);
});

test('ZS-M19-015','campaign semantics grant 5 misses on Dream success and keep 3 on catch',()=>{
  const win=new Campaign(); win.stage=4; const rw=win.resolve({won:true}); assert.equal(rw.advanced,true); assert.equal(rw.dreamBonus,true); assert.equal(win.stage,5); assert.equal(win.missLimit,5);
  const caught=new Campaign(); caught.stage=4; const rc=caught.resolve({caught:true}); assert.equal(rc.advanced,true); assert.equal(rc.dreamBonus,false); assert.equal(caught.stage,5); assert.equal(caught.missLimit,3);
});

test('ZS-M19-016','browser campaign wires Day 4 → Dream bilingually and exposes both outcomes',()=>{
  const app=fs.readFileSync(path.join(root,'web/app.js'),'utf8');
  assert.match(app,/makeDreamStage/); assert.match(app,/Enter the Dream/); assert.match(app,/Entra nel Sogno/); assert.match(app,/PHONE_TELEPORT/); assert.match(app,/DREAM_CAUGHT/);
  assert.match(app,/futureMissLimit=5/); assert.match(app,/futureMissLimit=3/); assert.match(app,/startDream/); assert.match(app,/dreamBonus/); assert.match(app,/dreamNoBonus/);
});

test('ZS-M19-017','renderer has new placeholder-only tables and Ghost treatment',()=>{
  const renderer=fs.readFileSync(path.join(root,'web/renderer.js'),'utf8');
  assert.match(renderer,/drawTables\(sim\)/); assert.match(renderer,/ghost=n\.type==='ghost'/); assert.match(renderer,/block-built ghost/);
  assert.doesNotMatch(renderer,/\.png|\.gif|tileset\.chr|label_/i);
});

test('ZS-M19-018','package is M19 and Dream remains semantic-only',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')); { const [maj,min]=pkg.version.split('.').map(Number); assert.ok(maj>=1 || (maj===0 && min>=19), pkg.version); } assert.match(pkg.scripts.test,/run-m19-tests/);
  const src=fs.readFileSync(path.join(root,'data/stage-dream-data.js'),'utf8'); assert.match(src,/historical semantic stage data/i); assert.doesNotMatch(src,/bonus_nam|0x59|0x5a|tileset\.chr/i);
});

test('ZS-M19-019','teleport event survives Simulation.tick event plumbing',()=>{
  const sim=new Simulation(makeDreamStage('en'),{seed:1}); sim.player.xFp=128<<4;sim.player.yFp=184<<4;sim.phoneRunaway=0;
  const events=sim.tick({}); assert.equal(events.filter(e=>e.type==='PHONE_TELEPORT').length,1); assert.equal(sim.events.filter(e=>e.type==='PHONE_TELEPORT').length,1);
});

const failed=results.filter(r=>!r.ok); const report={baseline:'Zooming Secretary M19 Dream playable',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m19-test-report.json'),JSON.stringify(report,null,2)+'\n'); console.log(`\n${report.passed}/${report.total} M19 tests passed`); if(failed.length)process.exit(1);
