import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const app=read('src/js/app.js'), html=read('src/index.html'), css=read('src/css/app.css'), pkg=JSON.parse(read('package.json'));
let passed=0;
function test(name,fn){fn();passed++;console.log(`PASS ${name}`)}
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

test('M11-01 viewport includes viewport-fit cover',()=>assert.match(html,/viewport-fit=cover/));
test('M11-02 document defaults to English',()=>assert.match(html,/<html lang="en">/));
test('M11-03 canvas is keyboard focusable',()=>assert.match(html,/canvas[^>]+tabindex="0"/));
test('M11-04 polite live region exists for Canvas feedback',()=>assert.match(html,/aria-live="polite"/));
test('M11-05 page scrolling remains disabled',()=>{assert.match(css,/overflow:hidden/);assert.match(css,/overscroll-behavior:none/)});
test('M11-06 touch browser gestures remain disabled',()=>assert.match(css,/touch-action:none/));
test('M11-07 language toggle synchronizes document language',()=>{assert.match(app,/function syncDocumentLanguage\(\)/);assert.match(app,/document\.documentElement\.lang=app\.lang/);assert.match(app,/toggleLang\(\).*syncDocumentLanguage\(\)/s)});
test('M11-08 canvas accessible name follows language',()=>assert.match(app,/canvas\.setAttribute\('aria-label'/));
test('M11-09 save and preference keys are explicitly versioned',()=>{assert.match(app,/session\.v2/);assert.match(app,/preferences\.v1/)});
test('M11-10 reset removes both session and preference state',()=>{assert.match(app,/localStorage\.removeItem\(SAVE_KEY\)/);assert.match(app,/localStorage\.removeItem\(PREF_KEY\)/)});
test('M11-11 resume uses certified GameSession.restore',()=>assert.match(app,/GameSession\.restore\(JSON\.parse\(raw\)\)/));
test('M11-12 audio can be disabled and persists',()=>{assert.match(app,/function toggleAudio\(\)/);assert.match(app,/savePrefs\(\)/)});
test('M11-13 credits remain a separate screen',()=>{assert.match(app,/case'credits':drawCredits\(\)/);assert.match(app,/function drawCredits\(\)/)});
test('M11-14 executable source has no quarantined original asset references',()=>{for(const f of ['src/js/app.js','src/js/ui-shell.js','src/index.html']){const s=read(f);assert.doesNotMatch(s,/res\/(screens|sound)|\.(png|mp3)\b|raw\.githubusercontent|github\.com\//i)}});
test('M11-15 package remains dependency-free',()=>{assert.equal(pkg.dependencies,undefined);assert.equal(pkg.devDependencies,undefined)});
test('M11-16 all executable JavaScript passes Node syntax check',()=>{for(const f of fs.readdirSync(path.join(root,'src/js')).filter(x=>x.endsWith('.js')))execFileSync(process.execPath,['--check',path.join(root,'src/js',f)],{stdio:'pipe'})});
test('M11-17 preservation core is unchanged from M10',()=>{const old='/mnt/data/turkey-cooking-simulator-m10';for(const f of ['thermal-model.js','runtime.js','gameplay-state.js','game-session.js']){const rel=`src/js/${f}`;const oldSha=crypto.createHash('sha256').update(fs.readFileSync(path.join(old,rel))).digest('hex');assert.equal(sha(rel),oldSha)}});
test('M11-18 GPLv3 license and third-party notices are present',()=>{assert.ok(fs.existsSync(path.join(root,'LICENSE')));assert.ok(fs.existsSync(path.join(root,'THIRD_PARTY_NOTICES.md')));assert.match(read('LICENSE'),/GNU GENERAL PUBLIC LICENSE/)});
console.log(`M11 Release Candidate Audit: ${passed}/18 PASS`);
