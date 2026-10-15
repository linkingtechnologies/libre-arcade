import fs from 'node:fs';
import { makePlayer, tickPlayerMotion, updatePlayerSpeed } from '../src/player.js';
import { BUTTON } from '../src/input.js';
import { makeDay1Stage } from '../web/stage-day1.js';
import { makeDay2Stage } from '../web/stage-day2.js';
import { makeDay3Stage } from '../web/stage-day3.js';
import { makeDay4Stage } from '../web/stage-day4.js';
import { makeDay5Stage } from '../web/stage-day5.js';
import { makeDay6Stage } from '../web/stage-day6.js';
import { makeDay7Stage } from '../web/stage-day7.js';
import { makeDreamStage } from '../web/stage-dream.js';

const ACTIONS=[BUTTON.LEFT,BUTTON.RIGHT,BUTTON.UP,BUTTON.DOWN];
const overlaps=(ax,ay,aw,ah,bx,by,bw,bh)=>!(bx>=ax+aw || bx+bw<ax || by>=ay+ah || by+bh<ay);
const hit=(p,t)=>overlaps(p.xFp>>4,p.yFp>>4,16,24,t.x,t.y,t.w,t.h);
const stateKey=(p,phase)=>[p.xFp,p.yFp,p.dir,p.dirCountFp,p.onFloor?1:0,p.speedFp,phase].join(',');

function targetsFor(stage){
  return [
    ...stage.phones.map((o,i)=>({id:`phone${i}`,x:o.x,y:o.y,w:8,h:8,type:'phone'})),
    ...stage.topics.map(o=>({id:`topic${o.id}`,x:o.x,y:o.y,w:12,h:8,type:'topic'})),
    ...(stage.coffee?[{id:'coffee',x:stage.coffee.x,y:stage.coffee.y,w:8,h:8,type:'coffee'}]:[]),
    ...stage.tables.map((o,i)=>({id:`table${i}`,x:o.x,y:o.y,w:8,h:8,type:'table'}))
  ];
}

function auditStage(stage,maxStates=1_000_000){
  const targets=targetsFor(stage), found={};
  const p0=makePlayer(stage.spawn.x,stage.spawn.y);
  const queue=[{p:p0,phase:0,depth:0}];
  const seen=new Set([stateKey(p0,0)]);
  let qi=0;
  while(qi<queue.length && queue.length<maxStates && Object.keys(found).length<targets.length){
    const s=queue[qi++];
    for(const t of targets) if(found[t.id]===undefined && hit(s.p,t)) found[t.id]=s.depth;
    for(const bit of ACTIONS){
      const p={...s.p};
      tickPlayerMotion(p,stage.map,{down:b=>!!(bit&b)},[]);
      const phase=Math.min(8,s.phase+1);
      updatePlayerSpeed(p,phase);
      p.stepAnim=0; p.answerTicks=0;
      const k=stateKey(p,phase);
      if(!seen.has(k)){ seen.add(k); queue.push({p,phase,depth:s.depth+1}); }
    }
  }
  return {
    stage:stage.name,
    targetCount:targets.length,
    reachableCount:Object.keys(found).length,
    allReachable:Object.keys(found).length===targets.length,
    exploredStates:queue.length,
    targets:targets.map(t=>({...t,minInputTicks:found[t.id]??null,reachable:found[t.id]!==undefined}))
  };
}

const stages=[makeDay1Stage(),makeDay2Stage(),makeDay3Stage(),makeDay4Stage(),makeDay5Stage(),makeDay6Stage(),makeDay7Stage(),makeDreamStage()];
const audits=stages.map(s=>auditStage(s));
const totalTargets=audits.reduce((n,a)=>n+a.targetCount,0);
const reachableTargets=audits.reduce((n,a)=>n+a.reachableCount,0);
const report={
  baseline:'Zooming Secretary M29 input-only movement reachability audit',
  version:'1.0.0-rc.6',
  method:'Breadth-first search over the real player movement routine using only LEFT/RIGHT/UP/DOWN input states. No coordinate teleport or map mutation.',
  totalTargets,reachableTargets,allReachable:reachableTargets===totalTargets,stages:audits
};
fs.writeFileSync(new URL('../docs/m29-reachability-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(`${reachableTargets}/${totalTargets} interactable positions reachable`);
if(!report.allReachable) process.exit(1);
