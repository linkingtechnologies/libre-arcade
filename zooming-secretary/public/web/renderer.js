/* SPDX-License-Identifier: GPL-3.0-or-later */
import { TILE, MAP_ORIGIN_Y, TILE_SIZE } from '../src/map.js';
import { PHONE } from '../src/phone.js';
import { DIR } from '../src/npc.js';

const TOPIC_KEY = ['earth', 'history', 'books', 'space'];
const NES = Object.freeze({
  black:'#000000', cyan:'#38d9f5', cyanDark:'#087f9c', white:'#f7f4e8',
  magenta:'#e64aa5', blue:'#1769c2', yellow:'#f4d445', green:'#55c441',
  greenDark:'#177a38', orange:'#f08a2d', red:'#e34f55', redDark:'#9e303f',
  skin:'#f2b36f', brown:'#5d352b', violet:'#9a64c7', grey:'#9fb3bd'
});
const TOPIC_COLORS = [NES.green,NES.yellow,NES.magenta,NES.cyan];
const TOPIC_LETTERS = ['E','H','B','S'];

const PIXEL_GLYPHS = {
  ' ': [0,0,0,0,0,0,0],
  'A':[14,17,17,31,17,17,17],'B':[30,17,17,30,17,17,30],'C':[14,17,16,16,16,17,14],
  'D':[30,17,17,17,17,17,30],'E':[31,16,16,30,16,16,31],'F':[31,16,16,30,16,16,16],
  'G':[14,17,16,23,17,17,15],'H':[17,17,17,31,17,17,17],'I':[31,4,4,4,4,4,31],
  'J':[7,2,2,2,2,18,12],'K':[17,18,20,24,20,18,17],'L':[16,16,16,16,16,16,31],
  'M':[17,27,21,21,17,17,17],'N':[17,25,21,19,17,17,17],'O':[14,17,17,17,17,17,14],
  'P':[30,17,17,30,16,16,16],'Q':[14,17,17,17,21,18,13],'R':[30,17,17,30,20,18,17],
  'S':[15,16,16,14,1,1,30],'T':[31,4,4,4,4,4,4],'U':[17,17,17,17,17,17,14],
  'V':[17,17,17,17,17,10,4],'W':[17,17,17,21,21,21,10],'X':[17,17,10,4,10,17,17],
  'Y':[17,17,10,4,4,4,4],'Z':[31,1,2,4,8,16,31],
  '0':[14,17,19,21,25,17,14],'1':[4,12,4,4,4,4,14],'2':[14,17,1,2,4,8,31],
  '3':[30,1,1,14,1,1,30],'4':[2,6,10,18,31,2,2],'5':[31,16,16,30,1,1,30],
  '6':[14,16,16,30,17,17,14],'7':[31,1,2,4,8,8,8],'8':[14,17,17,14,17,17,14],
  '9':[14,17,17,15,1,1,14],':':[0,4,4,0,4,4,0],'/':[1,2,2,4,8,8,16],
  '-':[0,0,0,31,0,0,0],'.':[0,0,0,0,0,6,6],'!':[4,4,4,4,4,0,4],'?':[14,17,1,2,4,0,4]
};

function normalizePixelText(text) {
  return String(text)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[’‘]/g,"'").replace(/—/g,'-').toUpperCase();
}

export function pixelTextWidth(text,scale=1) {
  const length=normalizePixelText(text).length;
  return length ? (length*6-1)*scale : 0;
}

export function wrapPixelText(text,maxWidth,scale=1,maxLines=2) {
  const maxChars=Math.max(1,Math.floor((maxWidth/scale+1)/6));
  const words=String(text).trim().split(/\s+/).filter(Boolean);
  if(!words.length)return [''];
  const lines=[];
  let current='';
  const pushWord=word=>{
    while(word.length>maxChars){
      if(current){lines.push(current);current='';if(lines.length>=maxLines)return false;}
      lines.push(word.slice(0,maxChars));word=word.slice(maxChars);
      if(lines.length>=maxLines)return false;
    }
    const candidate=current?`${current} ${word}`:word;
    if(candidate.length<=maxChars){current=candidate;return true;}
    if(current){lines.push(current);if(lines.length>=maxLines)return false;}
    current=word;return true;
  };
  for(let i=0;i<words.length;i++){
    if(!pushWord(words[i])){
      const remaining=[current,...words.slice(i+1)].filter(Boolean).join(' ').trim();
      if(lines.length>=maxLines){
        const last=lines[maxLines-1] ?? '';
        lines[maxLines-1]=(last.length>maxChars-3?last.slice(0,maxChars-3):last)+'...';
      }else if(remaining){
        lines.push(remaining.length>maxChars?remaining.slice(0,maxChars-3)+'...':remaining);
      }
      return lines.slice(0,maxLines);
    }
  }
  if(current)lines.push(current);
  if(lines.length>maxLines){
    const kept=lines.slice(0,maxLines);
    kept[maxLines-1]=kept[maxLines-1].slice(0,Math.max(1,maxChars-3))+'...';
    return kept;
  }
  return lines;
}

function drawPixelText(ctx,text,x,y,{color='#f4f2e9',scale=1}={}) {
  ctx.fillStyle=color;
  let cursor=Math.round(x);
  const top=Math.round(y);
  for(const ch of normalizePixelText(text)) {
    const rows=PIXEL_GLYPHS[ch] ?? PIXEL_GLYPHS['?'];
    for(let row=0;row<7;row++) {
      const bits=rows[row];
      for(let col=0;col<5;col++) if(bits & (1 << (4-col))) ctx.fillRect(cursor+col*scale,top+row*scale,scale,scale);
    }
    cursor+=6*scale;
  }
  return pixelTextWidth(text,scale);
}


function drawTopicGlyph(c,id,x,y) {
  const px=Math.round(x), py=Math.round(y);
  if(id===0){ // globe
    c.fillStyle=NES.cyan; c.fillRect(px+1,py,3,1); c.fillRect(px,py+1,5,3); c.fillRect(px+1,py+4,3,1);
    c.fillStyle=NES.green; c.fillRect(px+1,py+1,1,1); c.fillRect(px+3,py+2,1,2);
  } else if(id===1){ // hourglass / history
    c.fillStyle=NES.yellow; c.fillRect(px,py,5,1); c.fillRect(px+1,py+1,3,1); c.fillRect(px+2,py+2,1,1); c.fillRect(px+1,py+3,3,1); c.fillRect(px,py+4,5,1);
  } else if(id===2){ // books
    c.fillStyle=NES.magenta; c.fillRect(px,py,2,5); c.fillStyle=NES.white; c.fillRect(px+2,py+1,1,4); c.fillStyle=NES.blue; c.fillRect(px+3,py,2,5);
  } else { // star / space
    c.fillStyle=NES.white; c.fillRect(px+2,py,1,5); c.fillRect(px,py+2,5,1); c.fillStyle=NES.cyan; c.fillRect(px+1,py+1,3,3); c.fillStyle=NES.white; c.fillRect(px+2,py+2,1,1);
  }
}

function drawPlatformTile(c,x,y) {
  // New clean-room pattern: high-level homage to the bright striped office floors in the NES game,
  // not a traced or byte-derived historical tile.
  c.fillStyle=NES.white; c.fillRect(x,y,8,1); c.fillRect(x,y+7,8,1);
  c.fillStyle=NES.cyan; c.fillRect(x,y+1,8,6);
  c.fillStyle=NES.magenta;
  c.fillRect(x,y+5,2,2); c.fillRect(x+2,y+3,2,2); c.fillRect(x+4,y+1,2,2); c.fillRect(x+6,y+5,2,2);
  c.fillStyle=NES.white; c.fillRect(x+1,y+2,1,1); c.fillRect(x+5,y+4,1,1);
}

export class ArcadeRenderer {
  constructor(canvas, strings) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.strings = strings;
    this.message = '';
    this.messageTicks = 0;
  }

  setStrings(strings) { this.strings = strings; }
  flash(message, ticks = 90) { this.message = message; this.messageTicks = ticks; }

  draw(sim) {
    const c = this.ctx;
    c.save();
    c.imageSmoothingEnabled = false;
    this.drawBackdrop();
    this.drawHud(sim);
    this.drawMap(sim.stage.map);
    this.drawTables(sim);
    this.drawTopics(sim);
    this.drawCoffee(sim);
    this.drawPhones(sim);
    this.drawNpc(sim);
    this.drawPlayer(sim);
    this.drawMessage();
    c.restore();
  }

  drawBackdrop() {
    const c=this.ctx;
    // The original NES game is visually sparse: a black playfield with bright office geometry.
    // M28 adopts that visual grammar without importing any historical tile or sprite pixels.
    c.fillStyle=NES.black; c.fillRect(0,0,256,240);
  }

  drawHud(sim) {
    const c = this.ctx;
    c.fillStyle = NES.black; c.fillRect(0, 0, 256, 48);
    // Cyan/white bitmap HUD mirrors the density and contrast of the NES presentation.
    drawPixelText(c,sim.stage.name,16,4,{color:NES.cyan});
    drawPixelText(c,`${this.strings.calls} ${sim.phones.callsCount}/${sim.stage.targetCalls}`,68,4,{color:NES.cyan});
    const missText = sim.stage.bonus ? `${this.strings.misses} ${this.strings.dreamMiss ?? '-'}` : `${this.strings.misses} ${sim.phones.callsMissed}/${sim.missLimit}`;
    drawPixelText(c,missText,178,4,{color:NES.cyan});

    // Small status emblem in the historical HUD zone. It communicates memory without consuming a
    // whole modern UI widget; the accompanying text remains bilingual and readable.
    c.strokeStyle=NES.cyan; c.strokeRect(3.5,3.5,8,8);
    if(sim.player.wisdom){ c.fillStyle=NES.yellow; c.fillRect(5,5,5,5); }
    else if(sim.player.topic!==255) drawTopicGlyph(c,sim.player.topic,5,5);

    let topic = this.strings.none;
    if (sim.player.wisdom) topic = this.strings.any;
    else if (sim.player.topic !== 255) topic = this.strings[TOPIC_KEY[sim.player.topic]] ?? '?';
    drawPixelText(c,`${this.strings.memory}: ${topic}`,8,24,{color:NES.white});
    if (sim.player.coffee) drawPixelText(c,`${this.strings.boost}: ${sim.player.coffee}`,178,24,{color:NES.yellow});
    c.fillStyle=NES.cyan; c.fillRect(0,45,256,1);
  }

  drawMap(map) {
    const c = this.ctx;
    for (let row = 0; row < map.height; row++) {
      for (let col = 0; col < map.width; col++) {
        const t = map.get(col, row);
        const x = col * TILE_SIZE;
        const y = MAP_ORIGIN_Y + row * TILE_SIZE;
        if (t === TILE.WALL) {
          drawPlatformTile(c,x,y);
        } else if (t === TILE.LADDER) {
          // Pixel-only ladder: white rails, cyan rungs. No antialiased strokes.
          c.fillStyle=NES.white; c.fillRect(x+1,y,1,8); c.fillRect(x+6,y,1,8);
          c.fillStyle=NES.cyan; c.fillRect(x+2,y+1,4,1); c.fillRect(x+2,y+4,4,1); c.fillRect(x+2,y+7,4,1);
        }
      }
    }
  }

  drawTables(sim) {
    if (!sim.stage.tables?.length) return;
    const c = this.ctx;
    for (const t of sim.stage.tables) {
      c.fillStyle=NES.magenta; c.fillRect(t.x-7,t.y-2,22,3);
      c.fillStyle=NES.white; c.fillRect(t.x-6,t.y+1,20,2);
      c.fillStyle=NES.cyan; c.fillRect(t.x-5,t.y+3,18,5);
      c.fillStyle=NES.blue; c.fillRect(t.x-4,t.y+8,3,5); c.fillRect(t.x+9,t.y+8,3,5);
    }
  }

  drawTopics(sim) {
    const c = this.ctx;
    for (const t of sim.topics) {
      // Two-drawer filing cabinet, intentionally new but using the same readable office metaphor.
      c.fillStyle=NES.greenDark; c.fillRect(t.x-2,t.y-4,15,14);
      c.fillStyle=NES.green; c.fillRect(t.x-1,t.y-3,13,12);
      c.fillStyle=NES.white; c.fillRect(t.x+1,t.y,9,1); c.fillRect(t.x+1,t.y+5,9,1);
      c.fillStyle=NES.greenDark; c.fillRect(t.x+4,t.y+2,3,1); c.fillRect(t.x+4,t.y+7,3,1);
      drawTopicGlyph(c,t.id,t.x+4,t.y-9);
    }
  }

  drawCoffee(sim) {
    if (!sim.coffee) return;
    const c = this.ctx;
    const ready = sim.coffee.wait === 0;
    c.fillStyle=ready?NES.white:NES.grey; c.fillRect(sim.coffee.x,sim.coffee.y+2,7,5);
    c.fillStyle=ready?NES.cyan:NES.cyanDark; c.fillRect(sim.coffee.x+1,sim.coffee.y+3,5,3);
    c.fillStyle=ready?NES.white:NES.grey; c.fillRect(sim.coffee.x+7,sim.coffee.y+3,2,3);
    if(ready){c.fillStyle=NES.white;c.fillRect(sim.coffee.x+2,sim.coffee.y-2,1,2);c.fillRect(sim.coffee.x+5,sim.coffee.y-3,1,2);}
  }

  drawPhones(sim) {
    const c = this.ctx;
    for (const p of sim.phones.phones) {
      if (!p) continue;
      const ringing = p.level > PHONE.IDLE && p.level !== PHONE.ANSWERED;
      const urgent = ringing && p.level >= 3;
      const base = urgent ? NES.white : ringing ? NES.yellow : NES.cyan;
      // Compact desk phone: body, dark keypad, lifted handset and pixel ring rays.
      c.fillStyle=base; c.fillRect(p.x,p.y+3,8,5);
      c.fillStyle=NES.black; c.fillRect(p.x+2,p.y+5,4,2);
      c.fillStyle=base; c.fillRect(p.x+1,p.y,6,2); c.fillRect(p.x,p.y+1,2,2); c.fillRect(p.x+6,p.y+1,2,2);
      if(ringing){
        c.fillStyle=urgent?NES.white:NES.yellow;
        c.fillRect(p.x-3,p.y-2,2,1); c.fillRect(p.x-2,p.y-4,1,2);
        c.fillRect(p.x+9,p.y-2,2,1); c.fillRect(p.x+9,p.y-4,1,2);
        if(p.topic!==null && p.topic!==undefined) drawTopicGlyph(c,p.topic,p.x+2,p.y-9);
      }
    }
  }

  drawNpc(sim) {
    if (!sim.npc) return;
    const c = this.ctx, n=sim.npc, x=n.x, y=n.y;
    const chief=n.type==='chief', bouncer=n.type==='bouncer', chatter=n.type==='chatter', geek=n.type==='geek', manbox=n.type==='manbox', dibrov=n.type==='dibrov', ghost=n.type==='ghost';
    if(ghost){
      // Deliberately block-built ghost: NES-like readability with no traced historical sprite.
      c.fillStyle=NES.white; c.fillRect(x+4,y+4,8,3); c.fillRect(x+2,y+7,12,9); c.fillRect(x+1,y+10,14,7);
      c.fillRect(x+1,y+17,3,4); c.fillRect(x+6,y+17,3,4); c.fillRect(x+11,y+17,3,4);
      c.fillStyle=NES.blue; c.fillRect(x+4,y+10,2,2); c.fillRect(x+10,y+10,2,2); c.fillRect(x+7,y+14,2,2); return;
    }
    // Shared human skeleton; per-character props carry the gameplay identity instead of debug letters.
    const coat=chief?NES.red:bouncer?NES.magenta:chatter?NES.violet:geek?NES.green:dibrov?NES.blue:NES.orange;
    c.fillStyle=NES.brown; c.fillRect(x+5,y,6,2);
    c.fillStyle=NES.skin; c.fillRect(x+5,y+2,6,6);
    c.fillStyle=coat; c.fillRect(x+3,y+8,10,8); c.fillRect(x+2,y+10,2,6); c.fillRect(x+13,y+10,2,6);
    c.fillStyle=NES.blue; c.fillRect(x+4,y+16,4,7); c.fillRect(x+9,y+16,4,7);
    c.fillStyle=NES.black; c.fillRect(x+3,y+23,5,1); c.fillRect(x+9,y+23,5,1);
    if(chief){ c.fillStyle=NES.white; c.fillRect(x+7,y+8,2,5); c.fillStyle=NES.yellow; c.fillRect(x+7,y+12,2,3); if(sim.player.slowdown){c.fillStyle=NES.white;c.fillRect(x-4,y-7,2,2);c.fillRect(x,y-7,2,2);c.fillRect(x+4,y-7,2,2);} }
    if(bouncer){ c.fillStyle=NES.magenta; c.fillRect(x+1,y+12,14,7); c.fillStyle=NES.redDark; c.fillRect(x+2,y+19,12,2); }
    if(chatter){ c.fillStyle=NES.black; c.fillRect(x+4,y+5,3,2);c.fillRect(x+9,y+5,3,2);c.fillRect(x+7,y+5,2,1); if(n.wait){c.fillStyle=NES.white;c.fillRect(x+3,y-5,2,2);c.fillRect(x+7,y-5,2,2);c.fillRect(x+11,y-5,2,2);} }
    if(geek){ c.fillStyle=NES.black; c.fillRect(x+3,y+4,4,3);c.fillRect(x+9,y+4,4,3);c.fillRect(x+7,y+5,2,1); c.fillStyle=NES.white;c.fillRect(x+5,y+10,6,5);c.fillStyle=NES.cyan;c.fillRect(x+6,y+11,4,3); }
    if(manbox){ c.fillStyle=NES.orange;c.fillRect(x,y+7,16,14);c.fillStyle=NES.yellow;c.fillRect(x+2,y+9,12,1);c.fillRect(x+7,y+7,2,14);c.fillStyle=NES.brown;c.fillRect(x+5,y+2,6,4); }
    if(dibrov){ c.fillStyle=NES.yellow;c.fillRect(x+4,y,8,3);c.fillStyle=NES.black;c.fillRect(x+4,y+5,3,2);c.fillRect(x+9,y+5,3,2); if(sim.player.wisdom){c.fillStyle=NES.yellow;c.fillRect(x-1,y-2,18,1);c.fillRect(x-1,y+24,18,1);} }
  }

  drawPlayer(sim) {
    const c = this.ctx;
    const p=sim.player;
    const x=p.xFp>>4, y=p.yFp>>4;
    const facingLeft=p.dirPrev===DIR.LEFT;
    const walking=(p.dir===DIR.LEFT||p.dir===DIR.RIGHT)&&!p.knocked;
    const step=walking?((p.stepAnim>>2)&1):0;
    // M28 clean-room heroine: orange/red hair and a coral skirt suit echo the original game's broad
    // palette/silhouette while the pixel arrangement is newly authored and intentionally not traced.
    c.fillStyle=NES.orange; c.fillRect(x+4,y,8,2); c.fillRect(x+(facingLeft?10:4),y+2,2,7); c.fillRect(x+5,y+2,6,2);
    c.fillStyle=NES.skin; c.fillRect(x+5,y+4,6,5); c.fillRect(x+(facingLeft?4:11),y+6,1,2);
    c.fillStyle=NES.black; c.fillRect(x+(facingLeft?6:9),y+5,1,1);
    c.fillStyle=p.knocked?NES.violet:NES.red; c.fillRect(x+4,y+9,8,7); c.fillRect(x+2,y+10+(step?1:0),2,6); c.fillRect(x+12,y+10+(step?0:1),2,6);
    c.fillStyle=NES.white; c.fillRect(x+7,y+9,2,5); c.fillRect(x+6,y+9,1,2); c.fillRect(x+9,y+9,1,2);
    c.fillStyle=NES.redDark; c.fillRect(x+5,y+16,6,2); c.fillRect(x+4,y+18,8,3);
    c.fillStyle=NES.skin;
    if(step){c.fillRect(x+4,y+21,3,2);c.fillRect(x+10,y+21,2,2);}else{c.fillRect(x+5,y+21,2,2);c.fillRect(x+9,y+21,2,2);}
    c.fillStyle=NES.black;
    if(step){c.fillRect(x+3,y+23,4,1);c.fillRect(x+10,y+23,3,1);}else{c.fillRect(x+4,y+23,3,1);c.fillRect(x+9,y+23,3,1);}
    if(p.answerTicks){c.fillStyle=NES.skin;c.fillRect(x+(facingLeft?1:14),y+8,1,4);}
    if(p.wisdom){c.fillStyle=NES.yellow;c.fillRect(x+1,y-2,14,1);c.fillRect(x+1,y+24,14,1);}
  }

  drawMessage() {
    if (!this.messageTicks || !this.message) return;
    const c = this.ctx; this.messageTicks--;
    const boxX=10, boxW=236, innerW=boxW-12;
    const lines=wrapPixelText(this.message,innerW,1,2);
    const lineGap=3;
    const textH=lines.length*7+(lines.length-1)*lineGap;
    const boxH=lines.length===1?17:27;
    const boxY=236-boxH;
    c.fillStyle = 'rgba(0, 0, 0, .94)'; c.fillRect(boxX, boxY, boxW, boxH);
    c.strokeStyle=NES.cyan;c.strokeRect(boxX+.5,boxY+.5,boxW-1,boxH-1);
    let textY=boxY+Math.floor((boxH-textH)/2);
    for(const line of lines){
      const w=pixelTextWidth(line,1);
      drawPixelText(c,line,128-w/2,textY,{color:NES.white});
      textY+=7+lineGap;
    }
  }
}
