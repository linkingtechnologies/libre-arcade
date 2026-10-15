import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Simulation } from '../src/simulation.js';
import { PHONE } from '../src/phone.js';
import { makeDay1Stage } from '../web/stage-day1.js';
import { makeDay2Stage } from '../web/stage-day2.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const sha=rel=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,rel))).digest('hex');
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log('PASS',id,name);}catch(error){results.push({id,name,ok:false,error:String(error?.stack||error)});console.error('FAIL',id,name,error);}}

const overlap1D=(a,aw,b,bw)=>!(b>=a+aw || b+bw<a);
function objectOverlap(sim,o,w=8,h=8){const px=sim.player.xFp>>4,py=sim.player.yFp>>4;return overlap1D(px,16,o.x,w)&&overlap1D(py,24,o.y,h);}
function nearestLadderX(sim,direction){
  const py=sim.player.yFp>>4, foot=py+23+(direction==='DOWN'?1:0), xs=[];
  for(let px=0;px<=240;px++) if(sim.stage.map.isLadderAt(px+6,foot)&&sim.stage.map.isLadderAt(px+9,foot)) xs.push(px);
  if(!xs.length) return null;
  const cur=sim.player.xFp>>4;
  return xs.reduce((a,b)=>Math.abs(b-cur)<Math.abs(a-cur)?b:a,xs[0]);
}
function navigate(sim,o,w=8,h=8){
  const px=sim.player.xFp>>4,py=sim.player.yFp>>4,ty=o.y-8;
  if(objectOverlap(sim,o,w,h)) return {};
  if(Math.abs(py-ty)>4){
    const dir=ty<py?'UP':'DOWN', lx=nearestLadderX(sim,dir);
    if(lx===null) return {};
    const foot=py+23+(dir==='DOWN'?1:0);
    const canClimb=sim.stage.map.isLadderAt(px+6,foot)&&sim.stage.map.isLadderAt(px+9,foot);
    if(!canClimb) return px<lx?{RIGHT:true}:{LEFT:true};
    return dir==='UP'?{UP:true}:{DOWN:true};
  }
  const pc=px+8,tc=o.x+Math.floor(w/2);
  if(pc<tc-2) return {RIGHT:true};
  if(pc>tc+2) return {LEFT:true};
  return {};
}
function reactiveDay1Input(sim){
  const ringing=sim.phones.phones.map((p,id)=>({p,id})).filter(x=>x.p.level!==PHONE.IDLE&&x.p.level!==PHONE.ANSWERED);
  if(!ringing.length) return {};
  ringing.sort((a,b)=>b.p.level-a.p.level||a.p.counter-b.p.counter);
  const r=ringing[0];
  if(!sim.player.wisdom&&sim.player.topic!==r.p.topic){const topic=sim.topics.find(t=>t.id===r.p.topic);if(topic)return navigate(sim,topic,12,8);}
  return navigate(sim,r.p,8,8);
}
function day2Input(sim){
  const ringing=sim.phones.phones.map((p,id)=>({p,id})).filter(x=>x.p.level!==PHONE.IDLE&&x.p.level!==PHONE.ANSWERED);
  if(ringing.length){
    ringing.sort((a,b)=>b.p.level-a.p.level||a.p.counter-b.p.counter);
    const r=ringing[0];
    if(!sim.player.wisdom&&sim.player.topic!==r.p.topic){const topic=sim.topics.find(t=>t.id===r.p.topic);if(topic)return navigate(sim,topic,12,8);}
    return navigate(sim,r.p,8,8);
  }
  const next=sim.phones.phones.map((p,id)=>({p,id})).filter(x=>x.p.level===PHONE.IDLE).sort((a,b)=>a.p.counter-b.p.counter)[0];
  return next?navigate(sim,next.p,8,8):{};
}
function runWithPolicy(stage,policy,maxTicks=20000){
  const sim=new Simulation(stage,{seed:1});
  const eventCounts={};
  while(sim.status==='PLAYING'&&sim.tickCount<maxTicks){
    for(const e of sim.tick(policy(sim))) eventCounts[e.type]=(eventCounts[e.type]||0)+1;
  }
  return {sim,eventCounts};
}

test('ZS-M29-001','package remains on 1.0.0 release-candidate line (rc.6 or later) and M29 suite is enabled',()=>{
  const pkg=JSON.parse(read('package.json')); const m=/^1\.0\.0-rc\.(\d+)$/.exec(pkg.version); assert.ok(m && Number(m[1])>=6,pkg.version);
  assert.match(pkg.scripts.test,/run-m29-tests/); assert.match(pkg.scripts['test:m29'],/run-m29-tests/);
});

test('ZS-M29-002','Day 1 is winnable by reactive input only with no teleport or state forcing',()=>{
  const {sim,eventCounts}=runWithPolicy(makeDay1Stage(),reactiveDay1Input,5000);
  assert.equal(sim.status,'WON'); assert.equal(sim.phones.callsCount,10); assert.equal(sim.phones.callsMissed,0);
  assert.equal(eventCounts.ANSWER,10); assert.ok((eventCounts.TOPIC||0)>=1); assert.ok(sim.tickCount<3000);
});

test('ZS-M29-003','Day 1 idle play loses naturally on the third missed call at certified ticks',()=>{
  const sim=new Simulation(makeDay1Stage(),{seed:1}),missTicks=[];
  while(sim.status==='PLAYING'&&sim.tickCount<5000){for(const e of sim.tick({}))if(e.type==='MISS')missTicks.push(sim.tickCount-1);}
  assert.equal(sim.status,'LOST'); assert.equal(sim.phones.callsMissed,3); assert.deepEqual(missTicks,[855,1107,1689]);
});

test('ZS-M29-004','Day 2 is completable by input-only navigation under the normal three-miss limit',()=>{
  const {sim,eventCounts}=runWithPolicy(makeDay2Stage(),day2Input,8000);
  assert.equal(sim.status,'WON'); assert.equal(sim.phones.callsCount,15); assert.ok(sim.phones.callsMissed<3);
  assert.equal(eventCounts.ANSWER,15); assert.ok((eventCounts.TOPIC||0)>=1);
});

test('ZS-M29-005','all 56 gameplay interaction positions are movement-reachable from their real stage spawns',()=>{
  const audit=JSON.parse(read('docs/m29-reachability-audit.json'));
  assert.equal(audit.totalTargets,56); assert.equal(audit.reachableTargets,56); assert.equal(audit.allReachable,true);
  assert.equal(audit.stages.length,8); for(const s of audit.stages) assert.equal(s.allReachable,true,s.stage);
});

test('ZS-M29-006','Dream movement topology reaches every table and the runaway phone location',()=>{
  const audit=JSON.parse(read('docs/m29-reachability-audit.json')); const dream=audit.stages.find(s=>s.stage==='Dream');
  assert.ok(dream); assert.equal(dream.targetCount,7); assert.equal(dream.reachableCount,7);
  for(const id of ['phone0','table0','table1','table2','table3','table4','table5']) assert.equal(dream.targets.find(t=>t.id===id)?.reachable,true,id);
});

test('ZS-M29-007','reachability audit uses real movement inputs and documents no coordinate teleport',()=>{
  const tool=read('tools/run-m29-reachability-audit.mjs'); const audit=JSON.parse(read('docs/m29-reachability-audit.json'));
  assert.match(tool,/tickPlayerMotion/); assert.match(tool,/BUTTON\.LEFT/); assert.match(tool,/BUTTON\.UP/);
  assert.match(audit.method,/No coordinate teleport or map mutation/);
});

test('ZS-M29-008','gameplay simulation and player movement remain byte-identical to M28',()=>{
  assert.equal(sha('src/player.js'),'a83dc581c96647f355734836f0a750b449cfa3c23d5f3b37aab1afeb2cd60ce9');
  assert.equal(sha('src/simulation.js'),'ae1e1fb10d34e5fdd2003ae7b41a4e13233f094cfff7548de59a9b4c4be17168');
});

test('ZS-M29-009','M28 renderer and verified procedural audio remain unchanged',()=>{
  assert.equal(sha('web/audio.js'),'8f428e9e2bb26e54517e5a1e60c280a82d6f93e716cd0b9314f8c6f9707f96a1');
  assert.equal(sha('web/renderer.js'),'df8b1e3529a928130dd19a79b375faa47732ba4ffed86bebadbfb248dcf4500d');
});

test('ZS-M29-010','M29 certification remains preserved in rc.6-or-later releases without gameplay/media scope drift',()=>{
  const v=read('VERSION.txt'); const m=/1\.0\.0-rc\.(\d+)/m.exec(v); assert.ok(m && Number(m[1])>=6,v);
  assert.ok(fs.existsSync(path.join(root,'docs/M29_REPORT.md')));
  assert.doesNotMatch(read('tools/run-m29-reachability-audit.mjs'),/\.xFp\s*=|\.yFp\s*=/);
});

const failed=results.filter(r=>!r.ok);
const report={baseline:'Zooming Secretary M29 real playability certification',version:'1.0.0-rc.6',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m29-test-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`\n${report.passed}/${report.total} M29 tests passed`); if(failed.length)process.exit(1);
