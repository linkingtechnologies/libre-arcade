import test from 'node:test';
import assert from 'node:assert/strict';

class Store{constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
const raf=[];
globalThis.localStorage=new Store();
globalThis.window={open(){},AudioContext:undefined,webkitAudioContext:undefined};
globalThis.Image=class{constructor(){this.complete=false;this.naturalWidth=0;this.decoding='';this.src='';}};
globalThis.requestAnimationFrame=(cb)=>{raf.push(cb);return raf.length};
const grad={addColorStop(){}};
const ctx=new Proxy({measureText:(s)=>({width:String(s).length*9}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},{get(t,p){if(p in t)return t[p];return ()=>{}},set(t,p,v){t[p]=v;return true}});
const canvas={getContext:()=>ctx,addEventListener(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:800,height:600})};
globalThis.document={documentElement:{lang:'en'},getElementById:(id)=>id==='game'?canvas:null};

const mod=await import('../public/src/app.js');
function frame(){const cb=raf.shift();assert.ok(cb,'render frame queued');cb(performance.now());}

test('menu, preview, play and winner each render without exceptions',()=>{
 frame();
 assert.equal(mod.__builderTest.getState().screen,'menu');
 mod.__builderTest.newTarget();frame();
 let s=mod.__builderTest.getState();assert.equal(s.screen,'preview');assert.ok(s.target.flat().some(Boolean));
 mod.__builderTest.startPlay();frame();s=mod.__builderTest.getState();assert.equal(s.screen,'play');assert.ok(s.selectedAsset);
 for(let x=0;x<8;x++)for(let y=0;y<8;y++)s.player[x][y]=s.target[x][y];
 mod.__builderTest.finish();frame();assert.equal(mod.__builderTest.getState().screen,'win');
});
