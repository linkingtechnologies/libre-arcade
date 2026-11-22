// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// Draws the field. Depth order, sprite offsets, bar sizes and animation speeds are those of the
// original (z = y + 58 for rabbits, 10 + y + 25 for carrots, scenery by its base, effects on top).
// This file only reads the game; it never changes it.

const FRAME_MS = 20;
const REEL = { player: 300, enemy: 250, push: 450, carrot: 450 }; // ms for one whole cycle
const SCENERY_Z_OFFSET = [0, 16, 8, 0, 16, 16, 0]; // by obstacle kind 1..6

export class Renderer {
  constructor(art) {
    this.art = art;
    this.reset();
  }

  reset() {
    this.anim = new Map(); // rabbit -> {dir, ms}
    this.puffs = [];
    this.ms = 0;
  }

  // Effects announced by the game (the cloud of a push).
  notify(events) {
    for (const ev of events) if (ev.type === "push") this.puffs.push({ x: ev.x, y: ev.y, age: 0 });
  }

  // Called once per simulation step.
  advance(game) {
    this.ms += FRAME_MS;
    for (const p of this.puffs) p.age += FRAME_MS;
    this.puffs = this.puffs.filter((p) => p.age < REEL.push);
    const walk = (who, reel) => {
      const m = who.move;
      const moving = m.up || m.down || m.left || m.right;
      let a = this.anim.get(who);
      if (!a) { a = { dir: 0, ms: 0 }; this.anim.set(who, a); }
      if (!moving) return;
      const dir = m.left ? 2 : m.right ? 3 : m.up ? 1 : 0; // sheet rows: down, up, left, right
      if (dir !== a.dir) { a.dir = dir; a.ms = 0; }
      a.ms = (a.ms + FRAME_MS) % reel;
    };
    walk(game.player, REEL.player);
    for (const e of game.enemies) {
      if (e.digCarrot.canPull || e.pushedProps.pushed) continue; // pulling or stunned: the original pauses the reel
      walk(e, REEL.enemy);
    }
  }

  frameOf(who, reel) {
    const a = this.anim.get(who);
    return a ? Math.min(2, Math.floor((a.ms / reel) * 3)) : 0;
  }

  draw(ctx, game) {
    const art = this.art;
    const W = game.config.screenWidth, H = game.config.screenHeight;
    for (let y = 0; y < H; y += 64) for (let x = 0; x < W; x += 64) ctx.drawImage(art.grass, x, y);

    const items = [];
    for (const o of game.obstacles) {
      const x = o.tx * 64, y = o.ty * 64;
      items.push({ z: 10 + y + 64 - SCENERY_Z_OFFSET[o.kind], draw: () => ctx.drawImage(art.tiles[o.kind], x, y) });
    }
    for (const c of game.carrots) {
      const f = [0, 1, 2, 1][Math.floor(((this.ms % REEL.carrot) / REEL.carrot) * 4)];
      items.push({ z: 10 + 24 + c.y + 1, draw: () => ctx.drawImage(art.carrots, f * 32, 0, 32, 32, c.x, c.y, 32, 32) });
    }
    const p = game.player;
    const rabbit = (who, sheet, reel) => items.push({
      z: who.y + 58,
      draw: () => {
        const a = this.anim.get(who);
        ctx.drawImage(sheet, this.frameOf(who, reel) * 32, (a ? a.dir : 0) * 48, 32, 48, who.x, who.y, 32, 48);
      },
    });
    rabbit(p, art.player, REEL.player);
    for (const e of game.enemies) rabbit(e, art.enemy, REEL.enemy);
    if (game.fork) {
      const f = game.fork;
      items.push({ z: 10 + f.y + 48, draw: () => ctx.drawImage(art.fork, f.x - 24, f.y - 24) });
    }
    items.sort((a, b) => a.z - b.z);
    for (const it of items) it.draw();

    for (const pf of this.puffs) {
      const f = Math.min(7, Math.floor((pf.age / REEL.push) * 8));
      ctx.drawImage(art.puff, f * 64, 0, 64, 64, pf.x - 32, pf.y - 32, 64, 64);
    }
    // pull bar over the carrot the player is standing on: red = effort left, green = health
    const obj = p.digCarrot.canPull ? p.digCarrot.obj : undefined;
    if (obj && !obj.dead) {
      ctx.fillStyle = "#aa0000";
      ctx.fillRect(obj.x, obj.y - 5, 32, 5);
      ctx.fillStyle = "#00aa00";
      ctx.fillRect(obj.x, obj.y - 5, Math.max(0, 0.32 * obj.health), 5);
    }
  }
}
