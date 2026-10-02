import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDER_ASSETS, CATEGORIES } from '../public/src/assets.js';
import { SETTINGS_KEY } from '../public/src/storage.js';

class Store{constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
const raf=[];const events=new Map();
globalThis.localStorage=new Store();
localStorage.setItem(SETTINGS_KEY,JSON.stringify({lang:'en',sound:false,size:2,difficulty:0,countdownOn:false,countdown:30}));
globalThis.window={open(){},AudioContext:undefined,webkitAudioContext:undefined};
globalThis.Image=class{constructor(){this.complete=false;this.naturalWidth=0;this.decoding='';this.src='';}};
globalThis.requestAnimationFrame=(cb)=>{raf.push(cb);return raf.length};
const grad={addColorStop(){}};
const ctx=new Proxy({measureText:(s)=>({width:String(s).length*9}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},{get(t,p){if(p in t)return t[p];return ()=>{}},set(t,p,v){t[p]=v;return true}});
const canvas={getContext:()=>ctx,addEventListener:(n,fn)=>events.set(n,fn),setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:800,height:600})};
globalThis.document={documentElement:{lang:'en'},getElementById:(id)=>id==='game'?canvas:null};

const mod=await import('../public/src/app.js?playthrough=1');
function frame(){const cb=raf.shift();assert.ok(cb);cb(performance.now());}
function evt(x,y){return {clientX:x,clientY:y,pointerId:1,preventDefault(){}};}
function down(x,y){events.get('pointerdown')(evt(x,y));}
function up(x,y){events.get('pointerup')(evt(x,y));}
function click(x,y){events.get('click')(evt(x,y));}
function tap(x,y){down(x,y);up(x,y);click(x,y);}

function chooseAsset(asset){
 const cat=BUILDER_ASSETS[asset].category;const ci=CATEGORIES.indexOf(cat);assert.ok(ci>=0,cat);
 down(746,164+ci*52);up(746,164+ci*52);
 let guard=0;
 while(mod.__builderTest.getState().selectedAsset!==asset){
  down(630,322);up(630,322);
  if(++guard>100)throw new Error(`could not select ${asset}`);
 }
}

test('complete 2x2 Builder game through real pointer flow',()=>{
 frame();
 tap(240,130); // Builder preview in its historical menu slot
 assert.equal(mod.__builderTest.getState().screen,'preview');
 tap(650,365); // Start
 assert.equal(mod.__builderTest.getState().screen,'play');
 const state=mod.__builderTest.getState();
 const active=[];
 for(let x=0;x<8;x++)for(let y=0;y<8;y++)if(state.target[x][y])active.push([x,y,state.target[x][y]]);
 assert.ok(active.length>0&&active.length<=4,`active=${active.length}`);
 for(const [x,y,asset] of active){
  chooseAsset(asset);
  down(634,244); // grab selected piece from historical palette
  up(44+x*64+32,44+y*64+32); // drop into board cell
 }
 assert.equal(mod.__builderTest.getState().screen,'win');
});
