// The minimal NES under the executable oracle (tools/nes-machine.mjs) and the compositor that draws its frames (tools/nes-frame.mjs),
// tried on programs and pictures small enough to know the answer: the frame and the NMI, the scroll registers and the nametable
// addressing, the sprite 0 hit, the log of register writes and the rule the compositor draws a line by.
import assert from 'node:assert/strict';
import test from 'node:test';
import { NesMachine, CYCLES_PER_FRAME, CYCLES_PER_SCANLINE } from '../tools/nes-machine.mjs';
import { composeFrame } from '../tools/nes-frame.mjs';
import { NES_RGB } from '../public/src/nes-assets.js';

// An NROM cartridge: the program at $8000 enables the NMI and loops; the NMI handler at $8100 counts in $00 and returns.
function cartridge({ chr = new Uint8Array(8192), vertical = true } = {}) {
  const rom = new Uint8Array(16 + 16384 + 8192);
  rom.set([0x4E, 0x45, 0x53, 0x1A, 1, 1, vertical ? 1 : 0, 0], 0);
  const prg = rom.subarray(16, 16 + 16384);
  prg.set([0xA9, 0x80, 0x8D, 0x00, 0x20, 0x4C, 0x05, 0x80], 0);        // LDA #$80; STA $2000; JMP $8005
  prg.set([0xE6, 0x00, 0x40], 0x100);                                    // INC $00; RTI
  prg.set([0x00, 0x81, 0x00, 0x80, 0x00, 0x80], 0x3FFA);                 // NMI, reset and IRQ vectors
  rom.set(chr, 16 + 16384);
  return rom;
}
const rgb = (index) => [(NES_RGB[index] >> 16) & 255, (NES_RGB[index] >> 8) & 255, NES_RGB[index] & 255];
const pixel = (frame, x, y) => Array.from(frame.rgba.subarray((y * 256 + x) * 4, (y * 256 + x) * 4 + 3));

test('a frame is 29,780 cycles and raises one NMI', () => {
  const m = new NesMachine(cartridge());
  m.frame(); m.frame();                                                  // the first frame sets PPUCTRL; the NMI is raised from the next
  const before = m.ram[0];
  for (let i = 0; i < 10; i++) m.frame();
  assert.equal(m.ram[0], before + 10);
  assert.ok(Math.abs(m.cpu.cycles - 12 * CYCLES_PER_FRAME) < 30, 'twelve frames of cycles, give or take the last instruction');
});

test('the scroll registers: PPUCTRL and PPUSCROLL fill t and the fine X scroll the way the console does', () => {
  const m = new NesMachine(cartridge());
  m.write(0x2000, 0x01);                                                  // the nametable to the right
  m.write(0x2005, 0x15); m.write(0x2005, 0x2A);
  assert.equal(m.scrollX, 0x15 + 256);
  assert.equal(m.scrollY, 0x2A);
  m.read(0x2002);                                                         // reading the status resets the write toggle
  m.write(0x2005, 0xFF); m.write(0x2005, 0x00);
  assert.equal(m.scrollX, 0xFF + 256);
  m.write(0x2000, 0x02);
  assert.equal(m.scrollY, 240, 'the vertical nametable bit adds one screen of 240 lines');
  assert.equal(m.scrollX, 0xFF, 'and the horizontal one is gone');
});

test('PPUADDR sets v on the second write, and the address increments by 1 or by 32', () => {
  const m = new NesMachine(cartridge());
  m.write(0x2006, 0x23); m.write(0x2006, 0xC0);
  m.write(0x2007, 0x5A);
  assert.equal(m.vram[m.nametableIndex(0x23C0)], 0x5A);
  m.write(0x2000, 0x04);                                                  // increment by 32
  m.write(0x2006, 0x20); m.write(0x2006, 0x00);
  m.write(0x2007, 1); m.write(0x2007, 2);
  assert.equal(m.vram[0], 1);
  assert.equal(m.vram[32], 2);
  assert.equal(m.t & 0x7FFF, 0x2000, 'PPUADDR also leaves its bits in t, which is what scrolls the picture');
});

test('vertical mirroring: $2000 and $2800 are one table, $2400 and $2C00 the other', () => {
  const m = new NesMachine(cartridge({ vertical: true }));
  m.write(0x2006, 0x28); m.write(0x2006, 0x01); m.write(0x2007, 7);
  assert.equal(m.vram[1], 7);
  m.write(0x2006, 0x2C); m.write(0x2006, 0x02); m.write(0x2007, 8);
  assert.equal(m.vram[1024 + 2], 8);
});

test('sprite 0 hit: set at the line and column where an opaque sprite pixel meets an opaque background pixel, cleared at the next frame', () => {
  const chr = new Uint8Array(8192);
  chr[16] = 0x80;                                                         // tile 1: the top left pixel is colour 1
  const m = new NesMachine(cartridge({ chr }));
  m.vram[32] = 1;                                                         // the background tile at row 1 (lines 8 to 15), column 0 is tile 1
  m.oam.set([7, 1, 0, 0]);                                                // sprite 0 at y = 7: its first line is 8
  m.ppuMask = 0x1E;
  m.frame();
  assert.equal(m.sprite0Hit, true);
  assert.equal(m.sprite0At[1], 8, 'the line is OAM y + 1');
  assert.equal(m.sprite0At[0], 0);
  const cycleOfLine = m.sprite0Cycle - (m.frameStart - CYCLES_PER_FRAME);     // (frameStart is already the next frame's)
  assert.ok(cycleOfLine > 2273 && cycleOfLine < CYCLES_PER_FRAME);
  assert.equal(m.read(0x2002) & 0x40, 0x40, 'bit 6 of the status');
  m.oam[0] = 255;                                                         // the sprite is gone
  m.frame();
  assert.equal(m.sprite0Hit, false, 'cleared when the pre-render line comes');
});

test('the log of a frame: a write to PPUSCROLL is kept with the line it happened in and the registers it left', () => {
  const m = new NesMachine(cartridge());
  m.capture = true;
  let fired = false;
  m.beforeStep = () => {
    if (!fired && m.frames === 2 && m.cpu.cycles - m.frameStart > 2273 + 100 * CYCLES_PER_SCANLINE) { fired = true; m.write(0x2005, 0x18); m.write(0x2005, 0); }
  };
  m.frame(); m.frame();
  const writes = m.visible.log.filter((e) => e.register === 5);
  assert.equal(writes.length, 2);
  assert.equal(Math.floor(writes[0].c / CYCLES_PER_SCANLINE) - 1, 99, 'a write after 100 lines of the picture falls in line 99, counted from the first visible line');
  assert.equal(writes[0].t & 0x1F, 3, 'coarse X: 0x18 >> 3');
});

test('the compositor draws a line with the horizontal scroll that the line before left, and reports the line a write falls in', () => {
  // Two nametable tiles of different colours side by side; the scroll moves by one tile at line 100.
  const chr = new Uint8Array(8192);
  chr.fill(0xFF, 16, 24);                                                 // tile 1: colour 1 everywhere
  chr.fill(0xFF, 32 + 8, 32 + 16);                                        // tile 2: colour 2 everywhere
  const m = new NesMachine(cartridge({ chr }));
  for (let y = 0; y < 30; y++) { m.vram[y * 32] = 1; m.vram[y * 32 + 1] = 2; }
  m.palette.set([0x0F, 0x11, 0x21, 0x30]);
  m.ppuMask = 0x0A;                                                       // background and its left 8 pixels
  m.capture = true;
  let fired = false;
  m.beforeStep = () => {
    if (!fired && m.cpu.cycles - m.frameStart > 2273 + 101 * CYCLES_PER_SCANLINE) { fired = true; m.write(0x2005, 8); m.write(0x2005, 0); }
  };
  m.frame();
  const frame = composeFrame(m);
  assert.deepEqual(pixel(frame, 0, 10), rgb(0x11), 'before the write: tile 1 at the left');
  assert.deepEqual(pixel(frame, 0, 200), rgb(0x21), 'after it: scrolled by 8, tile 2 at the left');
  const lines = [...frame.split].map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
  assert.deepEqual(lines, [100], 'the write fell in line 100');
});
