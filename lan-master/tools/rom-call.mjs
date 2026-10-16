// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// Calls one of the ROM's own subroutines on the machine (tools/nes-machine.mjs), with the registers and the memory the caller sets, and runs it until it
// returns. This is how the oracle checks the routines that have no timing of their own (the random number generator, the unpacking of a level, the trace
// of the network) on more inputs than a game ever visits: the page's functions are run on the same inputs and the results compared.

import { RomGame } from './rom-run.mjs';
import { loadSymbols } from './symbols.mjs';
import { address as ramAddress } from './ram-map.mjs';

export class RomRoutines {
  constructor(rom) {
    this.game = new RomGame(rom);
    this.symbols = loadSymbols(rom);
    this.ram = this.game.m.ram;
  }

  // Calls the routine at `address` (or the label of that name) and returns { a, x, y, z, c, cycles }.
  call(target, { a = 0, x = 0, y = 0, maxCycles = 20_000_000 } = {}) {
    const address = typeof target === 'string' ? this.symbols[target] : target;
    if (address === undefined) throw new Error(`no such routine: ${target}`);
    const m = this.game.m, cpu = m.cpu;
    const TRAP = 0xfff0;                       // a place that is not code: RTS comes back here
    const start = cpu.cycles;
    cpu.sp = 0xfd;
    cpu.push((TRAP - 1) >> 8); cpu.push((TRAP - 1) & 0xff);
    cpu.pc = address; cpu.a = a; cpu.x = x; cpu.y = y;
    while (cpu.pc !== TRAP) {
      m.step();
      if (cpu.cycles - start > maxCycles) throw new Error(`${target} did not return`);
    }
    return { a: cpu.a, x: cpu.x, y: cpu.y, z: cpu.z, c: cpu.c, cycles: cpu.cycles - start };
  }

  set(name, value) { this.ram[ramAddress(name)] = value & 0xff; }
  setWord(name, value) { const at = ramAddress(name); this.ram[at] = value & 0xff; this.ram[at + 1] = (value >> 8) & 0xff; }
  get(name) { return this.ram[ramAddress(name)]; }
  getWord(name) { const at = ramAddress(name); return this.ram[at] | (this.ram[at + 1] << 8); }
  bytes(name, size) { const at = ramAddress(name); return this.ram.slice(at, at + size); }
  load(name, bytes) { this.ram.set(bytes, ramAddress(name)); }
}
