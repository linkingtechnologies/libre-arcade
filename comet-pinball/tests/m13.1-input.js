'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),els=new Map(),listeners={},frames=[];
let now=1000;const samples=[];
function el(id){
  if(els.has(id))return els.get(id);
  const classes=new Set();const out={id,textContent:'',innerHTML:'',hidden:false,value:'',
    classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k)},
    addEventListener(k,fn){this['on'+k]=fn;},setAttribute(){},focus(){},setPointerCapture(){},click(){this.onclick?.();}};
  els.set(id,out);return out;
}
const canvas=el('game');canvas.width=456;canvas.height=840;
canvas.getContext=()=>new Proxy({createLinearGradient(){return {addColorStop(){}};},createRadialGradient(){return {addColorStop(){}};}},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
const document={getElementById:el,hidden:false,addEventListener(k,fn){listeners['document:'+k]=fn;}};
const ctx=vm.createContext({document,localStorage:{getItem(){return null;},setItem(){}},performance:{now:()=>now},requestAnimationFrame:cb=>frames.push(cb),console,Math,Number,Set,Map});
ctx.window=ctx;ctx.globalThis=ctx;ctx.addEventListener=(k,fn)=>listeners[k]=fn;
for(const name of ['public/data/playfield.js','public/js/physics.js','public/js/camera.js','public/js/audio.js','public/js/visuals.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
const Real=ctx.CometPhysics.Engine;
ctx.CometPhysics.Engine=class extends Real{step(dt,t,input,handlers){samples.push({left:input.left,right:input.right,plunge:input.plunge});super.step(dt,t,input,handlers);}};
ctx.navigator={language:'it-IT',languages:['it-IT']};
vm.runInContext(fs.readFileSync(path.join(root,'public/js/i18n.js'),'utf8'),ctx,{filename:'public/js/i18n.js'});
vm.runInContext(fs.readFileSync(path.join(root,'public/js/comet.js'),'utf8'),ctx,{filename:'public/js/comet.js'});
function tick(){now+=1000/60;const f=frames.shift();assert.equal(typeof f,'function');f(now);return samples.at(-1);}
function key(name,down,other={}){let prevented=false;listeners[down?'keydown':'keyup']({key:name,code:name===' '?'Space':'',repeat:false,preventDefault(){prevented=true;},...other});return prevented;}
function ptr(button,id,down){const e={pointerId:id,preventDefault(){}};el(button)['onpointer'+(down?'down':'up')](e);}
function assertFlippers(l,r,msg){const s=tick();assert.deepEqual([s.left,s.right],[l,r],msg);}
assert.match(el('overlay').innerHTML,/GIOCA/);el('startGame').click();tick();
assert(key('ArrowLeft',true));assertFlippers(true,false,'left arrow');
assert(key('a',true));assert(key('ArrowLeft',false));assertFlippers(true,false,'left A still down after arrow release');
assert(key('z',true));assert(key('a',false));assertFlippers(true,false,'left Z still down after A release');
assert(key('z',false));assertFlippers(false,false,'last key release lowers left');
assert(key('ArrowRight',true));assert(key('l',true));assert(key('d',true));assert(key('m',true));assertFlippers(false,true,'right aliases');
for(const alias of ['ArrowRight','l','d'])assert(key(alias,false));
assertFlippers(false,true,'M holds right');assert(key('m',false));assertFlippers(false,false);
assert(key('Tab',true));assert(key('Enter',true));assertFlippers(true,true,'legacy bindings retained');
assert(key('Tab',false));assert(key('Enter',false));assertFlippers(false,false);
assert(key('ArrowLeft',true));assert(key('ArrowRight',true));assertFlippers(true,true,'both flippers simultaneous');
ptr('leftBtn',11,true);assert(key('ArrowLeft',false));assertFlippers(true,true,'touch keeps left held after key release');
ptr('leftBtn',12,true);ptr('leftBtn',11,false);assertFlippers(true,true,'second finger holds same flipper');
ptr('rightBtn',21,true);assert(key('ArrowRight',false));assertFlippers(true,true,'touch keeps right held after key release');
ptr('leftBtn',12,false);ptr('rightBtn',21,false);assertFlippers(false,false,'last finger release lowers flippers');
assert(key('ArrowDown',true));assert.equal(tick().plunge,true,'down arrow activates launch');
assert(key('ArrowDown',false));assert.equal(tick().plunge,false,'release clears launch');
assert(key(' ',true));assert.equal(tick().plunge,true,'space still launches');
assert(key(' ',false));assert.equal(tick().plunge,false);
// Explicit pause and focus loss discard every stale key/pointer, even if keyup never arrives.
assert(key('a',true));ptr('rightBtn',22,true);assertFlippers(true,true);
assert(key('p',true));assert.match(el('overlay').innerHTML,/IN PAUSA/);el('resumeGame').click();
assertFlippers(false,false,'pause release clears all inputs');
key('p',false);key('ArrowLeft',true);assertFlippers(true,false);listeners.blur();
assert.match(el('overlay').innerHTML,/IN PAUSA/);el('resumeGame').click();assertFlippers(false,false,'blur clears stale held key');
// Browser autorepeat must not oscillate pause state.
assert(key('p',true));assert.match(el('overlay').innerHTML,/IN PAUSA/);
assert(key('p',true,{repeat:true}));assert.match(el('overlay').innerHTML,/IN PAUSA/);
el('resumeGame').click();tick();
// Keyboard keys do not act as flippers when editing a player's name.
key('ArrowLeft',true,{target:{tagName:'INPUT'}});assertFlippers(false,false);
console.log('PASS M13.1 input: aliases L/M, arrows, Tab/Enter compatibility, independent per-key/per-pointer holds, both flippers, Space/Down launch, pause/blur/repeat/text safety');
