import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ArcadeRenderer } from '../web/renderer.js';
import { TILE } from '../src/map.js';
import { DIR } from '../src/npc.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const sha=rel=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,rel))).digest('hex');
const results=[];
function test(id,name,fn){try{fn();results.push({id,name,ok:true});console.log('PASS',id,name);}catch(error){results.push({id,name,ok:false,error:String(error?.stack||error)});console.error('FAIL',id,name,error);}}

class FakeContext {
  constructor(){this.calls=[];this._fillStyle='';this._strokeStyle='';}
  set fillStyle(v){this._fillStyle=v;} get fillStyle(){return this._fillStyle;}
  set strokeStyle(v){this._strokeStyle=v;} get strokeStyle(){return this._strokeStyle;}
  fillRect(x,y,w,h){this.calls.push({op:'fillRect',x,y,w,h,fill:this._fillStyle});}
  strokeRect(x,y,w,h){this.calls.push({op:'strokeRect',x,y,w,h,stroke:this._strokeStyle});}
}
const makeRenderer=()=>{const ctx=new FakeContext();const canvas={getContext:()=>ctx};return {renderer:new ArcadeRenderer(canvas,{calls:'CALL',misses:'MISS',dreamMiss:'-',memory:'MEM',none:'NONE',any:'ANY',earth:'EARTH',history:'HISTORY',books:'BOOKS',space:'SPACE',boost:'BOOST'}),ctx};};
const singleTileMap=tile=>({width:1,height:1,get:()=>tile});
const player=(over={})=>({xFp:32<<4,yFp:80<<4,dir:DIR.RIGHT,dirPrev:DIR.RIGHT,stepAnim:0,knocked:0,answerTicks:0,wisdom:0,...over});

test('ZS-M28-001','package is RC5-or-later and M28 suite remains enabled',()=>{
  const pkg=JSON.parse(read('package.json')); const m=/^1\.0\.0-rc\.(\d+)$/.exec(pkg.version); assert.ok(m && Number(m[1])>=5,pkg.version);
  assert.match(pkg.scripts.test,/run-m28-tests/); assert.match(pkg.scripts['test:m28'],/run-m28-tests/);
});

test('ZS-M28-002','playfield uses sparse black NES-like backdrop instead of the modern grid wallpaper',()=>{
  const {renderer,ctx}=makeRenderer(); renderer.drawBackdrop();
  assert.deepEqual(ctx.calls,[{op:'fillRect',x:0,y:0,w:256,h:240,fill:'#000000'}]);
});

test('ZS-M28-003','platform tile is a new cyan-magenta-white pixel pattern',()=>{
  const {renderer,ctx}=makeRenderer(); renderer.drawMap(singleTileMap(TILE.WALL));
  const colors=new Set(ctx.calls.filter(x=>x.op==='fillRect').map(x=>x.fill));
  assert.ok(colors.has('#f7f4e8')); assert.ok(colors.has('#38d9f5')); assert.ok(colors.has('#e64aa5'));
  assert.ok(ctx.calls.length>=7);
});

test('ZS-M28-004','ladder is pixel-only with white rails and cyan rungs',()=>{
  const {renderer,ctx}=makeRenderer(); renderer.drawMap(singleTileMap(TILE.LADDER));
  assert.ok(ctx.calls.some(x=>x.fill==='#f7f4e8'&&x.w===1&&x.h===8));
  assert.ok(ctx.calls.some(x=>x.fill==='#38d9f5'&&x.w===4&&x.h===1));
});

test('ZS-M28-005','cabinet topics use new filing-cabinet geometry and icon glyphs without external art',()=>{
  const {renderer,ctx}=makeRenderer(); renderer.drawTopics({topics:[{x:40,y:80,id:0},{x:80,y:80,id:3}]});
  assert.ok(ctx.calls.some(x=>x.fill==='#55c441'&&x.w===13&&x.h===12));
  assert.ok(ctx.calls.some(x=>x.fill==='#38d9f5'));
});

test('ZS-M28-006','phones use pixel handset/body and ring rays; urgent phase turns white',()=>{
  const {renderer,ctx}=makeRenderer(); renderer.drawPhones({phones:{phones:[{x:40,y:70,level:3,topic:1}]}});
  assert.ok(ctx.calls.some(x=>x.fill==='#f7f4e8'&&x.w===8&&x.h===5));
  assert.ok(ctx.calls.some(x=>x.w===2&&x.h===1));
});

test('ZS-M28-007','heroine now uses orange hair and red skirt suit while remaining inside 16x24 footprint',()=>{
  const {renderer,ctx}=makeRenderer(); renderer.drawPlayer({player:player()});
  const rects=ctx.calls.filter(x=>x.op==='fillRect');
  assert.ok(rects.some(x=>x.fill==='#f08a2d')); assert.ok(rects.some(x=>x.fill==='#e34f55')); assert.ok(rects.some(x=>x.fill==='#9e303f'));
  for(const r of rects){assert.ok(r.x>=32&&r.x+r.w<=48,JSON.stringify(r));assert.ok(r.y>=80&&r.y+r.h<=104,JSON.stringify(r));}
});

test('ZS-M28-008','NPC rendering is prop-based pixel art with no debug G M D lettering',()=>{
  const s=read('web/renderer.js');
  assert.match(s,/geek=n\.type==='geek'/); assert.match(s,/manbox=n\.type==='manbox'/); assert.match(s,/dibrov=n\.type==='dibrov'/);
  assert.doesNotMatch(s,/fillText\(/); assert.doesNotMatch(s,/fillText\('G'|fillText\('M'|fillText\('D'/);
});

test('ZS-M28-009','renderer is still procedural clean-room media with no image or historical tile dependency',()=>{
  const s=read('web/renderer.js');
  assert.match(s,/not a traced or byte-derived historical tile/); assert.match(s,/intentionally not traced/);
  assert.doesNotMatch(s,/drawImage\(|\.png|\.gif|\.jpg|\.webp|tileset\.chr|map[1-7]_nam/i);
});

test('ZS-M28-010','gameplay movement and simulation are byte-identical to M27',()=>{
  assert.equal(sha('src/player.js'),'a83dc581c96647f355734836f0a750b449cfa3c23d5f3b37aab1afeb2cd60ce9');
  assert.equal(sha('src/simulation.js'),'ae1e1fb10d34e5fdd2003ae7b41a4e13233f094cfff7548de59a9b4c4be17168');
});

test('ZS-M28-011','M26/M27 procedural audio engine remains byte-identical',()=>{
  assert.equal(sha('web/audio.js'),'8f428e9e2bb26e54517e5a1e60c280a82d6f93e716cd0b9314f8c6f9707f96a1');
});

test('ZS-M28-012','release still contains no raster/sampled historical media',()=>{
  const forbidden=[];
  const walk=dir=>{for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,ent.name);if(ent.isDirectory())walk(full);else if(/\.(wav|mp3|ogg|flac|m4a|png|gif|jpe?g|webp|chr|nes)$/i.test(ent.name))forbidden.push(path.relative(root,full));}};
  walk(root); assert.deepEqual(forbidden,[]);
});

const failed=results.filter(r=>!r.ok);
const report={baseline:'Zooming Secretary M28 NES visual fidelity pass',version:'1.0.0-rc.5',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m28-test-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`\n${report.passed}/${report.total} M28 tests passed`); if(failed.length)process.exit(1);
