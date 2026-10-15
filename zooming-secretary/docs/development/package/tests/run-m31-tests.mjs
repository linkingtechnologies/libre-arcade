import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Rng8 } from '../src/rng.js';
import { Simulation } from '../src/simulation.js';
import { makeDay1Stage } from '../web/stage-day1.js';
import { anyPhoneRinging, shouldRepeatRing } from '../web/ringing.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const sha=rel=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,rel))).digest('hex');
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log('PASS',id,name);}catch(error){results.push({id,name,ok:false,error:String(error?.stack||error)});console.error('FAIL',id,name,error);}}

const app=()=>read('web/app.js');

test('ZS-M31-001','package is 1.0.0-rc.8 and M31 suite is enabled',()=>{
  const pkg=JSON.parse(read('package.json')); assert.match(pkg.version,/^1\.0\.0-rc\.(?:8|9)$/);
  assert.match(pkg.scripts.test,/run-m31-tests/); assert.match(pkg.scripts['test:m31'],/run-m31-tests/);
});

test('ZS-M31-002','initial browser surface contains a dedicated accessible clean-room title screen',()=>{
  const html=read('index.html');
  assert.match(html,/id="title-screen" class="title-screen"/);
  assert.match(html,/id="title-start" class="title-start" type="button">PRESS START/);
  assert.match(html,/ZOOMING[\s\S]*SECRETARY/);
  assert.match(html,/LIBRE ARCADE RESTORATION/);
});

test('ZS-M31-003','title screen is bilingual and supports keyboard or tap start',()=>{
  const s=app();
  assert.match(s,/titlePress:'PRESS START'/); assert.match(s,/titlePress:'PREMI START'/);
  assert.match(s,/titleHint:'Enter \/ Space or tap'/); assert.match(s,/titleHint:'Invio \/ Spazio o tocca'/);
  assert.match(s,/screenMode==='TITLE'\)\{startFromTitle\(\)/);
  assert.match(s,/titleStart\.addEventListener\('click',startFromTitle\)/);
});

test('ZS-M31-004','title idle consumes the historical two-RNG-step rand16 cadence',()=>{
  const s=app(); assert.match(s,/titleRng\.advanceTitleTicks\(steps\)/);
  const r1=new Rng8(1); assert.equal(r1.advanceTitleTicks(1),4); const r72=new Rng8(1); assert.equal(r72.advanceTitleTicks(72),24);
  const a=new Rng8(1),b=new Rng8(1); a.advanceTitleTicks(10); b.advanceTitleTicks(11); assert.notEqual(a.state,b.state);
});

test('ZS-M31-005','pressing Start freezes the title-derived seed and runs a 72-tick transition',()=>{
  const s=app();
  assert.match(s,/runSeed=titleRng\.state \|\| 1/);
  assert.match(s,/TITLE_TRANSITION_TICKS=72/);
  assert.match(s,/titleTransitionTicks=TITLE_TRANSITION_TICKS/);
  assert.match(s,/if\(titleTransitionTicks===0\) finishTitleTransition\(\)/);
});

test('ZS-M31-006','Day 1 receives title-derived seed while certified core code stays untouched',()=>{
  const s=app(); assert.match(s,/new Simulation\(makeStage\(day\),\{seed:day===1\?runSeed:1\}\)/);
  assert.equal(sha('src/player.js'),'a83dc581c96647f355734836f0a750b449cfa3c23d5f3b37aab1afeb2cd60ce9');
  assert.equal(sha('src/simulation.js'),'ae1e1fb10d34e5fdd2003ae7b41a4e13233f094cfff7548de59a9b4c4be17168');
});

test('ZS-M31-007','ringing policy repeats audibly while any phone remains in a heat state',()=>{
  const sim=new Simulation(makeDay1Stage('en'),{seed:1});
  let firstRing=-1,repeats=0,firstMiss=-1;
  for(let t=0;t<1000;t++){
    const events=sim.tick({});
    if(firstRing<0 && events.some(e=>e.type==='RING_START')) firstRing=t;
    if(shouldRepeatRing(sim,50)) repeats++;
    if(events.some(e=>e.type==='MISS')){firstMiss=t;break;}
  }
  assert.equal(firstRing,252); assert.equal(firstMiss,855); assert.ok(repeats>=8,`only ${repeats} repeats`);
});

test('ZS-M31-008','ring repeat policy stops whenever there is no actively ringing phone',()=>{
  assert.equal(anyPhoneRinging({phones:{phones:[{level:0},{level:255}]}}),false);
  assert.equal(shouldRepeatRing({ringCnt:50,phones:{phones:[{level:0}]}},50),false);
  assert.equal(shouldRepeatRing({ringCnt:50,phones:{phones:[{level:2}]}},50),true);
});

test('ZS-M31-009','ring scheduling remains an app/audio concern and does not alter the audio synthesizer',()=>{
  const s=app();
  assert.match(s,/RING_REPEAT_TICKS=50/); assert.match(s,/shouldRepeatRing\(sim,RING_REPEAT_TICKS\)/);
  assert.match(s,/audio\.play\('ring'\)/);
  assert.equal(sha('web/audio.js'),'8f428e9e2bb26e54517e5a1e60c280a82d6f93e716cd0b9314f8c6f9707f96a1');
});

test('ZS-M31-010','M28 gameplay renderer remains byte-identical; title artwork is DOM/CSS clean-room UI',()=>{
  assert.equal(sha('web/renderer.js'),'df8b1e3529a928130dd19a79b375faa47732ba4ffed86bebadbfb248dcf4500d');
  const css=read('web/style.css'); assert.match(css,/M31 clean-room title screen/); assert.match(css,/\.title-logo/); assert.match(css,/\.title-phone/);
});

test('ZS-M31-011','title transition ends at the existing Day 1 tutorial rather than bypassing onboarding',()=>{
  const s=app(); assert.match(s,/function finishTitleTransition\(\)\{[\s\S]*showIntro\(1\)/);
  assert.match(s,/setOverlayRule\(day===DREAM_STAGE\?strings\.dreamRule:/); assert.match(s,/strings\.answerRule/);
});

test('ZS-M31-012','M31 adds no historical/sample media files',()=>{
  const forbidden=[]; const walk=dir=>{for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,ent.name);if(ent.isDirectory())walk(full);else if(/\.(wav|mp3|ogg|flac|m4a|png|gif|jpe?g|webp|chr|nes|nsf|ftm)$/i.test(ent.name))forbidden.push(path.relative(root,full));}};
  walk(root); assert.deepEqual(forbidden,[]);
});

const failed=results.filter(r=>!r.ok);
const report={baseline:'Zooming Secretary M31 title-screen and persistent-ringing fidelity pass',version:'1.0.0-rc.8',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m31-test-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`\n${report.passed}/${report.total} M31 tests passed`); if(failed.length)process.exit(1);
