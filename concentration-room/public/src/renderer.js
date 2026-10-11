import { FIELD_HEIGHT, FIELD_WIDTH, cardIdentity } from './layouts.js';
import { PLAY_STATE } from './state-machine.js';
import {
  NES_CLUT, NES_GEOMETRY, buildCardTiles, backgroundPalette, cardSpritePalette,
  scoreBoxTiles, CURSOR_PALETTE, symbolTile, symbolSpritePosition,
  approachQuarter, arrowTarget, gameOverWipeRows, passControllerSprites,
} from './nes-visual.js';

export const NES_WIDTH = NES_GEOMETRY.width;
export const NES_HEIGHT = NES_GEOMETRY.height;

function indexToXY(index) { return { x: Math.floor(index / FIELD_HEIGHT), y: index % FIELD_HEIGHT }; }

function makeCanvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}

export class NesRenderer {
  constructor(canvas, { atlasUrl = './assets/original/gamegfx.png' } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = NES_WIDTH; canvas.height = NES_HEIGHT;
    this.atlas = new Image(); this.atlasReady = false; this.indices = null;
    this.tileCache = new Map();
    this.arrowX = 128; this.arrowY = 192; this.lastFrame = -1;
    this.atlas.onload = () => { this.#extractIndices(); this.atlasReady = true; };
    this.atlas.src = atlasUrl;
  }

  #extractIndices() {
    const c = makeCanvas(128, 128), x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(this.atlas, 0, 0);
    const rgba = x.getImageData(0,0,128,128).data;
    this.indices = new Uint8Array(128*128);
    for (let i=0; i<this.indices.length; i+=1) {
      const r=rgba[i*4];
      this.indices[i] = r > 220 ? 0 : r > 140 ? 1 : r > 50 ? 2 : 3;
    }
    this.tileCache.clear();
  }

  #tileCanvas(tile, palette, transparent=false) {
    const key = `${tile}:${palette.join(',')}:${transparent?1:0}`;
    if (this.tileCache.has(key)) return this.tileCache.get(key);
    const out = makeCanvas(8,8), ctx = out.getContext('2d');
    const data = ctx.createImageData(8,8);
    const sx=(tile&15)*8, sy=(tile>>>4)*8;
    for (let y=0;y<8;y+=1) for(let x=0;x<8;x+=1){
      const pi=this.indices[(sy+y)*128+sx+x];
      const o=(y*8+x)*4;
      if (transparent && pi===0) { data.data[o+3]=0; continue; }
      const hex=NES_CLUT[palette[pi]&0x3f];
      data.data[o]=parseInt(hex.slice(1,3),16); data.data[o+1]=parseInt(hex.slice(3,5),16); data.data[o+2]=parseInt(hex.slice(5,7),16); data.data[o+3]=255;
    }
    ctx.putImageData(data,0,0); this.tileCache.set(key,out); return out;
  }

  #drawTile(tile, palette, x, y, { transparent=false, flipH=false, flipV=false }={}) {
    if (!this.atlasReady) return;
    const img=this.#tileCanvas(tile,palette,transparent), c=this.ctx;
    if (!flipH && !flipV) { c.drawImage(img,x,y); return; }
    c.save(); c.translate(x+(flipH?8:0),y+(flipV?8:0)); c.scale(flipH?-1:1,flipV?-1:1); c.drawImage(img,0,0); c.restore();
  }

  #drawMetasprite2x2(baseTile, palette, x, y) {
    this.#drawTile(baseTile,palette,x,y,{transparent:true});
    this.#drawTile(baseTile^0x01,palette,x+8,y,{transparent:true});
    // the atlas is 16 tiles wide: the tile below is +$10 and the one diagonally below is +$11 (OAM tiles $6e $6f / $7e $7f)
    this.#drawTile(baseTile^0x10,palette,x,y+8,{transparent:true});
    this.#drawTile(baseTile^0x11,palette,x+8,y+8,{transparent:true});
  }

  cardAt(clientX, clientY) {
    const r=this.canvas.getBoundingClientRect();
    const px=(clientX-r.left)*NES_WIDTH/r.width, py=(clientY-r.top)*NES_HEIGHT/r.height;
    const col=Math.floor((px-NES_GEOMETRY.playfieldX)/NES_GEOMETRY.cardPitch);
    const row=Math.floor((py+NES_GEOMETRY.scrollY-NES_GEOMETRY.playfieldY)/NES_GEOMETRY.cardPitch);
    if(col<0||col>=FIELD_WIDTH||row<0||row>=FIELD_HEIGHT) return -1;
    return col*FIELD_HEIGHT+row;
  }

  #drawBoardBackground(game) {
    const c=this.ctx;
    c.fillStyle=NES_CLUT[0x0f]; c.fillRect(0,0,NES_WIDTH,NES_HEIGHT);
    c.save(); c.translate(0,-NES_GEOMETRY.scrollY);   // the background is scrolled up; the sprites drawn later are not
    const pal=backgroundPalette(0,game.bgcolor ?? 0x18);
    // the playfield is made of the 72 cards' tiles: absent ones are plain ($20), and the four at the corners of the table are rounded
    for(let i=0;i<72;i+=1){
      const tiles=buildCardTiles(game.board,i); const {x:col,y:row}=indexToXY(i);
      const bx=16+col*24, by=24+row*24;
      for(let ty=0;ty<4;ty+=1) for(let tx=0;tx<4;tx+=1) this.#drawTile(tiles[ty*4+tx],pal,bx+tx*8,by+ty*8);
    }
    c.restore();
  }

  #drawOpenSymbols(game) {
    for(let i=0;i<72;i+=1){
      const v=game.board[i]; if((v&0xc0)!==0xc0) continue;
      if(i===game.selected[0]&&game.card0FlipFrame) continue;
      if(game.state===PLAY_STATE.COLLECTING){
        const slot=i===game.selected[0]?0:i===game.selected[1]?1:-1;
        if(slot>=0 && game.collectingY?.[slot]) continue;
      }
      const p=symbolSpritePosition(i); this.#drawMetasprite2x2(symbolTile(cardIdentity(v)),cardSpritePalette(v),p.x,p.y+1);
    }
  }

  #drawFlippingCard(game) {
    if (!game.card0FlipFrame || game.selected[0] < 0) return;
    const i=game.selected[0], {x:col,y:row}=indexToXY(i), x=24+col*24, y=16+row*24;   // OAM y 15 + row*24, shown a line lower
    const tile=game.card0FlipFrame, pal=CURSOR_PALETTE;
    // Exact 0.02 2x3 flip metasprite, including sprite flips.
    this.#drawTile(tile,pal,x,y,{transparent:true});
    this.#drawTile(tile,pal,x+8,y,{transparent:true,flipH:true});
    this.#drawTile(tile|0x10,pal,x,y+8,{transparent:true});
    this.#drawTile(tile|0x10,pal,x+8,y+8,{transparent:true,flipH:true,flipV:true});
    this.#drawTile(tile,pal,x,y+16,{transparent:true,flipV:true});
    this.#drawTile(tile,pal,x+8,y+16,{transparent:true,flipH:true,flipV:true});
  }

  #drawCollecting(game) {
    if(game.state!==PLAY_STATE.COLLECTING) return;
    // the second card's sprites come first in sprite memory ($05-$08, the first card's are $09-$0C), so they are on top where the two overlap
    for(let slot=0;slot<2;slot+=1){
      const i=game.selected[slot]; if(i<0) continue;
      const v=game.board[i];
      if(!game.collectingY || game.collectingY[slot]===0 || game.collectingY[slot]>=0xf0) continue;
      this.#drawMetasprite2x2(symbolTile(cardIdentity(v)),cardSpritePalette(v),game.collectingX[slot],game.collectingY[slot]+1);
    }
  }

  #advanceArrow(game) {
    if(this.lastFrame<0){this.lastFrame=game.frame;return;}
    let steps=Math.max(0,Math.min(8,game.frame-this.lastFrame)); this.lastFrame=game.frame;
    const target=arrowTarget(game.cursorX??4,game.cursorY??3,game.state,game.stateTimer);
    while(steps-- >0){this.arrowX=approachQuarter(this.arrowX,target.x);this.arrowY=approachQuarter(this.arrowY,target.y);}
  }

  #drawArrow(game) {
    // 0.02 hides the arrow only for human PASS_CONTROLLER. In Vs CPU,
    // lastPlayerIsAI bypasses the pass message and leaves the arrow visible.
    // While the controller is being handed over the original also parks the arrow under the new player's score box, off the bottom of the
    // screen (cursor_sprite_x = the box's sprite x + 32, cursor_sprite_y = 191), so it slides back in from there when play goes on.
    if(!game.lastPlayerIsAI && game.state===PLAY_STATE.PASS_CONTROLLER) { this.arrowX=NES_GEOMETRY.scoreSpriteX[game.curTurn&1]+32; this.arrowY=191; this.lastFrame=game.frame; return; }
    this.#advanceArrow(game);
    const x=this.arrowX, y=this.arrowY+1, p=CURSOR_PALETTE;
    this.#drawTile(0x06,p,x,y,{transparent:true});
    this.#drawTile(0x07,p,x+8,y,{transparent:true});
    this.#drawTile(0x16,p,x,y+8,{transparent:true});
    this.#drawTile(0x17,p,x+8,y+8,{transparent:true});
  }

  #drawPassController(game) {
    if(game.state!==PLAY_STATE.PASS_CONTROLLER || game.lastPlayerIsAI) return;
    const pal=CURSOR_PALETTE;
    for (const sprite of passControllerSprites(game.curTurn)) {
      this.#drawTile(sprite.tile,pal,sprite.x,sprite.y,{transparent:true});
    }
  }

  #drawScore(game, player) {
    // the turn marker and the WIN mark reach the screen one iteration after the change (see turnChangedAt and clearedAt)
    const winState = (game.state===PLAY_STATE.CLEARED && game.frame>game.clearedAt) || (game.state===PLAY_STATE.DONE && game.endReason==='cleared');
    const pal=backgroundPalette(player+2), win=winState && game.winner===player;
    const turn=game.frame>game.turnChangedAt ? game.curTurn : -1;
    const {top,bottom}=scoreBoxTiles(game.score[player],player,turn,win), x=NES_GEOMETRY.scoreX[player];
    this.ctx.save(); this.ctx.translate(0,-NES_GEOMETRY.scrollY);
    for(let i=0;i<14;i+=1){this.#drawTile(top[i],pal,x+i*8,224);this.#drawTile(bottom[i],pal,x+i*8,232);}
    this.ctx.restore();
  }

  #drawGameOverWipe(game) {
    const complete = game.state===PLAY_STATE.DONE && game.endReason==='game-over';
    if(game.state!==PLAY_STATE.GAME_OVER && !complete) return;
    this.ctx.fillStyle=NES_CLUT[0x0f];
    for (const row of gameOverWipeRows(game.stateTimer, complete)) {
      if(row>=3 && row<=27) this.ctx.fillRect(0,row*8-NES_GEOMETRY.scrollY,256,8);
    }
  }

  render(game) {
    // a new game starts with the arrow where loadPlayScreen puts it
    if(game!==this.game){ this.game=game; this.arrowX=128; this.arrowY=192; this.lastFrame=-1; }
    const c=this.ctx; c.save(); c.imageSmoothingEnabled=false; c.clearRect(0,0,NES_WIDTH,NES_HEIGHT);
    if(!this.atlasReady){c.fillStyle='#000';c.fillRect(0,0,256,240);c.restore();return;}
    // the background first (the table, the score boxes, the game-over wipe), then the sprites, which are on top of all of it
    this.#drawBoardBackground(game);
    for(let p=0;p<game.numPlayers;p+=1) this.#drawScore(game,p);
    this.#drawGameOverWipe(game);
    this.#drawOpenSymbols(game);
    this.#drawCollecting(game);
    this.#drawFlippingCard(game);
    this.#drawArrow(game);
    this.#drawPassController(game);
    c.restore();
  }
}
