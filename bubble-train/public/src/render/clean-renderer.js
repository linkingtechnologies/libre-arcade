// SPDX-License-Identifier: GPL-3.0-or-later
import { SPECIAL } from '../game/bubble.js';
import { CleanAssetLibrary } from './clean-asset-library.js';

const FALLBACK_PALETTE = ['#4f8bd6', '#d65757', '#58a86b', '#e58e4d', '#9c70e8'];

/** Canvas rotation is opposite the source/game angle convention (positive source angle aims left). */
export function cannonCanvasRotation(angle) { return -Number(angle || 0); }

const TRACK_STYLE = {
  default: { stroke: '#8b94a0', dash: [7,7], glow: 'rgba(255,255,255,.05)' },
  arctic: { stroke: '#8fd0e6', dash: [6,7], glow: 'rgba(255,255,255,.09)' },
  beach: { stroke: '#fff0d0', dash: [8,8], glow: 'rgba(255,255,255,.08)' },
  mexico: { stroke: '#ffd998', dash: [7,8], glow: 'rgba(120,55,8,.08)' },
  mountains: { stroke: '#dce7ef', dash: [8,7], glow: 'rgba(255,255,255,.06)' },
  sea: { stroke: '#dcfbff', dash: [7,9], glow: 'rgba(213,248,255,.08)' },
  sky: { stroke: '#f9fcff', dash: [8,8], glow: 'rgba(255,255,255,.10)' },
  space: { stroke: '#ddd6ff', dash: [5,8], glow: 'rgba(221,214,255,.10)' },
};

/** Clean-room renderer. Uses new CC0 SVG assets when available, with Canvas fallbacks. */
export class CleanRenderer {
  constructor(canvas, { diagnosticHud = false, assetBaseUrl = '../assets-clean/svg/' } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.diagnosticHud = diagnosticHud;
    this.assets = new CleanAssetLibrary(assetBaseUrl);
  }

  draw(level) {
    const ctx = this.ctx;
    const theme = String(level?.theme || 'default').toLowerCase();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const bg = this.assets.themeBackground(theme);
    if (bg) ctx.drawImage(bg, 0, 0, this.canvas.width, this.canvas.height);
    else { ctx.fillStyle = '#15171a'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); }

    for (const station of level.stations) {
      this.drawTrack(station.track, theme);
      for (let i = station.train.carriages.length - 1; i >= 0; i--) {
        this.drawBubble(station.train.positionOf(i), station.train.carriages[i].bubble);
      }
    }

    for (const bullet of level.bullets) this.drawBubble(bullet.position, bullet.bubble);
    for (const cannon of level.cannons) this.drawCannon(cannon);
    if (this.diagnosticHud) this.drawHud(level);
  }

  drawTrack(track, theme = 'default') {
    const ctx = this.ctx;
    const style = TRACK_STYLE[theme] ?? TRACK_STYLE.default;
    ctx.save();
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 4;
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = 6;
    ctx.setLineDash(style.dash);
    ctx.beginPath();
    let first = true;
    for (const section of track.sections) {
      const samples = Math.max(16, Math.min(180, Math.ceil(section.maxProgress > 20 ? section.maxProgress / 4 : section.maxProgress * 24)));
      for (let i = 0; i <= samples; i++) {
        const p = section.position(section.maxProgress * i / samples);
        if (first) { ctx.moveTo(p.x, p.y); first = false; }
        else ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  drawBubble(position, bubble) {
    const ctx = this.ctx;
    const normal = this.assets.bubbleImage(bubble.colour);
    const bomb = this.assets.image('bubble:bomb');
    const colourBomb = this.assets.image('bubble:colour-bomb');

    if (bubble.special === SPECIAL.BOMB && bomb) {
      ctx.drawImage(bomb, position.x - 18, position.y - 18, 36, 36);
      return;
    }
    if (bubble.special === SPECIAL.COLOUR_BOMB && colourBomb) {
      ctx.drawImage(colourBomb, position.x - 18, position.y - 18, 36, 36);
      return;
    }
    if (normal) {
      ctx.drawImage(normal, position.x - 18, position.y - 18, 36, 36);
      const overlayKey = bubble.special === SPECIAL.SPEED ? 'overlay:speed' : bubble.special === SPECIAL.RAINBOW ? 'overlay:rainbow' : null;
      const overlay = overlayKey ? this.assets.image(overlayKey) : null;
      if (overlay) ctx.drawImage(overlay, position.x - 18, position.y - 18, 36, 36);
      return;
    }

    this.drawBubbleFallback(position, bubble);
  }

  drawBubbleFallback(position, bubble) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.fillStyle = FALLBACK_PALETTE[bubble.colour % FALLBACK_PALETTE.length] ?? FALLBACK_PALETTE[0];
    ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f5f7fa'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = '#22272e'; ctx.lineWidth = 2;
    if (bubble.special === SPECIAL.SPEED) {
      ctx.beginPath(); ctx.moveTo(-7,6); ctx.lineTo(0,-7); ctx.lineTo(7,6); ctx.stroke();
    } else if (bubble.special === SPECIAL.BOMB) {
      ctx.beginPath(); ctx.arc(0,0,7,0,Math.PI*2); ctx.stroke();
    } else if (bubble.special === SPECIAL.COLOUR_BOMB) {
      ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(8,0); ctx.moveTo(0,-8); ctx.lineTo(0,8); ctx.stroke();
    }
    ctx.restore();
  }

  drawCannon(cannon) {
    const ctx = this.ctx;
    const base = this.assets.image('cannon:base');
    const barrel = this.assets.image('cannon:barrel');

    if (base) ctx.drawImage(base, cannon.position.x - 42, cannon.position.y - 42, 84, 84);

    ctx.save();
    ctx.translate(cannon.position.x, cannon.position.y);
    ctx.rotate(cannonCanvasRotation(cannon.angle));
    if (barrel) {
      const scale = 0.56;
      const w = 64 * scale, h = 108 * scale;
      const pivotY = 92 * scale;
      ctx.drawImage(barrel, -w / 2, -pivotY, w, h);
    } else {
      ctx.fillStyle = '#d9dde2'; ctx.strokeStyle = '#454b53'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-14,10); ctx.lineTo(14,10); ctx.lineTo(8,-45); ctx.lineTo(-8,-45); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();

    if (cannon.loadedBubble) this.drawBubble(cannon.barrelPosition(), cannon.loadedBubble);
    if (cannon.nextBubble) this.drawBubble(cannon.nextPreviewPosition(this.canvas.height), cannon.nextBubble);
  }

  drawHud(level) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(5,7,9,.78)';
    ctx.fillRect(0, this.canvas.height - 36, this.canvas.width, 36);
    ctx.fillStyle = '#f4f6f8';
    ctx.font = '15px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Frame ${level.frame} · ${(level.nowMs / 1000).toFixed(1)} s`, 14, this.canvas.height - 18);
    ctx.textAlign = 'right';
    ctx.fillText(level.state.toUpperCase(), this.canvas.width - 14, this.canvas.height - 18);
    ctx.restore();
  }
}
