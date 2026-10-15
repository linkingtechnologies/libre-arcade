import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ArcadeRenderer, pixelTextWidth, wrapPixelText } from '../web/renderer.js';
import { DIR } from '../src/npc.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const sha=rel=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,rel))).digest('hex');
const results=[];
function test(id,name,fn){
  try{fn();results.push({id,name,ok:true});console.log('PASS',id,name);}
  catch(error){results.push({id,name,ok:false,error:String(error?.stack||error)});console.error('FAIL',id,name,error);}
}

class FakeContext {
  constructor(){this.calls=[];this._fillStyle='';this._strokeStyle='';}
  set fillStyle(v){this._fillStyle=v;} get fillStyle(){return this._fillStyle;}
  set strokeStyle(v){this._strokeStyle=v;} get strokeStyle(){return this._strokeStyle;}
  fillRect(x,y,w,h){this.calls.push({op:'fillRect',x,y,w,h,fill:this._fillStyle});}
  strokeRect(x,y,w,h){this.calls.push({op:'strokeRect',x,y,w,h,stroke:this._strokeStyle});}
}
const makeRenderer=()=>{const ctx=new FakeContext(); const canvas={getContext:()=>ctx}; return {renderer:new ArcadeRenderer(canvas,{}),ctx};};
const makePlayer=(overrides={})=>({xFp:32<<4,yFp:80<<4,dir:DIR.NONE,dirPrev:DIR.RIGHT,stepAnim:0,knocked:0,answerTicks:0,wisdom:0,...overrides});

// 1
test('ZS-M27-001','package remains on 1.0.0 release-candidate line (rc.4 or later) and M27 suite is enabled',()=>{
  const pkg=JSON.parse(read('package.json'));
  assert.match(pkg.version,/^1\.0\.0-rc\.(?:[4-9]|[1-9]\d+)$/);
  assert.match(pkg.scripts.test,/run-m27-tests/); assert.match(pkg.scripts['test:m27'],/run-m27-tests/);
});

// 2
test('ZS-M27-002','transient feedback uses bounded bitmap text rather than system-font fillText',()=>{
  const s=read('web/renderer.js');
  const block=s.slice(s.indexOf('  drawMessage() {'),s.indexOf('\n  }\n}',s.indexOf('  drawMessage() {'))+4);
  assert.match(block,/wrapPixelText/); assert.match(block,/drawPixelText/); assert.match(block,/pixelTextWidth/);
  assert.doesNotMatch(block,/fillText\(/); assert.doesNotMatch(block,/measureText\(/); assert.doesNotMatch(block,/system-ui/);
});

// 3
test('ZS-M27-003','Missed call pixels remain vertically and horizontally inside their feedback box',()=>{
  const {renderer,ctx}=makeRenderer(); renderer.flash('Missed call',2); renderer.drawMessage();
  const box=ctx.calls.find(c=>c.op==='fillRect'&&c.fill.startsWith('rgba'));
  assert.ok(box); const pixels=ctx.calls.filter(c=>c.op==='fillRect'&&c!==box);
  assert.ok(pixels.length>0);
  for(const p of pixels){assert.ok(p.x>=box.x+1 && p.x+p.w<=box.x+box.w-1,`x overflow ${JSON.stringify(p)}`);assert.ok(p.y>=box.y+1 && p.y+p.h<=box.y+box.h-1,`y overflow ${JSON.stringify(p)}`);}
});

// 4
test('ZS-M27-004','long English and Italian gameplay messages fit within at most two lines',()=>{
  const samples=[
    'Missed call','Chiamata persa','Answered!','Risposta corretta!','Topic memorized: Space',
    'Argomento memorizzato: Space','Chatter changed it: Literature','Chatter lo ha cambiato: Letteratura',
    'The phone moved!','Il telefono è scappato!','The Ghost caught you!','Il Fantasma ti ha preso!',
    'ManBox knocked you!','ManBox ti ha colpito!','Wisdom: any topic works!','Wisdom: ora va bene qualsiasi argomento!',
    'Phone ringing: Literature','Telefono in arrivo: Letteratura'
  ];
  for(const sample of samples){const lines=wrapPixelText(sample,224,1,2);assert.ok(lines.length>=1&&lines.length<=2,sample);for(const line of lines)assert.ok(pixelTextWidth(line)<=224,`${sample}: ${line}`);}
});

// 5
test('ZS-M27-005','accented Italian text is normalized by the bitmap renderer instead of requiring an external font',()=>{
  const s=read('web/renderer.js'); assert.match(s,/normalize\('NFD'\)/); assert.match(s,/\\u0300-\\u036f/);
  assert.equal(pixelTextWidth('è',1),5); assert.equal(pixelTextWidth('e',1),5);
});

// 6
test('ZS-M27-006','player is rendered from multiple body parts instead of the old 10×17 rectangle',()=>{
  const {renderer,ctx}=makeRenderer(); renderer.drawPlayer({player:makePlayer()});
  const rects=ctx.calls.filter(c=>c.op==='fillRect');
  assert.ok(rects.length>=18,`only ${rects.length} sprite rectangles`);
  assert.ok(!rects.some(r=>r.w===10&&r.h===17),'legacy body rectangle still present');
  assert.ok(new Set(rects.map(r=>r.fill)).size>=6,'sprite lacks visual separation');
});

// 7
test('ZS-M27-007','walk animation changes limbs without changing the 16×24 logical player footprint',()=>{
  const a=makeRenderer(), b=makeRenderer();
  a.renderer.drawPlayer({player:makePlayer({dir:DIR.RIGHT,stepAnim:0})});
  b.renderer.drawPlayer({player:makePlayer({dir:DIR.RIGHT,stepAnim:4})});
  assert.notDeepEqual(a.ctx.calls,b.ctx.calls,'walk frames are identical');
  for(const ctx of [a.ctx,b.ctx]) for(const r of ctx.calls.filter(c=>c.op==='fillRect')){
    assert.ok(r.x>=32 && r.x+r.w<=48,`sprite x footprint ${JSON.stringify(r)}`);
    assert.ok(r.y>=80 && r.y+r.h<=104,`sprite y footprint ${JSON.stringify(r)}`);
  }
});

// 8
test('ZS-M27-008','left/right facing changes face and hair details',()=>{
  const left=makeRenderer(), right=makeRenderer();
  left.renderer.drawPlayer({player:makePlayer({dirPrev:DIR.LEFT})});
  right.renderer.drawPlayer({player:makePlayer({dirPrev:DIR.RIGHT})});
  assert.notDeepEqual(left.ctx.calls,right.ctx.calls);
});

// 9
test('ZS-M27-009','gameplay collision/motion core is byte-identical to M26',()=>{
  assert.equal(sha('src/player.js'),'a83dc581c96647f355734836f0a750b449cfa3c23d5f3b37aab1afeb2cd60ce9');
  assert.equal(sha('src/simulation.js'),'ae1e1fb10d34e5fdd2003ae7b41a4e13233f094cfff7548de59a9b4c4be17168');
});

// 10
test('ZS-M27-010','M26 procedural audio engine is unchanged',()=>{
  assert.equal(sha('web/audio.js'),'8f428e9e2bb26e54517e5a1e60c280a82d6f93e716cd0b9314f8c6f9707f96a1');
});

// 11
test('ZS-M27-011','new player remains clean-room procedural rendering with no image asset dependency',()=>{
  const s=read('web/renderer.js');
  const block=s.slice(s.indexOf('  drawPlayer(sim) {'),s.indexOf('  drawMessage() {'));
  assert.match(block,/clean-room.*(?:office-worker sprite|heroine)/i); assert.doesNotMatch(block,/drawImage\(|\.png|\.gif|\.jpg|\.svg/i);
});

// 12
test('ZS-M27-012','release still bundles no sampled audio or raster player assets',()=>{
  const forbidden=[];
  const walk=dir=>{for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,ent.name);if(ent.isDirectory())walk(full);else if(/\.(wav|mp3|ogg|flac|m4a|png|gif|jpe?g|webp)$/i.test(ent.name))forbidden.push(path.relative(root,full));}};
  walk(root); assert.deepEqual(forbidden,[]);
});

const failed=results.filter(r=>!r.ok);
const report={baseline:'Zooming Secretary M27 message fitting and player readability',version:'1.0.0-rc.4',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m27-test-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`\n${report.passed}/${report.total} M27 tests passed`); if(failed.length)process.exit(1);
