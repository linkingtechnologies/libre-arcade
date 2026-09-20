'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');
const elements=new Map(),listeners={};let frames=[];
function element(id){
  if(elements.has(id))return elements.get(id);
  const classes=new Set();
  const obj={id,innerHTML:'',textContent:'',value:'',hidden:false,style:{},attributes:{},listeners:{},
    classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},
    addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(k,v){this.attributes[k]=v;},
    focus(){},setPointerCapture(){}};
  elements.set(id,obj);return obj;
}
const canvas=element('game');canvas.width=456;canvas.height=840;
const context2d=new Proxy({createLinearGradient(){return {addColorStop(){}};},createRadialGradient(){return {addColorStop(){}};}},{get(obj,k){if(k in obj)return obj[k];return ()=>{};},set(obj,k,v){obj[k]=v;return true;}});
canvas.getContext=()=>context2d;
const document={getElementById:element,hidden:false,addEventListener(type,fn){listeners['document:'+type]=fn;}};
let time=1000;
const ctx=vm.createContext({document,performance:{now:()=>time},requestAnimationFrame:fn=>frames.push(fn),localStorage:{getItem:()=>null,setItem(){}},console,Math,Number,Set,Map});
ctx.navigator={language:'it-IT',languages:['it-IT']};ctx.window=ctx;ctx.globalThis=ctx;ctx.addEventListener=(k,fn)=>listeners[k]=fn;
for(const file of ['public/data/playfield.js','public/js/physics.js','public/js/camera.js','public/js/audio.js','public/js/visuals.js','public/js/i18n.js','public/js/comet.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
assert.ok(element('overlay').classList.contains('show'),'menu opens');
assert.equal(typeof element('startGame').onclick,'function','start button is wired');
element('startGame').onclick();
assert.ok(!element('overlay').classList.contains('show'),'game opens');
function tick(count){for(let i=0;i<count;i++){time+=1000/60;const cb=frames.shift();assert.equal(typeof cb,'function');cb(time);}}
tick(1);
assert.equal(element('launchHint').hidden,false,'launch prompt visible when ball is waiting');
listeners.keydown({key:' ',code:'Space',target:canvas,preventDefault(){}});
tick(1);
listeners.keyup({key:' ',code:'Space',target:canvas,preventDefault(){}});
tick(17); // a one-frame tap is retained until the untouched native plunger sensor is ready
assert.equal(element('launchHint').hidden,true,'ball launches on Space');
const before=element('viewBtn').textContent;
element('viewBtn').onclick();tick(1);
assert.notEqual(element('viewBtn').textContent,before,'camera toggle responds');
element('viewBtn').onclick();tick(1);
assert.equal(element('viewBtn').attributes['aria-pressed'],'true','follow mode can be re-enabled');
assert.match(element('scoreText').textContent,/^\d{6}$/,'score remains visible');
console.log('PASS DOM/Canvas smoke: game/menu, 60 Hz render, short-tap launch, follow toggle and HUD');
