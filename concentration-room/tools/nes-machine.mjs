// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// The smallest NES that can run the preserved Concentration Room 0.02 ROM (an NROM-128 cartridge) for the
// executable oracle in tools/rom-oracle.mjs. It is not a general emulator and draws nothing:
//
//   * CPU: tools/mos6502.mjs, with cycle counts.
//   * RAM: 2 KiB mirrored; PRG ROM: 16 KiB mirrored at $8000 and $C000 (the iNES header is read, the mapper is checked).
//   * PPU: only what the game observes and what is useful for debugging: the status register (vblank flag),
//     the address and data ports with the nametable, palette and OAM memories, OAM DMA. Rendering is not modelled.
//   * Controllers: the strobe and shift protocol of $4016 and $4017. Pad bits are A, B, Select, Start, Up, Down, Left, Right
//     from the most significant bit down, as the game's KEY_* constants are.
//   * APU: writes are accepted and ignored.
//   * Time: a frame is 29,780 cycles. The vblank flag is set for the first 2,273 cycles of a frame and the NMI is raised
//     at its start when PPUCTRL bit 7 is set, so a program that waits for its NMI counter to change sees one change per frame.
//
// Everything the program computes is computed by its own code; this file only provides the world around it.

import { Cpu6502 } from './mos6502.mjs';

export const CYCLES_PER_FRAME = 29780;
export const VBLANK_CYCLES = 2273;

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
    this.ppuToggle = 0;
    this.ppuAddress = 0; this.ppuTemp = 0;
    this.ppuReadBuffer = 0;
    this.scrollX = 0; this.scrollY = 0;
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
        case 2: { const value = this.vblank ? 0x80 : 0; this.vblank = false; this.ppuToggle = 0; return value; }
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
          this.ppuCtrl = value; break;
        case 1: this.ppuMask = value; break;
        case 3: this.oamAddress = value; break;
        case 4: this.oam[this.oamAddress] = value; this.oamAddress = (this.oamAddress + 1) & 0xFF; break;
        case 5:
          if (this.ppuToggle === 0) this.scrollX = value; else this.scrollY = value;
          this.ppuToggle ^= 1; break;
        case 6:
          if (this.ppuToggle === 0) this.ppuTemp = (value & 0x3F) << 8; else { this.ppuTemp |= value; this.ppuAddress = this.ppuTemp; }
          this.ppuToggle ^= 1; break;
        case 7:
          this.ppuWrite(this.ppuAddress, value);
          this.ppuAddress = (this.ppuAddress + ((this.ppuCtrl & 4) ? 32 : 1)) & 0x7FFF; break;
        default: break;
      }
      return;
    }
    if (address === 0x4014) {
      const base = value << 8;
      for (let i = 0; i < 256; i++) this.oam[(this.oamAddress + i) & 0xFF] = this.ram[(base + i) & 0x7FF];
      this.cpu.cycles += 513;
      return;
    }
    if (address === 0x4016) {
      const strobe = value & 1;
      if (this.padStrobe && !strobe) { this.padShift[0] = this.pad[0]; this.padShift[1] = this.pad[1]; }
      this.padStrobe = strobe;
    }
  }

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
      scalars: Object.fromEntries(['padStrobe', 'ppuCtrl', 'ppuMask', 'vblank', 'ppuToggle', 'ppuAddress', 'ppuTemp', 'ppuReadBuffer', 'scrollX', 'scrollY', 'oamAddress', 'frameStart', 'frames', 'ppuWrites'].map((k) => [k, this[k]])),
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
    while (cpu.cycles < end) this.step();
    // an instruction may overrun the budget by a few cycles; frames are measured from absolute start times, so the next one is shorter by as much
    this.frameStart = end;
  }
}
