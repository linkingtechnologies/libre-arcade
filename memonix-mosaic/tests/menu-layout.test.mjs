import test from 'node:test';
import assert from 'node:assert/strict';
import { MENU_LAYOUT, allMenuRects } from '../public/src/menu_layout.js';

test('standalone menu preserves the four historical Memonix mode-window coordinates', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(MENU_LAYOUT.slots).map(([k,s])=>[k,[s.x,s.y,s.w,s.h]])),
    {
      instructions:[176,66,128,128],
      options:[496,66,128,128],
      play:[56,255,128,128],
      credits:[616,255,128,128],
    }
  );
});

test('utility buttons remain in the original lower-button rows', () => {
  const u=MENU_LAYOUT.utilities;
  assert.deepEqual([u.language.x,u.language.y,u.buttonW,u.buttonH],[10,474,198,41]);
  assert.deepEqual([u.audio.x,u.audio.y,u.buttonW,u.buttonH],[10,524,198,41]);
  assert.deepEqual([u.scores.x,u.scores.y,u.buttonW,u.buttonH],[591,474,198,41]);
  assert.deepEqual([u.play.x,u.play.y,u.buttonW,u.buttonH],[591,524,198,41]);
});

test('all main-menu hit regions remain inside the historical 800x600 viewport', () => {
  for(const r of allMenuRects()){
    assert.ok(r.x>=0&&r.y>=0, JSON.stringify(r));
    assert.ok(r.x+r.w<=800&&r.y+r.h<=600, JSON.stringify(r));
  }
});
