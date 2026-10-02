import test from 'node:test';
import assert from 'node:assert/strict';
import { SETTINGS_KEY } from '../public/src/storage.js';
class Store{constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
const store=new Store();store.setItem(SETTINGS_KEY,JSON.stringify({lang:'it',sound:false,size:4,difficulty:0,countdownOn:true,countdown:30}));globalThis.localStorage=store;
globalThis.window={open(){},AudioContext:undefined,webkitAudioContext:undefined};
globalThis.Image=class{constructor(){this.complete=false;this.naturalWidth=0;this.decoding='';this.src='';}};
globalThis.requestAnimationFrame=()=>1;
const grad={addColorStop(){}};const ctx=new Proxy({measureText:s=>({width:String(s).length*8}),createLinearGradient:()=>grad},{get(t,p){if(p in t)return t[p];return ()=>{}},set(t,p,v){t[p]=v;return true;}});
const canvas={getContext:()=>ctx,addEventListener(){},getBoundingClientRect:()=>({left:0,top:0,width:800,height:600}),setPointerCapture(){}};
const root={lang:'en'};globalThis.document={documentElement:root,getElementById:id=>id==='game'?canvas:null};
await import('../public/src/app.js?language-startup=it');
test('saved Italian setting synchronizes document language on startup',()=>{assert.equal(root.lang,'it');});
