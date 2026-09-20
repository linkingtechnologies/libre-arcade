/* Camera-only presentation logic. No state from here is passed into the physics engine. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.CometCamera=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const ZOOM=1.75;
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  function target(ball,worldW,worldH,zoom=ZOOM){
    const vw=worldW/zoom,vh=worldH/zoom;
    const leadX=clamp(ball.vx*.032,-.048,.048);
    const leadY=clamp(ball.vy*.07,-.095,.095);
    return {x:clamp(ball.x+leadX,vw/2,worldW-vw/2),y:clamp(ball.y+leadY,vh/2,worldH-vh/2)};
  }
  function create(worldW,worldH,zoom=ZOOM){
    if(!(worldW>0&&worldH>0&&zoom>=1))throw Error('Invalid camera bounds');
    const cam={worldW,worldH,zoom,following:true,x:worldW/2,y:worldH/2};
    cam.snap=function(ball){const p=target(ball,worldW,worldH,cam.following?cam.zoom:1);cam.x=p.x;cam.y=p.y;return cam;};
    cam.update=function(ball,dt){
      if(!cam.following){cam.x=worldW/2;cam.y=worldH/2;return cam;}
      const p=target(ball,worldW,worldH,cam.zoom);
      const blend=1-Math.exp(-Math.max(0,Math.min(dt,.1))/.13);
      cam.x+=blend*(p.x-cam.x);cam.y+=blend*(p.y-cam.y);
      return cam;
    };
    cam.setFollowing=function(value,ball){cam.following=!!value;return cam.snap(ball);};
    cam.transform=function(canvasW,canvasH){
      const z=cam.following?cam.zoom:1;
      const scaleX=canvasW/worldW*z,scaleY=canvasH/worldH*z;
      return {scaleX,scaleY,tx:canvasW/2-cam.x*scaleX,ty:canvasH/2+cam.y*scaleY,
        sx:x=>canvasW/2+(x-cam.x)*scaleX,sy:y=>canvasH/2-(y-cam.y)*scaleY};
    };
    return cam;
  }
  return {ZOOM,target,create};
});
