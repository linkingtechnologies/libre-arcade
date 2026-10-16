// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// A small MOS 6502 core for the executable oracle (tools/lockstep.mjs), copied from the one written for Concentration Room's oracle
// (each game in this collection keeps its own copy of what it needs).
// It runs the documented NMOS instruction set (the NES's Ricoh 2A03 has no decimal mode, so ADC and SBC are
// binary only) and counts cycles, including the extra cycle of a page crossing and of a taken branch.
// An opcode it does not know stops the run with an error instead of being guessed at.
//
// The bus is any object with read(address) and write(address, value).

const NAMES = {
  cc1: ['ORA', 'AND', 'EOR', 'ADC', 'STA', 'LDA', 'CMP', 'SBC'],
  cc2: ['ASL', 'ROL', 'LSR', 'ROR', 'STX', 'LDX', 'DEC', 'INC'],
};
const MODES1 = ['izx', 'zp', 'imm', 'abs', 'izy', 'zpx', 'aby', 'abx'];
const MODES2 = ['imm', 'zp', 'acc', 'abs', null, 'zpx', null, 'abx'];

// opcode -> [mnemonic, addressing mode]
export const OPCODES = new Array(256).fill(null);
function def(code, op, mode) { OPCODES[code] = [op, mode]; }
for (let aaa = 0; aaa < 8; aaa++) {
  for (let bbb = 0; bbb < 8; bbb++) {
    if (!(aaa === 4 && bbb === 2)) def((aaa << 5) | (bbb << 2) | 1, NAMES.cc1[aaa], MODES1[bbb]);   // STA #imm does not exist
    let mode = MODES2[bbb];
    let op = NAMES.cc2[aaa];
    if (mode === null) continue;
    if (aaa === 4 || aaa === 5) { if (mode === 'zpx') mode = 'zpy'; if (mode === 'abx') mode = 'aby'; }
    if (bbb === 0 && aaa !== 5) continue;                                                              // only LDX has #imm
    if (bbb === 2 && aaa >= 4) continue;                                                               // TXA, TAX, DEX, NOP are listed below
    if (aaa === 4 && bbb === 7) continue;                                                              // no STX abs,Y
    def((aaa << 5) | (bbb << 2) | 2, op, mode);
  }
}
def(0x24, 'BIT', 'zp'); def(0x2C, 'BIT', 'abs'); def(0x4C, 'JMP', 'abs'); def(0x6C, 'JMP', 'ind');
def(0x84, 'STY', 'zp'); def(0x8C, 'STY', 'abs'); def(0x94, 'STY', 'zpx');
def(0xA0, 'LDY', 'imm'); def(0xA4, 'LDY', 'zp'); def(0xAC, 'LDY', 'abs'); def(0xB4, 'LDY', 'zpx'); def(0xBC, 'LDY', 'abx');
def(0xC0, 'CPY', 'imm'); def(0xC4, 'CPY', 'zp'); def(0xCC, 'CPY', 'abs');
def(0xE0, 'CPX', 'imm'); def(0xE4, 'CPX', 'zp'); def(0xEC, 'CPX', 'abs');
for (const [code, op] of [[0x10, 'BPL'], [0x30, 'BMI'], [0x50, 'BVC'], [0x70, 'BVS'], [0x90, 'BCC'], [0xB0, 'BCS'], [0xD0, 'BNE'], [0xF0, 'BEQ']]) def(code, op, 'rel');
for (const [code, op] of [
  [0x00, 'BRK'], [0x40, 'RTI'], [0x60, 'RTS'], [0x08, 'PHP'], [0x28, 'PLP'], [0x48, 'PHA'], [0x68, 'PLA'],
  [0x88, 'DEY'], [0xA8, 'TAY'], [0xC8, 'INY'], [0xE8, 'INX'], [0x18, 'CLC'], [0x38, 'SEC'], [0x58, 'CLI'], [0x78, 'SEI'],
  [0x98, 'TYA'], [0xB8, 'CLV'], [0xD8, 'CLD'], [0xF8, 'SED'], [0x8A, 'TXA'], [0x9A, 'TXS'], [0xAA, 'TAX'], [0xBA, 'TSX'], [0xCA, 'DEX'], [0xEA, 'NOP'],
]) def(code, op, 'imp');
def(0x20, 'JSR', 'abs');

const WRITE_OPS = new Set(['STA', 'STX', 'STY']);
const RMW_OPS = new Set(['ASL', 'ROL', 'LSR', 'ROR', 'DEC', 'INC']);
const BASE = { imm: 2, zp: 3, zpx: 4, zpy: 4, abs: 4, abx: 4, aby: 4, izx: 6, izy: 5 };
const RMW_BASE = { zp: 5, zpx: 6, abs: 6, abx: 7 };
const FIXED = { BRK: 7, RTI: 6, RTS: 6, PHP: 3, PHA: 3, PLP: 4, PLA: 4, JSR: 6 };

// Per opcode, worked out once: 0 = read (the base cycles, plus one for an indexed access that crosses a page), 1 = write,
// 2 = read-modify-write, and the cycles each takes before any page-crossing penalty.
const KIND = new Uint8Array(256);
const CYCLES = new Uint8Array(256);
OPCODES.forEach((entry, code) => {
  if (!entry) return;
  const [op, mode] = entry;
  if (RMW_OPS.has(op) && mode !== 'acc') { KIND[code] = 2; CYCLES[code] = RMW_BASE[mode]; }
  else if (WRITE_OPS.has(op)) { KIND[code] = 1; CYCLES[code] = (mode === 'abx' || mode === 'aby') ? 5 : mode === 'izy' ? 6 : BASE[mode]; }
  else CYCLES[code] = BASE[mode] ?? 0;
});

export class Cpu6502 {
  constructor(bus) {
    this.bus = bus;
    this.a = 0; this.x = 0; this.y = 0; this.sp = 0xFD; this.pc = 0;
    this.c = 0; this.z = 0; this.i = 1; this.d = 0; this.v = 0; this.n = 0;
    this.cycles = 0;
    this.instructions = 0;
    this.nmiPending = false;
  }

  get p() { return this.c | (this.z << 1) | (this.i << 2) | (this.d << 3) | 0x20 | (this.v << 6) | (this.n << 7); }
  setP(value) { this.c = value & 1; this.z = (value >> 1) & 1; this.i = (value >> 2) & 1; this.d = (value >> 3) & 1; this.v = (value >> 6) & 1; this.n = (value >> 7) & 1; }

  reset() {
    this.pc = this.bus.read(0xFFFC) | (this.bus.read(0xFFFD) << 8);
    this.sp = 0xFD; this.i = 1; this.cycles += 7;
  }

  push(value) { this.bus.write(0x100 + this.sp, value & 0xFF); this.sp = (this.sp - 1) & 0xFF; }
  pull() { this.sp = (this.sp + 1) & 0xFF; return this.bus.read(0x100 + this.sp); }

  nmi() {
    this.push(this.pc >> 8); this.push(this.pc & 0xFF); this.push(this.p & ~0x10); this.i = 1;
    this.pc = this.bus.read(0xFFFA) | (this.bus.read(0xFFFB) << 8);
    this.cycles += 7;
  }

  setNZ(value) { this.z = value === 0 ? 1 : 0; this.n = (value >> 7) & 1; return value; }

  // Effective address of the operand; sets this.crossed when an indexed access crossed a page.
  address(mode) {
    const bus = this.bus;
    let base;
    this.crossed = false;
    switch (mode) {
      case 'imm': return this.pc++ & 0xFFFF;
      case 'zp': return bus.read(this.pc++ & 0xFFFF);
      case 'zpx': return (bus.read(this.pc++ & 0xFFFF) + this.x) & 0xFF;
      case 'zpy': return (bus.read(this.pc++ & 0xFFFF) + this.y) & 0xFF;
      case 'abs': base = bus.read(this.pc & 0xFFFF) | (bus.read((this.pc + 1) & 0xFFFF) << 8); this.pc += 2; return base;
      case 'abx': base = bus.read(this.pc & 0xFFFF) | (bus.read((this.pc + 1) & 0xFFFF) << 8); this.pc += 2; this.crossed = ((base & 0xFF) + this.x) > 0xFF; return (base + this.x) & 0xFFFF;
      case 'aby': base = bus.read(this.pc & 0xFFFF) | (bus.read((this.pc + 1) & 0xFFFF) << 8); this.pc += 2; this.crossed = ((base & 0xFF) + this.y) > 0xFF; return (base + this.y) & 0xFFFF;
      case 'izx': { const zp = (bus.read(this.pc++ & 0xFFFF) + this.x) & 0xFF; return bus.read(zp) | (bus.read((zp + 1) & 0xFF) << 8); }
      case 'izy': { const zp = bus.read(this.pc++ & 0xFFFF); base = bus.read(zp) | (bus.read((zp + 1) & 0xFF) << 8); this.crossed = ((base & 0xFF) + this.y) > 0xFF; return (base + this.y) & 0xFFFF; }
      default: throw new Error(`no operand for mode ${mode}`);
    }
  }

  add(m) {
    const sum = this.a + m + this.c;
    this.v = ((~(this.a ^ m) & (this.a ^ sum)) >> 7) & 1;
    this.c = sum > 0xFF ? 1 : 0;
    this.a = this.setNZ(sum & 0xFF);
  }

  compare(register, m) {
    const diff = register - m;
    this.c = register >= m ? 1 : 0;
    this.setNZ(diff & 0xFF);
  }

  branch(condition) {
    const offset = this.bus.read(this.pc++ & 0xFFFF);
    this.cycles += 2;
    if (!condition) return;
    const target = (this.pc + (offset < 128 ? offset : offset - 256)) & 0xFFFF;
    this.cycles += 1 + (((this.pc ^ target) & 0xFF00) ? 1 : 0);
    this.pc = target;
  }

  step() {
    if (this.nmiPending) { this.nmiPending = false; this.nmi(); }
    const bus = this.bus;
    const start = this.pc & 0xFFFF;
    const opcode = bus.read(start);
    this.pc = (start + 1) & 0xFFFF;
    const entry = OPCODES[opcode];
    if (!entry) throw new Error(`unknown opcode $${opcode.toString(16).padStart(2, '0')} at $${start.toString(16).padStart(4, '0')}`);
    const [op, mode] = entry;
    this.instructions++;

    if (mode === 'imp' || mode === 'acc') {
      this.cycles += FIXED[op] ?? 2;
      switch (op) {
        case 'BRK': this.pc = (this.pc + 1) & 0xFFFF; this.push(this.pc >> 8); this.push(this.pc & 0xFF); this.push(this.p | 0x10); this.i = 1; this.pc = bus.read(0xFFFE) | (bus.read(0xFFFF) << 8); break;
        case 'RTI': this.setP(this.pull()); this.pc = this.pull(); this.pc |= this.pull() << 8; break;
        case 'RTS': this.pc = this.pull(); this.pc |= this.pull() << 8; this.pc = (this.pc + 1) & 0xFFFF; break;
        case 'PHP': this.push(this.p | 0x10); break;
        case 'PHA': this.push(this.a); break;
        case 'PLP': this.setP(this.pull()); break;
        case 'PLA': this.a = this.setNZ(this.pull()); break;
        case 'DEY': this.y = this.setNZ((this.y - 1) & 0xFF); break;
        case 'INY': this.y = this.setNZ((this.y + 1) & 0xFF); break;
        case 'DEX': this.x = this.setNZ((this.x - 1) & 0xFF); break;
        case 'INX': this.x = this.setNZ((this.x + 1) & 0xFF); break;
        case 'TAY': this.y = this.setNZ(this.a); break;
        case 'TAX': this.x = this.setNZ(this.a); break;
        case 'TYA': this.a = this.setNZ(this.y); break;
        case 'TXA': this.a = this.setNZ(this.x); break;
        case 'TSX': this.x = this.setNZ(this.sp); break;
        case 'TXS': this.sp = this.x; break;
        case 'CLC': this.c = 0; break;
        case 'SEC': this.c = 1; break;
        case 'CLI': this.i = 0; break;
        case 'SEI': this.i = 1; break;
        case 'CLV': this.v = 0; break;
        case 'CLD': this.d = 0; break;
        case 'SED': this.d = 1; break;
        case 'NOP': break;
        case 'ASL': this.c = this.a >> 7; this.a = this.setNZ((this.a << 1) & 0xFF); break;
        case 'LSR': this.c = this.a & 1; this.a = this.setNZ(this.a >> 1); break;
        case 'ROL': { const c = this.c; this.c = this.a >> 7; this.a = this.setNZ(((this.a << 1) | c) & 0xFF); break; }
        case 'ROR': { const c = this.c; this.c = this.a & 1; this.a = this.setNZ((this.a >> 1) | (c << 7)); break; }
        default: throw new Error(`unhandled implied ${op}`);
      }
      return;
    }

    switch (op) {
      case 'JSR': {
        const lo = bus.read(this.pc & 0xFFFF), hi = bus.read((this.pc + 1) & 0xFFFF);
        const ret = (this.pc + 1) & 0xFFFF;
        this.push(ret >> 8); this.push(ret & 0xFF);
        this.pc = lo | (hi << 8); this.cycles += 6; return;
      }
      case 'JMP': {
        const lo = bus.read(this.pc & 0xFFFF), hi = bus.read((this.pc + 1) & 0xFFFF);
        const target = lo | (hi << 8);
        if (mode === 'abs') { this.pc = target; this.cycles += 3; return; }
        // indirect: the 6502 does not carry into the high byte of the pointer
        this.pc = bus.read(target) | (bus.read((target & 0xFF00) | ((target + 1) & 0xFF)) << 8); this.cycles += 5; return;
      }
      case 'BPL': this.branch(!this.n); return;
      case 'BMI': this.branch(this.n); return;
      case 'BVC': this.branch(!this.v); return;
      case 'BVS': this.branch(this.v); return;
      case 'BCC': this.branch(!this.c); return;
      case 'BCS': this.branch(this.c); return;
      case 'BNE': this.branch(!this.z); return;
      case 'BEQ': this.branch(this.z); return;
      default: break;
    }

    const address = this.address(mode);
    const kind = KIND[opcode];
    this.cycles += CYCLES[opcode] + (kind === 0 && this.crossed ? 1 : 0);

    if (kind === 2) {
      const m = bus.read(address);
      bus.write(address, m);                                           // the 6502 writes the old value back first
      let r;
      switch (op) {
        case 'ASL': this.c = m >> 7; r = (m << 1) & 0xFF; break;
        case 'LSR': this.c = m & 1; r = m >> 1; break;
        case 'ROL': { const c = this.c; this.c = m >> 7; r = ((m << 1) | c) & 0xFF; break; }
        case 'ROR': { const c = this.c; this.c = m & 1; r = (m >> 1) | (c << 7); break; }
        case 'DEC': r = (m - 1) & 0xFF; break;
        default: r = (m + 1) & 0xFF; break;
      }
      this.setNZ(r);
      bus.write(address, r);
      return;
    }

    switch (op) {
      case 'STA': bus.write(address, this.a); return;
      case 'STX': bus.write(address, this.x); return;
      case 'STY': bus.write(address, this.y); return;
      case 'LDA': this.a = this.setNZ(bus.read(address)); return;
      case 'LDX': this.x = this.setNZ(bus.read(address)); return;
      case 'LDY': this.y = this.setNZ(bus.read(address)); return;
      case 'ORA': this.a = this.setNZ(this.a | bus.read(address)); return;
      case 'AND': this.a = this.setNZ(this.a & bus.read(address)); return;
      case 'EOR': this.a = this.setNZ(this.a ^ bus.read(address)); return;
      case 'ADC': this.add(bus.read(address)); return;
      case 'SBC': this.add(bus.read(address) ^ 0xFF); return;
      case 'CMP': this.compare(this.a, bus.read(address)); return;
      case 'CPX': this.compare(this.x, bus.read(address)); return;
      case 'CPY': this.compare(this.y, bus.read(address)); return;
      case 'BIT': { const m = bus.read(address); this.z = (this.a & m) === 0 ? 1 : 0; this.n = m >> 7; this.v = (m >> 6) & 1; return; }
      default: throw new Error(`unhandled operation ${op}`);
    }
  }
}
