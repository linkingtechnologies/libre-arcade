import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const sha=rel=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,rel))).digest('hex');
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log('PASS',id,name);}catch(error){results.push({id,name,ok:false,error:String(error?.stack||error)});console.error('FAIL',id,name,error);}}

const app=()=>read('web/app.js');

test('ZS-M30-001','package is RC7-or-later and M30 suite remains enabled',()=>{
  const pkg=JSON.parse(read('package.json')); const m=/^1\.0\.0-rc\.(\d+)$/.exec(pkg.version); assert.ok(m && Number(m[1])>=7,pkg.version);
  assert.match(pkg.scripts.test,/run-m30-tests/); assert.match(pkg.scripts['test:m30'],/run-m30-tests/);
});

test('ZS-M30-002','Day 1 instructions explicitly explain automatic phone answering in English and Italian',()=>{
  const s=app();
  assert.match(s,/How to answer: a ringing phone shows a topic symbol\./);
  assert.match(s,/Touch the filing cabinet with the same symbol to memorize it, then touch the phone\./);
  assert.match(s,/There is no Answer button\./);
  assert.match(s,/Come rispondere: il telefono che squilla mostra il simbolo di un argomento\./);
  assert.match(s,/Tocca lo schedario con lo stesso simbolo per memorizzarlo, poi tocca il telefono\./);
  assert.match(s,/Non esiste un tasto Rispondi\./);
});

test('ZS-M30-003','ambiguous old Read-the-phone wording is removed and Day 1 says answer is automatic',()=>{
  const s=app();
  assert.doesNotMatch(s,/Read the ringing phone/); assert.doesNotMatch(s,/Leggi il telefono/);
  assert.match(s,/answer automatically/); assert.match(s,/la risposta è automatica/);
});

test('ZS-M30-004','instruction rule has its own overlay element instead of overloading the stage prose',()=>{
  const html=read('index.html');
  assert.match(html,/id="overlay-rule" class="answer-rule"/);
  assert.ok(html.indexOf('id="overlay-rule"')>html.indexOf('id="overlay-text"'));
  assert.ok(html.indexOf('id="overlay-rule"')<html.indexOf('id="primary"'));
});

test('ZS-M30-005','normal stage intros show the reusable answer rule while Dream shows its special exception',()=>{
  const s=app();
  assert.match(s,/setOverlayRule\(day===DREAM_STAGE\?strings\.dreamRule:/);
  assert.match(s,/strings\.answerRule/);
  assert.match(s,/Dream exception: no topic is needed/); assert.match(s,/Eccezione Sogno: non serve alcun argomento/);
});

test('ZS-M30-006','answer-rule help is hidden during gameplay results and pause so it does not become UI clutter',()=>{
  const s=app();
  assert.match(s,/running=true; setOverlayRule\(\); overlay\.hidden=true/);
  assert.match(s,/function showDreamResult\(won\)\{[\s\S]*?running=false; overlay\.hidden=false; setOverlayRule\(\)/);
  assert.match(s,/function showEnd\(won\)\{[\s\S]*?running=false; overlay\.hidden=false; setOverlayRule\(\); syncPauseButton\(\); audio\.play/);
  assert.match(s,/if\(paused\)\{overlay\.hidden=false;setOverlayRule\(\);/);
});

test('ZS-M30-007','answer-rule panel remains compact in the short-landscape responsive profile',()=>{
  const css=read('web/style.css');
  assert.match(css,/\.card \.answer-rule \{[^}]*font-size:12px/s);
  assert.match(css,/\.card \.answer-rule \{ padding:5px 7px; font-size:11px; line-height:1\.2; \}/);
  assert.match(css,/\.card \{ max-height:94%; padding:10px 12px; \}/);
});

test('ZS-M30-008','README documents the same no-button mechanic and Dream exception',()=>{
  const md=read('README.md');
  assert.match(md,/## How to answer a call/); assert.match(md,/There is \*\*no Answer button\*\*/);
  assert.match(md,/filing cabinet with the same symbol/); assert.match(md,/In the Dream, topic matching is bypassed/);
});

test('ZS-M30-009','M29-certified gameplay and M28 renderer/M26 audio remain byte-identical',()=>{
  assert.equal(sha('src/player.js'),'a83dc581c96647f355734836f0a750b449cfa3c23d5f3b37aab1afeb2cd60ce9');
  assert.equal(sha('src/simulation.js'),'ae1e1fb10d34e5fdd2003ae7b41a4e13233f094cfff7548de59a9b4c4be17168');
  assert.equal(sha('web/renderer.js'),'df8b1e3529a928130dd19a79b375faa47732ba4ffed86bebadbfb248dcf4500d');
  assert.equal(sha('web/audio.js'),'8f428e9e2bb26e54517e5a1e60c280a82d6f93e716cd0b9314f8c6f9707f96a1');
});

test('ZS-M30-010','M30 adds no media assets or new gameplay control',()=>{
  const forbidden=[]; const walk=dir=>{for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,ent.name);if(ent.isDirectory())walk(full);else if(/\.(wav|mp3|ogg|flac|m4a|png|gif|jpe?g|webp|chr|nes)$/i.test(ent.name))forbidden.push(path.relative(root,full));}};
  walk(root); assert.deepEqual(forbidden,[]);
  assert.doesNotMatch(app(),/KeyE|KeyF|AnswerButton|data-action=['"]answer/i);
});

const failed=results.filter(r=>!r.ok);
const report={baseline:'Zooming Secretary M30 answer-mechanic onboarding and instruction clarity',version:'1.0.0-rc.7',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m30-test-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`\n${report.passed}/${report.total} M30 tests passed`); if(failed.length)process.exit(1);
