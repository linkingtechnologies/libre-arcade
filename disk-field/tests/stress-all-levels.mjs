import { World } from '../public/js/engine.mjs';
for(let level=0;level<17;level++){
  const w=new World(level,{randomizeDodge:false});
  for(let t=0;t<1200&&!w.finished;t++){
    const phase=t%180;if(phase<45)w.rotate(false);else if(phase>=90&&phase<135)w.rotate(true);w.update();
    for(const d of w.disks)for(const x of [...d.pos.v,...d.speed.v,d.rotation,d.angularV])if(!Number.isFinite(x))throw new Error(`non-finite value level=${level} tick=${t}`);
  }
}
console.log('PASS: all 17 levels stable for up to 1200 ticks each');
