import test from 'node:test';
import assert from 'node:assert/strict';
import { SETTINGS_KEY } from '../public/src/storage.js';
class Store{constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
const store=new Store();store.setItem(SETTINGS_KEY,JSON.stringify({lang:'en',sound:false,size:2,difficulty:1,countdownOn:false,countdown:30}));globalThis.localStorage=store;
globalThis.window={open(){},AudioContext:undefined,webkitAudioContext:undefined};
const draws=[];
globalThis.Image=class{constructor(){this.complete=true;this.naturalWidth=800;this.naturalHeight=800;this.decoding='';this._src='';}set src(v){this._src=String(v)}get src(){return this._src}};
const raf=[];globalThis.requestAnimationFrame=(cb)=>{raf.push(cb);return raf.length};
const grad={addColorStop(){}};
const ctx=new Proxy({measureText:s=>({width:String(s).length*8}),createLinearGradient:()=>grad,drawImage:(img,...args)=>draws.push([img?.src||'',...args])},{get(t,p){if(p in t)return t[p];return ()=>{}},set(t,p,v){t[p]=v;return true;}});
const listeners={};const canvas={getContext:()=>ctx,addEventListener:(n,f)=>listeners[n]=f,getBoundingClientRect:()=>({left:0,top:0,width:800,height:600}),setPointerCapture(){}};
globalThis.document={documentElement:{lang:'en'},getElementById:id=>id==='game'?canvas:null};
// eslint-disable-next-line no-unused-vars -- imported for its module-level side effects (render loop, event listeners)
const mod=await import('../public/src/app.js?visual-parity=1');
function frame(now=performance.now()){const cb=raf.shift();assert.ok(cb);cb(now)}
function pointer(x,y){listeners.pointerup({clientX:x,clientY:y,preventDefault(){}})}

test('historical Start and Game artwork are actually rendered',()=>{
 frame(); pointer(560,130); draws.length=0; frame();
 assert.ok(draws.some(d=>d[0].includes('/assets/ui/original/start.jpg')),'start.jpg rendered');
 pointer(670,365); draws.length=0; frame();
 assert.ok(draws.some(d=>d[0].includes('/assets/ui/original/game.jpg')),'game.jpg rendered');
 assert.ok(draws.some(d=>d[0].includes('/assets/ui/original/game2.png')),'Pair no-Mist patch rendered');
});
