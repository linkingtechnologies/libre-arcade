// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import { LineSection, ArcSection, SpiralSection, Track, pointsNearlyEqual } from '../public/src/index.js';

const close = (a,b,eps=1e-6) => assert.ok(Math.abs(a-b)<=eps, `${a} != ${b}`);

test('line movement preserves exact distance and leftover', () => {
  const s = new LineSection({x:0,y:0},{x:100,y:0});
  let r = s.move(20, 30); close(r.progress, 50); assert.equal(r.boundary, null);
  r = s.move(90, 25); close(r.progress,100); close(r.leftover,15); assert.equal(r.boundary,'end');
  r = s.move(10,-15); close(r.progress,0); close(r.leftover,-5); assert.equal(r.boundary,'start');
});

test('clockwise arc converts linear distance to angle/radius', () => {
  const s = new ArcSection({x:10,y:0},{x:0,y:10},{x:0,y:0},'clockwise');
  const r = s.move(0, Math.PI*10/2); close(r.progress,Math.PI/2);
  const p = s.position(r.progress); close(p.x,0); close(p.y,10);
});

test('anticlockwise arc follows opposite direction in screen coordinates', () => {
  const s = new ArcSection({x:0,y:10},{x:10,y:0},{x:0,y:0},'anticlockwise');
  const r = s.move(0, Math.PI*10/2); const p=s.position(r.progress); close(p.x,10); close(p.y,0);
});

test('spiral preserves exponential radius and discrete movement rule', () => {
  const start={x:100,y:0}, centre={x:0,y:0};
  const phi=2; const endR=100*Math.exp(-phi/10); const end={x:Math.cos(phi)*endR,y:Math.sin(phi)*endR};
  const s=new SpiralSection(start,end,centre,'clockwise');
  close(s.sweep,phi,1e-6);
  close(s.radiusAt(1),100*Math.exp(-0.1));
  const r=s.move(0,50); close(r.progress,0.5); // amount/currentRadius
});

test('track carries leftover into next section and reports end/start overflow', () => {
  const t=new Track([new LineSection({x:0,y:0},{x:10,y:0}),new LineSection({x:10,y:0},{x:20,y:0})]);
  let r=t.move(t.startCursor(),15); assert.equal(r.status,'ok'); assert.equal(r.cursor.sectionIndex,1); close(r.cursor.progress,5);
  r=t.move(r.cursor,10); assert.equal(r.status,'crashed'); close(t.position(r.cursor).x,20);
  r=t.move({sectionIndex:0,progress:2},-5); assert.equal(r.status,'returned'); close(t.position(r.cursor).x,0);
});

test('track insertion side uses local path-forward projection', () => {
  const t=new Track([new LineSection({x:0,y:0},{x:100,y:0})]); const c={sectionIndex:0,progress:50};
  assert.equal(t.insertionSide(c,{x:60,y:20}),'after');
  assert.equal(t.insertionSide(c,{x:40,y:20}),'before');
  assert.ok(pointsNearlyEqual(t.position(c),{x:50,y:0}));
});
