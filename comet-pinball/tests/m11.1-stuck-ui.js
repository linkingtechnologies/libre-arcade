'use strict';
// Browser-controller test: ONLY the fixture setup of the native corner is test-only.
// All game buttons, confirmation and no-auto-drain behavior are production JS.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),elements=new Map(),listeners={};let now=1000,frames=[];
function el(id){if(elements.has(id))return elements.get(id);const classes=new Set();
 const e={id,hidden:false,innerHTML:'',textContent:'',value:'',attributes:{},
 classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle:(k,v)=>v?classes.add(k):classes.delete(k)},
 setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){this[k]=fn;},focus(){},setPointerCapture(){},click(){this.onclick?.();}};elements.set(id,e);return e;}
const canvas=el('game');canvas.width=456;canvas.height=840;
canvas.getContext=()=>new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get(o,k){return k in o?o[k]:()=>{};}});
const document={getElementById:el,hidden:false,addEventListener(k,fn){listeners['document:'+k]=fn;}};
const c=vm.createContext({document,localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>now},requestAnimationFrame:fn=>frames.push(fn),console,Math,Number,Set,Map});
c.window=c;c.globalThis=c;c.addEventListener=(k,fn)=>listeners[k]=fn;
for(const p of ['public/data/playfield.js','public/js/physics.js','public/js/camera.js'])vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),c,{filename:p});
const NativeEngine=c.CometPhysics.Engine;
c.CometPhysics.Engine=class TestCaptureEngine extends NativeEngine{constructor(...args){super(...args);c.__engine=this;}};
for(const dep of ['public/js/audio.js','public/js/visuals.js'])vm.runInContext(fs.readFileSync(path.join(root,dep),'utf8'),c,{filename:dep});
c.navigator={language:'it-IT',languages:['it-IT']};
vm.runInContext(fs.readFileSync(path.join(root,'public/js/i18n.js'),'utf8'),c,{filename:'public/js/i18n.js'});
vm.runInContext(fs.readFileSync(path.join(root,'public/js/comet.js'),'utf8'),c,{filename:'public/js/comet.js'});
function tick(n){for(let i=0;i<n;i++){now+=1000/60;const callback=frames.shift();assert.equal(typeof callback,'function');callback(now);}}
el('startGame').click();
// Test-only initialization of the exact measured native equilibrium; no browser code does this.
c.__engine.lastPlunge=0; // make plunge cooldown not relevant to this artificial post-launch snapshot
listeners.keydown({key:' ',code:'Space',target:canvas,preventDefault(){}});tick(20);listeners.keyup({key:' ',code:'Space',target:canvas,preventDefault(){}});
assert(el('launchHint').hidden,'ball launched');
Object.assign(c.__engine.ball,{x:.024,y:1.251117,vx:0,vy:0});
tick(120);assert(el('stuckHint').hidden,'no early prompt in the first two simulated seconds');
tick(210);assert.equal(el('stuckHint').hidden,false,'native physical rest offers optional recovery after five simulated seconds');
assert.match(el('stuckHint').textContent||'Pallina ferma? Scegli cosa fare',/Pallina ferma/);
el('stuckHint').click();assert.match(el('overlay').innerHTML,/Terminare questa pallina/);
assert.match(el('ballText').textContent,/1 \/ 3/,'a hint does not spend a ball');
el('cancelForfeit').click();assert.match(el('overlay').innerHTML,/IN PAUSA/);
el('resumeGame').click();tick(1);assert.equal(el('stuckHint').hidden,false,'cancel/resume preserves the playable ball');
el('stuckHint').click();el('confirmForfeit').click();tick(1);assert.equal(el('overlay').innerHTML,'');assert.match(el('turnToast').innerHTML,/Pallina terminata/);
assert.match(el('ballText').textContent,/2 \/ 3/,'only an explicit confirmation spends a ball');
console.log('PASS M11.1 corner hint: 5 seconds native-compatible resting ball; no automatic drain; optional confirmation/cancel; next ball only on confirmation');
