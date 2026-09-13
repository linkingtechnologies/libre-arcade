// SPDX-License-Identifier: GPL-3.0-or-later
export const EPSILON = 1e-9;
export const TAU = Math.PI * 2;

export function point(x = 0, y = 0) { return { x: Number(x), y: Number(y) }; }
export function clonePoint(p) { return { x: p.x, y: p.y }; }
export function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
export function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
export function scale(v, n) { return { x: v.x * n, y: v.y * n }; }
export function length(v) { return Math.hypot(v.x, v.y); }
export function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
export function normalize(v) {
  const n = length(v);
  return n <= EPSILON ? { x: 0, y: 0 } : { x: v.x / n, y: v.y / n };
}
export function dot(a, b) { return a.x * b.x + a.y * b.y; }
export function normalizePositiveAngle(angle) {
  let a = angle % TAU;
  if (a < 0) a += TAU;
  return a;
}
export function nearlyEqual(a, b, eps = 1e-7) { return Math.abs(a - b) <= eps; }
export function pointsNearlyEqual(a, b, eps = 1e-7) {
  return nearlyEqual(a.x, b.x, eps) && nearlyEqual(a.y, b.y, eps);
}
