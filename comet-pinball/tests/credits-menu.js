'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const elements=new Map(),frames=[],listeners={};let now=1000,steps=0;
function element(id){
  if(elements.has(id))return elements.get(id);
  const classes=new Set();const el={id,hidden:false,textContent:'',innerHTML:'',value:'',attributes:{},
    classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},
    addEventListener(k,fn){this[k]=fn;},setAttribute(k,v){this.attributes[k]=v;},focus(){},setPointerCapture(){},click(){this.onclick?.();}};
  elements.set(id,el);return el;
}
const canvas=element('game');canvas.width=456;canvas.height=840;
canvas.getContext=()=>new Proxy({createLinearGradient(){return {addColorStop(){}}},createRadialGradient(){return {addColorStop(){}}}},{get(o,k){return k in o?o[k]:()=>{}},set(o,k,v){o[k]=v;return true}});
const document={getElementById:element,hidden:false,addEventListener(k,fn){listeners[`document:${k}`]=fn;}};
const context=vm.createContext({document,localStorage:{getItem(){return null},setItem(){}},performance:{now:()=>now},requestAnimationFrame:fn=>frames.push(fn),console,Math,Number,Set,Map});
context.window=context;context.globalThis=context;context.addEventListener=(k,fn)=>listeners[k]=fn;
for(const file of ['public/data/playfield.js','public/js/physics.js','public/js/camera.js','public/js/audio.js','public/js/visuals.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const Engine=context.CometPhysics.Engine;
context.CometPhysics.Engine=class extends Engine{step(...args){steps++;return super.step(...args)}};
context.navigator={language:'it-IT',languages:['it-IT']};
vm.runInContext(fs.readFileSync(path.join(root,'public/js/i18n.js'),'utf8'),context,{filename:'public/js/i18n.js'});
vm.runInContext(fs.readFileSync(path.join(root,'public/js/comet.js'),'utf8'),context,{filename:'public/js/comet.js'});
function tick(n=1){for(let i=0;i<n;i++){now+=1000/60;const fn=frames.shift();assert.equal(typeof fn,'function');fn(now)}}
const content=()=>element('overlay').innerHTML;
assert.match(content(),/showCredits/,'credits accessible from opening menu');
element('showCredits').click();
assert.match(content(),/Patrick Haring e Christian Bürgi/);
assert.match(content(),/Libre Arcade/);
assert.match(content(),/https:\/\/linkingtechnologies\.github\.io\/libre-arcade\//);
assert.match(content(),/Visita Libre Arcade/);
assert.match(content(),/rel="noopener noreferrer"/);
assert.match(content(),/Mechanical Night loop · CC0 1.0/);
assert.match(content(),/Apache 2.0/);
assert.match(content(),/https:\/\/github.com\/boskoop\/comet-pinball/);
assert.match(content(),/backCredits/);
const at=steps;tick(45);assert.equal(steps,at,'credits must not simulate a game');
element('backCredits').click();assert.match(content(),/GIOCA/);
element('showCredits').click();listeners.keydown({key:'Escape',target:canvas,preventDefault(){}});
assert.match(content(),/GIOCA/,'Escape should return from credits to menu');
element('startGame').click();tick(3);assert.equal(steps,at+3,'starting a game still works after credits');
console.log('PASS credits: source attribution, music/license, back/Escape, freeze and start game');
