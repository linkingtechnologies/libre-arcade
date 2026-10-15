/* SPDX-License-Identifier: GPL-3.0-or-later */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Simulation } from '../src/simulation.js';
import { makeDay1Stage } from '../web/stage-day1.js';
import { AudioEngine } from '../web/audio.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log(`PASS ${id} ${name}`);}catch(e){results.push({id,name,ok:false,error:e.stack||String(e)});console.error(`FAIL ${id} ${name}\n${e.stack||e}`);}}
const text=f=>fs.readFileSync(path.join(root,f),'utf8');

// 1
test('ZS-M23-001','package is M23 and production-readiness suite is enabled',()=>{
  const pkg=JSON.parse(text('package.json')); const [maj,min]=pkg.version.split('.').map(Number); assert.ok(maj>=1 || (maj===0 && min>=23),pkg.version); assert.ok(['zooming-secretary-m23-production','zooming-secretary-libre-arcade'].includes(pkg.name)); assert.match(pkg.scripts.test,/run-m23-tests/);
});

// 2
test('ZS-M23-002','production shell exposes audio, credits and reset preferences',()=>{
  const html=text('index.html');
  for(const id of ['audio','credits','credits-dialog','credits-close','reset-preferences','libre-arcade-link']) assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/linkingtechnologies\.github\.io\/libre-arcade/);
});

// 3
test('ZS-M23-003','Libre Arcade project link appears only inside Credits, not the gameplay footer',()=>{
  const html=text('index.html'); const count=(html.match(/linkingtechnologies\.github\.io\/libre-arcade/g)||[]).length; assert.equal(count,1);
  const footer=html.match(/<footer[\s\S]*?<\/footer>/)?.[0]??''; assert.doesNotMatch(footer,/libre-arcade|Zooming Secretary/i);
});

// 4
test('ZS-M23-004','audio engine is runtime synthesis with no fetched or bundled sound media',()=>{
  const audio=text('web/audio.js'); assert.match(audio,/AudioContext/); assert.match(audio,/createOscillator/); assert.match(audio,/createBuffer/); assert.doesNotMatch(audio,/fetch\(|\.wav|\.ogg|\.mp3|new Audio\(/i);
});

// 5
test('ZS-M23-005','audio engine is inert when Web Audio is unavailable and does not affect gameplay core',async()=>{
  const engine=new AudioEngine({enabled:true,contextFactory:null});
  const before=new Simulation(makeDay1Stage('en'),{seed:1}); const after=new Simulation(makeDay1Stage('en'),{seed:1});
  engine.play('ring'); for(let i=0;i<120;i++){before.tick({RIGHT:i<20});after.tick({RIGHT:i<20});}
  assert.deepEqual(before.snapshot(),after.snapshot());
});

// 6
test('ZS-M23-006','gameplay events are wired to distinct production SFX',()=>{
  const app=text('web/app.js');
  for(const pair of [["RING_START","ring"],["ANSWER","answer"],["MISS","miss"],["COFFEE_PICKUP","coffee"],["PHONE_TELEPORT","teleport"],["GHOST_CAUGHT","ghost"],["KNOCK","knock"],["WISDOM","wisdom"]]) {
    assert.match(app,new RegExp(`${pair[0]}[\\s\\S]{0,180}audio\\.play\\('${pair[1]}'\\)`));
  }
});

// 7
test('ZS-M23-007','audio preference persists and M is a mute shortcut',()=>{
  const app=text('web/app.js'); assert.match(app,/localStorage\.getItem\('zs-sound'\)/); assert.match(app,/localStorage\.setItem\('zs-sound'/); assert.match(app,/e\.code==='KeyM'/);
});

// 8
test('ZS-M23-008','Credits are bilingual and preserve historical attribution without putting it on the main screen',()=>{
  const app=text('web/app.js'); assert.match(app,/Shiru/); assert.match(app,/PinWizz/); assert.match(app,/Gibson/); assert.match(app,/Crediti/); assert.match(app,/Credits/);
  const html=text('index.html'); const main=html.match(/<main[\s\S]*?<\/main>/)?.[0]??''; assert.doesNotMatch(main,/Shiru|PinWizz|Gibson/);
});

// 9
test('ZS-M23-009','renderer has graduated from the old shell class and contains no historical image dependency',()=>{
  const renderer=text('web/renderer.js'); assert.match(renderer,/export class ArcadeRenderer/); assert.doesNotMatch(renderer,/PlaceholderRenderer|\.png|\.gif|tileset\.chr|label_/i);
  assert.match(text('web/app.js'),/new ArcadeRenderer/);
});

// 10
test('ZS-M23-010','main UI contains no public debug globals or archaeology controls',()=>{
  const app=text('web/app.js'); const html=text('index.html'); assert.doesNotMatch(app,/__ZS_M\d+__|debugApi/); assert.doesNotMatch(html,/provenance|oracle|SHA-?256|debug|M2[0-3]/i);
});

// 11
test('ZS-M23-011','ending copy is player-facing rather than archaeology-facing',()=>{
  const app=text('web/app.js'); assert.match(app,/You made it through all seven days/); assert.match(app,/Hai superato tutti e sette i giorni/); assert.doesNotMatch(app,/restoration campaign is complete|restauro clean-room è completa/i);
});

// 12
test('ZS-M23-012','Credits automatically pause and resume an active game',()=>{
  const app=text('web/app.js'); assert.match(app,/creditsPausedGame=Boolean\(running&&!paused\)/); assert.match(app,/togglePause\(\{silent:true\}\)/); assert.match(app,/if\(creditsPausedGame && paused\) togglePause/);
});

// 13
test('ZS-M23-013','language and audio preferences can be reset from Credits',()=>{
  const app=text('web/app.js'); assert.match(app,/removeItem\('zs-lang'\)/); assert.match(app,/removeItem\('zs-sound'\)/); assert.match(app,/setLanguage\('en'\)/);
});

// 14
test('ZS-M23-014','responsive layout remains no-scroll with touch and landscape handling',()=>{
  const css=text('web/style.css'); assert.match(css,/html, body[^}]*overflow\s*:\s*hidden/s); assert.match(css,/@media \(pointer:coarse\), \(max-width:700px\)/); assert.match(css,/@media \(max-height:520px\) and \(orientation:landscape\)/); assert.match(css,/\.touch \{ display:none/);
});

// 15
test('ZS-M23-015','Credits dialog is accessible and externally linked safely',()=>{
  const html=text('index.html'); assert.match(html,/<dialog[^>]+aria-labelledby="credits-title"/); assert.match(html,/target="_blank" rel="noopener noreferrer"/); assert.match(html,/aria-label="Close credits"/);
});

// 16
test('ZS-M23-016','no binary media was added in the production pass',()=>{
  const forbidden=new Set(['.nes','.chr','.ftm','.png','.gif','.bmp','.jpg','.jpeg','.pdf','.wav','.ogg','.mp3','.bin']);
  const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{const p=path.join(d,e.name);return e.isDirectory()?walk(p):[p];});
  const bad=walk(root).filter(f=>forbidden.has(path.extname(f).toLowerCase())).map(f=>path.relative(root,f)); assert.deepEqual(bad,[]);
});

// 17
test('ZS-M23-017','no AI assets rule and procedural-audio decision are explicit in notices',()=>{
  const n=text('THIRD_PARTY_NOTICES.md'); assert.match(n,/No AI-generated assets/i); assert.match(n,/Web Audio/i); assert.match(n,/no bundled audio/i);
});

// 18
test('ZS-M23-018','historical Shiru CC0 SFX option is documented but not bundled',()=>{
  const n=text('THIRD_PARTY_NOTICES.md'); assert.match(n,/NES 8-bit sound\s+effects/i); assert.match(n,/CC0/i); assert.match(n,/not bundled/i);
});

const failed=results.filter(r=>!r.ok); const report={baseline:'Zooming Secretary M23 production readiness',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m23-test-report.json'),JSON.stringify(report,null,2)+'\n'); console.log(`\n${report.passed}/${report.total} M23 tests passed`); if(failed.length)process.exit(1);
