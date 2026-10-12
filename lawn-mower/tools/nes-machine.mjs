// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// The smallest NES that can run the preserved Lawn Mower ROM (an NROM-128 cartridge) for the
// executable oracle in tools/rom-oracle.mjs. It is not a general emulator and draws nothing:
//
//   * CPU: tools/mos6502.mjs, with cycle counts.
//   * RAM: 2 KiB mirrored; PRG ROM: 16 KiB mirrored at $8000 and $C000 (the iNES header is read, the mapper is checked).
//   * PPU: only what the game observes and what is useful for debugging: the status register (the vblank flag and
//     the sprite 0 hit flag, which the game polls to split the screen), the address and data ports with the nametable,
//     palette and OAM memories, OAM DMA. Pictures are not drawn here (tools/nes-frame.mjs composes them); only the
//     one overlap that sets the sprite 0 hit flag is worked out, from the same memories, at the scanline where it happens.
//   * Controllers: the strobe and shift protocol of $4016 and $4017. The byte `pad[0]` is shifted out from its top bit, A first, so it
//     holds A, B, Select, Start, Up, Down, Left, Right from the most significant bit down (the game's PAD_* constants have A at bit 0:
//     tools/rom-oracle.mjs `machinePad` reverses the bits).
//   * Scroll: the registers the console has (the temporary address t, the fine X scroll and the write toggle), so that PPUCTRL,
//     PPUSCROLL and PPUADDR writes leave the scroll where the console would; with `capture` on, frame() keeps the memories as they
//     are when the picture starts and a log of every register write during it, with the CPU cycle (tools/nes-frame.mjs draws from them).
//   * APU: writes are accepted and ignored.
//   * Time: a frame is 29,780 cycles (the NTSC console's, 29,780.5 really). The vblank flag is set for the first 2,273
//     cycles of a frame and the NMI is raised at its start when PPUCTRL bit 7 is set, so a program that waits for its NMI
//     counter to change sees one change per frame. A scanline is 341/3 cycles; the pre-render line starts at cycle 2,273 and the first visible line one scanline later.
//     The sprite 0 hit flag is cleared when vblank ends and set at the scanline and column where an opaque pixel of sprite 0
//     lies over an opaque background pixel.
//
// Everything the program computes is computed by its own code; this file only provides the world around it.

import { Cpu6502 } from './mos6502.mjs';

export const CYCLES_PER_FRAME = 29780;
export const VBLANK_CYCLES = 2273;
export const CYCLES_PER_SCANLINE = 341 / 3;

export class NesMachine {
  constructor(rom) {
    const header = rom.subarray(0, 16);
    if (header[0] !== 0x4E || header[1] !== 0x45 || header[2] !== 0x53 || header[3] !== 0x1A) throw new Error('not an iNES file');
    const prgBanks = header[4], chrBanks = header[5];
    const mapper = (header[6] >> 4) | (header[7] & 0xF0);
    if (mapper !== 0) throw new Error(`mapper ${mapper} is not NROM`);
    if (prgBanks !== 1 && prgBanks !== 2) throw new Error('NROM has one or two 16 KiB PRG banks');
    this.verticalMirroring = (header[6] & 1) === 1;
    this.prg = rom.subarray(16, 16 + prgBanks * 0x4000);
    this.chr = rom.subarray(16 + prgBanks * 0x4000, 16 + prgBanks * 0x4000 + chrBanks * 0x2000);

    this.ram = new Uint8Array(0x800);
    this.vram = new Uint8Array(0x800);
    this.palette = new Uint8Array(32);
    this.oam = new Uint8Array(256);
    this.pad = [0, 0];                       // buttons currently held, per controller
    this.padShift = [0, 0];
    this.padStrobe = 0;
    this.ppuCtrl = 0; this.ppuMask = 0;
    this.vblank = false;
    this.sprite0Hit = false;
    this.sprite0Done = false;
    this.sprite0Row = -1; this.sprite0Frame = -1;
    this.ppuToggle = 0;
    this.ppuAddress = 0;                     // v
    this.t = 0; this.fineX = 0;              // t and the fine X scroll; the scroll registers and PPUCTRL's nametable bits live in them
    this.ppuReadBuffer = 0;
    this.capture = false;                    // when true, frame() keeps what the picture of that frame is made of (see tools/nes-frame.mjs)
    this.visible = null;
    this.oamAddress = 0;
    this.frameStart = this.cpu ? this.cpu.cycles : 0;
    this.frames = 0;                         // NMIs raised so far
    this.ppuWrites = 0;
    this.readHook = null;                    // (address) => void, called for every CPU read
    this.writeHook = null;                   // (address, value) => void, called for every CPU write
    this.beforeStep = null;                  // (cpu) => void, called before every instruction
    this.cpu = new Cpu6502(this);
    this.cpu.reset();
    this.frameStart = this.cpu.cycles;
  }

  // The scroll as the registers hold it now, in pixels from the left and top of the 512 by 480 plane of the four nametables.
  get scrollX() { return (((this.t & 0x1F) << 3) | this.fineX) + ((this.t & 0x400) ? 256 : 0); }
  get scrollY() { return ((((this.t >> 5) & 0x1F) << 3) | ((this.t >> 12) & 7)) + ((this.t & 0x800) ? 240 : 0); }

  nametableIndex(address) {
    const table = (address >> 10) & 3;
    const mirrored = this.verticalMirroring ? table & 1 : table >> 1;
    return (mirrored << 10) | (address & 0x3FF);
  }

  ppuRead(address) {
    address &= 0x3FFF;
    if (address < 0x2000) return this.chr[address] ?? 0;
    if (address < 0x3F00) return this.vram[this.nametableIndex(address)];
    let index = address & 0x1F;
    if ((index & 0x13) === 0x10) index &= ~0x10;
    return this.palette[index];
  }

  ppuWrite(address, value) {
    address &= 0x3FFF;
    this.ppuWrites++;
    if (address < 0x2000) return;                       // CHR-ROM
    if (address < 0x3F00) { this.vram[this.nametableIndex(address)] = value; return; }
    let index = address & 0x1F;
    if ((index & 0x13) === 0x10) index &= ~0x10;
    this.palette[index] = value & 0x3F;
  }

  read(address) {
    address &= 0xFFFF;
    if (this.readHook) this.readHook(address);
    if (address < 0x2000) return this.ram[address & 0x7FF];
    if (address >= 0x8000) return this.prg[(address - 0x8000) % this.prg.length];
    if (address < 0x4000) {
      switch (address & 7) {
        case 2: { const value = (this.vblank ? 0x80 : 0) | (this.sprite0Hit ? 0x40 : 0); this.vblank = false; this.ppuToggle = 0; return value; }
        case 4: return this.oam[this.oamAddress];
        case 7: {
          const value = (this.ppuAddress & 0x3FFF) >= 0x3F00 ? this.ppuRead(this.ppuAddress) : this.ppuReadBuffer;
          this.ppuReadBuffer = this.ppuRead(this.ppuAddress);
          this.ppuAddress = (this.ppuAddress + ((this.ppuCtrl & 4) ? 32 : 1)) & 0x7FFF;
          return value;
        }
        default: return 0;
      }
    }
    if (address === 0x4016 || address === 0x4017) {
      const index = address - 0x4016;
      if (this.padStrobe) return this.pad[index] >> 7 & 1;
      const bit = this.padShift[index] >> 7 & 1;
      this.padShift[index] = ((this.padShift[index] << 1) | 1) & 0xFF;
      return bit;
    }
    return 0;
  }

  write(address, value) {
    address &= 0xFFFF; value &= 0xFF;
    if (this.writeHook) this.writeHook(address, value);
    if (address < 0x2000) { this.ram[address & 0x7FF] = value; return; }
    if (address < 0x4000) {
      switch (address & 7) {
        case 0:
          if (!(this.ppuCtrl & 0x80) && (value & 0x80) && this.vblank) this.cpu.nmiPending = true;
          this.ppuCtrl = value; this.t = (this.t & ~0x0C00) | ((value & 3) << 10); break;
        case 1: this.ppuMask = value; break;
        case 3: this.oamAddress = value; break;
        case 4: this.oam[this.oamAddress] = value; this.oamAddress = (this.oamAddress + 1) & 0xFF; break;
        case 5:
          if (this.ppuToggle === 0) { this.t = (this.t & ~0x1F) | (value >> 3); this.fineX = value & 7; }
          else this.t = (this.t & ~0x73E0) | ((value & 7) << 12) | ((value >> 3) << 5);
          this.ppuToggle ^= 1; break;
        case 6:
          if (this.ppuToggle === 0) this.t = (this.t & 0x00FF) | ((value & 0x3F) << 8);
          else { this.t = (this.t & 0x7F00) | value; this.ppuAddress = this.t; }
          this.ppuToggle ^= 1; break;
        case 7:
          this.ppuWrite(this.ppuAddress, value);
          this.ppuAddress = (this.ppuAddress + ((this.ppuCtrl & 4) ? 32 : 1)) & 0x7FFF; break;
        default: break;
      }
      this.logWrite(address & 7, value);
      return;
    }
    if (address === 0x4014) {
      const base = value << 8;
      for (let i = 0; i < 256; i++) this.oam[(this.oamAddress + i) & 0xFF] = this.ram[(base + i) & 0x7FF];
      this.logWrite('dma', value);
      this.cpu.cycles += 513;
      return;
    }
    if (address === 0x4016) {
      const strobe = value & 1;
      if (this.padStrobe && !strobe) { this.padShift[0] = this.pad[0]; this.padShift[1] = this.pad[1]; }
      this.padStrobe = strobe;
    }
  }

  // What a write does to the picture, kept with the time it happened (CPU cycles after the start of the pre-render line) and the
  // registers as they were left, for a frame whose picture is to be composed.
  logWrite(register, value) {
    if (this.visible) this.visible.log.push({ c: this.cpu.cycles - this.visible.start, register, value, t: this.t, x: this.fineX, ctrl: this.ppuCtrl, mask: this.ppuMask });
  }

  // The scanline that the PPU is drawing at CPU cycle `cycle` of this frame: -1 for the pre-render line, 0 to 239 for the picture.
  scanlineAt(cycle, visibleStart) { return Math.floor((cycle - visibleStart) / CYCLES_PER_SCANLINE) - 1; }

  step() {
    if (this.beforeStep) this.beforeStep(this.cpu);
    this.cpu.step();
  }

  // The whole state, to start from a point that took a while to reach (a booted ROM) without running to it again.
  snapshot() {
    const cpu = this.cpu;
    return {
      ram: this.ram.slice(), vram: this.vram.slice(), palette: this.palette.slice(), oam: this.oam.slice(),
      pad: [...this.pad], padShift: [...this.padShift],
      scalars: Object.fromEntries(['padStrobe', 'ppuCtrl', 'ppuMask', 'vblank', 'sprite0Hit', 'sprite0Done', 'sprite0Row', 'sprite0Frame', 'ppuToggle', 'ppuAddress', 't', 'fineX', 'ppuReadBuffer', 'oamAddress', 'frameStart', 'frames', 'ppuWrites'].map((k) => [k, this[k]])),
      cpu: Object.fromEntries(['a', 'x', 'y', 'sp', 'pc', 'c', 'z', 'i', 'd', 'v', 'n', 'cycles', 'instructions', 'nmiPending'].map((k) => [k, cpu[k]])),
    };
  }

  restore(snapshot) {
    this.ram.set(snapshot.ram); this.vram.set(snapshot.vram); this.palette.set(snapshot.palette); this.oam.set(snapshot.oam);
    this.pad = [...snapshot.pad]; this.padShift = [...snapshot.padShift];
    Object.assign(this, snapshot.scalars);
    Object.assign(this.cpu, snapshot.cpu);
    return this;
  }

  // The background pixel (colour index 0 to 3) that the console would draw at screen column x of scanline y, with the scroll
  // and the pattern table as set now.
  backgroundPixel(x, y) {
    const sx = (this.scrollX + x) & 511;
    const sy = (this.scrollY + y) % 480;
    const table = (sx >> 8) | ((sy >= 240) ? 2 : 0);
    const lx = sx & 255, ly = sy % 240;
    const tile = this.vram[this.nametableIndex(0x2000 | (table << 10) | ((ly >> 3) << 5) | (lx >> 3))];
    const base = ((this.ppuCtrl & 0x10) ? 0x1000 : 0) + tile * 16 + (ly & 7);
    return ((this.chr[base] >> (7 - (lx & 7))) & 1) | (((this.chr[base + 8] >> (7 - (lx & 7))) & 1) << 1);
  }

  // The sprite 0 hit: when the scanline reaches the sprite's rows, the first column whose sprite pixel and background pixel are both opaque sets the flag.
  checkSprite0(visibleStart) {
    if ((this.ppuMask & 0x18) !== 0x18) return;
    const top = this.oam[0] + 1, x0 = this.oam[3], tile = this.oam[1], attr = this.oam[2];
    const line = this.scanlineAt(this.cpu.cycles, visibleStart);
    if (line < top || line > 239) return;
    if (line >= top + 8) { this.sprite0Done = true; return; }
    if (this.sprite0Row === line && this.sprite0Frame === this.frames) return;
    this.sprite0Row = line; this.sprite0Frame = this.frames;
    const row = (attr & 0x80) ? 7 - (line - top) : line - top;
    const base = ((this.ppuCtrl & 0x08) ? 0x1000 : 0) + tile * 16 + row;
    for (let c = 0; c < 8; c++) {
      const x = x0 + c;
      if (x > 254) break;
      const bit = (attr & 0x40) ? c : 7 - c;
      const sprite = ((this.chr[base] >> bit) & 1) | (((this.chr[base + 8] >> bit) & 1) << 1);
      if (sprite && this.backgroundPixel(x, line)) {
        this.sprite0Hit = true; this.sprite0Done = true;
        this.sprite0Cycle = this.cpu.cycles; this.sprite0At = [x, line];
        return;
      }
    }
  }

  // Runs the CPU to the end of the next frame: the NMI is raised at its start.
  frame() {
    const cpu = this.cpu;
    const start = this.frameStart;
    this.vblank = true;
    this.frames++;
    if (this.ppuCtrl & 0x80) cpu.nmiPending = true;
    const vblankEnd = start + VBLANK_CYCLES;
    const end = start + CYCLES_PER_FRAME;
    while (cpu.cycles < vblankEnd) this.step();
    this.vblank = false;
    if (this.capture) {
      this.visible = { start: vblankEnd, vram: this.vram.slice(), palette: this.palette.slice(), oam: this.oam.slice(), ctrl: this.ppuCtrl, mask: this.ppuMask, t: this.t, x: this.fineX, log: [] };
    }
    this.sprite0Hit = false;                           // cleared on the pre-render line
    this.sprite0Done = false;
    this.visibleStart = vblankEnd;
    while (cpu.cycles < end) { this.step(); if (!this.sprite0Done) this.checkSprite0(vblankEnd); }
    // an instruction may overrun the budget by a few cycles; frames are measured from absolute start times, so the next one is shorter by as much
    this.frameStart = end;
  }
}
