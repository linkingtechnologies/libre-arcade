import test from 'node:test';
import assert from 'node:assert/strict';
import { MENU_LAYOUT, allMenuRects } from '../public/src/menu_layout.js';

test('Builder keeps its historical Memonix preview coordinate',()=>{
  const s=MENU_LAYOUT.slots.play;
  assert.deepEqual([s.x,s.y,s.w,s.h],[176,66,128,128]);
});

test('standalone navigation uses the four historical mode-window coordinates',()=>{
  const coords=Object.values(MENU_LAYOUT.slots).map(s=>[s.x,s.y,s.w,s.h]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
  assert.deepEqual(coords,[[176,66,128,128],[496,66,128,128],[56,255,128,128],[616,255,128,128]]);
});

test('utility buttons remain in original lower-button rows',()=>{
  const u=MENU_LAYOUT.utilities;
  assert.deepEqual([u.language.x,u.language.y,u.buttonW,u.buttonH],[10,474,198,41]);
  assert.deepEqual([u.audio.x,u.audio.y,u.buttonW,u.buttonH],[10,524,198,41]);
  assert.deepEqual([u.scores.x,u.scores.y,u.buttonW,u.buttonH],[591,474,198,41]);
  assert.deepEqual([u.play.x,u.play.y,u.buttonW,u.buttonH],[591,524,198,41]);
});

test('all menu hit regions stay inside historical 800x600 viewport',()=>{
  for(const r of allMenuRects()){
    assert.ok(r.x>=0&&r.y>=0,JSON.stringify(r));
    assert.ok(r.x+r.w<=800&&r.y+r.h<=600,JSON.stringify(r));
  }
});
