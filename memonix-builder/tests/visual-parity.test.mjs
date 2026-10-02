import test from 'node:test';
import assert from 'node:assert/strict';

class Store{constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
const raf=[];
const drawCalls=[];
globalThis.localStorage=new Store();
globalThis.window={open(){},AudioContext:undefined,webkitAudioContext:undefined};
globalThis.Image=class{constructor(){this.complete=true;this.naturalWidth=800;this.naturalHeight=800;this.decoding='';this.src='';}};
globalThis.requestAnimationFrame=(cb)=>{raf.push(cb);return raf.length};
const grad={addColorStop(){}};
const ctx=new Proxy({
 measureText:(s)=>({width:String(s).length*9}),
 createLinearGradient:()=>grad,createRadialGradient:()=>grad,
 drawImage:(img,...args)=>{drawCalls.push({src:img?.src||'',args});}
},{get(t,p){if(p in t)return t[p];return ()=>{}},set(t,p,v){t[p]=v;return true}});
const canvas={getContext:()=>ctx,addEventListener(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:800,height:600})};
globalThis.document={documentElement:{lang:'en'},getElementById:(id)=>id==='game'?canvas:null};

const mod=await import('../public/src/app.js?visual-parity=1');
function frame(){drawCalls.length=0;const cb=raf.shift();assert.ok(cb,'render frame queued');cb(performance.now());return drawCalls.map(x=>x.src);}

test('historical Start/Game/selector/dialog art participates in rendering',()=>{
 frame();
 mod.__builderTest.newTarget();
 let srcs=frame();
 assert.ok(srcs.some(s=>s.includes('/assets/ui/original/start.jpg')),srcs.join('\n'));
 assert.ok(srcs.some(s=>s.includes('/assets/ui/original/start2.jpg')),srcs.join('\n'));
 mod.__builderTest.startPlay();
 srcs=frame();
 assert.ok(srcs.some(s=>s.includes('/assets/ui/original/game.jpg')),srcs.join('\n'));
 assert.ok(srcs.some(s=>s.includes('/assets/ui/original/game2.png')),srcs.join('\n'));
 mod.__builderTest.finish();
 srcs=frame();
 assert.ok(srcs.some(s=>s.includes('/assets/ui/original/box.jpg')),srcs.join('\n'));
});
