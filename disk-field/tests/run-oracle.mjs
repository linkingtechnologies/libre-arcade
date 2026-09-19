import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { World } from '../public/js/engine.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const base=path.join(here,'oracle');
const cases=JSON.parse(fs.readFileSync(path.join(base,'cases.json'),'utf8'));
function inputFor(c,t){for(const s of c.segments||[])if(s.start<=t&&t<=s.end)return s.input;return 'none';}
function parseCsv(s){const ls=s.trim().split(/\r?\n/);const h=ls.shift().split(',');return ls.map(l=>{const a=l.split(',');return Object.fromEntries(h.map((k,i)=>[k,a[i]]));});}
const cols=['x','y','vx','vy','real_vx','real_vy','rotation','angular_v','scale','hole_step','finished','collision','world_finished'];
let all=true;
for(const c of cases){
  const exp=parseCsv(fs.readFileSync(path.join(base,c.name+'.csv'),'utf8'));
  const w=new World(c.level,{randomizeDodge:false});let row=0,max=Object.fromEntries(cols.map(k=>[k,0]));let first=null;
  for(let t=0;t<c.ticks;t++){
    const inp=inputFor(c,t);if(inp==='cw')w.rotate(true);else if(inp==='ccw')w.rotate(false);w.update();
    for(let di=0;di<w.disks.length;di++){
      const d=w.disks[di];const got={x:d.pos.v[0],y:d.pos.v[1],vx:d.speed.v[0],vy:d.speed.v[1],real_vx:d.realSpeed.v[0],real_vy:d.realSpeed.v[1],rotation:d.rotation,angular_v:d.angularV,scale:d.scale,hole_step:d.holeStep,finished:+d.finished,collision:+d.collided,world_finished:+w.finished};
      const e=exp[row++]; if(!e){first=first||`extra row tick ${t}`;continue;}
      for(const k of cols){const er=Math.abs(Number(e[k])-Number(got[k]));if(er>max[k])max[k]=er;const exact=['hole_step','finished','collision','world_finished'].includes(k);const tol=exact?0:((k==='x'||k==='y'||k==='real_vx'||k==='real_vy')?0.0025:((k==='vx'||k==='vy')?0.00025:(k==='rotation'?0.0002:(k==='angular_v'?0.000005:0.000001))));if(er>tol&&!first)first=`tick ${t} ${k}: expected ${e[k]}, got ${got[k]}, err ${er}`;}
    }
    if(w.finished)break;
  }
  if(row!==exp.length&&!first)first=`row count ${row} != ${exp.length}`;
  const ok=!first;all&&=ok;console.log(`${ok?'PASS':'FAIL'} ${c.name} rows=${row}/${exp.length} maxXY=${Math.max(max.x,max.y).toExponential(3)} maxV=${Math.max(max.vx,max.vy).toExponential(3)}`);if(first)console.log('  '+first);
}
// field samples
const fsamp=parseCsv(fs.readFileSync(path.join(base,'field_samples.csv'),'utf8'));let fmax=0,ffirst=null;
for(const r of fsamp){const w=new World(Number(r.level),{randomizeDodge:false});const v=w.getVectorAtPoint([Number(r.x),Number(r.y)]);for(let i=0;i<2;i++){const e=Number(i?r.field_y:r.field_x),er=Math.abs(e-v[i]);fmax=Math.max(fmax,er);if(er>2e-5&&!ffirst)ffirst=`level ${r.level} point ${r.x},${r.y} component ${i}: ${e} vs ${v[i]}`;}}
console.log(`${ffirst?'FAIL':'PASS'} field_samples max=${fmax.toExponential(3)}`);if(ffirst)console.log('  '+ffirst);all&&=!ffirst;
process.exit(all?0:1);
