import fs from 'node:fs';
import crypto from 'node:crypto';
import {LevelSet} from '../src/levels.mjs';
import {GameSession} from '../src/session.mjs';
function fbits(v){const b=Buffer.alloc(4);b.writeFloatBE(v,0);return b.readUInt32BE(0);}
function parse(line){const out=[];let cur='',q=false;for(const c of line){if(c==='"')q=!q;else if(c===','&&!q){out.push(cur);cur='';}else cur+=c;}out.push(cur);return out;}
const bytes=fs.readFileSync('reference/levels.dat');const sha=crypto.createHash('sha256').update(bytes).digest('hex');
if(sha!=='d88a4a1c3f8bb7eab580cb4a0225602b2f96b71fd34404ad230d37f0c6ee774f')throw Error('levels.dat checksum');
const levels=new LevelSet(bytes);
function run(events={}){const gs=new GameSession(levels,{startLevel:1,difficulty:'normal',seed:1});const a=[gs.snapshot()];while(gs.clockMs<10000){const key=events[gs.oracle.gameMs]??null;gs.step(Math.min(16,10000-gs.clockMs),key);a.push(gs.snapshot());}return a;}
function compare(path,events={},includeInitial=false){
 const lines=fs.readFileSync(path,'utf8').trim().split(/\r?\n/),head=parse(lines[0]),rows=lines.slice(1).map(l=>{const v=parse(l),o={};head.forEach((h,i)=>o[h]=v[i]);return o;});
 const actual=run(events).slice(includeInitial?0:1),dir={LEFT:'0',RIGHT:'1',UP:'2',DOWN:'3'};let comparisons=0;const fail=[];
 const eq=(i,k,a,b)=>{comparisons++;if(a!==b&&fail.length<10)fail.push({i,k,a,b});};eq(0,'frames',String(actual.length),String(rows.length));
 for(let i=0;i<Math.min(actual.length,rows.length);i++){const a=actual[i],r=rows[i];eq(i,'time',String(a.time_ms),r.time_ms);eq(i,'D',fbits(a.D).toString(16).padStart(8,'0'),r.D_bits);eq(i,'cell',String(a.cell),r.cell);eq(i,'wagons',String(a.wagons),r.NWagon);eq(i,'remaining',String(a.remaining),r.remaining);eq(i,'score',String(a.score),r.score);eq(i,'spacing',fbits(a.spacing).toString(16).padStart(8,'0'),r.spacing_bits);eq(i,'lives',String(a.lives),r.lives);eq(i,'won',a.won?'1':'0',r.won);eq(i,'types',a.wagon_types.join('|'),r.wagon_types);eq(i,'keys',a.keys.split('/').map(x=>dir[x]).join('|'),r.keys);eq(i,'board',a.board.map(v=>v.toString(16).padStart(2,'0')).join(''),r.board_hex);eq(i,'points',a.geometry.map(g=>[g.front_x,g.front_y,g.rear_x,g.rear_y].join(':')).join('|'),r.points);}
 if(fail.length)throw Error(JSON.stringify(fail,null,2));return {frames:actual.length,comparisons,mismatches:0};
}
const events={1008:2,2016:3,3024:1,4032:0,6048:2};const a=compare('test/golden/full_sdlmain_level01_seed1.csv');const b=compare('test/golden/cpp_level01_seed1_inputs.csv',events,true);
console.log(JSON.stringify({status:'PASS',levels_sha256:sha,original_cpp:a,original_cpp_inputs:b,total_comparisons:a.comparisons+b.comparisons},null,2));
