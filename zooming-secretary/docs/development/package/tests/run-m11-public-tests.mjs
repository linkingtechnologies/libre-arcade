/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { StageMap, StageDefinition, Simulation } from '../src/index.js';
const here=path.dirname(fileURLToPath(import.meta.url));
const v=JSON.parse(fs.readFileSync(path.join(here,'../fixtures/m11-shadow-vectors.json'),'utf8'));
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log(`PASS ${id} ${name}`)}catch(e){results.push({id,name,ok:false,error:e.stack||String(e)});console.error(`FAIL ${id} ${name}`);console.error(e.stack||e)}}
function stageFromVector(s){return new StageDefinition({
  name:s.stage,map:StageMap.empty(),targetCalls:s.targetCalls,topicsActive:s.topicsActive,callDelay:s.callDelay,
  spawn:s.spawn,phones:s.phones.map((p,id)=>({x:p.x,y:p.y,scanIndex:p.scanIndex,initDelay:s.bonus?25:(id<<8)})),
  topics:s.topics.map(t=>({x:t.x,y:t.y,id:t.id,scanIndex:t.scanIndex})),coffee:s.coffee,
  npc:s.npc?{type:s.npc.type,x:s.npc.x,y:s.npc.y,scanIndex:s.npc.scanIndex}:null,tables:s.tables,
  bonus:s.bonus,missLimit:255,sourceOrderedInit:true
})}

test('ZS-M11-P01','Certified ROM fingerprint is locked',()=>assert.equal(v.rom_sha256,'315adee10052367298959d55256e9f2621381da9f7c839f50832e13516b61770'));
test('ZS-M11-P02','Eight redacted map fingerprints are present',()=>{assert.equal(v.stages.length,8);for(const s of v.stages){assert.match(s.nametable_sha256,/^[0-9a-f]{64}$/);assert.match(s.collision_sha256,/^[0-9a-f]{64}$/)}});
test('ZS-M11-P03','Coffee corrections are exactly six +1px Y changes',()=>{assert.equal(v.m7_corrections.length,6);for(const d of v.m7_corrections){assert.equal(d.type,'coffee');assert.equal(d.field,'runtime_y');assert.equal(d.m11,d.m7+1)}});
test('ZS-M11-P04','Source-order initialization vectors reproduce for all stages',()=>{for(const s of v.stages){const sim=new Simulation(stageFromVector(s),{seed:1});const q=sim.snapshot();assert.equal(q.rng,s.rng_after_init,s.stage);assert.equal(q.phones.callDelay,s.call_delay_after_init,s.stage);assert.deepEqual(q.phones.phones.map(p=>p.counter),s.phones.map(p=>p.counter),s.stage);assert.deepEqual(q.phones.phones.map(p=>p.topic),s.phones.map(p=>p.topic),s.stage);assert.deepEqual(q.topics.map(t=>t.messageIndex),s.topics.map(t=>t.messageIndex),s.stage);if(s.npc)assert.equal(q.npc.dir,s.npc.effectiveDir,s.stage)}});
test('ZS-M11-P05','ROM offsets and compressed lengths are stable',()=>{const exp={'Day 1':[0x4ec1,424],'Day 2':[0x5069,475],'Day 3':[0x5244,515],'Day 4':[0x5447,454],'Day 5':[0x560d,496],'Day 6':[0x57fd,610],'Day 7':[0x5a5f,597],'Dream':[0x5cb4,558]};for(const s of v.stages)assert.deepEqual([s.prg_offset,s.compressed_len],exp[s.stage],s.stage)});
test('ZS-M11-P06','Initial ring ticks equal initialized counters',()=>{for(const s of v.stages)assert.deepEqual(s.first_ring_ticks,s.phones.map(p=>p.counter),s.stage)});
test('ZS-M11-P07','Normal first-miss ticks preserve +603 lifecycle',()=>{for(const s of v.stages.filter(s=>!s.bonus))assert.deepEqual(s.first_miss_ticks,s.phones.map(p=>p.counter+603),s.stage)});
test('ZS-M11-P08','Dream remains a non-miss bonus phone',()=>{const s=v.stages.find(s=>s.stage==='Dream');assert.equal(s.first_miss_ticks,null);assert.equal(s.phones.length,1);assert.equal(s.topicsActive,0)});
test('ZS-M11-P09','Side-floor metadata captures edge-accessible floors',()=>{const d6=v.stages.find(s=>s.stage==='Day 6');const d7=v.stages.find(s=>s.stage==='Day 7');assert.deepEqual(d6.sideFloors,{left:[56,120,184],right:[56,120,184]});assert.deepEqual(d7.sideFloors,d6.sideFloors)});
test('ZS-M11-P10','Source-order initialization is seed-sensitive and deterministic',()=>{const s=v.stages.find(s=>s.stage==='Day 7');const run=seed=>new Simulation(stageFromVector(s),{seed}).snapshot();assert.deepEqual(run(37),run(37));assert.notDeepEqual(run(37).phones.phones.map(p=>[p.counter,p.topic]),run(38).phones.phones.map(p=>[p.counter,p.topic]))});
const failed=results.filter(r=>!r.ok);const report={baseline:v.baseline,milestone:'M11-public',total:results.length,passed:results.length-failed.length,failed:failed.length,results};fs.writeFileSync(path.join(here,'../docs/m11-public-test-report.json'),JSON.stringify(report,null,2));console.log(`\n${report.passed}/${report.total} M11 public tests passed`);if(failed.length)process.exit(1);
