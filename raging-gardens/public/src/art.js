// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// The game's pictures. The original artwork (c) Stremena Tuzsuzova is all rights reserved and is
// NOT used. Everything here is drawn by this code onto offscreen canvases when the page loads:
// original work for this collection, not a copy or a trace of the historical sprites. Sizes and
// frame counts follow the original sprite sheets so that hit boxes, which the game logic fixes
// relative to them, keep their meaning: tiles 64 x 64, rabbits 32 x 48 (3 frames x 4 directions:
// down, up, left, right), carrots 32 x 32 (3 frames), totem 48 x 48, puff 64 x 64 (8 frames).

import { mulberry32 } from "./rng.js";

function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")];
}

function ellipse(g, x, y, rx, ry, fill, stroke) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1.5; g.stroke(); }
}

function shadow(g, x, y, rx, ry) {
  ellipse(g, x, y, rx, ry, "rgba(0,0,0,0.28)");
}

function grass() {
  const [c, g] = canvas(64, 64);
  g.fillStyle = "#5f9c3c";
  g.fillRect(0, 0, 64, 64);
  const r = mulberry32(2012);
  for (let i = 0; i < 70; i++) {
    g.fillStyle = r() < 0.5 ? "#6aab45" : "#52892f";
    g.fillRect(Math.floor(r() * 62), Math.floor(r() * 62), 2, 3);
  }
  return c;
}

function stone(big) {
  const [c, g] = canvas(64, 64);
  shadow(g, 32, 46, big ? 22 : 15, big ? 7 : 5);
  const w = big ? 22 : 15, h = big ? 17 : 11;
  ellipse(g, 32, 42 - h * 0.4, w, h, "#9a9a96", "#5d5d5a");
  ellipse(g, 28, 38 - h * 0.4, w * 0.5, h * 0.4, "#b9b9b3");
  return c;
}

function tree() {
  const [c, g] = canvas(64, 64);
  shadow(g, 32, 58, 22, 5);
  g.fillStyle = "#6b4423";
  g.fillRect(28, 34, 9, 26);
  g.fillStyle = "#4f3219";
  g.fillRect(33, 34, 4, 26);
  ellipse(g, 32, 22, 26, 20, "#2f7a2c", "#1d5019");
  ellipse(g, 22, 16, 11, 9, "#3f9139");
  ellipse(g, 40, 26, 9, 7, "#276b25");
  return c;
}

function barrel() {
  const [c, g] = canvas(64, 64);
  shadow(g, 32, 50, 17, 5);
  g.fillStyle = "#8a5a2b";
  g.beginPath();
  g.moveTo(17, 22); g.quadraticCurveTo(12, 36, 17, 50); g.lineTo(47, 50); g.quadraticCurveTo(52, 36, 47, 22); g.closePath();
  g.fill();
  g.strokeStyle = "#4b2f14"; g.lineWidth = 2; g.stroke();
  g.fillStyle = "#4b4b4b";
  g.fillRect(14, 27, 36, 3);
  g.fillRect(14, 42, 36, 3);
  ellipse(g, 32, 22, 15, 5, "#a3702f", "#4b2f14");
  return c;
}

function bush() {
  const [c, g] = canvas(64, 64);
  shadow(g, 32, 50, 22, 6);
  ellipse(g, 20, 40, 14, 11, "#2f8a3a", "#1d5a25");
  ellipse(g, 44, 40, 14, 11, "#2f8a3a", "#1d5a25");
  ellipse(g, 32, 34, 17, 14, "#3aa04a", "#1d5a25");
  g.fillStyle = "#d94a4a";
  for (const [x, y] of [[26, 32], [38, 36], [31, 42], [18, 40]]) { g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); }
  return c;
}

function haystack() {
  const [c, g] = canvas(64, 64);
  shadow(g, 32, 58, 24, 5);
  g.fillStyle = "#d8b24a";
  g.beginPath();
  g.moveTo(10, 58); g.quadraticCurveTo(12, 22, 32, 14); g.quadraticCurveTo(52, 22, 54, 58); g.closePath();
  g.fill();
  g.strokeStyle = "#8c6b1e"; g.lineWidth = 1.5; g.stroke();
  g.strokeStyle = "#b8922f";
  for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(16 + i * 4, 56); g.lineTo(24 + i * 2, 24); g.stroke(); }
  return c;
}

// One rabbit frame. dir: 0 down, 1 up, 2 left, 3 right; step: 0..2 walking cycle.
function rabbit(dir, step, palette) {
  const [c, g] = canvas(32, 48);
  const bob = step === 1 ? -1 : 0;
  const swing = step === 0 ? -2 : step === 2 ? 2 : 0;
  shadow(g, 16, 44, 11, 3);
  // feet
  const fx = dir >= 2 ? 0 : 1;
  ellipse(g, 11 + swing * fx, 43, 4, 2.5, palette.fur2);
  ellipse(g, 21 - swing * fx, 43, 4, 2.5, palette.fur2);
  // ears
  const earSide = dir === 2 ? -3 : dir === 3 ? 3 : 0;
  ellipse(g, 11 + earSide, 8 + bob, 3.5, 9, palette.fur, palette.line);
  ellipse(g, 21 + earSide, 8 + bob, 3.5, 9, palette.fur, palette.line);
  if (dir !== 1) {
    ellipse(g, 11 + earSide, 9 + bob, 1.6, 6, palette.ear);
    ellipse(g, 21 + earSide, 9 + bob, 1.6, 6, palette.ear);
  }
  // body and head
  ellipse(g, 16, 33 + bob, 10, 11, palette.fur, palette.line);
  ellipse(g, 16, 22 + bob, 9, 8, palette.fur, palette.line);
  if (palette.band) {
    g.fillStyle = palette.band;
    g.fillRect(7, 18 + bob, 18, 3);
    if (dir === 1 || dir === 2) g.fillRect(24, 19 + bob, 5, 2); // knot and tails
    if (dir === 3) g.fillRect(3, 19 + bob, 5, 2);
    if (dir === 0) { g.fillRect(24, 20 + bob, 4, 2); }
  }
  // face
  if (dir === 0 || dir === 2 || dir === 3) {
    const ox = dir === 2 ? -3 : dir === 3 ? 3 : 0;
    g.fillStyle = "#111";
    g.fillRect(12 + ox, 22 + bob, 2, 3);
    g.fillRect(19 + ox, 22 + bob, 2, 3);
    ellipse(g, 16 + ox, 27 + bob, 2, 1.4, "#e58b8b");
  }
  // belly / tail
  if (dir === 1) ellipse(g, 16, 36 + bob, 4, 4, "#ffffff");
  else ellipse(g, 16, 35 + bob, 5, 6, palette.belly);
  return c;
}

function rabbitSheet(palette) {
  const [c, g] = canvas(96, 192);
  for (let d = 0; d < 4; d++) for (let s = 0; s < 3; s++) g.drawImage(rabbit(d, s, palette), s * 32, d * 48);
  return c;
}

function carrotSheet() {
  const [c, g] = canvas(96, 32);
  for (let f = 0; f < 3; f++) {
    const sway = f === 1 ? 0 : f === 0 ? -2 : 2;
    const x = f * 32;
    ellipse(g, x + 16, 26, 11, 4, "#6b4a2b");
    ellipse(g, x + 16, 25, 8, 3, "#8a6238");
    g.fillStyle = "#e8761c";
    g.beginPath(); g.moveTo(x + 11, 24); g.lineTo(x + 21, 24); g.lineTo(x + 16, 14); g.closePath(); g.fill();
    g.strokeStyle = "#2f8a2f"; g.lineWidth = 2.5; g.lineCap = "round";
    for (const dx of [-5, 0, 5]) { g.beginPath(); g.moveTo(x + 16, 14); g.lineTo(x + 16 + dx + sway, 4 + Math.abs(dx) * 0.3); g.stroke(); }
  }
  return c;
}

function forkSprite() {
  const [c, g] = canvas(48, 48);
  shadow(g, 24, 44, 8, 3);
  g.fillStyle = "#6b4423";
  g.fillRect(22, 14, 4, 30);
  g.strokeStyle = "#555"; g.lineWidth = 2;
  g.beginPath(); g.moveTo(14, 6); g.lineTo(14, 14); g.lineTo(34, 14); g.lineTo(34, 6); g.moveTo(24, 14); g.lineTo(24, 4); g.stroke();
  g.fillStyle = "#e8761c";
  g.beginPath(); g.moveTo(18, 4); g.lineTo(30, 4); g.lineTo(24, 20); g.closePath(); g.fill();
  g.strokeStyle = "#2f8a2f"; g.lineWidth = 2; g.lineCap = "round";
  for (const dx of [-4, 0, 4]) { g.beginPath(); g.moveTo(24, 4); g.lineTo(24 + dx, -1); g.stroke(); }
  return c;
}

function puffSheet() {
  const [c, g] = canvas(64 * 8, 64);
  const r = mulberry32(99);
  const blobs = Array.from({ length: 9 }, () => ({ a: r() * 6.283, d: 0.4 + r() * 0.6, s: 0.5 + r() * 0.5 }));
  for (let f = 0; f < 8; f++) {
    const t = (f + 1) / 8;
    g.save();
    g.translate(f * 64 + 32, 32);
    g.globalAlpha = 1 - Math.pow(t, 2.2) * 0.85;
    for (const b of blobs) {
      const rad = 7 + 11 * t * b.s;
      const px = Math.cos(b.a) * 20 * t * b.d, py = Math.sin(b.a) * 17 * t * b.d;
      ellipse(g, px, py, rad, rad * 0.85, f < 5 ? "#b9d56a" : "#d3dd9a");
    }
    g.restore();
  }
  return c;
}

export function buildArt() {
  return {
    grass: grass(),
    tiles: [null, stone(false), stone(true), tree(), barrel(), bush(), haystack()], // indexed by obstacle kind
    player: rabbitSheet({ fur: "#e9e4d8", fur2: "#cfc8b6", ear: "#e79aa6", belly: "#ffffff", line: "#6e6a5e", band: "#c62828" }),
    enemy: rabbitSheet({ fur: "#a9743f", fur2: "#7d5129", ear: "#d99a8a", belly: "#d9b98c", line: "#4a2f17" }),
    carrots: carrotSheet(),
    fork: forkSprite(),
    puff: puffSheet(),
  };
}
