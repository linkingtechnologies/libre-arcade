import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
class Mem{constructor(){this.m=new Map()}getItem(k){return this.m.get(k)??null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
class FakeImage{constructor(){this.src='';this.width=120;this.height=40;}async decode(){}}
class FakeAudio{constructor(src=''){this.src=src;this.loop=false;this.volume=1;this.currentTime=0;this.paused=true;this.dataset={};}play(){this.paused=false;return Promise.resolve()}pause(){this.paused=true}cloneNode(){return new FakeAudio(this.src)}}
const ctx={imageSmoothingEnabled:false,drawImage(){},fillRect(){},fillText(){},save(){},restore(){},set fillStyle(v){},set textAlign(v){},set textBaseline(v){},set font(v){}};
function elem(id){return {id,textContent:'',innerHTML:'',onclick:null,hidden:id==='info-panel'||id==='reset-area',dataset:{},style:{},children:[],focus(){},setAttribute(){},addEventListener(){},getBoundingClientRect(){return {left:0,top:0,width:800,height:600}},getContext(){return ctx},requestFullscreen:async()=>{}}}
const ids=['game','status','pause','help','lang','restart','instructions','credits','info-panel','info-title','info-body','reset-area','reset-data','reset-note','info-close','touchpad','keys-help'];
const elements=new Map(ids.map(id=>[id,elem(id)]));
const touchButtons=['up','down','left','right'].map(dir=>{const b=elem('touch-'+dir);b.dataset.dir=dir;return b});
globalThis.window=globalThis;globalThis.__RILI_ENABLE_TEST_HOOKS__=true;globalThis.localStorage=new Mem();globalThis.Image=FakeImage;globalThis.Audio=FakeAudio;globalThis.requestAnimationFrame=()=>1;globalThis.addEventListener=()=>{};
globalThis.document={hidden:false,fullscreenElement:null,documentElement:{lang:'it'},body:{dataset:{}},getElementById:id=>elements.get(id),addEventListener(){},querySelector:q=>q==='.shell'?elem('shell'):q==='.touchpad'?elements.get('touchpad'):null,querySelectorAll:q=>q==='#touchpad [data-dir]'?touchButtons:[],exitFullscreen:async()=>{}};
globalThis.fetch=async u=>{u=String(u);if(u==='data/sprites.json')return {ok:true,json:async()=>JSON.parse(await fs.readFile(path.join(root,u),'utf8'))};if(u==='reference/levels.dat'){const b=await fs.readFile(path.join(root,u));return {ok:true,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}};throw Error('unexpected fetch '+u)};
await import('../src/app.mjs');
for(let i=0;i<20&&!globalThis.__RILI_READY__;i++)await new Promise(r=>setTimeout(r,10));
if(!globalThis.__RILI_READY__)throw Error('app did not become ready');
if(globalThis.__RILI_STATE__.screen!=='menu')throw Error('not on menu');
globalThis.__RILI_TEST__.start(1,'normal');if(globalThis.__RILI_STATE__.screen!=='game')throw Error('game start failed');
globalThis.__RILI_TEST__.openInfo('instructions');if(elements.get('info-panel').hidden)throw Error('guide did not open');if(!elements.get('info-body').innerHTML.includes('vagoni'))throw Error('Italian guide missing');
globalThis.__RILI_TEST__.closeInfo();if(!elements.get('info-panel').hidden)throw Error('guide did not close');
globalThis.__RILI_TEST__.menu();if(globalThis.__RILI_STATE__.screen!=='menu')throw Error('menu return failed');
globalThis.__RILI_TEST__.options();if(globalThis.__RILI_STATE__.screen!=='options')throw Error('options failed');
console.log('app smoke: menu -> game -> guide -> menu -> options PASS');
