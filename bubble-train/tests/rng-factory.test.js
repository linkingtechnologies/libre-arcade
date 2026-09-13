// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import { SeededRng, CarriageFactory } from '../public/src/index.js';

test('same seed yields same gameplay sequence', () => {
  const a=new SeededRng(12345), b=new SeededRng(12345);
  const av=Array.from({length:50},()=>a.nextInt(7)); const bv=Array.from({length:50},()=>b.nextInt(7));
  assert.deepEqual(av,bv);
});

test('random carriage factory suppresses automatic triples', () => {
  const f=new CarriageFactory({colourCount:3,count:100,random:true},new SeededRng(7));
  const colours=Array.from({length:100},()=>f.nextBubble().colour);
  for(let i=2;i<colours.length;i++) assert.ok(!(colours[i]===colours[i-1]&&colours[i-1]===colours[i-2]),`triple at ${i}`);
});
