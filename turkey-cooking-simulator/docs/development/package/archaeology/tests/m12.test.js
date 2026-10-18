import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const pkg = JSON.parse(read('package.json'));
const html = read('src/index.html');
const css = read('src/css/app.css');
const app = read('src/js/app.js');
const ui = read('src/js/ui-shell.js');
const readme = read('README.md');
const notices = read('THIRD_PARTY_NOTICES.md');
const license = read('LICENSE');

const tests = [];
const t=(name,fn)=>tests.push([name,fn]);
t('R01 version is 1.0.0-rc1',()=>assert.equal(pkg.version,'1.0.0-rc1'));
t('R02 no runtime dependencies',()=>assert.ok(!pkg.dependencies || Object.keys(pkg.dependencies).length===0));
t('R03 viewport is mobile-ready',()=>assert.match(html,/name="viewport"/));
t('R04 canvas has keyboard focusability',()=>assert.match(html,/tabindex="0"/));
t('R05 document defaults to English',()=>assert.match(html,/<html[^>]+lang="en"/));
t('R06 no-scroll policy retained',()=>assert.match(css,/overflow\s*:\s*hidden/));
t('R07 touch action policy retained',()=>assert.match(css,/touch-action\s*:\s*none/));
t('R08 localStorage persistence exists',()=>assert.match(app+ui,/localStorage/));
t('R09 audio preference exists',()=>assert.match(app+ui,/audio/i));
t('R10 language toggle exists',()=>assert.match(app+ui,/language|locale|lang/i));
t('R11 Credits remain dedicated',()=>assert.match(app+ui,/Credits/));
t('R12 no historical png runtime refs',()=>assert.ok(!/\.png/i.test(app+ui)));
t('R13 no historical mp3 runtime refs',()=>assert.ok(!/\.mp3/i.test(app+ui)));
t('R14 no original res path runtime refs',()=>assert.ok(!/res\/(screens|sound)/i.test(app+ui)));
t('R15 GPL license present',()=>assert.match(license,/GNU GENERAL PUBLIC LICENSE/));
t('R16 third-party notices present',()=>assert.ok(notices.length>100));
t('R17 manual QA checklist documented',()=>assert.match(readme,/Manual browser QA checklist/));
t('R18 release status is explicit RC1',()=>assert.match(readme,/1\.0\.0-rc1|RC1/));

let passed=0;
for (const [name,fn] of tests){
  try { fn(); console.log(`PASS ${name}`); passed++; }
  catch(e){ console.error(`FAIL ${name}: ${e.message}`); process.exitCode=1; }
}
console.log(`${passed}/${tests.length} PASS`);
if (passed!==tests.length) process.exit(1);
