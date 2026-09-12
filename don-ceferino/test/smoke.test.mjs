import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Game } from '../public/src/core/game.js';
import { LevelSet } from '../public/src/core/level.js';

const levels = new LevelSet(fs.readFileSync(new URL('../public/assets/levels/base.map', import.meta.url)));

test('randomized headless smoke simulation remains finite on all 30 levels', () => {
  let seed=0x12345678;
  const rnd=()=>{ seed=(1664525*seed+1013904223)>>>0; return seed/2**32; };
  for (let n=1; n<=30; n++) {
    const game=new Game(levels,{rng:rnd});
    game.loadLevel(n);
    for (let tick=0; tick<1200; tick++) {
      const r=rnd();
      game.update({
        left:r<.08,
        right:r>=.08&&r<.16,
        up:r>=.16&&r<.19,
        down:r>=.19&&r<.22,
        shot:r>=.22&&r<.30,
        sweep:r>=.30&&r<.36
      });
      if (game.state==='gameover' || game.state==='finished') break;
    }
    assert.ok(Number.isFinite(game.player.x), `level ${n} x`);
    assert.ok(Number.isFinite(game.player.y), `level ${n} y`);
  }
});
