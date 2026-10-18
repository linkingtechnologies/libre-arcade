import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fitCanvas, clientToCanvas, formatClock, t, conditionLabel, DESIGN } from '../src/js/ui-shell.js';

let passed=0;
function test(name,fn){fn();passed++;console.log(`PASS M6-${String(passed).padStart(2,'0')} ${name}`);}

test('landscape viewport fits without overflow',()=>{const f=fitCanvas(1280,720);assert.ok(f.cssWidth<=1280&&f.cssHeight<=720);assert.equal(f.cssWidth,1152);assert.equal(f.cssHeight,720);});
test('portrait viewport still fits without vertical scroll',()=>{const f=fitCanvas(360,640);assert.ok(f.cssWidth<=360&&f.cssHeight<=640);});
test('pointer coordinates map back to design space',()=>{const p=clientToCanvas(480,300,{left:0,top:0,width:960,height:600});assert.deepEqual(p,{x:480,y:300});});
test('clock formatting is deterministic',()=>assert.equal(formatClock(3661),'01:01:01'));
test('English is default translation surface',()=>assert.equal(t('en','market'),'Market'));
test('Italian translation surface exists',()=>assert.equal(t('it','market'),'Mercato'));
test('cook condition localizes independently of model',()=>assert.equal(conditionLabel('it','burnt'),'Bruciato'));
test('HTML shell has no external framework or CDN dependency',()=>{const h=fs.readFileSync(new URL('../src/index.html',import.meta.url),'utf8');assert.ok(!/https?:\/\//.test(h));assert.ok(!/createjs|react|vue|pixi/i.test(h));});
test('source shell does not reference quarantined original assets',()=>{const s=fs.readFileSync(new URL('../src/js/app.js',import.meta.url),'utf8');assert.ok(!/res\/screens|res\/sound|\.png|\.mp3/i.test(s));});
test('CSS hard-disables page scrolling and touch browser gestures',()=>{const c=fs.readFileSync(new URL('../src/css/app.css',import.meta.url),'utf8');assert.match(c,/overflow\s*:\s*hidden/);assert.match(c,/touch-action\s*:\s*none/);});
test('canvas design size remains deterministic',()=>assert.deepEqual(DESIGN,{width:960,height:600}));
test('M6 exposes save, language and audio controls in app source',()=>{const s=fs.readFileSync(new URL('../src/js/app.js',import.meta.url),'utf8');for(const token of ['saveGame','toggleLang','toggleAudio','resumeGame'])assert.ok(s.includes(token));});

console.log(`M6: ${passed}/12 PASS`);
