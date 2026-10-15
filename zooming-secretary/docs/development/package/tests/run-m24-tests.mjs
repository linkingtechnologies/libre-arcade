/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Campaign } from '../src/campaign.js';
import { Simulation } from '../src/simulation.js';
import { PHONE } from '../src/phone.js';
import { makeDay1Stage } from '../web/stage-day1.js';
import { makeDay2Stage } from '../web/stage-day2.js';
import { makeDay3Stage } from '../web/stage-day3.js';
import { makeDay4Stage } from '../web/stage-day4.js';
import { makeDreamStage } from '../web/stage-dream.js';
import { makeDay5Stage } from '../web/stage-day5.js';
import { makeDay6Stage } from '../web/stage-day6.js';
import { makeDay7Stage } from '../web/stage-day7.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log(`PASS ${id} ${name}`);}catch(e){results.push({id,name,ok:false,error:e.stack||String(e)});console.error(`FAIL ${id} ${name}\n${e.stack||e}`);}}
const text=f=>fs.readFileSync(path.join(root,f),'utf8');
const exists=f=>fs.existsSync(path.join(root,f));
const factories=[
  (lang,limit)=>makeDay1Stage(lang),
  (lang,limit)=>makeDay2Stage(lang),
  (lang,limit)=>makeDay3Stage(lang),
  (lang,limit)=>makeDay4Stage(lang),
  (lang,limit)=>makeDreamStage(lang),
  (lang,limit)=>makeDay5Stage(lang,limit),
  (lang,limit)=>makeDay6Stage(lang,limit),
  (lang,limit)=>makeDay7Stage(lang,limit),
];
function forceWin(stageIndex,missLimit=3){
  const sim=new Simulation(factories[stageIndex]('en',missLimit),{seed:1});
  if(sim.npc) sim.npc.counter=255;
  const phone=sim.phones.phones[0];
  phone.level=PHONE.HEAT_1; phone.counter=100;
  if(stageIndex===4){
    sim.player.wisdom=10;
  } else {
    sim.phones.callsCount=sim.stage.targetCalls-1;
    sim.player.topic=phone.topic;
  }
  sim.player.xFp=phone.x<<4; sim.player.yFp=(phone.y-8)<<4;
  const events=sim.tick({});
  assert.equal(sim.status,'WON',`stage ${stageIndex} did not win`);
  assert.ok(events.some(e=>e.type==='STAGE_WON'),`stage ${stageIndex} missing STAGE_WON`);
  return sim;
}

// 1
test('ZS-M24-001','release package is 1.0 RC and final-audit suite is enabled',()=>{
  const pkg=JSON.parse(text('package.json'));
  assert.equal(pkg.name,'zooming-secretary-libre-arcade');
  assert.match(pkg.version,/^1\.0\.0-rc\.(?:[1-9]\d*)$/);
  assert.equal(pkg.license,'GPL-3.0-or-later');
  assert.match(pkg.scripts.test,/run-m24-tests/);
});

// 2
test('ZS-M24-002','full success campaign reaches Ending with Dream bonus preserved',()=>{
  const campaign=new Campaign();
  for(let stage=0;stage<8;stage++){
    forceWin(stage,campaign.missLimit);
    const r=campaign.resolve({won:true});
    assert.equal(r.advanced,true);
    if(stage===4) assert.equal(campaign.missLimit,5);
  }
  assert.deepEqual(campaign.snapshot(),{stage:8,name:'Ending',missLimit:5});
});

// 3
test('ZS-M24-003','Ghost-catch branch still reaches Day 7 and Ending with allowance 3',()=>{
  const campaign=new Campaign();
  for(let stage=0;stage<4;stage++){ forceWin(stage,campaign.missLimit); campaign.resolve({won:true}); }
  const dream=new Simulation(makeDreamStage('en'),{seed:1});
  dream.npc.wait=0; dream.npc.xFp=dream.player.xFp; dream.npc.yFp=dream.player.yFp; dream.npc.x=120; dream.npc.y=120;
  const ev=dream.tick({}); assert.ok(ev.some(e=>e.type==='DREAM_CAUGHT'));
  campaign.resolve({caught:true}); assert.equal(campaign.stage,5); assert.equal(campaign.missLimit,3);
  for(let stage=5;stage<8;stage++){ forceWin(stage,campaign.missLimit); campaign.resolve({won:true}); }
  assert.deepEqual(campaign.snapshot(),{stage:8,name:'Ending',missLimit:3});
});

// 4
test('ZS-M24-004','all eight playable stages can terminate through their production Simulation path',()=>{
  for(let stage=0;stage<8;stage++) assert.equal(forceWin(stage,stage>=5?5:3).status,'WON');
});

// 5
test('ZS-M24-005','late-game stage factories preserve Dream-derived 3 or 5 miss allowance',()=>{
  for(const limit of [3,5]) for(const factory of [makeDay5Stage,makeDay6Stage,makeDay7Stage]){
    const sim=new Simulation(factory('en',limit),{seed:1}); assert.equal(sim.missLimit,limit); assert.equal(sim.stage.missLimit,limit);
  }
});

// 6
test('ZS-M24-006','ending route resets the next campaign allowance to three',()=>{
  const app=text('web/app.js');
  assert.match(app,/currentDay===DAY7_STAGE[\s\S]{0,500}pendingDay=1; futureMissLimit=3/);
  assert.match(app,/restart:'Restart from Day 1'/); assert.match(app,/restart:'Ricomincia dal Giorno 1'/);
});

// 7
test('ZS-M24-007','English and Italian final campaign copy covers every stage and ending',()=>{
  const app=text('web/app.js');
  for(const token of ['Day 1','Day 2','Day 3','Day 4','Dream','Day 5','Day 6','Day 7','Trial complete!','Giorno 1','Giorno 7','Sogno','Prova completata!']) assert.ok(app.includes(token),token);
});

// 8
test('ZS-M24-008','small-screen overlays are bounded and scroll safely instead of escaping the canvas',()=>{
  const css=text('web/style.css'); assert.match(css,/\.card \{[^}]*max-height:92%[^}]*overflow:auto/s);
  assert.match(css,/@media \(max-height:520px\) and \(orientation:landscape\) and \(pointer:coarse\)/);
});

// 9
test('ZS-M24-009','touch controls remain available in short landscape orientation',()=>{
  const css=text('web/style.css'); const m=css.match(/@media \(max-height:520px\) and \(orientation:landscape\) and \(pointer:coarse\) \{([\s\S]*?)\n\}/);
  assert.ok(m); assert.match(m[1],/\.controls \{ display:flex/); assert.match(m[1],/\.touch \{ display:grid/);
});

// 10
test('ZS-M24-010','game overlay announces stage/status changes accessibly',()=>{
  const html=text('index.html'); assert.match(html,/id="overlay"[^>]*aria-live="polite"/);
});

// 11
test('ZS-M24-011','release root has no obsolete standalone demo harnesses',()=>{
  assert.equal(exists('demo.mjs'),false); assert.equal(exists('m10-demo.mjs'),false);
  const pkg=JSON.parse(text('package.json')); assert.equal('demo' in pkg.scripts,false); assert.equal('demo:m10' in pkg.scripts,false);
});

// 12
test('ZS-M24-012','production app does not import synthetic training stage or expose debug globals',()=>{
  const app=text('web/app.js'); assert.doesNotMatch(app,/stage-synthetic|Synthetic|__ZS_M\d+__|debugApi/);
});

// 13
test('ZS-M24-013','runtime has no external network dependency',()=>{
  const runtime=['index.html','web/app.js','web/renderer.js','web/audio.js','web/style.css'].map(text).join('\n');
  assert.doesNotMatch(runtime,/fetch\(|XMLHttpRequest|WebSocket|EventSource|\.wav|\.ogg|\.mp3|\.png|\.gif|\.jpg/i);
});

// 14
test('ZS-M24-014','Libre Arcade link remains confined to Credits',()=>{
  const html=text('index.html'); assert.equal((html.match(/linkingtechnologies\.github\.io\/libre-arcade/g)||[]).length,1);
  const footer=html.match(/<footer[\s\S]*?<\/footer>/)?.[0]??''; assert.doesNotMatch(footer,/Libre Arcade|libre-arcade/i);
});

// 15
test('ZS-M24-015','no historical binary or expressive media is present anywhere in release source',()=>{
  const forbidden=new Set(['.nes','.chr','.ftm','.png','.gif','.bmp','.jpg','.jpeg','.pdf','.wav','.ogg','.mp3','.bin']);
  const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{const p=path.join(d,e.name);return e.isDirectory()?walk(p):[p];});
  const bad=walk(root).filter(f=>forbidden.has(path.extname(f).toLowerCase())).map(f=>path.relative(root,f)); assert.deepEqual(bad,[]);
});

// 16
test('ZS-M24-016','historical fact-message prose is not present in production runtime',()=>{
  const runtime=['web/app.js','web/renderer.js',...fs.readdirSync(path.join(root,'web')).filter(n=>/^stage-.*\.js$/.test(n)).map(n=>'web/'+n)].map(text).join('\n').toUpperCase();
  for(const phrase of ['MACBETH WAS A KING OF SCOTLAND','MARCO POLO TRAVELLED TO ASIA','RHYMES ARE EASIER TO REMEMBER','PLUTO IS SMALLER THAN MOON']) assert.equal(runtime.includes(phrase),false,phrase);
});

// 17
test('ZS-M24-017','audio remains procedural and user-mutable without affecting core state',()=>{
  const audio=text('web/audio.js'); const app=text('web/app.js');
  assert.match(audio,/createOscillator/); assert.match(audio,/createBuffer/); assert.doesNotMatch(audio,/fetch\(|new Audio\(/);
  assert.match(app,/localStorage\.setItem\('zs-sound'/); assert.match(app,/e\.code==='KeyM'/);
});

// 18
test('ZS-M24-018','Credits contain attribution, licensing, procedural-audio note and project link',()=>{
  const app=text('web/app.js'); const html=text('index.html');
  for(const x of ['Shiru','PinWizz','Gibson','GPL-3.0-or-later','Web Audio']) assert.ok(app.includes(x),x);
  assert.match(html,/id="libre-arcade-link"/);
});

// 19
test('ZS-M24-019','release documentation states technical readiness separately from unresolved public-release gate',()=>{
  const report=text('docs/M24_REPORT.md'); assert.match(report,/TECHNICAL GATE:\s*GREEN/i); assert.match(report,/PUBLIC RELEASE GATE:\s*YELLOW/i);
  assert.match(report,/semantic topology/i); assert.match(report,/naming/i);
});

// 20
test('ZS-M24-020','M24 final checklist exists and requires external visual smoke before public tag',()=>{
  const checklist=text('docs/M24_RELEASE_CHECKLIST.md'); assert.match(checklist,/manual visual smoke/i); assert.match(checklist,/320×568|320x568/); assert.match(checklist,/landscape/i); assert.match(checklist,/Credits/i); assert.match(checklist,/audio/i);
});

const failed=results.filter(r=>!r.ok);
const report={baseline:'Zooming Secretary M24 final release audit',version:'1.0.0-rc.1',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m24-test-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`\n${report.passed}/${report.total} M24 tests passed`); if(failed.length)process.exit(1);
