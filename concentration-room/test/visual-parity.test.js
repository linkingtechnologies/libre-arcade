import assert from 'node:assert/strict';
import {
  NES_CLUT, GAME_PALETTE, CARD_PALETTES, NES_GEOMETRY,
  cardTopLeft, symbolSpritePosition, buildCardTiles, scoreBoxTiles, backgroundPalette,
  approachQuarter, arrowTarget, gameOverWipeRow,
} from '../public/src/nes-visual.js';
import { FrameGame, PLAY_STATE, NTSC } from '../public/src/state-machine.js';
import { MODE } from '../public/src/rules.js';
import { faceDownValue } from '../public/src/layouts.js';

assert.equal(NES_CLUT.length, 64);
assert.deepEqual(GAME_PALETTE.slice(0,4), [0x0f,0x10,0x18,0x0f]);
assert.equal(CARD_PALETTES.length, 72);
assert.deepEqual(backgroundPalette(0,0x18), [0x30,0x10,0x18,0x0f]); // $3F10 mirrors universal BG color
assert.deepEqual(cardTopLeft(0), {x:16,y:24});
assert.deepEqual(cardTopLeft(71), {x:208,y:192});
assert.deepEqual(symbolSpritePosition(0), {x:24,y:19});
assert.deepEqual(symbolSpritePosition(71), {x:216,y:187});
assert.deepEqual(NES_GEOMETRY.scoreX, [16,128]);

// Adjacent cards must agree on their overlapped 8px border tiles.
const fullBoard = new Uint8Array(72); fullBoard.fill(faceDownValue(0x1c));
const writes = new Map();
for (let i=0;i<72;i+=1) {
  const tiles=buildCardTiles(fullBoard,i), col=Math.floor(i/8), row=i&7;
  for(let ty=0;ty<4;ty+=1) for(let tx=0;tx<4;tx+=1){
    const key=`${2+col*3+tx},${3+row*3+ty}`;
    const v=tiles[ty*4+tx];
    if(writes.has(key)) assert.equal(v,writes.get(key),`overlap conflict at ${key}`);
    writes.set(key,v);
  }
}

const p1=scoreBoxTiles(92,0,0,false);
assert.equal(p1.top[0],0x64); assert.equal(p1.top[1],0x65);
assert.equal(p1.top[2],0x60); assert.equal(p1.top[3],0x61);
assert.equal(p1.top[10],0x49); assert.equal(p1.top[11],0x42);
assert.equal(p1.bottom[0],0x74);
const p2win=scoreBoxTiles(5,1,1,true);
assert.deepEqual(Array.from(p2win.top.slice(5,8)),[0x4d,0x4e,0x4f]);

assert.equal(approachQuarter(128,32),104);
assert.equal(approachQuarter(32,128),56);
assert.deepEqual(arrowTarget(4,3,PLAY_STATE.STILL,0),{x:128,y:99});
assert.deepEqual(arrowTarget(4,3,PLAY_STATE.COLLECTING,20),{x:132,y:107});
assert.equal(gameOverWipeRow(25),3);
assert.equal(gameOverWipeRow(24),27);
assert.equal(gameOverWipeRow(1),15);
assert.equal(gameOverWipeRow(26),null);

// Cursor state is now part of the historical play model.
const board = new Uint8Array(72); board[0]=faceDownValue(0x1c); board[8]=faceDownValue(0x1c);
const game = new FrameGame({board,mode:MODE.TWO_PLAYER});
assert.deepEqual([game.cursorX,game.cursorY],[4,3]);
game.moveCursor(-9,-9); assert.deepEqual([game.cursorX,game.cursorY],[0,0]);
game.moveCursor(20,20); assert.deepEqual([game.cursorX,game.cursorY],[8,7]);
game.setCursor(0); assert.equal(game.cursorIndex,0);
assert.equal(game.select(0),true); assert.deepEqual([game.cursorX,game.cursorY],[0,0]);
game.tick(NTSC.flipFrames+1);
assert.equal(game.state,PLAY_STATE.STILL);
game.select(8); game.tick(NTSC.flipFrames+1);
assert.equal(game.state,PLAY_STATE.COLLECTING);
game.tick(90-28+1); // enter first coalescing step
assert.notDeepEqual(game.collectingX,[0,0]);
assert.notDeepEqual(game.collectingY,[0,0]);


// The package compared the drawn board with a picture that its own script made (test/fixtures/board-oracle.png). That picture was drawn without
// the background's 12-pixel scroll, with the card backs' lower tiles swapped and the emblems' lower tiles swapped; it is gone. What the board looks like
// is compared with the ROM's own picture instead: test/render-oracle.test.js.

console.log('All Concentration Room visual-parity tests passed.');
