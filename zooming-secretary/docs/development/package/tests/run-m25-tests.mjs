import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { makeDay1Map, DAY1_ORACLE } from '../web/stage-day1.js';
import { makeDay2Map, DAY2_ORACLE } from '../web/stage-day2.js';
import { makeDay3Map, DAY3_ORACLE } from '../web/stage-day3.js';
import { makeDay4Map, DAY4_ORACLE } from '../web/stage-day4.js';
import { makeDreamMap, DREAM_ORACLE } from '../web/stage-dream.js';
import { makeDay5Map, DAY5_ORACLE } from '../web/stage-day5.js';
import { makeDay6Map, DAY6_ORACLE } from '../web/stage-day6.js';
import { makeDay7Map, DAY7_ORACLE } from '../web/stage-day7.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log('PASS',id,name);}catch(error){results.push({id,name,ok:false,error:String(error?.stack||error)});console.error('FAIL',id,name,error);}}
const read=(rel)=>fs.readFileSync(path.join(root,rel),'utf8');
const shaMap=(map)=>crypto.createHash('sha256').update(Buffer.from(map.cells)).digest('hex');

const dataFiles=['day1','day2','day3','day4','dream','day5','day6','day7'].map(x=>`data/stage-${x}-data.js`);
const wrappers=['day1','day2','day3','day4','dream','day5','day6','day7'].map(x=>`web/stage-${x}.js`);

// 1
test('ZS-M25-001','package remains on the 1.0.0 release-candidate line (rc.2 or later) and M25 suite is enabled',()=>{
  const pkg=JSON.parse(read('package.json'));
  assert.match(pkg.version,/^1\.0\.0-rc\.(?:[2-9]|[1-9]\d+)$/);
  assert.match(pkg.scripts.test,/run-m25-tests/); assert.match(pkg.scripts['test:m25'],/run-m25-tests/);
});
// 2
test('ZS-M25-002','all eight historical semantic stage components are physically separated',()=>{
  for(const rel of dataFiles) assert.ok(fs.existsSync(path.join(root,rel)),rel);
  assert.ok(fs.existsSync(path.join(root,'data/README.md'))); assert.ok(fs.existsSync(path.join(root,'data/LICENSE.txt')));
});
// 3
test('ZS-M25-003','historical data uses explicit custom LicenseRef and is not marked GPL',()=>{
  for(const rel of dataFiles){const s=read(rel); assert.match(s,/SPDX-License-Identifier: LicenseRef-Zooming-Secretary-CC-BY-Unspecified/); assert.doesNotMatch(s,/SPDX-License-Identifier: GPL/);}
});
// 4
test('ZS-M25-004','stage adapters remain GPL code and import the separated historical data',()=>{
  for(const rel of wrappers){const s=read(rel); assert.match(s,/SPDX-License-Identifier: GPL-3\.0-or-later/); assert.match(s,/\.\.\/data\/stage-/);}
});
// 5
test('ZS-M25-005','data licensing note preserves unspecified CC BY version and attribution',()=>{
  const s=read('data/README.md'); assert.match(s,/Creative Commons\s+Attribution/i); assert.match(s,/version unspecified/i); assert.match(s,/Shiru/); assert.match(s,/PinWizz/); assert.match(s,/does not silently convert[\s\S]*GPL/i);
});
// 6
test('ZS-M25-006','separated stage data still contains no original NES map/media source',()=>{
  const s=dataFiles.map(read).join('\n'); assert.doesNotMatch(s,/map[1-7]_nam|bonus_nam|tileset\.chr|manual\.pdf|label_.*\.png|game\.c|npc\.h/i);
});
// 7
test('ZS-M25-007','licensing refactor preserves all eight certified collision fingerprints',()=>{
  const pairs=[[makeDay1Map,DAY1_ORACLE],[makeDay2Map,DAY2_ORACLE],[makeDay3Map,DAY3_ORACLE],[makeDay4Map,DAY4_ORACLE],[makeDreamMap,DREAM_ORACLE],[makeDay5Map,DAY5_ORACLE],[makeDay6Map,DAY6_ORACLE],[makeDay7Map,DAY7_ORACLE]];
  for(const [make,oracle] of pairs) assert.equal(shaMap(make()),oracle.collisionSha256);
});
// 8
test('ZS-M25-008','public document title qualifies the archival title as a Libre Arcade restoration',()=>{
  const s=read('index.html'); assert.match(s,/<title>Zooming Secretary — Libre Arcade Restoration<\/title>/); assert.match(s,/Unofficial Libre Arcade browser restoration/);
});
// 9
test('ZS-M25-009','Credits are bilingual about unofficial status and non-endorsement',()=>{
  const s=read('web/app.js'); assert.match(s,/Unofficial Libre Arcade restoration/); assert.match(s,/No endorsement/); assert.match(s,/Restauro Libre Arcade non ufficiale/); assert.match(s,/Non è implicata alcuna approvazione/);
});
// 10
test('ZS-M25-010','Credits explain the mixed GPL plus historical-data licensing boundary',()=>{
  const s=read('web/app.js'); assert.match(s,/historical-data component under the original CC BY grant \(version unspecified\)/); assert.match(s,/componente storico separato.*CC BY originale \(versione non specificata\)/s);
});
// 11
test('ZS-M25-011','title review is explicit that project acceptance is not formal trademark clearance',()=>{
  const s=read('docs/M25_TITLE_REVIEW.md'); assert.match(s,/PROJECT NAMING GATE: ACCEPTED/); assert.match(s,/not a formal trademark clearance or legal opinion/i); assert.match(s,/shiru\.untergrund\.net/); assert.match(s,/old-pirate\.itch\.io/);
});
// 12
test('ZS-M25-012','release decision accepts preservation route without silently choosing a CC version',()=>{
  const s=read('docs/M25_RELEASE_DECISION.md'); assert.match(s,/preservation route/i); assert.match(s,/version explicitly recorded as \*\*unspecified\*\*/); assert.match(s,/not relicensed under GPL/i);
});
// 13
test('ZS-M25-013','manual visual smoke is the only remaining release-process yellow gate',()=>{
  const s=read('docs/M25_RELEASE_DECISION.md'); assert.match(s,/Manual visual browser smoke:\*\* YELLOW/); assert.match(s,/Only the external visual smoke remains/i);
});
// 14
test('ZS-M25-014','package metadata keeps GPL code license while disclosing separate data license',()=>{
  const pkg=JSON.parse(read('package.json')); assert.equal(pkg.license,'GPL-3.0-or-later'); assert.match(pkg.licenseNotes,/data\/\*/); assert.match(pkg.licenseNotes,/version unspecified/);
});
// 15
test('ZS-M25-015','runtime source contains no historical logo or expressive media dependency',()=>{
  const s=[read('index.html'),...fs.readdirSync(path.join(root,'web')).filter(x=>x.endsWith('.js')).map(x=>read(`web/${x}`)),...fs.readdirSync(path.join(root,'src')).filter(x=>x.endsWith('.js')).map(x=>read(`src/${x}`))].join('\n');
  assert.doesNotMatch(s,/label_fami|label_nes|manual\.pdf|tileset\.chr|\.png['\"]|\.gif['\"]|\.ogg['\"]|\.mp3['\"]/i);
});
// 16
test('ZS-M25-016','runtime historical data has only local module imports and no network dependency',()=>{
  for(const rel of dataFiles){const s=read(rel); assert.doesNotMatch(s,/https?:\/\//i); assert.match(s,/from '\.\.\/src\/map\.js'/);}
});
// 17
test('ZS-M25-017','README and notices expose the preservation split and no-AI policy',()=>{
  const s=read('README.md')+'\n'+read('THIRD_PARTY_NOTICES.md'); assert.match(s,/Semantic-topology preservation-route policy: ACCEPTED/); assert.match(s,/No AI-generated assets/); assert.match(s,/M25 preservation-route licensing split/);
});
// 18
test('ZS-M25-018','M25 browser QA records the stronger D-Bus retry without claiming a visual pass',()=>{
  const s=read('docs/M25_BROWSER_QA.md'); assert.match(s,/dbus-run-session/); assert.match(s,/UPower/); assert.match(s,/visual browser smoke remains external/);
});

const failed=results.filter(r=>!r.ok);
const report={baseline:'Zooming Secretary M25 release hardening',version:'1.0.0-rc.2',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m25-test-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`\n${report.passed}/${report.total} M25 tests passed`); if(failed.length)process.exit(1);
