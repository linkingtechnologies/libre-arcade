import { BLOCK_HEIGHT,BLOCK_WIDTH,FLAG,FPS,LEVEL_HEIGHT,LEVEL_WIDTH,LOGICAL_HEIGHT,LOGICAL_WIDTH } from '../core/constants.js';
import { PARTICLE } from '../core/particles.js';

const colors=['#f2f2f2','#d44848','#e88735','#e5c844','#55a85b','#67b7c9','#4869bb','#b75aa6'];
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function triangle(c,a,b,d){c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.lineTo(d.x,d.y);c.closePath();c.fill();}
function jitter(t,salt=0){return ((Math.imul((t+salt)|0,1103515245)+12345>>>16)%3)-1;}

export class CanvasRenderer{
  constructor(canvas){
    this.canvas=canvas;
    this.ctx=canvas.getContext('2d',{alpha:false});
    this.pixelRatio=0;
    this.setPixelRatio(globalThis.devicePixelRatio||1);
  }

  setPixelRatio(value=1){
    const ratio=Math.max(2,Math.min(3,Number(value)||1));
    if(this.pixelRatio===ratio&&this.canvas.width===Math.round(LOGICAL_WIDTH*ratio)&&this.canvas.height===Math.round(LOGICAL_HEIGHT*ratio))return;
    this.pixelRatio=ratio;
    this.canvas.width=Math.round(LOGICAL_WIDTH*ratio);
    this.canvas.height=Math.round(LOGICAL_HEIGHT*ratio);
    this.ctx.setTransform(ratio,0,0,ratio,0,0);
    this.ctx.imageSmoothingEnabled=true;
    this.ctx.imageSmoothingQuality='high';
  }

  drawFlow(flow,t){
    switch(flow.screen){
      case 'warning': return this.warningScreen(flow,t);
      case 'title': return this.titleScreen(flow,t);
      case 'controls': return this.controlsScreen(flow,t);
      case 'credits': return this.creditsScreen(flow,t);
      case 'hiscore': return this.highScoreScreen(flow,t);
      default: return this.draw(flow.game,t);
    }
  }

  clearScreen(c,base='#172027'){
    c.fillStyle=base;c.fillRect(0,0,LOGICAL_WIDTH,LOGICAL_HEIGHT);
    c.save();c.globalAlpha=.08;c.strokeStyle='#fff';
    for(let x=-LOGICAL_HEIGHT;x<LOGICAL_WIDTH;x+=16){c.beginPath();c.moveTo(x,0);c.lineTo(x+LOGICAL_HEIGHT,LOGICAL_HEIGHT);c.stroke();}
    c.restore();
  }

  centredLines(c,lines,startY,{font='11px system-ui,sans-serif',gap=18,fill='#e8e6d7'}={}){
    c.font=font;c.fillStyle=fill;c.textAlign='center';c.textBaseline='top';
    lines.forEach((line,i)=>c.fillText(line,LOGICAL_WIDTH/2,startY+i*gap));
    c.textAlign='left';
  }

  warningScreen(flow,t){
    const c=this.ctx;this.clearScreen(c,'#1b1515');
    c.textAlign='center';c.textBaseline='top';c.fillStyle='#f0cf86';c.font='bold 18px system-ui,sans-serif';c.fillText(t.warningTitle,LOGICAL_WIDTH/2,26);
    this.centredLines(c,t.warningLines,76,{gap:19});
    if((flow.screenTime%FPS)<FPS/2)this.centredLines(c,[t.anyKey],194,{font:'10px system-ui,sans-serif',fill:'#fff'});
  }

  titleScreen(flow,t){
    const c=this.ctx,phase=flow.titlePhase(),time=flow.screenTime;
    this.clearScreen(c,'#14202a');
    if(time>FPS){
      let amount=1;
      if(phase.backgroundIn)amount=(time-FPS)/(FPS/2);
      if(phase.backgroundOut)amount=1-(time-FPS*4)/(FPS/2);
      c.save();c.globalAlpha=Math.max(0,Math.min(1,amount))*.65;
      c.fillStyle=phase.backgroundB?'#665233':'#315448';c.fillRect(18,46,284,124);
      c.strokeStyle='#d8d0a4';c.strokeRect(22.5,50.5,275,115);
      for(let i=0;i<7;i++){c.fillStyle=i%2?'#273735':'#405c4c';c.fillRect(28+i*39,132-(i%3)*10,28,24+(i%3)*10);}
      c.restore();
    }
    const k=Math.min(1,time/(FPS/2));
    c.save();c.translate(LOGICAL_WIDTH/2,84);c.scale(1+(1-k)*1.8,1+(1-k)*1.8);
    c.textAlign='center';c.textBaseline='middle';c.font='bold 27px system-ui,sans-serif';c.fillStyle='#f1d36d';c.strokeStyle='#3c2c16';c.lineWidth=3;c.strokeText('DONKEY',0,-12);c.fillText('DONKEY',0,-12);
    c.fillStyle='#f1eee0';c.font='bold 24px system-ui,sans-serif';c.strokeText('BOLONKEY',0,15);c.fillText('BOLONKEY',0,15);c.restore();
    if(phase.prompt){this.centredLines(c,[t.pressEnter,t.pressEsc],178,{font:'10px system-ui,sans-serif',gap:22,fill:'#fff'});}
    if(flow.exitRequested)this.centredLines(c,[t.browserExit],220,{font:'8px system-ui,sans-serif',fill:'#b9c4ca'});
  }

  controlsScreen(flow,t){
    const c=this.ctx;this.clearScreen(c,'#263746');
    c.textAlign='center';c.textBaseline='top';c.fillStyle='#f0e7ae';c.font='bold 17px system-ui,sans-serif';c.fillText(t.controlsTitle,LOGICAL_WIDTH/2,20);
    this.centredLines(c,t.controlsLines,70,{font:'11px system-ui,sans-serif',gap:27});
    if((flow.screenTime%FPS)<FPS/2)this.centredLines(c,[t.anyKey],211,{font:'9px system-ui,sans-serif',fill:'#fff'});
  }

  creditsScreen(flow,t){
    const c=this.ctx;this.clearScreen(c,'#34282d');
    c.textAlign='center';c.textBaseline='top';c.fillStyle='#f0d875';c.font='bold 19px system-ui,sans-serif';c.fillText(t.creditsTitle,LOGICAL_WIDTH/2,18);
    this.centredLines(c,t.creditsLines,58,{font:'10px system-ui,sans-serif',gap:22});
    this.centredLines(c,[t.anyKey],210,{font:'9px system-ui,sans-serif',fill:'#fff'});
  }

  highScoreScreen(flow,t){
    const c=this.ctx,hs=flow.highscores;
    this.clearScreen(c,flow.game.level?.bg==='bg2'?'#394038':'#253646');
    c.textAlign='center';c.textBaseline='top';c.fillStyle='#f0e7ae';c.font='bold 15px system-ui,sans-serif';c.fillText(t.highScores,LOGICAL_WIDTH/2,5);
    c.font='10px ui-monospace,Consolas,monospace';
    hs.entries.forEach((e,i)=>{
      const y=28+i*16,editing=i===hs.editingIndex;
      c.textAlign='right';c.fillStyle=editing?'#fff4a5':'#c7d0d4';c.fillText(`${i+1}.`,38,y);
      c.textAlign='left';c.fillText(e.name||'',48,y);
      c.textAlign='right';c.fillText(String(e.score),LOGICAL_WIDTH-10,y);
      if(editing&&(flow.screenTime%FPS)<FPS/2){
        const w=c.measureText(e.name).width;c.fillRect(48+w,y+12,7,2);
      }
    });
    c.textAlign='center';c.font='9px system-ui,sans-serif';c.fillStyle='#fff';
    if(hs.editingIndex>=0)c.fillText(t.namePrompt,LOGICAL_WIDTH/2,207);
    else if(flow.screenTime>FPS&&(flow.screenTime%FPS)<FPS/2)c.fillText(t.anyKey,LOGICAL_WIDTH/2,207);
    c.textAlign='left';
  }

  draw(game,t){
    const c=this.ctx;
    c.fillStyle=game.level.bg==='bg1'?'#253646':game.level.bg==='bg2'?'#394038':'#403536';
    c.fillRect(0,0,LOGICAL_WIDTH,LOGICAL_HEIGHT);
    this.backdrop(c,game.level.bg);
    this.level(c,game);
    this.donkeys(c,game);
    this.particles(c,game,false);
    this.crusher(c,game,t);
    this.particles(c,game,true);
    this.bubbles(c,game);
    this.hud(c,game,t);
    if(game.paused)this.overlay(c,t.pause,t.resume,true);
    if(game.gameOver){
      const blink=game.gameOverTime%(FPS*2)>FPS;
      this.overlay(c,game.final?t.completed:t.gameOver,blink?(game.final?t.finalHint:t.restartHint):'',false);
    }
  }

  backdrop(c,bg){
    c.save();
    c.globalAlpha=.14;
    c.strokeStyle='#fff';
    const s=bg==='bg3'?12:18;
    for(let x=-LOGICAL_HEIGHT;x<LOGICAL_WIDTH;x+=s){
      c.beginPath();c.moveTo(x,0);c.lineTo(x+LOGICAL_HEIGHT,LOGICAL_HEIGHT);c.stroke();
    }
    c.restore();
  }

  level(c,g){
    let doorIndex=0;
    for(let y=0;y<LEVEL_HEIGHT;y++)for(let x=0;x<LEVEL_WIDTH;x++){
      const f=g.getFlags(x,y);
      if(!f||(f&FLAG.BUBBLE))continue;
      const px=x*BLOCK_WIDTH,py=y*BLOCK_HEIGHT;
      if(f&FLAG.EXIT){
        const frame=g.doorFrame(doorIndex++);
        c.fillStyle='#8f823f';
        c.fillRect(px+1,py+5,BLOCK_WIDTH-2,BLOCK_HEIGHT-5);
        c.fillStyle='#282515';
        c.fillRect(px+4,py+7,BLOCK_WIDTH-8,BLOCK_HEIGHT-7);
        const gateHeight=Math.max(0,10-frame*5);
        if(gateHeight){
          c.fillStyle='#c2b45f';
          c.fillRect(px+5,py+7,BLOCK_WIDTH-10,gateHeight);
          c.fillStyle='#665d2f';
          for(let gx=px+7;gx<px+BLOCK_WIDTH-5;gx+=4)c.fillRect(gx,py+7,1,gateHeight);
        }
      }else{
        c.fillStyle=f&FLAG.TRAP?'#985f55':'#777d80';
        rr(c,px+2,py+6,BLOCK_WIDTH-4,8,3);c.fill();
        c.fillStyle='#adb3b6';
        rr(c,px+4,py+7,BLOCK_WIDTH-8,2,1);c.fill();
      }
      if(f&FLAG.HOME){
        c.fillStyle='#dad6a7';c.fillRect(px+5,py+2,8,12);
        c.fillStyle='#47382b';c.fillRect(px+7,py+7,4,7);
      }
    }

    const f=g.funnel,cr=g.crusher;
    if(f?.x1>=0&&cr){
      c.fillStyle='#817b16';
      triangle(c,{x:f.x1,y:f.y1},{x:cr.x,y:cr.y},{x:f.x1,y:f.y1+BLOCK_HEIGHT/2});
      triangle(c,{x:f.x2,y:f.y2},{x:cr.x+cr.w,y:cr.y},{x:f.x2,y:f.y2+BLOCK_HEIGHT/2});
      c.strokeStyle='#b2a934';c.lineWidth=1;
      c.beginPath();c.moveTo(f.x1,f.y1);c.lineTo(cr.x,cr.y);c.moveTo(f.x2,f.y2);c.lineTo(cr.x+cr.w,cr.y);c.stroke();
    }
  }

  donkeys(c,g){
    const walk=g.moveTime>=((FPS/2)*g.moveFreq/1000);
    for(const d of g.donkeys){
      this.donkeyAt(c,d.x*BLOCK_WIDTH+BLOCK_WIDTH/2,d.y*BLOCK_HEIGHT+BLOCK_HEIGHT/2-2,d.color,d.flip,1,0,walk);
    }
    for(const d of g.deaths){
      const p=g.deathPose(d);
      this.donkeyAt(c,p.x,p.y,d.color,d.flip,1,p.angle,true);
    }
  }

  donkeyAt(c,cx,cy,color,flip,scale=1,angle=0,walk=false){
    c.save();
    c.translate(cx,cy);
    c.rotate(angle);
    c.scale((flip?-1:1)*scale,scale);
    const coat=colors[color]||colors[0];
    c.fillStyle=coat;
    rr(c,-6.5,-5.2,11.5,8.8,3.8);c.fill();
    c.beginPath();c.ellipse(5.4,-1.8,4.2,3.5,0,0,Math.PI*2);c.fill();
    c.beginPath();c.moveTo(2.6,-4.3);c.quadraticCurveTo(2.2,-8.8,4.1,-8.2);c.quadraticCurveTo(6,-7.1,5,-3.9);c.fill();
    c.beginPath();c.moveTo(-4.7,-4.2);c.quadraticCurveTo(-7.5,-8.8,-8.2,-6.7);c.quadraticCurveTo(-8.6,-4.9,-5.3,-2.9);c.fill();
    const step=walk?1.1:0;
    c.strokeStyle=coat;c.lineWidth=2.4;c.lineCap='round';
    c.beginPath();c.moveTo(-3.4,2.2);c.lineTo(-3.8,7+step);c.moveTo(2.1,2.2);c.lineTo(2.7,7-step);c.stroke();
    c.fillStyle='#242424';c.beginPath();c.arc(6,-2.7,.75,0,Math.PI*2);c.fill();
    c.fillStyle='#d8c3ad';c.beginPath();c.ellipse(7.4,.2,2.4,1.45,0,0,Math.PI*2);c.fill();
    c.fillStyle='#3b302a';c.beginPath();c.arc(8.2,.05,.48,0,Math.PI*2);c.fill();
    c.restore();
  }

  particles(c,g,late){
    const split=FPS/4;
    for(const p of g.particleSystem.particles){
      if(late ? p.time<split : p.time>=split)continue;
      const pos=g.particleSystem.position(p);
      if(p.type===PARTICLE.BLOOD){
        const size=Math.trunc(p.size*p.time/(FPS*2));
        c.fillStyle='#e62f2f';
        if(size<=0)c.fillRect(Math.round(pos.x),Math.round(pos.y),1,1);
        else{c.beginPath();c.arc(pos.x,pos.y,size,0,Math.PI*2);c.fill();}
      }else{
        c.save();
        c.translate(pos.x,pos.y);
        c.rotate(Math.PI*2*(p.time%FPS)/FPS);
        c.fillStyle=p.type===PARTICLE.BODY3?'#efc6a4':p.type===PARTICLE.BODY2?'#b97b62':'#8a4f42';
        if(p.type===PARTICLE.BODY3){c.beginPath();c.arc(0,0,3,0,Math.PI*2);c.fill();}
        else if(p.type===PARTICLE.BODY2)c.fillRect(-3,-2,7,4);
        else c.fillRect(-2,-4,4,8);
        c.restore();
      }
    }
  }

  crusher(c,g){
    const cr=g.crusher;
    const jx=jitter(g.tickCount,17),jy=jitter(g.tickCount,43);

    // Motor, belt and pulley: procedural replacement preserving the original layout/motion.
    c.fillStyle='#565b5e';c.fillRect(cr.x-20+jx,cr.y+7+jy,20,20);
    c.fillStyle='#272a2c';c.fillRect(cr.x-17+jx,cr.y+11+jy,12,12);

    const pulleyX=cr.x+18,pulleyY=cr.y+15;
    c.strokeStyle='#16191a';c.lineWidth=2;
    c.beginPath();c.moveTo(cr.x-8+jx,cr.y+10+jy);c.lineTo(pulleyX,pulleyY-8);c.moveTo(cr.x-8+jx,cr.y+24+jy);c.lineTo(pulleyX,pulleyY+8);c.stroke();
    c.save();c.translate(pulleyX+jitter(g.tickCount,3),pulleyY+jitter(g.tickCount,5));c.rotate(g.crusher.angle/256*Math.PI*2);
    c.fillStyle='#b0a45b';c.beginPath();c.arc(0,0,9,0,Math.PI*2);c.fill();
    c.strokeStyle='#3d391f';c.lineWidth=2;c.beginPath();c.moveTo(-7,0);c.lineTo(7,0);c.moveTo(0,-7);c.lineTo(0,7);c.stroke();c.restore();

    c.fillStyle='#73787a';rr(c,cr.x,cr.y,cr.w,cr.h,4);c.fill();
    c.fillStyle='#3a3d3e';c.fillRect(cr.x+4,cr.y+4,cr.w-8,8);
    c.fillStyle='#171819';c.fillRect(cr.x+9,cr.y+14,cr.w-18,15);
    c.fillStyle='#999e9f';c.fillRect(cr.x+12,cr.y+15,2,12);c.fillRect(cr.x+18,cr.y+15,2,12);

    const panelX=cr.x+cr.w+5,panelY=177,panelW=LOGICAL_WIDTH-(cr.x+cr.w+9),panelH=57;
    c.fillStyle='#252b2e';rr(c,panelX,panelY,panelW,panelH,4);c.fill();
    c.strokeStyle='#596166';c.stroke();
    c.fillStyle='#101416';c.fillRect(panelX+7,panelY+9,panelW-14,20);

    c.fillStyle='#13283d';c.beginPath();c.arc(panelX+panelW-28,panelY+11,4,0,Math.PI*2);c.fill();
    if(g.alarm.blueTime>=0){c.fillStyle='#4aa5ff';c.beginPath();c.arc(panelX+panelW-28,panelY+11,3,0,Math.PI*2);c.fill();}
    c.fillStyle='#351414';c.beginPath();c.arc(panelX+panelW-14,panelY+11,4,0,Math.PI*2);c.fill();
    if(g.alarm.redTime>=0){c.fillStyle='#ff4a4a';c.beginPath();c.arc(panelX+panelW-14,panelY+11,3,0,Math.PI*2);c.fill();}
    this.banner(c,g,panelX+panelW-81,panelY+27);
  }

  hud(c,g,t){
    const cr=g.crusher,panelX=cr.x+cr.w+5,panelY=177;
    c.font='9px ui-monospace,Consolas,monospace';c.textBaseline='top';
    c.fillStyle='#b8c0c4';c.fillText(`${t.level} ${g.levelNumber}/6`,panelX+10,panelY+11);
    c.fillText(`${t.remaining} ${String(g.counter).padStart(3,'0')}`,panelX+75,panelY+11);
    c.fillStyle='#f0e7ae';c.font='bold 11px ui-monospace,Consolas,monospace';
    c.fillText(`${t.score} ${String(g.score).padStart(8,'0')}`,panelX+10,panelY+34);
    c.font='8px ui-monospace,Consolas,monospace';c.fillStyle='#9da7ab';
    c.fillText(`${t.best} ${String(g.bestScore).padStart(8,'0')}`,panelX+103,panelY+36);
  }

  banner(c,g,x,y){
    const b=g.bannerFrame();
    if(!b.visible)return;
    const w=75,h=28,drawH=b.phase==='collapse'?Math.max(0,Math.round(h*b.amount)):h;
    if(drawH<=0)return;
    const yy=y+Math.round((h-drawH)/2);
    c.save();c.beginPath();c.rect(x,yy,w,drawH);c.clip();
    const fills=['#675b31','#31545a','#5a354b','#355d3d','#4d4568'];
    c.fillStyle=fills[b.type]||fills[0];c.fillRect(x,y,w,h);
    c.strokeStyle='rgba(255,255,255,.45)';c.strokeRect(x+.5,y+.5,w-1,h-1);
    c.fillStyle='rgba(255,255,255,.78)';
    for(let i=0;i<5;i++){const px=x+8+i*13,bar=5+((b.type+i*3)%13);c.fillRect(px,y+20-bar,7,bar);}
    if(b.phase==='interference'){
      const threshold=Math.round(16*b.amount);
      for(let py=0;py<h;py+=2)for(let px=0;px<w;px+=3){
        const v=(Math.imul((g.tickCount+px+py*17+b.type*101)|0,1103515245)>>>27)&31;
        if(v<threshold){const gray=80+((px*19+py*11+g.tickCount*7)&127);c.fillStyle=`rgb(${gray} ${gray} ${gray})`;c.fillRect(x+px,y+py,3,2);}
      }
    }
    c.restore();
  }

  bubbles(c,g){
    g.bubbles.forEach((b,i)=>{
      if(!b.state)return;
      const cx=b.x*BLOCK_WIDTH+BLOCK_WIDTH/2,cy=b.y*BLOCK_HEIGHT+BLOCK_HEIGHT/2;
      const pulse=i===g.activeBubble?1+Math.sin(g.tickCount/7)*.08:1;
      c.save();c.translate(cx,cy);c.scale(pulse,pulse);
      c.fillStyle='rgba(120,205,255,.18)';c.strokeStyle=i===g.activeBubble?'#fff':'#78cdff';c.lineWidth=i===g.activeBubble?2:1;
      c.beginPath();c.arc(0,0,8,0,Math.PI*2);c.fill();c.stroke();
      if(b.donkey)this.donkeyAt(c,0,-2,b.donkey.color,b.donkey.flip,.72,0,false);
      c.restore();
    });
  }

  overlay(c,title,hint,compact){
    const y=compact?78:70,h=compact?68:84;
    c.fillStyle='rgba(0,0,0,.72)';c.fillRect(45,y,230,h);
    c.strokeStyle='#f4efd0';c.strokeRect(45.5,y+.5,229,h-1);
    c.fillStyle='#fff';c.font='bold 16px system-ui,sans-serif';c.textAlign='center';c.textBaseline='alphabetic';
    c.fillText(title,LOGICAL_WIDTH/2,y+27);
    if(hint){c.font='11px system-ui,sans-serif';c.fillStyle='#ddd';c.fillText(hint,LOGICAL_WIDTH/2,y+56);}
    c.textAlign='left';
  }
}
