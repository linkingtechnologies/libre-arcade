/*
 * Wok web preservation port - gameplay core
 * Copyright 2026 restoration contributors.
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This file is a clean JavaScript port based on the behavior of the historical
 * Wok 1.0 source by Kenta Cho (Copyright 2001, BSD-style license). The original
 * source is preserved unchanged under /reference/wok-1.0.
 */
(function (root) {
  'use strict';

  const W = root.Wok = root.Wok || {};

  const SCREEN_WIDTH = 640;
  const SCREEN_HEIGHT = 480;
  const RANK_BASE = 20000;
  const SCORE_MAX = 999999999;
  const MULTI_MAX = 9999;
  const MUSIC_CHANGE_SCORE = 1000000;
  const BALL_MAX = 96;
  const BOARD_MAX = 6;
  const GENERATOR_MAX = 4;

  const STATUS = Object.freeze({ TITLE: 0, IN_GAME: 1, MISS: 2, GAMEOVER: 3 });
  const GENERATOR = Object.freeze({ FIRE: 0, VOLCANO: 1, TREE: 2, BUCKET: 3, CLOUD: 4, WATER_TAP: 5 });

  const BALL_RADII = [7, 10, 15];
  const GRAVITY_BASE = [0.004, 0.008, 0.012];
  const GENERATOR_CNT_SUB = [4800, 5600, 6400, 6000, 6500, 7200];

  const vec = (x = 0, y = 0) => ({ x, y });
  const cloneVec = v => ({ x: v.x, y: v.y });
  const add = (a, b) => { a.x += b.x; a.y += b.y; return a; };
  const sub = (a, b) => { a.x -= b.x; a.y -= b.y; return a; };
  const mul = (a, s) => { a.x *= s; a.y *= s; return a; };
  const size = a => Math.sqrt(a.x * a.x + a.y * a.y);
  const projection = (v1, v2) => {
    const ll = v2.x * v2.x + v2.y * v2.y;
    if (ll === 0) return vec();
    const mag = v1.x * v2.x + v1.y * v2.y;
    return vec(mag * v2.x / ll, mag * v2.y / ll);
  };
  const checkSide = (checkPos, pos1, pos2) => {
    const xo = pos2.x - pos1.x;
    const yo = pos2.y - pos1.y;
    if (xo === 0) {
      if (yo === 0) return 0;
      return checkPos.x - pos1.x;
    }
    if (yo === 0) return pos1.y - checkPos.y;
    if (xo * yo > 0) {
      return (checkPos.x - pos1.x) / xo - (checkPos.y - pos1.y) / yo;
    }
    return -(checkPos.x - pos1.x) / xo + (checkPos.y - pos1.y) / yo;
  };

  function blankPanPos() {
    return {
      p1: vec(), p2: vec(), p3: vec(), p4: vec(),
      pc1: vec(), pc2: vec(), v1: vec(), v2: vec(),
      v1l: 0, v2l: 0
    };
  }

  function clonePanPos(p) {
    return {
      p1: cloneVec(p.p1), p2: cloneVec(p.p2), p3: cloneVec(p.p3), p4: cloneVec(p.p4),
      pc1: cloneVec(p.pc1), pc2: cloneVec(p.pc2), v1: cloneVec(p.v1), v2: cloneVec(p.v2),
      v1l: p.v1l, v2l: p.v2l
    };
  }

  class Random {
    constructor(randomFn) {
      this.randomFn = randomFn || Math.random;
    }
    n(n) {
      if (n <= 0) return 0;
      return Math.floor(this.randomFn() * n);
    }
    ns(n) {
      const positive = this.n(2) === 1;
      const magnitude = this.n(n);
      return positive ? magnitude : -magnitude;
    }
  }

  class Game {
    constructor(options = {}) {
      this.random = options.random instanceof Random ? options.random : new Random(options.randomFn);
      this.hiScore = Number.isFinite(options.hiScore) ? options.hiScore : 1000000;
      this.score = 0;
      this.aimScore = 0;
      this.rank = RANK_BASE;
      this.status = STATUS.TITLE;

      this.mouse = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2, down: false };
      this.pan = { pos: vec(80, 60), prvPos: vec(80, 60), vel: vec(), deg: 0 };
      this.now1 = blankPanPos(); this.now2 = blankPanPos(); this.now3 = blankPanPos();
      this.prv1 = blankPanPos(); this.prv2 = blankPanPos(); this.prv3 = blankPanPos();

      this.balls = Array.from({ length: BALL_MAX }, () => ({ color: -1 }));
      this.ballIdx = BALL_MAX;
      this.boards = Array.from({ length: BOARD_MAX }, () => ({ cnt: 0 }));
      this.boardIdx = BOARD_MAX;
      this.generators = Array.from({ length: GENERATOR_MAX }, () => ({ cnt: 0, apCnt: 0, spc: 0, x: 0, y: 0 }));
      this.generatorIdx = GENERATOR_MAX;

      this.scoreMulti = 1;
      this.smFib = 1;
      this.smTime = 0;
      this.gravity = GRAVITY_BASE.slice();
      this.missX = 0;
      this.missCnt = 0;
      this.ballCnt = 0; // C static storage starts at zero.
      this.generatorCnt = 0;
      this.musicChangeScore = MUSIC_CHANGE_SCORE;

      this.title = { mvTpIdx: -48, startMv: 0, quitMv: 0 };
      this.overCnt = 0;
      this.quitRequested = false;
      this.hiScoreChanged = false;

      this.audioEvents = [];
      this.sfxFlags = new Set();
      this.initTitle();
    }

    setPointer(x, y, down = this.mouse.down) {
      this.mouse.x = Math.max(0, Math.min(SCREEN_WIDTH - 1, x));
      this.mouse.y = Math.max(0, Math.min(SCREEN_HEIGHT - 1, y));
      this.mouse.down = !!down;
    }

    setPointerDown(down) { this.mouse.down = !!down; }

    requestSfx(idx) { this.sfxFlags.add(idx); }
    playMusic(idx) { this.audioEvents.push({ type: 'playMusic', idx }); }
    stopMusic() { this.audioEvents.push({ type: 'stopMusic' }); }
    nextMusic() { this.audioEvents.push({ type: 'nextMusic' }); }

    drainAudio() {
      const out = { events: this.audioEvents.splice(0), sfx: Array.from(this.sfxFlags) };
      this.sfxFlags.clear();
      return out;
    }

    initBalls() {
      for (const b of this.balls) b.color = -1;
      this.scoreMulti = 1;
      this.smFib = 1;
      this.smTime = 0;
    }

    initPan() {
      this.pan.prvPos.x = this.pan.pos.x = 80;
      this.pan.prvPos.y = this.pan.pos.y = 60;
      this.pan.vel.x = this.pan.vel.y = 0;
      this.pan.deg = 0;
      // Historical behavior: PanPos globals are not cleared here.
    }

    initBoards() { for (const b of this.boards) b.cnt = 0; }
    initGenerators() { for (const g of this.generators) g.cnt = 0; }

    initGame() {
      this.initBalls();
      this.initPan();
      this.initBoards();
      this.initGenerators();
      this.status = STATUS.IN_GAME;
      this.score = 0;
      this.aimScore = 0;
      this.musicChangeScore = MUSIC_CHANGE_SCORE;
      this.rank = RANK_BASE;
      this.ballCnt = 16;
      this.generatorCnt = 0;
      this.missCnt = 0;
      this.quitRequested = false;
      this.playMusic(0);
    }

    initTitle() {
      this.stopMusic();
      this.initBalls();
      this.status = STATUS.TITLE;
      this.title.mvTpIdx = -48;
      this.title.startMv = this.title.quitMv = 0;
    }

    initOver() {
      this.status = STATUS.GAMEOVER;
      this.overCnt = 0;
    }

    addScore(amount) {
      this.aimScore += amount;
      if (this.aimScore > SCORE_MAX) this.aimScore = SCORE_MAX;
      if (this.aimScore > this.musicChangeScore) {
        this.nextMusic();
        while (this.aimScore > this.musicChangeScore) this.musicChangeScore += MUSIC_CHANGE_SCORE;
      }
    }

    moveScore() {
      if (this.score < this.aimScore) {
        this.score += 1;
        this.score = Math.trunc(this.score + (this.aimScore - this.score) * 0.05);
        this.requestSfx(1);
      }
    }

    addBall(color, ballSize, x, y, mx, my) {
      let i;
      for (i = 0; i < BALL_MAX; i++) {
        this.ballIdx--;
        if (this.ballIdx < 0) this.ballIdx = BALL_MAX - 1;
        if (this.balls[this.ballIdx].color === -1) break;
      }
      if (i === BALL_MAX) return null;
      const b = this.balls[this.ballIdx];
      b.color = color;
      b.size = ballSize;
      b.sprPtn = (2 - color) * 3 + ballSize;
      b.radius = BALL_RADII[ballSize];
      b.pos = vec(x, y);
      b.vel = vec(mx, my);
      return b;
    }

    addBalls() {
      if (this.ballCnt <= 0) {
        this.addBall(
          this.random.n(3), this.random.n(3),
          this.random.n(SCREEN_WIDTH / 2), -this.random.n(16) - 32,
          this.random.ns(8) * 0.1, this.random.n(10) * 0.1
        );
        this.ballCnt = Math.trunc(RANK_BASE * 48 / this.rank);
      }
      this.ballCnt--;

      this.generatorCnt += Math.trunc(this.rank / (RANK_BASE / 5));
      if (this.random.n(this.generatorCnt) > 7200) {
        const spc = this.random.n(6);
        this.addGenerator(spc);
        this.generatorCnt -= GENERATOR_CNT_SUB[spc];
      }
    }

    getNextGeneratorIdx() {
      let i;
      for (i = 0; i < GENERATOR_MAX; i++) {
        this.generatorIdx--;
        if (this.generatorIdx < 0) this.generatorIdx = GENERATOR_MAX - 1;
        if (this.generators[this.generatorIdx].cnt === 0) break;
      }
      return i !== GENERATOR_MAX;
    }

    addGenerator(spc) {
      if (!this.getNextGeneratorIdx()) return;
      let g = this.generators[this.generatorIdx];
      g.spc = spc;
      switch (spc) {
        case GENERATOR.FIRE:
          g.x = this.random.n(Math.trunc(SCREEN_WIDTH / 3)) + Math.trunc(SCREEN_WIDTH / 6);
          g.y = this.random.n(SCREEN_HEIGHT / 2) + Math.trunc(SCREEN_HEIGHT / 4);
          g.apCnt = 0; g.cnt = this.random.n(120) + 120;
          break;
        case GENERATOR.VOLCANO:
          g.x = this.random.n(SCREEN_WIDTH / 4) + Math.trunc(SCREEN_WIDTH / 5);
          g.y = this.random.n(SCREEN_HEIGHT / 4) + Math.trunc(SCREEN_HEIGHT / 2);
          g.apCnt = 0; g.cnt = this.random.n(150) + 200;
          break;
        case GENERATOR.TREE:
          for (let i = 0; i < 3; i++) {
            g = this.generators[this.generatorIdx];
            g.spc = spc;
            g.x = this.random.n(SCREEN_WIDTH / 2) + Math.trunc(SCREEN_WIDTH / 5);
            g.y = this.random.n(SCREEN_HEIGHT / 5) + Math.trunc(SCREEN_HEIGHT / 5);
            g.apCnt = -this.random.n(40) * i;
            g.cnt = this.random.n(100) + 100;
            if (!this.getNextGeneratorIdx()) return;
          }
          break;
        case GENERATOR.BUCKET:
          g.x = this.random.n(Math.trunc(SCREEN_WIDTH / 3)) + Math.trunc(SCREEN_WIDTH / 2);
          g.y = 0; g.apCnt = 0; g.cnt = this.random.n(50) + 200;
          break;
        case GENERATOR.CLOUD:
          for (let i = 0; i < 2; i++) {
            g = this.generators[this.generatorIdx];
            g.spc = spc;
            g.x = this.random.n(SCREEN_WIDTH / 2) + Math.trunc(SCREEN_WIDTH / 5);
            g.y = this.random.n(SCREEN_HEIGHT / 4);
            g.apCnt = 0; g.cnt = this.random.n(200) + 50;
            if (!this.getNextGeneratorIdx()) return;
          }
          break;
        case GENERATOR.WATER_TAP:
          g.x = 0;
          g.y = this.random.n(SCREEN_HEIGHT / 4);
          g.apCnt = 0; g.cnt = this.random.n(250) + 100;
          break;
      }
    }

    moveGenerators() {
      for (const g of this.generators) {
        if (g.cnt <= 0) continue;
        this.requestSfx(0);
        switch (g.spc) {
          case GENERATOR.FIRE:
            if (this.random.n(20) === 0) this.addBall(0, this.random.n(2), g.x + 48, g.y, this.random.ns(10) * 0.2, -this.random.n(10) * 0.3 - 0.3);
            break;
          case GENERATOR.VOLCANO:
            if (this.random.n(18) === 0) this.addBall(0, this.random.n(3), g.x + 48 + this.random.ns(92), g.y - this.random.ns(48), this.random.ns(10) * 0.1, -this.random.n(10) * 0.5 - 2);
            break;
          case GENERATOR.TREE:
            if (this.random.n(32) === 0) this.addBall(1, 2, g.x + 48 + this.random.ns(128), g.y + 48, this.random.ns(30) * 0.1, 1);
            break;
          case GENERATOR.BUCKET:
            if (this.random.n(16) === 0) this.addBall(1, this.random.n(2), g.x - this.random.n(32), g.y + 80, -this.random.ns(30) * 0.1 - 4, 0);
            break;
          case GENERATOR.CLOUD:
            if (this.random.n(18) === 0) this.addBall(2, this.random.n(3), g.x + 48 + this.random.ns(160), g.y + 48, this.random.ns(20) * 0.1, this.random.n(10) * 0.3 + 1);
            break;
          case GENERATOR.WATER_TAP:
            if (this.random.n(12) === 0) this.addBall(2, 0, g.x + 96, g.y + 90, this.random.ns(30) * 0.1, this.random.n(10) * 0.2 + 3);
            break;
        }

        if (g.cnt === 1) {
          g.apCnt--;
          if (g.apCnt <= 0) g.cnt = 0;
        } else if (g.apCnt >= 16) {
          g.cnt--;
        } else {
          g.apCnt++;
        }
      }
    }

    addBoard(x, y, mx, my, sc, mp, cnt) {
      this.boardIdx--;
      if (this.boardIdx < 0) this.boardIdx = BOARD_MAX - 1;
      const b = this.boards[this.boardIdx];
      b.x = x; b.y = y; b.mx = mx; b.my = my;
      b.sc = sc; b.mp = mp; b.cnt = cnt; b.apCnt = 0;
    }

    moveBoards() {
      for (const b of this.boards) {
        if (b.cnt <= 0) continue;
        b.x += b.mx; b.y += b.my;
        if (b.cnt === 1) {
          b.apCnt -= 2;
          if (b.apCnt <= 0) b.cnt = 0;
        } else if (b.apCnt >= 16) {
          b.cnt--;
        } else {
          b.apCnt++;
        }
      }
    }

    movePan() {
      const PI = 3.1415;
      const PAN_WIDTH = 48;
      const PAN_HEIGHT = 16;
      const PAN_THICK = 8;
      const BALL_RADIUS = 10;

      this.pan.prvPos = cloneVec(this.pan.pos);
      this.pan.pos.x = this.mouse.x;
      this.pan.pos.y = this.mouse.y;
      this.pan.vel = cloneVec(this.pan.prvPos);
      sub(this.pan.vel, this.pan.pos);
      this.pan.deg -= this.pan.vel.x * 0.005;
      this.pan.deg *= 0.92;

      this.prv1 = clonePanPos(this.now1);
      this.prv2 = clonePanPos(this.now2);
      this.prv3 = clonePanPos(this.now3);

      const ps1 = Math.sin(this.pan.deg + PI * 0.25), pc1 = Math.cos(this.pan.deg + PI * 0.25);
      const ps2 = Math.sin(this.pan.deg + PI * 0.75), pc2 = Math.cos(this.pan.deg + PI * 0.75);
      const ps3 = Math.sin(this.pan.deg + PI * 1.25), pc3 = Math.cos(this.pan.deg + PI * 1.25);
      const ps4 = Math.sin(this.pan.deg + PI * 1.75), pc4 = Math.cos(this.pan.deg + PI * 1.75);
      const thick = (PAN_THICK + BALL_RADIUS) * 1.4;

      let n = blankPanPos();
      n.pc1.x = n.p1.x = n.p3.x = this.pan.pos.x + Math.cos(this.pan.deg + PI) * PAN_WIDTH;
      n.pc1.y = n.p1.y = n.p3.y = this.pan.pos.y + Math.sin(this.pan.deg + PI) * PAN_WIDTH;
      n.pc2.x = n.p2.x = n.p4.x = this.pan.pos.x + Math.cos(this.pan.deg) * PAN_WIDTH;
      n.pc2.y = n.p2.y = n.p4.y = this.pan.pos.y + Math.sin(this.pan.deg) * PAN_WIDTH;
      n.p1.x += pc3 * thick; n.p1.y += ps3 * thick;
      n.p2.x += pc4 * thick; n.p2.y += ps4 * thick;
      n.p3.x += pc2 * thick; n.p3.y += ps2 * thick;
      n.p4.x += pc1 * thick; n.p4.y += ps1 * thick;
      n.v1 = sub(cloneVec(n.p2), n.p1);
      n.v2 = sub(cloneVec(n.p1), n.p3);
      n.v1l = size(n.v1); n.v2l = size(n.v2);
      this.now1 = n;

      n = blankPanPos();
      n.pc1.x = n.p2.x = n.p4.x = this.now1.p1.x;
      n.pc1.y = n.p2.y = n.p4.y = this.now1.p1.y;
      n.pc2.x = n.p1.x = n.p3.x = n.p2.x + Math.cos(this.pan.deg + PI * 1.5) * PAN_HEIGHT;
      n.pc2.y = n.p1.y = n.p3.y = n.p2.y + Math.sin(this.pan.deg + PI * 1.5) * PAN_HEIGHT;
      n.p1.x += pc4 * thick; n.p1.y += ps4 * thick;
      n.p2.x += pc1 * thick; n.p2.y += ps1 * thick;
      n.p3.x += pc3 * thick; n.p3.y += ps3 * thick;
      n.p4.x += pc2 * thick; n.p4.y += ps2 * thick;
      n.v1 = sub(cloneVec(n.p2), n.p1);
      n.v2 = sub(cloneVec(n.p1), n.p3);
      n.v1l = size(n.v1); n.v2l = size(n.v2);
      this.now2 = n;

      n = blankPanPos();
      n.pc1.x = n.p1.x = n.p3.x = this.now1.p2.x;
      n.pc1.y = n.p1.y = n.p3.y = this.now1.p2.y;
      n.pc2.x = n.p2.x = n.p4.x = n.p1.x + Math.cos(this.pan.deg + PI * 1.5) * PAN_HEIGHT;
      n.pc2.y = n.p2.y = n.p4.y = n.p1.y + Math.sin(this.pan.deg + PI * 1.5) * PAN_HEIGHT;
      n.p1.x += pc2 * thick; n.p1.y += ps2 * thick;
      n.p2.x += pc3 * thick; n.p2.y += ps3 * thick;
      n.p3.x += pc1 * thick; n.p3.y += ps1 * thick;
      n.p4.x += pc4 * thick; n.p4.y += ps4 * thick;
      n.v1 = sub(cloneVec(n.p2), n.p1);
      n.v2 = sub(cloneVec(n.p1), n.p3);
      n.v1l = size(n.v1); n.v2l = size(n.v2);
      this.now3 = n;
    }

    checkBallHit(ball1, ball2) {
      let ofs = vec(ball1.pos.x - ball2.pos.x, ball1.pos.y - ball2.pos.y);
      let l = ofs.x * ofs.x + ofs.y * ofs.y;
      const rr = ball1.radius + ball2.radius;
      if (l > rr * rr) return;
      // The C original would become numerically undefined for perfectly coincident
      // centers. Avoid NaN while leaving every non-degenerate collision unchanged.
      if (l === 0) { ofs = vec(0.000001, 0); l = ofs.x * ofs.x; }

      const csft1 = projection(ball1.vel, ofs);
      sub(ball1.vel, csft1);
      const csft2 = projection(ball2.vel, ofs);
      sub(ball2.vel, csft2);

      mul(csft1, ball1.radius * 0.8 / ball2.radius);
      mul(csft2, ball2.radius * 0.8 / ball1.radius);
      add(ball2.vel, csft1);
      add(ball1.vel, csft2);

      mul(ofs, rr / Math.sqrt(l) / 2);
      add(ball1.pos, ball2.pos);
      mul(ball1.pos, 0.5);
      ball2.pos = cloneVec(ball1.pos);
      sub(ball2.pos, ofs);
      add(ball1.pos, ofs);
    }

    checkPanHit(bl, now, prv, bs) {
      let vc1, vc2, vc3, vc4;
      if (bs === 0) {
        if (now.p1.y < prv.p3.y) { vc1 = now.p1; vc3 = prv.p3; } else { vc3 = now.p1; vc1 = prv.p3; }
        if (now.p2.y < prv.p4.y) { vc2 = now.p2; vc4 = prv.p4; } else { vc4 = now.p2; vc2 = prv.p4; }
      } else if (bs === 1) {
        if (now.p1.x > prv.p3.x) { vc1 = now.p1; vc3 = prv.p3; } else { vc3 = now.p1; vc1 = prv.p3; }
        if (now.p2.x > prv.p4.x) { vc2 = now.p2; vc4 = prv.p4; } else { vc4 = now.p2; vc2 = prv.p4; }
      } else {
        if (now.p1.x < prv.p3.x) { vc1 = now.p1; vc3 = prv.p3; } else { vc3 = now.p1; vc1 = prv.p3; }
        if (now.p2.x < prv.p4.x) { vc2 = now.p2; vc4 = prv.p4; } else { vc4 = now.p2; vc2 = prv.p4; }
      }

      if (!(checkSide(bl.pos, now.p1, now.p2) <= 0 &&
            (checkSide(bl.pos, prv.p3, prv.p4) >= 0 || checkSide(bl.pos, now.p3, now.p4) >= 0) &&
            checkSide(bl.pos, vc2, vc4) <= 0 && checkSide(bl.pos, vc1, vc3) >= 0)) return;

      const ofs = sub(cloneVec(bl.pos), prv.p1);
      const po1 = projection(ofs, prv.v1);
      const l1 = size(po1);
      if (l1 > now.v1l) return;
      const po2 = projection(ofs, prv.v2);
      const l2 = size(po2);
      if (l2 > now.v2l) return;

      bl.pos = cloneVec(now.p1);
      const o1 = cloneVec(now.v1);
      if (now.v1l !== 0) mul(o1, l1 / now.v1l);
      add(bl.pos, o1);
      if (ofs.y < 0) {
        const o2 = cloneVec(now.v2);
        if (now.v2l !== 0) mul(o2, l2 / now.v2l);
        add(bl.pos, o2);
      }

      const rvReflect = projection(bl.vel, now.v2);
      mul(rvReflect, 1.2);
      sub(bl.vel, rvReflect);

      const rv = cloneVec(this.pan.vel);
      mul(rv, -2 / (bl.radius * 0.5));
      if (rv.y > 0) rv.y = 0;
      rv.x *= 0.5;
      add(bl.vel, rv);
    }

    addBallScore(bl) {
      const nsmf = this.scoreMulti;
      const bs = bl.size + 3;
      let smLgt = 1;
      let sm = this.scoreMulti;
      this.addScore(bs * this.scoreMulti);
      while (sm > 0) { sm = Math.trunc(sm / 10); smLgt++; }
      this.addBoard(
        bl.pos.x - smLgt * 52, bl.pos.y,
        -this.random.n(10) * 0.1 - 0.1, -this.random.n(20) * 0.1,
        bs, this.scoreMulti, Math.trunc(this.scoreMulti / 100) + this.random.n(10) + 10
      );
      this.scoreMulti = Math.trunc(this.scoreMulti + this.smFib * 0.5 + 1);
      if (this.scoreMulti > MULTI_MAX) this.scoreMulti = MULTI_MAX;
      this.smFib = nsmf;
      this.smTime = 20;
    }

    moveBalls() {
      for (let i = 0; i < 3; i++) this.gravity[i] = GRAVITY_BASE[i] * this.rank / RANK_BASE;

      for (let i = 0; i < BALL_MAX; i++) {
        const bl = this.balls[i];
        if (bl.color === -1) continue;
        bl.vel.y += this.gravity[bl.color];
        bl.pos.x += bl.vel.x;
        bl.pos.y += bl.vel.y;

        for (let j = i + 1; j < BALL_MAX; j++) {
          if (this.balls[j].color !== -1) this.checkBallHit(bl, this.balls[j]);
        }

        if (this.status === STATUS.MISS) {
          bl.vel.x += (bl.pos.x - this.missX) * 0.003;
          bl.vel.y -= 0.3;
        } else if (this.status === STATUS.IN_GAME) {
          this.checkPanHit(bl, this.now1, this.prv1, 0);
          this.checkPanHit(bl, this.now2, this.prv2, 1);
          this.checkPanHit(bl, this.now3, this.prv3, 2);
        }

        if (bl.pos.y < 0) {
          bl.vel.x *= 0.99; bl.vel.y *= 0.99;
          if (bl.pos.y < -SCREEN_HEIGHT) { bl.pos.y = -SCREEN_HEIGHT; bl.vel.y = 0; }
        }
        if (bl.pos.x < 0 && this.status === STATUS.IN_GAME) {
          bl.vel.x *= -0.8; bl.pos.x = 0;
        }

        if (bl.pos.x > SCREEN_WIDTH * 0.9) {
          if (bl.pos.y < 0) {
            bl.vel.x *= -0.8;
            bl.pos.x = SCREEN_WIDTH * 0.9;
          } else {
            if (this.status === STATUS.IN_GAME) this.addBallScore(bl);
            bl.color = -1;
            continue;
          }
        }

        if (this.status === STATUS.IN_GAME) {
          if (bl.pos.y > SCREEN_HEIGHT * 0.75) {
            if (bl.vel.y > 2) bl.vel.y *= 0.8;
            bl.vel.x *= 0.99; bl.vel.y *= 0.95;
            if (bl.pos.y > SCREEN_HEIGHT) {
              this.status = STATUS.MISS;
              this.missX = bl.pos.x;
              this.stopMusic();
              this.requestSfx(2);
              for (let j = 0; j < 32; j++) {
                this.addBall(0, 0, bl.pos.x + this.random.ns(32), bl.pos.y - this.random.n(32), this.random.ns(32) * 0.1, this.random.ns(32) * 0.1);
              }
            }
          }
        } else if (bl.pos.y > SCREEN_HEIGHT) {
          bl.color = -1;
        }
      }

      if (this.smTime > 0) {
        this.smTime--;
        if (this.smTime <= 0) this.scoreMulti = this.smFib = 1;
      }
    }

    moveTitle() {
      const mx = this.mouse.x, my = this.mouse.y;
      this.title.startMv = this.title.quitMv = 0;
      if (mx > 456 && mx < 586) {
        if (my > 300 && my < 332) this.title.startMv = 1;
        else if (my > 350 && my < 382) this.title.quitMv = 1;
      }
      if (this.title.startMv && this.mouse.down) {
        this.mouse.down = false; // one activation per pointer press in the browser.
        this.initGame();
        return;
      }
      if (this.title.quitMv && this.mouse.down) {
        this.mouse.down = false;
        this.quitRequested = true;
      }
      this.title.mvTpIdx++;
      if (this.title.mvTpIdx > 75 + 48) this.title.mvTpIdx = -48;
    }

    moveOver() {
      this.overCnt++;
      if (this.overCnt > 360 || this.mouse.down) {
        this.mouse.down = false;
        this.initTitle();
      }
    }

    step() {
      switch (this.status) {
        case STATUS.TITLE:
          this.rank = RANK_BASE;
          this.generatorCnt = 0;
          this.addBalls();
          this.moveBalls();
          this.moveTitle();
          break;
        case STATUS.IN_GAME:
          this.addBalls();
          this.moveBoards();
          this.moveBalls();
          this.movePan();
          this.moveGenerators();
          this.moveScore();
          break;
        case STATUS.MISS:
          this.moveBalls();
          this.moveScore();
          this.missCnt++;
          if (this.missCnt > 120) {
            this.score = this.aimScore;
            if (this.score > this.hiScore) {
              this.hiScore = this.score;
              this.hiScoreChanged = true;
            }
            this.initOver();
          }
          break;
        case STATUS.GAMEOVER:
          this.moveOver();
          break;
      }
      // The original increments rank once per nominal 10 ms outer loop under
      // normal performance. The fixed-step web loop preserves that 100 Hz rate.
      this.rank++;
    }

    handleEscape() {
      if (this.status === STATUS.TITLE) this.quitRequested = true;
      else this.initTitle();
    }
  }

  W.Core = {
    Game, Random, STATUS, GENERATOR,
    constants: { SCREEN_WIDTH, SCREEN_HEIGHT, RANK_BASE, SCORE_MAX, MULTI_MAX, BALL_MAX, BOARD_MAX, GENERATOR_MAX, BALL_RADII, GRAVITY_BASE },
    vector: { vec, cloneVec, add, sub, mul, size, projection, checkSide }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = W.Core;
})(typeof window !== 'undefined' ? window : globalThis);
