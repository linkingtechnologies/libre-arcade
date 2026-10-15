/*
 * Zooming Secretary M13 repository/media policy tests
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const results = [];
function test(id, name, fn) {
  try { fn(); results.push({id,name,ok:true}); console.log(`PASS ${id} ${name}`); }
  catch (e) { results.push({id,name,ok:false,error:e.stack||String(e)}); console.error(`FAIL ${id} ${name}`); console.error(e.stack||e); }
}
function files(dir) {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e => {
    const p=path.join(dir,e.name); return e.isDirectory()?files(p):[p];
  });
}
const all=files(root);
const rel=p=>path.relative(root,p).replaceAll('\\','/');

// M13-001
 test('ZS-M13-001','Media strategy and manifest exist',()=>{
  assert.ok(fs.existsSync(path.join(root,'docs/M13_MEDIA_LICENSE_STRATEGY.md')));
  assert.ok(fs.existsSync(path.join(root,'docs/M13_MEDIA_MANIFEST.json')));
  assert.ok(fs.existsSync(path.join(root,'docs/M13_REPORT.md')));
 });

// M13-002
 test('ZS-M13-002','Public reference is metadata-only',()=>{
  const rf=files(path.join(root,'reference')).map(rel).sort();
  assert.deepEqual(rf,['reference/README.md','reference/manifest.json']);
 });

// M13-003
 test('ZS-M13-003','No forbidden historical binary/media extensions',()=>{
  const forbiddenExt=new Set(['.nes','.chr','.ftm','.png','.gif','.bmp','.jpg','.jpeg','.pdf','.wav','.ogg','.mp3','.bin','.uze','.hex']);
  const bad=all.filter(p=>forbiddenExt.has(path.extname(p).toLowerCase())).map(rel);
  assert.deepEqual(bad,[]);
 });

// M13-004
 test('ZS-M13-004','No original source/map filenames',()=>{
  const badNames=[/^map[1-7]_nam\.h$/i,/^bonus_nam\.h$/i,/^tileset\.chr$/i,/^game\.c$/i,/^npc\.h$/i,/^crt0\.s$/i,/^neslib\.s$/i,/^famitone\.s$/i,/^sounds\.s$/i,/^music.*\.s$/i,/^manual\.pdf$/i,/^label_.*\.png$/i];
  const bad=all.filter(p=>badNames.some(rx=>rx.test(path.basename(p)))).map(rel);
  assert.deepEqual(bad,[]);
 });

// M13-005
 test('ZS-M13-005','Code package remains GPL-3.0-or-later',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  assert.equal(pkg.license,'GPL-3.0-or-later');
  const [maj,min] = pkg.version.split('.').map(Number);
  assert.ok(maj>=1 || (maj===0 && min>=13), `expected release version >=0.13.x, got ${pkg.version}`);
  assert.match(fs.readFileSync(path.join(root,'LICENSE'),'utf8'),/GNU GENERAL PUBLIC LICENSE/);
 });

// M13-006
 test('ZS-M13-006','Manifest keeps unresolved original media out of GREEN reuse',()=>{
  const m=JSON.parse(fs.readFileSync(path.join(root,'docs/M13_MEDIA_MANIFEST.json'),'utf8'));
  assert.equal(m.implementation_gate,'GREEN');
  const byName=Object.fromEntries(m.components.map(c=>[c.component,c]));
  assert.equal(byName['Exact NES nametable/map bytes and tile art'].status,'YELLOW');
  assert.equal(byName['Manual, cartridge labels, original screenshots'].status,'YELLOW');
  assert.equal(byName['Sound effects'].license,'CC0-1.0');
 });

// M13-007
 test('ZS-M13-007','No AI assets policy is explicit',()=>{
  const s=fs.readFileSync(path.join(root,'docs/M13_MEDIA_LICENSE_STRATEGY.md'),'utf8');
  const m=JSON.parse(fs.readFileSync(path.join(root,'docs/M13_MEDIA_MANIFEST.json'),'utf8'));
  assert.match(s,/No AI-generated assets/i);
  assert.ok(m.project_rules.some(r=>/No AI-generated assets/i.test(r)));
 });

// M13-008
 test('ZS-M13-008','Reference baseline hashes remain locked',()=>{
  const m=JSON.parse(fs.readFileSync(path.join(root,'reference/manifest.json'),'utf8'));
  assert.equal(m.baseline.rom_sha256,'315adee10052367298959d55256e9f2621381da9f7c839f50832e13516b61770');
  assert.equal(m.baseline.release_zip_sha256,'c61863bed7961dbba4ee02c20a5c2d3fa96ad0c746a638618f5132b58ab9eea9');
 });

const failed=results.filter(r=>!r.ok);
const report={milestone:'M13',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m13-policy-test-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`\n${report.passed}/${report.total} M13 policy tests passed`);
if(failed.length) process.exit(1);
