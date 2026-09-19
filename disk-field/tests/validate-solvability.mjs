import fs from 'node:fs';
import crypto from 'node:crypto';
import { makeWorld } from '../public/js/engine.mjs';

const corpus = JSON.parse(fs.readFileSync(new URL('./solvability/replays.json', import.meta.url), 'utf8'));
function hashSeed(text){let h=2166136261>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h||1;}
function seededRng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function options(r){
  if(r.randomizeDodge){return {randomizeDodge:true,rng:seededRng(hashSeed(`${r.seed}:${r.levelIndex}`))};}
  return {};
}
let failed=0;
const results=[];
for(const r of corpus.replays){
  const digest=crypto.createHash('sha256').update(r.actions).digest('hex');
  if(digest!==r.actionsSha256) throw new Error(`Replay ${r.level}: action hash mismatch`);
  if(r.actions.length!==r.ticks) throw new Error(`Replay ${r.level}: action length ${r.actions.length} != ticks ${r.ticks}`);
  const world=makeWorld(r.levelIndex,options(r));
  let finishedAt=null;
  for(let i=0;i<r.actions.length;i++){
    const a=r.actions[i];
    if(a==='L') world.rotate(false);
    else if(a==='R') world.rotate(true);
    else if(a!=='.') throw new Error(`Replay ${r.level}: invalid action ${JSON.stringify(a)} at ${i}`);
    world.update();
    if(world.finished){finishedAt=i+1;break;}
  }
  const d=world.disks[0];
  const pos=[d.pos.v[0],d.pos.v[1]];
  const err=Math.hypot(pos[0]-r.expectedFinalPosition[0],pos[1]-r.expectedFinalPosition[1]);
  const ok=world.finished && finishedAt===r.ticks && err<1e-9;
  if(!ok) failed++;
  results.push({level:r.level,ok,ticks:r.ticks,finishedAt,finalPosition:pos,expected:r.expectedFinalPosition,positionError:err,seed:r.seed??null});
  console.log(`${ok?'PASS':'FAIL'} level ${String(r.level).padStart(2,'0')}  ticks=${r.ticks}${r.seed?` seed=${r.seed}`:''}`);
}
console.log(`\nSolvability: ${results.filter(r=>r.ok).length}/${results.length} canonical replays finish.`);
if(failed) process.exit(1);
