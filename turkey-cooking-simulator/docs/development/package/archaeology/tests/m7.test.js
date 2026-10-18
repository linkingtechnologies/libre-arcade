import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  DESIGN, PORTRAIT_DESIGN, LayoutMode, layoutForViewport, fitAdaptiveCanvas,
  clientToCanvas, marketCategory, minimumTouchTarget
} from '../src/js/ui-shell.js';

let passed=0;
function test(name,fn){fn();passed++;console.log(`PASS M7-${String(passed).padStart(2,'0')} ${name}`);}

test('landscape keeps 960x600 logical space',()=>assert.deepEqual(layoutForViewport(1280,720),{mode:LayoutMode.LANDSCAPE,design:{...DESIGN}}));
test('portrait switches to dedicated 600x960 logical space',()=>assert.deepEqual(layoutForViewport(390,844),{mode:LayoutMode.PORTRAIT,design:{...PORTRAIT_DESIGN}}));
test('short landscape selects compact mode',()=>assert.equal(layoutForViewport(800,430).mode,LayoutMode.COMPACT_LANDSCAPE));
test('adaptive portrait canvas fits without vertical overflow',()=>{const f=fitAdaptiveCanvas(360,640);assert.equal(f.mode,LayoutMode.PORTRAIT);assert.ok(f.cssWidth<=360&&f.cssHeight<=640);});
test('portrait pointer mapping uses active design dimensions',()=>{const p=clientToCanvas(180,320,{left:0,top:0,width:360,height:640},PORTRAIT_DESIGN);assert.deepEqual(p,{x:300,y:480});});
test('portrait touch target minimum is at least 48px',()=>assert.ok(minimumTouchTarget(LayoutMode.PORTRAIT)>=48));
test('turkeys are categorized separately',()=>assert.equal(marketCategory({name:'Organic Turkey',kind:'turkey'}),'turkeys'));
test('probe/alarm/cookbook/oven light are essentials',()=>{for(const name of ['Temperature Probe','Alarm Clock','Cookbook','Oven Light in a Box'])assert.equal(marketCategory({name,kind:'x'}),'essentials');});
test('frills and stuffing are extras',()=>{for(const name of ['Frills Box','Special Stuffing'])assert.equal(marketCategory({name,kind:'x'}),'extras');});
test('app source has dedicated portrait and landscape kitchen composition',()=>{const s=fs.readFileSync(new URL('../src/js/app.js',import.meta.url),'utf8');assert.ok(s.includes('drawKitchenControlsPortrait'));assert.ok(s.includes('drawKitchenControlsLandscape'));});
test('M7 still references no original PNG or MP3 assets',()=>{const s=fs.readFileSync(new URL('../src/js/app.js',import.meta.url),'utf8');assert.ok(!/res\/screens|res\/sound|\.png|\.mp3/i.test(s));});
test('CSS includes safe-area support and keeps no-scroll',()=>{const c=fs.readFileSync(new URL('../src/css/app.css',import.meta.url),'utf8');assert.match(c,/safe-area-inset-top/);assert.match(c,/overflow\s*:\s*hidden/);assert.match(c,/touch-action\s*:\s*none/);});
test('credits remain a dedicated screen rather than permanent footer',()=>{const s=fs.readFileSync(new URL('../src/js/app.js',import.meta.url),'utf8');assert.ok(s.includes("case'credits':drawCredits()"));assert.ok(!/footer/i.test(s));});
test('market composition has semantic category tabs in portrait',()=>{const s=fs.readFileSync(new URL('../src/js/app.js',import.meta.url),'utf8');for(const token of ["'turkeys'","'essentials'","'extras'"])assert.ok(s.includes(token));});

console.log(`M7: ${passed}/14 PASS`);
