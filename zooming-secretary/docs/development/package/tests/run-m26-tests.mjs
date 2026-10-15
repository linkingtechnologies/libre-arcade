import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AudioEngine } from '../web/audio.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const results=[];
function test(id,name,fn){
  try{
    const value=fn();
    if(value?.then) return value.then(()=>{results.push({id,name,ok:true});console.log('PASS',id,name);}).catch(error=>{results.push({id,name,ok:false,error:String(error?.stack||error)});console.error('FAIL',id,name,error);});
    results.push({id,name,ok:true}); console.log('PASS',id,name);
  }catch(error){results.push({id,name,ok:false,error:String(error?.stack||error)});console.error('FAIL',id,name,error);}
}

class FakeParam {
  constructor(value=0){this.value=value;this.events=[];}
  setValueAtTime(value,time){this.value=value;this.events.push(['set',value,time]);}
  exponentialRampToValueAtTime(value,time){this.value=value;this.events.push(['exp',value,time]);}
}
class FakeNode { constructor(ctx){this.ctx=ctx;} connect(){this.ctx.connections++; return this;} }
class FakeGain extends FakeNode { constructor(ctx){super(ctx);this.gain=new FakeParam(1);} }
class FakeOscillator extends FakeNode {
  constructor(ctx){super(ctx);this.frequency=new FakeParam(440);this.type='sine';}
  start(time){this.ctx.starts.push(['osc',time,this.type]);}
  stop(time){this.ctx.stops.push(['osc',time]);}
}
class FakeBuffer { constructor(length){this.data=new Float32Array(length);} getChannelData(){return this.data;} }
class FakeBufferSource extends FakeNode { start(time){this.ctx.starts.push(['buffer',time]);} }
class FakeAudioContext {
  constructor(){this.state='suspended';this.currentTime=1;this.sampleRate=8000;this.destination={};this.resumeCount=0;this.connections=0;this.starts=[];this.stops=[];this.buffers=0;}
  async resume(){this.resumeCount++;this.state='running';}
  createGain(){return new FakeGain(this);}
  createOscillator(){return new FakeOscillator(this);}
  createBuffer(_channels,length){this.buffers++;return new FakeBuffer(length);}
  createBufferSource(){return new FakeBufferSource(this);}
}
const flush=async()=>{await Promise.resolve();await Promise.resolve();};

await test('ZS-M26-001','package remains on the 1.0.0 release-candidate line (rc.3 or later) and M26 suite is enabled',()=>{
  const pkg=JSON.parse(read('package.json'));
  assert.match(pkg.version,/^1\.0\.0-rc\.(?:[3-9]|[1-9]\d+)$/);
  assert.match(pkg.scripts.test,/run-m26-tests/); assert.match(pkg.scripts['test:m26'],/run-m26-tests/);
});

await test('ZS-M26-002','pause card uses a dedicated concise bilingual resume hint',()=>{
  const s=read('web/app.js');
  assert.match(s,/pauseHint:'Press P or Esc to resume\.'/);
  assert.match(s,/pauseHint:'Premi P o Esc per riprendere\.'/);
  assert.match(s,/overlayText\.textContent=strings\.pauseHint/);
  assert.doesNotMatch(s,/overlayTitle\.textContent=strings\.pause;overlayText\.textContent=strings\.keys/);
});

await test('ZS-M26-003','top pause action is hidden while paused or otherwise inactive',()=>{
  const s=read('web/app.js');
  assert.match(s,/pauseBtn\.hidden=paused\|\|!running/);
  assert.match(s,/function syncPauseButton/);
  assert.match(s,/paused=!paused; syncPauseButton\(\)/);
});

await test('ZS-M26-004','permanent footer help remains the full control reference',()=>{
  const s=read('web/app.js');
  assert.match(s,/keys:'Move: arrows \/ WASD · P or Esc: pause · M: sound'/);
  assert.match(s,/keys:'Muovi: frecce \/ WASD · P o Esc: pausa · M: audio'/);
  assert.match(s,/hint\.textContent=strings\.keys/);
});

await test('ZS-M26-005','HUD uses bitmap pixels rather than antialiased system font text',()=>{
  const s=read('web/renderer.js');
  assert.match(s,/const PIXEL_GLYPHS/); assert.match(s,/function drawPixelText/);
  const hud=s.slice(s.indexOf('  drawHud(sim) {'),s.indexOf('  drawMap(map) {'));
  assert.match(hud,/drawPixelText/); assert.doesNotMatch(hud,/fillText\(/); assert.doesNotMatch(hud,/system-ui/);
});

await test('ZS-M26-006','bitmap HUD covers alphabet, digits and required punctuation',()=>{
  const s=read('web/renderer.js');
  for(const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:/-.!?') assert.ok(s.includes(`'${ch}'`)||s.includes(`'${ch}':`),`missing glyph ${ch}`);
});

await test('ZS-M26-007','Web Audio unlock creates master gain and resumes a suspended context',async()=>{
  const ctx=new FakeAudioContext(); const audio=new AudioEngine({enabled:true,contextFactory:ctx});
  assert.equal(await audio.unlock(),true); assert.equal(ctx.state,'running'); assert.equal(ctx.resumeCount,1);
  assert.ok(audio.master); assert.equal(audio.master.gain.value,0.16); assert.ok(ctx.connections>=1);
});

await test('ZS-M26-008','every declared runtime sound effect schedules audible Web Audio nodes',async()=>{
  const ctx=new FakeAudioContext(); const audio=new AudioEngine({enabled:true,contextFactory:ctx}); await audio.unlock();
  const names=['start','ring','answer','topic','miss','coffee-ready','coffee','teleport','ghost','knock','wisdom','win','lose','pause','resume','ui'];
  for(const name of names){
    const before=ctx.starts.length; audio.play(name); await flush();
    assert.ok(ctx.starts.length>before,`${name} scheduled no source`);
  }
});

await test('ZS-M26-009','knock effect schedules both noise and tonal components',async()=>{
  const ctx=new FakeAudioContext(); const audio=new AudioEngine({enabled:true,contextFactory:ctx}); await audio.unlock();
  audio.play('knock'); await flush();
  assert.ok(ctx.starts.some(x=>x[0]==='buffer'),'knock noise missing');
  assert.ok(ctx.starts.some(x=>x[0]==='osc'),'knock tone missing');
  assert.ok(ctx.buffers>=1);
});

await test('ZS-M26-010','mute silences master gain and prevents new sources from being scheduled',async()=>{
  const ctx=new FakeAudioContext(); const audio=new AudioEngine({enabled:true,contextFactory:ctx}); await audio.unlock();
  audio.setEnabled(false); assert.equal(audio.master.gain.value,0);
  const before=ctx.starts.length; audio.play('win'); await flush(); assert.equal(ctx.starts.length,before);
  audio.setEnabled(true); assert.equal(audio.master.gain.value,0.16); audio.play('ui'); await flush(); assert.ok(ctx.starts.length>before);
});

await test('ZS-M26-011','gameplay/UI event routing references the complete sound vocabulary',()=>{
  const s=read('web/app.js');
  for(const name of ['start','ring','answer','topic','miss','coffee-ready','coffee','teleport','ghost','knock','wisdom','ui']) assert.ok(s.includes(`audio.play('${name}')`),name);
  assert.ok(s.includes("audio.play(won?'win':'lose')"));
  assert.ok(s.includes("audio.play(paused?'pause':'resume')"));
  assert.match(s,/localStorage\.setItem\('zs-sound'/); assert.match(s,/audio\.unlock\(\)/);
});

await test('ZS-M26-012','release still bundles no historical or sampled audio files',()=>{
  const forbidden=[];
  const walk=dir=>{for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,ent.name);if(ent.isDirectory())walk(full);else if(/\.(wav|mp3|ogg|flac|m4a|famitracker|ftm|nsf)$/i.test(ent.name))forbidden.push(path.relative(root,full));}};
  walk(root); assert.deepEqual(forbidden,[]);
  const s=read('web/audio.js'); assert.match(s,/synthesizes all effects at runtime/); assert.match(s,/AudioContext|webkitAudioContext/);
});

const failed=results.filter(r=>!r.ok);
const report={baseline:'Zooming Secretary M26 UI polish and Web Audio verification',version:'1.0.0-rc.3',total:results.length,passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(root,'docs/m26-test-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`\n${report.passed}/${report.total} M26 tests passed`); if(failed.length)process.exit(1);
