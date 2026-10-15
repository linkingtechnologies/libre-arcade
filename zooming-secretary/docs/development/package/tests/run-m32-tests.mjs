import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createHeldDirections, pressDirection, releaseDirection, clearDirections } from '../web/directional-input.js';
import { makePlayer, tickPlayerMotion } from '../src/player.js';
import { BUTTON } from '../src/input.js';
import { TILE, MAP_ORIGIN_Y } from '../src/map.js';
import { makeDay1Stage } from '../web/stage-day1.js';
import { makeDay2Stage } from '../web/stage-day2.js';
import { makeDay3Stage } from '../web/stage-day3.js';
import { makeDay4Stage } from '../web/stage-day4.js';
import { makeDreamStage } from '../web/stage-dream.js';
import { makeDay5Stage } from '../web/stage-day5.js';
import { makeDay6Stage } from '../web/stage-day6.js';
import { makeDay7Stage } from '../web/stage-day7.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const sha=rel=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,rel))).digest('hex');
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log('PASS',id,name);}catch(error){results.push({id,name,ok:false,error:String(error?.stack||error)});console.error('FAIL',id,name,error);}}

const stages=()=>[makeDay1Stage(),makeDay2Stage(),makeDay3Stage(),makeDay4Stage(),makeDreamStage(),makeDay5Stage(),makeDay6Stage(),makeDay7Stage()];

function ordinaryUpEntries(stage){
  const m=stage.map, entries=[];
  for(let r=0;r<m.height-1;r++){
    let cols=[];
    for(let c=0;c<m.width;c++) if(m.get(c,r)===TILE.LADDER && m.get(c,r+1)===TILE.WALL) cols.push(c);
    // Collapse adjacent ladder columns into one shaft.
    for(let i=0;i<cols.length;){let j=i;while(j+1<cols.length&&cols[j+1]===cols[j]+1)j++;entries.push({row:r,c0:cols[i],c1:cols[j]});i=j+1;}
  }
  return entries;
}

function climbFromEntry(stage,entry,speedFp){
  const x=(entry.c0*8)-2;
  const floorY=MAP_ORIGIN_Y+(entry.row+1)*8;
  const p=makePlayer(x,floorY-24); p.speedFp=speedFp; p.speedTargetFp=speedFp;
  const input={down:b=>b===BUTTON.UP}; const y0=p.yFp;
  for(let i=0;i<12;i++) tickPlayerMotion(p,stage.map,input,[]);
  return {y0:y0>>4,y1:p.yFp>>4};
}

test('ZS-M32-001','package advances to 1.0.0-rc.9 and enables the M32 suite',()=>{
  const pkg=JSON.parse(read('package.json')); assert.equal(pkg.version,'1.0.0-rc.9'); assert.match(pkg.scripts.test,/run-m32-tests/); assert.match(pkg.scripts['test:m32'],/run-m32-tests/);
});

test('ZS-M32-002','browser direction adapter makes the latest vertical direction win',()=>{
  const h=createHeldDirections(); pressDirection(h,'DOWN'); pressDirection(h,'UP'); assert.deepEqual(h,{UP:true,DOWN:false,LEFT:false,RIGHT:false});
  pressDirection(h,'DOWN'); assert.deepEqual(h,{UP:false,DOWN:true,LEFT:false,RIGHT:false});
});

test('ZS-M32-003','horizontal opposite directions remain independent for source-faithful core semantics',()=>{
  const h=createHeldDirections(); pressDirection(h,'LEFT'); pressDirection(h,'RIGHT'); assert.equal(h.LEFT,true); assert.equal(h.RIGHT,true);
});

test('ZS-M32-004','release and clear cannot leave a stale vertical key latched',()=>{
  const h=createHeldDirections(); pressDirection(h,'DOWN'); releaseDirection(h,'DOWN'); assert.equal(h.DOWN,false); pressDirection(h,'UP'); pressDirection(h,'LEFT'); clearDirections(h); assert.deepEqual(h,{UP:false,DOWN:false,LEFT:false,RIGHT:false});
});

test('ZS-M32-005','the reported stuck-ladder path is reproduced and fixed at the browser adapter boundary',()=>{
  const stage=makeDay1Stage(); const p=makePlayer(78,152); const h=createHeldDirections();
  // Old browser behavior could leave both bits true; the certified core then intentionally cancels vertical intent.
  h.DOWN=true; h.UP=true; const oldY=p.yFp; for(let i=0;i<8;i++) tickPlayerMotion(p,stage.map,{down:b=>b===BUTTON.UP?h.UP:b===BUTTON.DOWN?h.DOWN:false},[]); assert.equal(p.yFp,oldY);
  // A fresh UP press now clears stale DOWN and the same real ladder climbs.
  pressDirection(h,'UP'); for(let i=0;i<8;i++) tickPlayerMotion(p,stage.map,{down:b=>b===BUTTON.UP?h.UP:b===BUTTON.DOWN?h.DOWN:false},[]); assert.ok(p.yFp<oldY);
});

test('ZS-M32-006','every ordinary upward ladder shaft remains climbable at normal and coffee-boost speeds',()=>{
  let count=0; for(const stage of stages()) for(const e of ordinaryUpEntries(stage)) for(const speed of [16,24,34]){const r=climbFromEntry(stage,e,speed); assert.ok(r.y1<r.y0,`${stage.name} row ${e.row} speed ${speed}: ${r.y0}->${r.y1}`); count++;} assert.ok(count>=30,`only ${count} ladder cases`);
});

test('ZS-M32-007','historical edge-ladder wrap remains directional rather than being changed into generic stairs',()=>{
  const stage=makeDay5Stage();
  const up=makePlayer(118,184); tickPlayerMotion(up,stage.map,{down:b=>b===BUTTON.UP},[]); assert.equal(up.yFp>>4,184);
  const down=makePlayer(118,184); for(let i=0;i<25;i++) tickPlayerMotion(down,stage.map,{down:b=>b===BUTTON.DOWN},[]); assert.ok((down.yFp>>4)<100,`expected bottom wrap, got y=${down.yFp>>4}`);
});

test('ZS-M32-008','UI explicitly explains the original top/bottom ladder wrap in EN and IT',()=>{
  const s=read('web/app.js'); assert.match(s,/Edge ladders wrap vertically/); assert.match(s,/Le scale ai bordi continuano verticalmente/); assert.match(s,/strings\.wrapRule/);
});

test('ZS-M32-009','keyboard uses de-stick adapter and ignores direction auto-repeat as a new intent',()=>{
  const s=read('web/app.js'); assert.match(s,/if\(dir\)\{if\(!e\.repeat\)\{pressDirection\(held,dir\)/); assert.match(s,/releaseDirection\(held,dir\)/);
});

test('ZS-M32-010','touch, blur, visibility and pause/stage transitions clear or normalize held directions',()=>{
  const s=read('web/app.js'); assert.match(s,/v\?pressDirection\(held,dir\):releaseDirection\(held,dir\)/); assert.match(s,/window\.addEventListener\('blur',\(\)=>\{clearHeldDirections\(\)/); assert.match(s,/visibilitychange'[\s\S]*clearHeldDirections\(\)/); assert.match(s,/paused=!paused; syncPauseButton\(\);[\s\S]*clearHeldDirections\(\)/); assert.match(s,/function startDay\(day\)\{\s*clearHeldDirections\(\)/);
});

test('ZS-M32-011','certified deterministic core, M28 renderer and M26 audio remain byte-identical',()=>{
  assert.equal(sha('src/player.js'),'a83dc581c96647f355734836f0a750b449cfa3c23d5f3b37aab1afeb2cd60ce9');
  assert.equal(sha('src/simulation.js'),'ae1e1fb10d34e5fdd2003ae7b41a4e13233f094cfff7548de59a9b4c4be17168');
  assert.equal(sha('web/renderer.js'),'df8b1e3529a928130dd19a79b375faa47732ba4ffed86bebadbfb248dcf4500d');
  assert.equal(sha('web/audio.js'),'8f428e9e2bb26e54517e5a1e60c280a82d6f93e716cd0b9314f8c6f9707f96a1');
});

test('ZS-M32-012','M32 adds no historical/sample media files',()=>{
  const forbidden=[]; const walk=dir=>{for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,ent.name);if(ent.isDirectory())walk(full);else if(/\.(wav|mp3|ogg|flac|m4a|png|gif|jpe?g|webp|chr|nes|nsf|ftm)$/i.test(ent.name))forbidden.push(path.relative(root,full));}}; walk(root); assert.deepEqual(forbidden,[]);
});

const failed=results.filter(r=>!r.ok);
const report={baseline:'Zooming Secretary M32 ladder-input reliability and wrap guidance',version:'1.0.0-rc.9',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m32-test-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`\n${report.passed}/${report.total} M32 tests passed`); if(failed.length)process.exit(1);
