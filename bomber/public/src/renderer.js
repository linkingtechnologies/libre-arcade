const COLORS = ['#3478c8','#d04a47','#5aa55a','#d39832','#885ab3','#2ba6a0','#b66d31'];
export class Renderer {
  constructor(canvas) { this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.w=240; this.h=320; }
  clear(bg='#c5c5c5') { const c=this.ctx; c.fillStyle=bg; c.fillRect(0,0,this.w,this.h); }
  startup() {
    const c=this.ctx; this.clear('#c5c5c5'); c.fillStyle='#008080'; c.fillRect(24,0,192,320);
    c.fillStyle='#000080'; c.textAlign='center'; c.font='bold 22px monospace'; c.fillText('BOMBER',120,145);
  }
  title(g, strings) {
    const c=this.ctx; this.clear('#c5c5c5');
    c.fillStyle='#008080'; c.fillRect(24,0,192,320);
    c.textAlign='center'; c.textBaseline='alphabetic'; c.fillStyle='#000080'; c.font='bold 18px monospace'; c.fillText('BOMBER',120,30);
    c.font='12px monospace'; c.fillText(strings.originalBy,120,50); c.fillText('JOSEPH DUFFY',120,70); c.fillText(strings.adaptationBy,120,90); c.fillText('JUAN J LUNA',120,110);
    c.textAlign='left'; c.fillText(`${strings.score}: ${g.score}`,34,132); c.fillText(`${strings.landings}: ${g.landings}`,34,152); c.fillText(`${strings.hiscore}: ${g.scoreRecord}`,34,172);
    c.textAlign='center'; c.fillText(strings.press,120,210);
  }
  game(g, bg='#c5c5c5') {
    const c=this.ctx; this.clear(bg);
    c.fillStyle=bg; c.fillRect(24,0,192,320);
    c.fillStyle='#000'; c.fillRect(16,0,8,256);
    for (let row=0; row<26; row++) {
      const h=g.buildingHeights[row];
      for (let x=0; x<h; x++) this.block(24+x*8,24+row*8,g.buildingColours[row],x===h-1?g.buildingCaps[row]:0);
    }
    this.plane(24+g.planeX*8,g.planeY*8,g.planeFrame||0);
    if (g.bombStatus) this.bomb(24+g.bombX*8,g.bombY*8);
  }
  block(x,y,color,cap) {
    const c=this.ctx; c.fillStyle=COLORS[color%COLORS.length]; c.fillRect(x,y,8,8);
    c.fillStyle='#0005'; c.fillRect(x+1,y+1,1,6); c.fillRect(x+1,y+6,6,1);
    c.fillStyle='#fff6'; if(cap===1)c.fillRect(x+2,y,4,1); else if(cap===2){c.fillRect(x+3,y,2,2);} else if(cap===3){c.fillRect(x+1,y,2,2);c.fillRect(x+5,y+1,2,1);} else c.fillRect(x+1,y,6,1);
  }
  plane(x,y,frame) {
    const c=this.ctx; c.save(); c.translate(x,y);
    c.fillStyle=frame?'#8b1e1e':'#e8e8e8'; c.fillRect(1,9,6,10); c.fillRect(0,13,8,3); c.fillRect(3,3,2,20);
    c.fillStyle='#222'; c.fillRect(3,1,2,4); c.restore();
  }
  bomb(x,y){const c=this.ctx;c.fillStyle='#111';c.beginPath();c.arc(x+4,y+4,3,0,Math.PI*2);c.fill();c.fillStyle='#eee';c.fillRect(x+3,y,2,2);}
  black() { this.clear('#000'); }
}
