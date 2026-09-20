(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CometVisuals=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const TAU=Math.PI*2;
  // The preserved 2013 manual shows a bare black field: no printed orbits,
  // artificial labels, or decorative targets. Draw only the real fixtures.
  function drawArt(ctx,v,worldW,worldH){ /* intentionally unpainted */ }
  function lamp(ctx,v,x,y,r,active){
    const px=v.sx(x),py=v.sy(y),pr=r*v.scaleX;
    if(!Number.isFinite(px)||!Number.isFinite(py)||!(pr>0))return;
    ctx.save();
    if(active){
      ctx.shadowColor='#b9ffe8';ctx.shadowBlur=18;
      ctx.fillStyle='#5de0a84f';ctx.beginPath();ctx.arc(px,py,pr*.97,0,TAU);ctx.fill();
    }
    // 2013 circular outline and its little horizontal marker (no solid blue puck).
    ctx.strokeStyle=active?'#f5fff8':'#87ffb5';ctx.lineWidth=active?2.5:1.6;
    ctx.beginPath();ctx.arc(px,py,pr,0,TAU);ctx.stroke();
    ctx.strokeStyle=active?'#ffffff':'#b8ffcf';ctx.lineWidth=active?1.9:1.25;
    ctx.beginPath();ctx.moveTo(px+pr*.05,py);ctx.lineTo(px+pr*.92,py);ctx.stroke();
    ctx.restore();
  }
  function sparks(ctx,v,flashes,now){
    if(!flashes||!flashes.length)return;
    ctx.save();ctx.lineCap='round';
    for(const f of flashes){
      const age=(now-f.at)/650;if(age<0||age>=1)continue;
      const px=v.sx(f.x),py=v.sy(f.y),scale=v.scaleX;
      ctx.globalAlpha=Math.max(0,1-age);ctx.lineWidth=Math.max(1,1.8*scale/640);
      ctx.strokeStyle='#fff28f';
      for(let i=0;i<8;i++){
        const angle=i*TAU/8+f.id*.39,inner=(.012+age*.01)*scale,outer=(.020+age*.025)*scale;
        ctx.beginPath();ctx.moveTo(px+Math.cos(angle)*inner,py+Math.sin(angle)*inner);
        ctx.lineTo(px+Math.cos(angle)*outer,py+Math.sin(angle)*outer);ctx.stroke();
      }
    }ctx.restore();
  }
  function ballTrail(ctx,v,samples){
    if(!samples||samples.length<2)return;
    ctx.save();
    for(let i=0;i<samples.length-1;i++){
      const a=samples[i],b=samples[i+1];const alpha=(i+1)/samples.length*.16;
      ctx.strokeStyle=`rgba(188,235,255,${alpha.toFixed(3)})`;
      ctx.lineWidth=Math.max(.6,(i+1)/samples.length*.006*v.scaleX);
      ctx.beginPath();ctx.moveTo(v.sx(a.x),v.sy(a.y));ctx.lineTo(v.sx(b.x),v.sy(b.y));ctx.stroke();
    }ctx.restore();
  }
  return {drawArt,lamp,sparks,ballTrail};
});
