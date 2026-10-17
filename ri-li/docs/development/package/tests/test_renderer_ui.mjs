import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
class FakeImage{constructor(){this.src='';this.width=100;this.height=30;}async decode(){const m=this.src.match(/ui\/(?:it|en)\/(T_[^/]+)\.png$/);if(m){this.width=180;this.height=50;} if(this.src.includes('ui/lang/')){this.width=180;this.height=50;}}}
globalThis.Image=FakeImage;
globalThis.fetch=async u=>({ok:true,json:async()=>JSON.parse(await fs.readFile(path.join(root,String(u)),'utf8'))});
const ops=[];const ctx={imageSmoothingEnabled:false,drawImage:(...a)=>ops.push(['img',...a.slice(1)]),fillRect:(...a)=>ops.push(['rect',...a]),fillText:(...a)=>ops.push(['text',...a]),save(){},restore(){},set fillStyle(v){},set textAlign(v){},set textBaseline(v){},set font(v){}};
const canvas={getContext:()=>ctx};
const {Renderer}=await import('../src/renderer.mjs');const r=new Renderer(canvas);await r.load();
r.drawMainMenu(0,1000);r.drawDifficulty(1,1000);r.drawLevelMenu(1,12,23,1000);r.drawOptions(0,{sfxVolume:.7,musicVolume:.4,language:'it'},1000,false);
const fake={highScores:Array.from({length:8},(_,i)=>({score:(8-i)*100,name:i?'TEST':'PLAYER'})),highScoreSlot:0,state:'high_score'};r.drawScores(fake,1000);r.drawNameEntry(fake,1000,'PLAYER');
if(r.meta.size!==2506)throw Error(`meta ${r.meta.size}`);if(ops.length<100)throw Error(`too few draw ops ${ops.length}`);
console.log(`renderer UI smoke: ${r.meta.size} frames, ${ops.length} draw operations PASS`);
