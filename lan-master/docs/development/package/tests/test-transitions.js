const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
vm.runInThisContext(fs.readFileSync(path.join(ROOT,'src/levels.js'),'utf8'));
const C=require(path.join(ROOT,'src/core.js')),T=require(path.join(ROOT,'src/transitions.js'));
function ok(x,m){if(!x)throw new Error(m)}
function h(v){return crypto.createHash('sha256').update(Buffer.from(v)).digest('hex')}
ok([0,1,2,3,4,7,8,11,12,15].map(T.fadeInStage).join(',')==='3,3,3,3,2,2,1,1,0,0','fade in stages');
ok([0,3,4,7,8,11,12,15].map(T.fadeOutStage).join(',')==='0,0,1,1,2,2,3,3','fade out stages');
let seed=2,totalBatches=0,orders=[];
for(let i=0;i<50;i++){
  const r=C.unpackLevel(globalThis.LAN_MASTER_LEVELS[i],seed);seed=r.seed;
  const batches=T.showLevelBatches(r.map,globalThis.LAN_MASTER_LEVELS[i].start_pos);totalBatches+=batches.length;
  const flat=batches.flat();const uniq=new Set(flat);const nonempty=[];for(let o=0;o<256;o++)if(r.map[o])nonempty.push(o);
  ok(flat.length===uniq.size,`L${i+1} reveal duplicate`);ok(uniq.size===nonempty.length,`L${i+1} reveal coverage ${uniq.size}/${nonempty.length}`);
  ok(batches.every((b,j)=>b.length===(j===0?1:2)||b.length===1),`L${i+1} batch width`);
  orders.push(...flat);
}
const revealHash=h(orders);
const dummy=[new Array(256).fill(1),new Array(256).fill(2),new Array(256).fill(3)];const rf=T.restartFrames(dummy);
ok(rf.length===72,'restart frame count');ok(rf.every(x=>x.changes.length===6),'restart six tiles/frame');
const done=new Uint8Array(1024);let e=T.createEnding(done);let first=-1,fadeAt=-1,secondLine=-1;
for(let f=1;f<=700;f++){T.tickEnding(e,f);if(first<0&&e.curOff>0)first=f;if(fadeAt<0&&e.fade>0)fadeAt=f;if(secondLine<0&&e.curText>0&&e.curOff===0)secondLine=f;}
ok(first>=50&&first<=52,`ending first char ${first}`);ok(fadeAt===300,`ending first fade ${fadeAt}`);ok(secondLine>=319&&secondLine<=321,`ending second line reset ${secondLine}`);ok(e.bgOff===(700&255),'ending scroll');
console.log('M11 transitions regression: PASS');
console.log('reveal-order-sha256',revealHash);console.log('reveal-batches-total',totalBatches);console.log('ending-first-char-frame',first,'first-fade-frame',fadeAt,'second-line-frame',secondLine);
