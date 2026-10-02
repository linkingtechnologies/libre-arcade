import test from 'node:test';
import assert from 'node:assert/strict';
import { SETTINGS_KEY } from '../public/src/storage.js';
class Store{constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
const store=new Store();store.setItem(SETTINGS_KEY,JSON.stringify({lang:'en',sound:false,size:2,difficulty:1,countdownOn:false,countdown:30}));globalThis.localStorage=store;
let opened=null;globalThis.window={open:(...a)=>{opened=a;},AudioContext:undefined,webkitAudioContext:undefined};
globalThis.Image=class{constructor(){this.complete=false;this.naturalWidth=0;this.decoding='';this.src='';}};
const raf=[];globalThis.requestAnimationFrame=(cb)=>{raf.push(cb);return raf.length};
const grad={addColorStop(){}};const ctx=new Proxy({measureText:s=>({width:String(s).length*8}),createLinearGradient:()=>grad},{get(t,p){if(p in t)return t[p];return ()=>{}},set(t,p,v){t[p]=v;return true;}});
const listeners={};const canvas={getContext:()=>ctx,addEventListener:(n,f)=>listeners[n]=f,getBoundingClientRect:()=>({left:0,top:0,width:800,height:600}),setPointerCapture(){}};
globalThis.document={documentElement:{lang:'en'},getElementById:id=>id==='game'?canvas:null};
const mod=await import('../public/src/app.js');
function frame(now=performance.now()){const cb=raf.shift();assert.ok(cb,'render frame queued');cb(now);}
function pointer(x,y){listeners.pointerup({clientX:x,clientY:y,preventDefault(){}});}

test('menu -> preview -> play renders without exceptions',()=>{frame();assert.equal(mod.__pairTest.getState().screen,'menu');pointer(560,130);frame();assert.equal(mod.__pairTest.getState().screen,'preview');pointer(670,365);frame();assert.equal(mod.__pairTest.getState().screen,'play');});

test('complete 2x2 game through real pointer events',()=>{
 let s=mod.__pairTest.getState();assert.equal(s.settings.size,2);const groups=new Map();for(let x=0;x<8;x++)for(let y=0;y<8;y++){const f=s.game.board[x][y];if(f){if(!groups.has(f))groups.set(f,[]);groups.get(f).push([x,y]);}}
 for(const cells of groups.values()){
  for(const [x,y] of cells){pointer(44+x*64+32,44+y*64+32);}s=mod.__pairTest.getState();assert.equal(s.game.pending.kind,'match');const due=s.game.pending.due;mod.__pairTest.forceNowResolve(due);frame(due);
 }
 assert.equal(mod.__pairTest.getState().screen,'win');
});

test('credits exposes a clickable Libre Arcade link',()=>{mod.__pairTest.onActivate({x:470,y:370});/* winner Menu */frame();assert.equal(mod.__pairTest.getState().screen,'menu');pointer(680,320);frame();assert.equal(mod.__pairTest.getState().screen,'credits');pointer(400,505);assert.ok(opened);assert.equal(opened[0],'https://linkingtechnologies.github.io/libre-arcade/');});
