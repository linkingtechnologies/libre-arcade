
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');let now=1000,frames=[];
const elements=new Map(),listeners={};
function el(id){if(elements.has(id))return elements.get(id);const classes=new Set();const o={id,hidden:false,textContent:'',innerHTML:'',value:'',attributes:{},listeners:{},classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k)},addEventListener(k,fn){this.listeners[k]=fn;},setAttribute(k,v){this.attributes[k]=v;},focus(){},setPointerCapture(){},click(){this.onclick?.();}};elements.set(id,o);return o;}
const canvas=el('game');canvas.width=456;canvas.height=840;canvas.getContext=()=>new Proxy({createLinearGradient(){return {addColorStop(){}};},createRadialGradient(){return {addColorStop(){}};}},{get(o,k){return k in o?o[k]:()=>{};},set(o,k,v){o[k]=v;return true;}});
const document={getElementById:el,hidden:false,addEventListener(k,fn){listeners['document:'+k]=fn;}};
const ctx=vm.createContext({document,localStorage:{getItem(){return '[]';},setItem(){}},performance:{now:()=>now},requestAnimationFrame:fn=>frames.push(fn),console,Math,Number,Set,Map});
ctx.window=ctx;ctx.globalThis=ctx;ctx.addEventListener=(k,fn)=>listeners[k]=fn;
for(const p of ['public/data/playfield.js','public/js/physics.js','public/js/camera.js'])vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),ctx,{filename:p});
const Native=ctx.CometPhysics.Engine;
ctx.CometPhysics.Engine=class DrainHarnessEngine extends Native{step(dt,ms,input,handlers){super.step(dt,ms,input,handlers);if(ctx.__drain && this.lastPlunge>-Infinity && !this.drainLatched){ctx.__drain=false;this.drainLatched=true;handlers.onDrain();}if(!ctx.__drain)this.drainLatched=false;}};
for(const p of ['public/js/audio.js','public/js/visuals.js'])vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),ctx,{filename:p});
ctx.navigator={language:'it-IT',languages:['it-IT']};
vm.runInContext(fs.readFileSync(path.join(root,'public/js/i18n.js'),'utf8'),ctx,{filename:'public/js/i18n.js'});
vm.runInContext(fs.readFileSync(path.join(root,'public/js/comet.js'),'utf8'),ctx,{filename:'public/js/comet.js'});
function tick(n=1){for(let i=0;i<n;i++){now+=1000/60;const cb=frames.shift();assert.equal(typeof cb,'function');cb(now);}}
function key(k,down=true,code=k===' '?'Space':''){listeners[down?'keydown':'keyup']({key:k,code,target:canvas,preventDefault(){}});}
function launch(){key(' ',true,'Space');tick(1);key(' ',false,'Space');let guard=0;while(el('launchHint').hidden===false&&guard++<60)tick(1);assert.equal(el('launchHint').hidden,true);} 
assert.match(el('overlay').innerHTML,/GIOCA/);el('startGame').click();tick(1);launch();
ctx.__drain=true;tick(1);assert.equal(el('overlay').innerHTML,'','no blocking overlay after ball 1 drain');assert.match(el('turnToast').innerHTML,/Prossima pallina 2 \/ 3/);assert.match(el('ballText').textContent,/2 \/ 3/);tick(60);assert.equal(el('overlay').innerHTML,'');launch();
ctx.__drain=true;tick(1);assert.equal(el('overlay').innerHTML,'','no blocking overlay after ball 2 drain');assert.match(el('turnToast').innerHTML,/Prossima pallina 3 \/ 3/);assert.match(el('ballText').textContent,/3 \/ 3/);tick(60);launch();
ctx.__drain=true;tick(1);assert.match(el('overlay').innerHTML,/PARTITA FINITA/,'game-over overlay only after ball 3');
console.log('PASS M13.6 turn flow: balls 1 and 2 auto-advance with a toast; game over remains only after ball 3');
