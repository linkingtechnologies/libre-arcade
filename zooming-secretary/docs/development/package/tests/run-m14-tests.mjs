/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeTrainingStage } from '../web/stage-synthetic.js';
import { FixedStepClock } from '../web/scheduler.js';
import { Simulation } from '../src/simulation.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log(`PASS ${id} ${name}`);}catch(e){results.push({id,name,ok:false,error:e.stack});console.error(`FAIL ${id} ${name}\n${e.stack}`);}}

test('ZS-M14-001','training stage is synthetic and valid',()=>{
  const stage=makeTrainingStage('en');
  assert.equal(stage.map.cells.length,704);
  assert.equal(stage.targetCalls,2);
  assert.equal(stage.sourceOrderedInit,false);
  assert.equal(stage.phones.length,2);
  assert.equal(stage.topics.length,2);
});

test('ZS-M14-002','browser shell instantiates simulation',()=>{
  const sim=new Simulation(makeTrainingStage('en'),{seed:1});
  assert.equal(sim.status,'PLAYING');
  assert.equal(sim.player.xFp>>4,104);
  assert.equal(sim.phones.phones.length,2);
});

test('ZS-M14-003','50 Hz fixed-step clock',()=>{
  const clock=new FixedStepClock({hz:50});
  assert.equal(clock.consume(19).steps,0);
  assert.equal(clock.consume(1).steps,1);
  assert.equal(clock.consume(100).steps,5);
});

test('ZS-M14-004','fixed-step accumulation is partition invariant',()=>{
  const a=new FixedStepClock({hz:50});
  const b=new FixedStepClock({hz:50});
  let sa=0,sb=0;
  for(const d of [7,8,5,13,27,40,100]) sa+=a.consume(d).steps;
  sb+=b.consume(200).steps;
  assert.equal(sa,sb);
});

test('ZS-M14-005','shell files exist',()=>{
  for(const f of ['index.html','web/app.js','web/style.css','web/renderer.js','web/scheduler.js','web/stage-synthetic.js']) assert.ok(fs.existsSync(path.join(root,f)),f);
});

test('ZS-M14-006','canvas virtual size is 256x240',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(html,/<canvas[^>]+width="256"[^>]+height="240"/);
});

test('ZS-M14-007','viewport is no-scroll',()=>{
  const css=fs.readFileSync(path.join(root,'web/style.css'),'utf8');
  assert.match(css,/html, body[^}]*overflow\s*:\s*hidden/s);
});

test('ZS-M14-008','keyboard and touch controls are wired',()=>{
  const app=fs.readFileSync(path.join(root,'web/app.js'),'utf8');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(app,/ArrowUp/); assert.match(app,/KeyW/); assert.match(app,/pointerdown/);
  assert.match(html,/data-dir="UP"/); assert.match(html,/data-dir="LEFT"/); assert.match(html,/data-dir="DOWN"/); assert.match(html,/data-dir="RIGHT"/);
});

test('ZS-M14-009','IT EN strings are present',()=>{
  const app=fs.readFileSync(path.join(root,'web/app.js'),'utf8');
  assert.match(app,/Day 1 complete!|Training complete!/); assert.match(app,/Giorno 1 completato!|Prova completata!/);
});

test('ZS-M14-010','no original media in web shell',()=>{
  const forbiddenExt=/\.(nes|chr|ftm|bmp|gif|png|jpg|jpeg|pdf|wav|ogg|mp3)$/i;
  const forbiddenNames=/(map[1-7]_nam|bonus_nam|tileset\.chr|game\.c|npc\.h|label_fami|label_nes|manual\.pdf)/i;
  const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
  for(const f of walk(path.join(root,'web'))) {
    assert.equal(forbiddenExt.test(f),false,f);
    assert.equal(forbiddenNames.test(f),false,f);
  }
});

test('ZS-M14-011','training simulation advances deterministically',()=>{
  const a=new Simulation(makeTrainingStage('en'),{seed:7});
  const b=new Simulation(makeTrainingStage('en'),{seed:7});
  for(let i=0;i<200;i++){a.tick({RIGHT:i<60});b.tick({RIGHT:i<60});}
  assert.deepEqual(a.snapshot(),b.snapshot());
});

test('ZS-M14-012','UI core does not depend on original level topology',()=>{
  const stage=makeTrainingStage('en');
  assert.equal(stage.name,'Training office');
  assert.equal(stage.phones[0].x,24);
  assert.equal(stage.spawn.x,104);
});

const failed=results.filter(r=>!r.ok);
const report={baseline:'Zooming Secretary M14 HTML5 shell',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m14-test-report.json'),JSON.stringify(report,null,2));
console.log(`\n${report.passed}/${report.total} M14 tests passed`);
if(failed.length) process.exit(1);
