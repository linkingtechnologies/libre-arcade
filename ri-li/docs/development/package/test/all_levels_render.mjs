import fs from 'node:fs';
import {Renderer} from '../src/renderer.mjs';
import {LevelSet} from '../src/levels.mjs';
import {GameSession} from '../src/session.mjs';

const noop=()=>{};const ctx=new Proxy({},{get:(t,k)=>t[k]??noop,set:(t,k,v)=>(t[k]=v,true)});const canvas={width:800,height:600,getContext:()=>ctx};
const r=new Renderer(canvas);const manifest=JSON.parse(fs.readFileSync('data/sprites.json','utf8'));
for(const m of manifest){const g=m.png.split('/')[1],k=`${g}:${Number(m.frame)}`;r.meta.set(k,{...m,width:Number(m.width),height:Number(m.height),cx:Number(m.cx),cy:Number(m.cy)});r.imgs.set(k,{});}
for(const lang of ['it','en'])for(const name of ['T_level','T_lives','T_options','T_score','T_press_any_key','T_question','T_better_scores',...Array.from({length:30},(_,i)=>`T_tart${i+1}`),...Array.from({length:30},(_,i)=>`T_art${i+1}`)])r.ui[lang][name]={width:100,height:30};
const levels=new LevelSet(fs.readFileSync('reference/levels.dat'));const results=[];
for(let n=1;n<=50;n++){const s=new GameSession(levels,{startLevel:n,seed:1});s.oracle.renderFrame();const snap=s.snapshot();r.draw(levels.get(n),snap,s.oracle,{paused:true});results.push({level:n,start:[levels.get(n).startX,levels.get(n).startY],decorations:levels.get(n).decorations.length,wagons_remaining:snap.remaining});}
console.log(JSON.stringify({status:'PASS',levels_rendered:results.length,first:results[0],last:results.at(-1)},null,2));
