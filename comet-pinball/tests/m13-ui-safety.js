'use strict';
// Release-candidate regression: destructive controls cannot silently discard a ball.
// Production physics is loaded unchanged; only Canvas/browser mocks are substituted.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'), els=new Map(), listeners={}, frames=[];let now=1000,steps=0;
function el(id){
 if(els.has(id))return els.get(id);
 const cls=new Set();const o={id,hidden:false,textContent:'',innerHTML:'',value:'',attributes:{},
  classList:{add:x=>cls.add(x),remove:x=>cls.delete(x),contains:x=>cls.has(x),toggle:(x,on)=>on?cls.add(x):cls.delete(x)},
  addEventListener(k,fn){this[k]=fn;},setAttribute(k,v){this.attributes[k]=v;},focus(){},setPointerCapture(){},click(){this.onclick?.();}};
 els.set(id,o);return o;
}
const cv=el('game');cv.width=456;cv.height=840;
cv.getContext=()=>new Proxy({createLinearGradient(){return {addColorStop(){}};},createRadialGradient(){return {addColorStop(){}};}},{get(o,k){return k in o?o[k]:()=>{};},set(o,k,v){o[k]=v;return true;}});
const document={getElementById:el,hidden:false,addEventListener(k,fn){listeners['document:'+k]=fn;}};
const ctx=vm.createContext({document,localStorage:{getItem(){return null;},setItem(){}},performance:{now:()=>now},requestAnimationFrame:cb=>frames.push(cb),console,Math,Number,Set,Map});
ctx.window=ctx;ctx.globalThis=ctx;ctx.addEventListener=(k,fn)=>listeners[k]=fn;
for(const name of ['public/data/playfield.js','public/js/physics.js','public/js/camera.js','public/js/audio.js','public/js/visuals.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
const Base=ctx.CometPhysics.Engine;
ctx.CometPhysics.Engine=class extends Base{step(...args){steps++;super.step(...args);}};
ctx.navigator={language:'it-IT',languages:['it-IT']};
vm.runInContext(fs.readFileSync(path.join(root,'public/js/i18n.js'),'utf8'),ctx,{filename:'public/js/i18n.js'});
vm.runInContext(fs.readFileSync(path.join(root,'public/js/comet.js'),'utf8'),ctx,{filename:'public/js/comet.js'});
function tick(n=1){for(let i=0;i<n;i++){now+=1000/60;const f=frames.shift();assert.equal(typeof f,'function');f(now);}}
const overlay=()=>el('overlay').innerHTML;
assert.match(overlay(),/GIOCA/);el('startGame').click();tick(2);
const before=steps;el('menuBtn').click();tick(10);
assert.match(overlay(),/Uscire dalla partita/);assert.equal(steps,before,'exit confirmation must freeze simulation');
el('cancelMenu').click();tick(2);assert.equal(steps,before+2,'exit cancel resumes game without resetting');
el('resetBtn').click();assert.match(overlay(),/Nuova partita/);
el('cancelRestart').click();tick();assert.match(overlay(),/^$/,'restart cancel closes dialog');
el('pauseBtn').click();assert.match(overlay(),/IN PAUSA/);
const pausedSteps=steps;el('resetBtn').click();tick(10);
assert.match(overlay(),/Nuova partita/,'restart from pause asks to restart, NOT to forfeit');
assert.doesNotMatch(overlay(),/Terminare questa pallina/);assert.equal(steps,pausedSteps);
el('cancelRestart').click();assert.match(overlay(),/IN PAUSA/,'cancel returns to paused controls');
el('menuBtn').click();assert.match(overlay(),/Uscire dalla partita/);
el('cancelMenu').click();assert.match(overlay(),/IN PAUSA/);
el('resumeGame').click();tick();assert.equal(steps,pausedSteps+1);
el('pauseBtn').click();el('resetBtn').click();el('yesRestart').click();tick();
assert.match(el('ballText').textContent,/1 \/ 3/,'explicit restart starts first ball');
el('menuBtn').click();el('yesMenu').click();assert.match(overlay(),/GIOCA/);
console.log('PASS M13: menu/restart confirmation, cancel/resume, paused restart does not forfeit, no simulation during dialogs');
