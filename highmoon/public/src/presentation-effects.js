// SPDX-License-Identifier: GPL-3.0-or-later
/** Presentation-only effects. They never read or mutate the historical RNG. */
function hash32(a, b = 0, c = 0) {
  let x = (a ^ Math.imul(b + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(c + 0xc2b2ae35, 0x27d4eb2f)) | 0;
  x ^= x >>> 16; x = Math.imul(x, 0x7feb352d); x ^= x >>> 15; x = Math.imul(x, 0x846ca68b); x ^= x >>> 16;
  return x >>> 0;
}
function unit(seed) { return hash32(seed) / 0x100000000; }

export class PresentationEffects {
  constructor() {
    this.items = [];
    this.shake = 0;
    this.reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  }

  burst(x, y, { count = 16, speed = 3.5, life = 28, radius = 2.5, hue = 45, seed = 1 } = {}) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const n = this.reducedMotion ? Math.max(4, Math.floor(count / 3)) : count;
    for (let i = 0; i < n; i += 1) {
      const a = unit(seed + i * 11) * Math.PI * 2;
      const s = speed * (.35 + unit(seed + i * 17 + 2) * .8);
      this.items.push({ type: 'particle', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, maxLife: life, radius: radius * (.55 + unit(seed + i * 23 + 3) * .7), hue });
    }
  }

  ring(x, y, { life = 24, maxRadius = 42, hue = 210 } = {}) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    this.items.push({ type: 'ring', x, y, life, maxLife: life, maxRadius, hue });
  }

  handle(event, snapshot) {
    const frame = event.frame ?? snapshot?.frame ?? 0;
    if (event.event === 'fire') {
      const p = snapshot?.players?.[event.player];
      if (p) this.burst(p.x + Math.cos(p.shootAngle) * 30, p.y + Math.sin(p.shootAngle) * 30, { count: 8, speed: 2.1, life: 18, hue: event.player === 0 ? 8 : 210, seed: frame + event.player });
    } else if (event.event === 'damage') {
      this.burst(event.x, event.y, { count: 28, speed: 5.2, life: 34, radius: 3.2, hue: 20, seed: frame + event.player * 97 });
      this.ring(event.x, event.y, { maxRadius: 65, hue: 22 });
      this.shake = this.reducedMotion ? 0 : Math.max(this.shake, 8);
    } else if (event.event === 'body_impact') {
      this.burst(event.x, event.y, { count: 20, speed: 4.2, life: 30, hue: 38, seed: frame + 41 });
      this.ring(event.x, event.y, { maxRadius: 48, hue: 35 });
      this.shake = this.reducedMotion ? 0 : Math.max(this.shake, 4);
    } else if (event.event === 'storm_contact') {
      this.ring(event.x, event.y, { maxRadius: 58, hue: 8 });
    } else if (event.event === 'wormhole') {
      this.ring(event.x, event.y, { maxRadius: 54, hue: 270 });
      this.ring(event.toX, event.toY, { maxRadius: 54, hue: 270 });
    } else if (event.event === 'cluster_spawn') {
      this.burst(event.x, event.y, { count: 24, speed: 4.5, life: 28, hue: 275, seed: frame + 177 });
    } else if (event.event === 'bonus_collected') {
      const p = snapshot?.players?.[event.player];
      if (p) this.burst(p.x, p.y, { count: 18, speed: 3.2, life: 32, hue: 50, seed: frame + 313 });
    } else if (event.event === 'winner') {
      const p = snapshot?.players?.[event.player];
      if (p) this.burst(p.x, p.y, { count: 50, speed: 6, life: 70, radius: 3.5, hue: event.player === 0 ? 10 : 205, seed: frame + 997 });
    }
  }

  update() {
    for (const item of this.items) {
      item.life -= 1;
      if (item.type === 'particle') {
        item.x += item.vx; item.y += item.vy; item.vx *= .985; item.vy *= .985;
      }
    }
    this.items = this.items.filter((x) => x.life > 0);
    this.shake *= .76;
    if (this.shake < .05) this.shake = 0;
  }

  cameraOffset(frame = 0) {
    if (!this.shake || this.reducedMotion) return { x: 0, y: 0 };
    return { x: Math.sin(frame * 2.399) * this.shake, y: Math.cos(frame * 1.731) * this.shake * .7 };
  }

  draw(ctx, worldX, worldY) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const item of this.items) {
      const alpha = Math.max(0, item.life / item.maxLife);
      const x = worldX(item.x); const y = worldY(item.y);
      if (item.type === 'particle') {
        ctx.globalAlpha = alpha * .9;
        ctx.fillStyle = `hsl(${item.hue} 95% 70%)`;
        ctx.beginPath(); ctx.arc(x, y, item.radius * (.45 + alpha * .55), 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.globalAlpha = alpha * .75;
        ctx.strokeStyle = `hsl(${item.hue} 95% 72%)`;
        ctx.lineWidth = 1.5 + alpha * 2;
        ctx.beginPath(); ctx.arc(x, y, (1 - alpha) * item.maxRadius + 4, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.restore();
  }
}
