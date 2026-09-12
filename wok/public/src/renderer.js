/* SPDX-License-Identifier: GPL-3.0-or-later */
(function (root) {
  'use strict';
  const W = root.Wok;
  const { STATUS } = W.Core;

  const NUM_SPRITE_IDX = 9;
  const PPS_SPRITE_IDX = 20;
  const PPL_SPRITE_IDX = 28;
  const PAN_SPRITE_IDX = 32;
  const GEN_SPRITE_IDX = 34;
  const BAR_SPRITE_IDX = 40;
  const TITLE_SPRITE_IDX = 44;
  const SCREEN_WIDTH = 640;
  const SCREEN_HEIGHT = 480;

  const TITLE_PTN = [
    2,0,0, 2,0,30, 3,12,60, 1,36,60,
    2,48,0, 2,48,30, 3,60,60, 1,84,60,
    2,96,0, 2,96,30,
    1,140,0, 2,132,30, 3,140,60, 0,164,80, 1,188,60, 2,204,30, 3,188,0, 0,164,0,
    2,250,0, 2,250,30, 2,250,60, 1,278,4, 1,260,30, 3,270,40, 3,288,60
  ];

  const OVER_PTN = [
    0,24,0, 1,0,0, 3,0,25, 0,24,45, 2,42,25, 0,24,25,
    2,70,25, 1,70,0, 3,94,0, 2,114,25, 0,82,28,
    2,140,0, 2,140,25, 3,145,0, 1,166,0, 2,188,0, 2,188,25,
    2,210,0, 2,210,25, 0,212,0, 0,231,0, 0,212,22, 0,212,48, 0,231,48,
    1,160,80, 3,160,108, 1,185,108, 3,185,80,
    2,230,80, 3,230,108, 1,254,108, 2,264,80,
    2,295,80, 2,295,105, 0,297,80, 0,315,80, 0,297,102, 0,297,128, 0,315,128,
    2,360,80, 2,360,112, 0,370,80, 0,370,105, 2,390,80, 3,375,115
  ];

  class Renderer {
    constructor(canvas, assets) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.ctx.imageSmoothingEnabled = false;
      this.sprites = assets.sprites;
      this.lastSm = 0;
      this.smy = SCREEN_HEIGHT;
      this.visualRandom = () => Math.random();
    }

    randN(n) { return Math.floor(this.visualRandom() * n); }
    randNS(n) { return this.randN(2) ? this.randN(n) : -this.randN(n); }

    clear() {
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }

    drawSprite(n, x, y) {
      const s = this.sprites[n];
      if (!s) return;
      this.ctx.drawImage(s, Math.trunc(x), Math.trunc(y));
    }

    fillRect(x, y, w, h) {
      this.ctx.fillStyle = 'rgb(240,240,128)';
      this.ctx.fillRect(Math.trunc(x), Math.trunc(y), Math.trunc(w), Math.trunc(h));
    }

    drawThrownZone() { this.fillRect(SCREEN_WIDTH * 0.93, 0, SCREEN_WIDTH * 0.1, SCREEN_HEIGHT); }

    drawNum(n, x, y) {
      let drawn = false;
      for (let d = 100000000; d > 0; d = Math.trunc(d / 10)) {
        const nd = Math.trunc(n / d);
        if (nd > 0 || drawn) {
          n -= d * nd;
          this.drawSprite(nd + NUM_SPRITE_IDX, x, y);
          x += 50;
          drawn = true;
        }
      }
      if (!drawn) {
        this.drawSprite(NUM_SPRITE_IDX, x, y);
        x += 52;
      }
      return x;
    }

    drawNumPaper(n, x, y, pc) {
      let drawn = false;
      const ofs = pc * 6;
      pc += PPS_SPRITE_IDX;
      for (let d = 1000000; d > 0; d = Math.trunc(d / 10)) {
        const nd = Math.trunc(n / d);
        if (nd > 0 || drawn) {
          n -= d * nd;
          this.drawSprite(pc, x, y);
          x += ofs;
          drawn = true;
        }
      }
      return x;
    }

    drawBalls(game) {
      if (game.smFib > 1) {
        this.smy = SCREEN_HEIGHT - 72;
        this.drawSprite(NUM_SPRITE_IDX + 10, 0, this.smy);
        this.drawNum(game.smFib, 52, this.smy);
        this.lastSm = game.smFib;
      } else if (this.smy < SCREEN_HEIGHT) {
        this.smy++;
        this.drawSprite(NUM_SPRITE_IDX + 10, 0, this.smy);
        this.drawNum(this.lastSm, 52, this.smy);
      }
      for (const b of game.balls) if (b.color !== -1) this.drawSprite(b.sprPtn, b.pos.x, b.pos.y);
    }

    drawPanPos(now, spriteIdx, main) {
      let x = now.pc1.x, y = now.pc1.y;
      let mx, my, count;
      if (main) {
        mx = (now.pc2.x - x) / 5; my = (now.pc2.y - y) / 5;
        x -= mx; y -= my; count = 8;
      } else {
        mx = (now.pc2.x - x) * 0.7; my = (now.pc2.y - y) * 0.7;
        count = 3;
      }
      for (let i = 0; i < count; i++, x += mx, y += my) this.drawSprite(spriteIdx, x, y);
    }

    drawPan(game) {
      this.drawPanPos(game.now1, PAN_SPRITE_IDX, true);
      this.drawPanPos(game.now2, PAN_SPRITE_IDX + 1, false);
      this.drawPanPos(game.now3, PAN_SPRITE_IDX + 1, false);
    }

    drawGenerators(game) {
      for (const g of game.generators) {
        if (g.cnt <= 0) continue;
        if (g.apCnt >= 16) {
          this.drawSprite(GEN_SPRITE_IDX + g.spc, g.x + this.randN(5) - 2, g.y + this.randN(5) - 2);
        } else if (g.apCnt >= 0) {
          this.drawSprite(Math.trunc(g.apCnt / 4) + PPL_SPRITE_IDX, g.x + this.randN(9) - 4, g.y + this.randN(9) - 4);
        }
      }
    }

    drawBoards(game) {
      for (const b of game.boards) {
        if (b.cnt <= 0) continue;
        if (b.apCnt >= 16) {
          let x = this.drawNum(b.sc, b.x, b.y);
          this.drawSprite(NUM_SPRITE_IDX + 10, x, b.y); x += 50;
          this.drawNum(b.mp, x, b.y);
        } else {
          let pc = Math.trunc(b.apCnt / 2);
          let x = this.drawNumPaper(1, b.x, b.y, pc);
          pc--; if (pc < 0) pc = 0;
          x = this.drawNumPaper(1, x, b.y, pc);
          pc--; if (pc < 0) pc = 0;
          this.drawNumPaper(b.mp, x, b.y, pc);
        }
      }
    }

    drawTitle(game) {
      const TITLE_X = 64, TITLE_Y = 80;
      this.fillRect(0, TITLE_Y, 40, 92);
      this.fillRect(400, TITLE_Y, 240, 92);
      for (let i = 0; i < TITLE_PTN.length; i += 3) {
        let x, y;
        if (i > game.title.mvTpIdx && i < game.title.mvTpIdx + 48) {
          x = this.randNS(4) + this.randNS(4) + this.randNS(4) + TITLE_X;
          y = this.randNS(4) + this.randNS(4) + this.randNS(4) + TITLE_Y;
        } else { x = TITLE_X; y = TITLE_Y; }
        this.drawSprite(BAR_SPRITE_IDX + TITLE_PTN[i], TITLE_PTN[i + 1] + x, TITLE_PTN[i + 2] + y);
      }
      this.fillRect(450, 282, 190, 120);
      if (game.title.startMv) this.drawSprite(TITLE_SPRITE_IDX, 480 + this.randNS(4) + this.randNS(4), 300 + this.randNS(4) + this.randNS(4));
      else this.drawSprite(TITLE_SPRITE_IDX, 480, 300);
      if (game.title.quitMv) this.drawSprite(TITLE_SPRITE_IDX + 1, 480 + this.randNS(4) + this.randNS(4), 350 + this.randNS(4) + this.randNS(4));
      else this.drawSprite(TITLE_SPRITE_IDX + 1, 480, 350);
      this.drawSprite(TITLE_SPRITE_IDX + 2, 20, 360);
      this.drawNum(game.hiScore, 10, 410);
      if (game.score > 0) this.drawNum(game.score, 0, 0);
      this.drawSprite(TITLE_SPRITE_IDX + 3, game.mouse.x, game.mouse.y);
    }

    drawOver(game) {
      this.drawNum(game.score, 0, 0);
      const OVER_X = 112, OVER_Y = 150;
      for (let i = 0; i < OVER_PTN.length; i += 3) {
        let x, y;
        if (game.overCnt < 30) {
          x = SCREEN_WIDTH / 2 - (SCREEN_WIDTH / 2 - (OVER_X + OVER_PTN[i + 1])) * game.overCnt / 30 + this.randNS(4) + this.randNS(4) + this.randNS(4);
          y = SCREEN_HEIGHT - (SCREEN_HEIGHT - (OVER_Y + OVER_PTN[i + 2])) * game.overCnt / 30 + this.randNS(4) + this.randNS(4) + this.randNS(4);
        } else {
          x = OVER_X + OVER_PTN[i + 1] + this.randNS(2);
          y = OVER_Y + OVER_PTN[i + 2] + this.randNS(2);
        }
        this.drawSprite(BAR_SPRITE_IDX + OVER_PTN[i], x, y);
      }
    }

    draw(game) {
      this.clear();
      switch (game.status) {
        case STATUS.TITLE:
          this.drawBalls(game);
          this.drawTitle(game);
          break;
        case STATUS.IN_GAME:
          this.drawThrownZone();
          this.drawBoards(game);
          this.drawPan(game);
          this.drawNum(game.score, 0, 0);
          this.drawBalls(game);
          this.drawGenerators(game);
          break;
        case STATUS.MISS:
          this.drawThrownZone();
          this.drawNum(game.score, 0, 0);
          this.drawBalls(game);
          break;
        case STATUS.GAMEOVER:
          this.drawOver(game);
          break;
      }
    }
  }

  W.Renderer = { Renderer };
})(window);
