#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// A small two-pass assembler for the NESASM 3 syntax that Shiru's sources use (the 6502 instructions, the directives .inesprg .ineschr
// .inesmir .inesmap .bank .org .include .incbin .db .dw (and .byte .word) .ifdef .ifndef .else .endif, `equ` and `=`, local labels, LOW() and
// HIGH()). The author's assembler (nesasm.exe) is not in his source archive; this one reproduces its output.
//
// The one rule that is not the obvious one, and that makes the output the same: NESASM encodes an operand as zero page only when it is a plain
// number of one or two digits (`lda $80`) or is written with a `<` (`lda <PAD_STATE`). A symbol is absolute, even if it was defined
// with `equ` as a number below $100, and so is a three-digit number such as $0080. With that rule the source of Lan Master assembles to
// exactly the author's ROM (test/reference.test.mjs checks it on every run), and so does the v1.12 source of his Lawn Mower to his ROM.
//
// It began as the port of the verification assembler that came with the restoration package Lawn Mower was integrated from (audit/build/mini_nesasm_verifier.py).
//
// Usage: node tools/assemble.mjs <source dir> [--org 0xC000=0x8000 ...] [--out file.nes] [--symbols file.json]

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const OP = {
  adc: { imm: 0x69, zp: 0x65, zpx: 0x75, abs: 0x6d, absx: 0x7d, absy: 0x79, indx: 0x61, indy: 0x71 },
  and: { imm: 0x29, zp: 0x25, zpx: 0x35, abs: 0x2d, absx: 0x3d, absy: 0x39, indx: 0x21, indy: 0x31 },
  asl: { acc: 0x0a, zp: 0x06, zpx: 0x16, abs: 0x0e, absx: 0x1e },
  bcc: { rel: 0x90 }, bcs: { rel: 0xb0 }, beq: { rel: 0xf0 }, bmi: { rel: 0x30 }, bne: { rel: 0xd0 }, bpl: { rel: 0x10 }, bvc: { rel: 0x50 }, bvs: { rel: 0x70 },
  bit: { zp: 0x24, abs: 0x2c },
  brk: { imp: 0x00 }, clc: { imp: 0x18 }, cld: { imp: 0xd8 }, cli: { imp: 0x58 }, clv: { imp: 0xb8 },
  cmp: { imm: 0xc9, zp: 0xc5, zpx: 0xd5, abs: 0xcd, absx: 0xdd, absy: 0xd9, indx: 0xc1, indy: 0xd1 },
  cpx: { imm: 0xe0, zp: 0xe4, abs: 0xec }, cpy: { imm: 0xc0, zp: 0xc4, abs: 0xcc },
  dec: { zp: 0xc6, zpx: 0xd6, abs: 0xce, absx: 0xde }, dex: { imp: 0xca }, dey: { imp: 0x88 },
  eor: { imm: 0x49, zp: 0x45, zpx: 0x55, abs: 0x4d, absx: 0x5d, absy: 0x59, indx: 0x41, indy: 0x51 },
  inc: { zp: 0xe6, zpx: 0xf6, abs: 0xee, absx: 0xfe }, inx: { imp: 0xe8 }, iny: { imp: 0xc8 },
  jmp: { abs: 0x4c, ind: 0x6c }, jsr: { abs: 0x20 },
  lda: { imm: 0xa9, zp: 0xa5, zpx: 0xb5, abs: 0xad, absx: 0xbd, absy: 0xb9, indx: 0xa1, indy: 0xb1 },
  ldx: { imm: 0xa2, zp: 0xa6, zpy: 0xb6, abs: 0xae, absy: 0xbe },
  ldy: { imm: 0xa0, zp: 0xa4, zpx: 0xb4, abs: 0xac, absx: 0xbc },
  lsr: { acc: 0x4a, zp: 0x46, zpx: 0x56, abs: 0x4e, absx: 0x5e }, nop: { imp: 0xea },
  ora: { imm: 0x09, zp: 0x05, zpx: 0x15, abs: 0x0d, absx: 0x1d, absy: 0x19, indx: 0x01, indy: 0x11 },
  pha: { imp: 0x48 }, php: { imp: 0x08 }, pla: { imp: 0x68 }, plp: { imp: 0x28 },
  rol: { acc: 0x2a, zp: 0x26, zpx: 0x36, abs: 0x2e, absx: 0x3e }, ror: { acc: 0x6a, zp: 0x66, zpx: 0x76, abs: 0x6e, absx: 0x7e },
  rti: { imp: 0x40 }, rts: { imp: 0x60 },
  sbc: { imm: 0xe9, zp: 0xe5, zpx: 0xf5, abs: 0xed, absx: 0xfd, absy: 0xf9, indx: 0xe1, indy: 0xf1 },
  sec: { imp: 0x38 }, sed: { imp: 0xf8 }, sei: { imp: 0x78 },
  sta: { zp: 0x85, zpx: 0x95, abs: 0x8d, absx: 0x9d, absy: 0x99, indx: 0x81, indy: 0x91 },
  stx: { zp: 0x86, zpy: 0x96, abs: 0x8e }, sty: { zp: 0x84, zpx: 0x94, abs: 0x8c },
  tax: { imp: 0xaa }, tay: { imp: 0xa8 }, tsx: { imp: 0xba }, txa: { imp: 0x8a }, txs: { imp: 0x9a }, tya: { imp: 0x98 },
};
const BRANCHES = new Set(['bcc', 'bcs', 'beq', 'bmi', 'bne', 'bpl', 'bvc', 'bvs']);
const DIRECTIVES = new Set(['.inesprg', '.ineschr', '.inesmir', '.inesmap', '.bank', '.org', '.include', '.incbin', '.db', '.dw', '.byte', '.word', '.ifdef', '.ifndef', '.else', '.endif']);
const SIZE = { imp: 1, acc: 1, imm: 2, zp: 2, zpx: 2, zpy: 2, indx: 2, indy: 2, rel: 2, abs: 3, absx: 3, absy: 3, ind: 3 };

class Unresolved extends Error {}

export class Assembler {
  constructor(root, { orgs = {} } = {}) {
    this.root = resolve(root);
    this.orgs = orgs;                                  // .org operand (a number) -> replacement, to move the program between the NROM mirrors
    this.symbols = new Map();
    this.defined = new Set();
    this.header = { prg: 0, chr: 0, mir: 0, map: 0 };
    this.banks = new Map();
    this.bank = 0; this.pc = 0; this.scope = '';
  }

  preprocess(path) {
    const full = isAbsolute(path) ? path : join(this.root, path);
    const out = [];
    readFileSync(full, 'latin1').split(/\r\n|\n|\r/).forEach((line, index) => {
      const code = line.split(';', 1)[0].trim();
      const include = /^\.include\s+["']([^"']+)["']/i.exec(code);
      if (include) out.push(...this.preprocess(join(dirname(full), include[1])));
      else out.push({ file: full, line: index + 1, raw: line });
    });
    return out;
  }

  canon(name, scope = this.scope) { return name.startsWith('.') ? `${scope}::${name}` : name; }

  // Expressions: numbers ($hex, %binary, decimal), symbols, LOW() HIGH(), + - * / & | ^ << >> ~ and parentheses, with integer division.
  evaluate(text, scope = this.scope, allowUnresolved = false) {
    const tokens = [];
    const pattern = /\s*(\$[0-9A-Fa-f]+|%[01]+|[0-9]+|\.[A-Za-z0-9_]+|[A-Za-z_][A-Za-z0-9_]*|<<|>>|[-+*/&|^~()])/y;
    let at = 0, unresolved = false;
    while (at < text.length) {
      pattern.lastIndex = at;
      const m = pattern.exec(text);
      if (!m) {
        if (/^\s*$/.test(text.slice(at))) break;
        throw new Error(`bad expression ${JSON.stringify(text)} at ${at}`);
      }
      tokens.push(m[1]); at = pattern.lastIndex;
    }
    let i = 0;
    const lookup = (name) => {
      const c = this.canon(name, scope);
      if (this.symbols.has(c)) return this.symbols.get(c);
      if (this.symbols.has(name)) return this.symbols.get(name);
      unresolved = true;
      if (!allowUnresolved) throw new Unresolved(`unresolved ${c} in ${text}`);
      return 0;
    };
    const primary = () => {
      const t = tokens[i++];
      if (t === undefined) throw new Error(`bad expression ${JSON.stringify(text)}`);
      if (t === '(') { const v = or(); if (tokens[i++] !== ')') throw new Error('missing ) in ' + text); return v; }
      if (t === '-') return -primary();
      if (t === '+') return primary();
      if (t === '~') return ~primary();
      if (t[0] === '$') return parseInt(t.slice(1), 16);
      if (t[0] === '%') return parseInt(t.slice(1), 2);
      if (/^[0-9]/.test(t)) return parseInt(t, 10);
      if ((t.toUpperCase() === 'LOW' || t.toUpperCase() === 'HIGH') && tokens[i] === '(') {
        i++; const v = or(); if (tokens[i++] !== ')') throw new Error('missing ) in ' + text);
        return t.toUpperCase() === 'LOW' ? v & 255 : (v >> 8) & 255;
      }
      return lookup(t);
    };
    const mul = () => { let v = primary(); while (tokens[i] === '*' || tokens[i] === '/') { const op = tokens[i++]; const r = primary(); v = op === '*' ? v * r : Math.trunc(v / r); } return v; };
    const add = () => { let v = mul(); while (tokens[i] === '+' || tokens[i] === '-') { const op = tokens[i++]; const r = mul(); v = op === '+' ? v + r : v - r; } return v; };
    const shift = () => { let v = add(); while (tokens[i] === '<<' || tokens[i] === '>>') { const op = tokens[i++]; const r = add(); v = op === '<<' ? v << r : v >> r; } return v; };
    const and = () => { let v = shift(); while (tokens[i] === '&') { i++; v &= shift(); } return v; };
    const xor = () => { let v = and(); while (tokens[i] === '^') { i++; v ^= and(); } return v; };
    const or = () => { let v = xor(); while (tokens[i] === '|') { i++; v |= xor(); } return v; };
    const value = or();
    if (i < tokens.length) throw new Error(`bad expression ${JSON.stringify(text)}`);
    return { value, unresolved };
  }

  splitArguments(text) {
    const out = []; let cur = '', quoted = false, depth = 0;
    for (const ch of text) {
      if (ch === '"') { quoted = !quoted; cur += ch; }
      else if (ch === '(' && !quoted) { depth++; cur += ch; }
      else if (ch === ')' && !quoted) { depth--; cur += ch; }
      else if (ch === ',' && !quoted && depth === 0) { out.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    if (cur.trim() || text.endsWith(',')) out.push(cur.trim());
    return out;
  }

  mode(mnemonic, operand, pass) {
    let o = operand.trim();
    if (BRANCHES.has(mnemonic)) return ['rel', o];
    if (!o) return ['imp', ''];
    if (o.toLowerCase() === 'a') return ['acc', ''];
    if (o.startsWith('#')) return ['imm', o.slice(1).trim()];
    let m = /^\[(.+)\],\s*[Yy]$/.exec(o);
    if (m) return ['indy', m[1].trim()];
    m = /^\[(.+),\s*[Xx]\]$/.exec(o);
    if (m) return ['indx', m[1].trim()];
    m = /^\((.+)\)$/.exec(o);
    if (m && mnemonic === 'jmp') return ['ind', m[1].trim()];
    let forceZeroPage = false;
    if (o.startsWith('<')) { forceZeroPage = true; o = o.slice(1).trim(); }
    let index = null;
    m = /^(.*),\s*([XxYy])$/.exec(o);
    if (m) { o = m[1].trim(); index = m[2].toLowerCase(); }
    const { value, unresolved } = this.evaluate(o, this.scope, pass === 1);
    // NESASM keeps the width the author wrote: $000 is absolute, $00 is zero page.
    const explicitAbsolute = /\$[0-9A-Fa-f]{3,}/.test(o) && !forceZeroPage;
    // The author's assembler (NESASM 3.1) takes zero page addressing for an operand only when it is written `<name` or is a number of one or two
    // digits: a symbol that an `equ` gave a small value is still absolute (the ROM has `ldx PAD_STATET` as three bytes, `ldx <PAD_STATET` as two).
    const literal = !/[A-Za-z_.]/.test(o.replace(/^\$/, '').replace(/\$[0-9A-Fa-f]+/g, ''));
    const zeroPage = forceZeroPage || (literal && !explicitAbsolute && !unresolved && value >= 0 && value <= 0xff);
    const candidates = index === 'x' ? [zeroPage ? 'zpx' : 'absx', 'absx', 'zpx']
      : index === 'y' ? [zeroPage ? 'zpy' : 'absy', 'absy', 'zpy']
      : [zeroPage ? 'zp' : 'abs', 'abs', 'zp'];
    for (const md of candidates) if (OP[mnemonic][md] !== undefined) return [md, o];
    throw new Error(`no addressing mode ${mnemonic} ${operand}`);
  }

  emit(bytes) {
    let store = this.banks.get(this.bank);
    if (!store) { store = new Uint8Array(8192).fill(0xff); this.banks.set(this.bank, store); }
    const offset = this.pc & 0x1fff;
    if (offset + bytes.length > 8192) throw new Error('bank overflow');
    for (let k = 0; k < bytes.length; k++) store[offset + k] = bytes[k] & 255;
    this.pc += bytes.length;
  }

  process(lines, pass) {
    this.bank = 0; this.pc = 0; this.scope = '';
    const conditions = [];
    let active = true;
    if (pass === 2) this.banks = new Map();
    for (const { file, line, raw } of lines) {
      const code = raw.split(';', 1)[0].trim();
      if (!code) continue;
      const low = code.toLowerCase();
      try {
        if (low.startsWith('.ifdef ') || low.startsWith('.ifndef ')) {
          const [directive, name] = [code.split(/\s+/, 1)[0].toLowerCase(), code.split(/\s+/).slice(1).join(' ').trim()];
          const exists = this.defined.has(name) || this.symbols.has(name);
          const take = directive === '.ifdef' ? exists : !exists;
          conditions.push({ parent: active, take });
          active = active && take; continue;
        }
        if (low === '.else') { const top = conditions[conditions.length - 1]; if (!top) throw new Error('.else without if'); active = top.parent && !top.take; continue; }
        if (low === '.endif') { const top = conditions.pop(); if (!top) throw new Error('.endif without if'); active = top.parent; continue; }
        if (!active) continue;

        let m = /^\.(inesprg|ineschr|inesmir|inesmap|bank|org)\s+(.+)$/i.exec(code);
        if (m) {
          const directive = m[1].toLowerCase();
          let { value } = this.evaluate(m[2], this.scope, pass === 1);
          if (directive === 'org' && this.orgs[value] !== undefined) value = this.orgs[value];
          if (directive === 'bank') this.bank = value;
          else if (directive === 'org') this.pc = value;
          else this.header[{ inesprg: 'prg', ineschr: 'chr', inesmir: 'mir', inesmap: 'map' }[directive]] = value;
          continue;
        }
        m = /^\.incbin\s+["']([^"']+)["']/i.exec(code);
        if (m) {
          const data = readFileSync(join(dirname(file), m[1]));
          if (pass === 2) this.emit(data); else this.pc += data.length;
          continue;
        }
        m = /^\.(db|dw|byte|word)\s+(.+)$/i.exec(code);
        if (m) {
          const values = [];
          for (const argument of this.splitArguments(m[2])) {
            if (argument.startsWith('"') && argument.endsWith('"')) values.push(...Buffer.from(argument.slice(1, -1), 'latin1'));
            else {
              const v = pass === 2 ? this.evaluate(argument, this.scope, false).value : 0;
              if (['db', 'byte'].includes(m[1].toLowerCase())) values.push(v & 255); else values.push(v & 255, (v >> 8) & 255);
            }
          }
          if (pass === 2) this.emit(values); else this.pc += values.length;
          continue;
        }
        m = /^([A-Za-z_][A-Za-z0-9_]*)\s+equ\s+(.+)$/i.exec(code) ?? /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/.exec(code);
        if (m) {
          const { value, unresolved } = this.evaluate(m[2], this.scope, pass === 1);
          if (!unresolved || pass === 2) this.symbols.set(m[1], value);
          this.defined.add(m[1]); continue;
        }
        const first = code.split(/\s+/, 1)[0];
        const alone = code.split(/\s+/).length === 1;
        if (!(first.toLowerCase() in OP) && !first.startsWith('.') && alone) {
          const canonical = this.canon(first);
          if (pass === 1) this.symbols.set(canonical, this.pc);
          this.defined.add(first); this.defined.add(canonical);
          this.scope = first; continue;
        }
        if (first.startsWith('.') && !DIRECTIVES.has(first.toLowerCase()) && alone) {
          const canonical = this.canon(first);
          if (pass === 1) this.symbols.set(canonical, this.pc);
          this.defined.add(canonical); continue;
        }
        const mnemonic = first.toLowerCase();
        const operand = code.slice(first.length).trim();
        if (!(mnemonic in OP)) throw new Error('unknown opcode or directive ' + mnemonic);
        const [md, expression] = this.mode(mnemonic, operand, pass);
        if (pass === 1) { this.pc += SIZE[md]; continue; }
        const v = expression ? this.evaluate(expression, this.scope, false).value : 0;
        const bytes = [OP[mnemonic][md]];
        if (['imm', 'zp', 'zpx', 'zpy', 'indx', 'indy'].includes(md)) bytes.push(v & 255);
        else if (md === 'rel') {
          const offset = v - (this.pc + 2);
          if (offset < -128 || offset > 127) throw new Error(`branch out of range ${mnemonic} ${operand} ${offset}`);
          bytes.push(offset & 255);
        } else if (['abs', 'absx', 'absy', 'ind'].includes(md)) bytes.push(v & 255, (v >> 8) & 255);
        this.emit(bytes);
      } catch (error) {
        throw new Error(`${file}:${line}: ${raw}\n  ${error.message}`);
      }
    }
  }

  assemble(main = 'game.asm') {
    const lines = this.preprocess(main);
    this.process(lines, 1);
    this.process(lines, 2);
    const header = Buffer.concat([Buffer.from('NES\x1a', 'latin1'), Buffer.from([this.header.prg & 255, this.header.chr & 255,
      (this.header.mir & 1) | ((this.header.map & 0x0f) << 4), this.header.map & 0xf0]), Buffer.alloc(8)]);
    const bank = (n) => Buffer.from(this.banks.get(n) ?? new Uint8Array(8192).fill(0xff));
    const parts = [header];
    for (let n = 0; n < this.header.prg * 2; n++) parts.push(bank(n));
    for (let n = 0; n < this.header.chr; n++) parts.push(bank(this.header.prg * 2 + n));
    return Buffer.concat(parts);
  }

  // The label addresses, global labels only unless asked for the local ones too.
  labels({ locals = false } = {}) {
    const out = {};
    for (const [name, value] of this.symbols) if (locals || !name.includes('::')) out[name] = value;
    return out;
  }
}

// The source moved to the upper NROM-128 mirror after the competition; these origins put the program back where the competition ROM has it.
export const ORGS_AT_8000 = Object.freeze({ 0xC000: 0x8000, 0xE000: 0xA000, 0xFFFA: 0xBFFA });

export function assembleSource(dir, { at8000 = false } = {}) {
  const assembler = new Assembler(dir, { orgs: at8000 ? ORGS_AT_8000 : {} });
  const rom = assembler.assemble('game.asm');
  return { rom, assembler };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const dir = args.find((a) => !a.startsWith('--'));
  const flag = (name) => { const k = args.indexOf(name); return k >= 0 ? args[k + 1] : null; };
  if (!dir) { console.error('usage: node tools/assemble.mjs <source dir> [--at8000] [--out file.nes] [--symbols file.json]'); process.exit(2); }
  const { rom, assembler } = assembleSource(dir, { at8000: args.includes('--at8000') });
  if (flag('--out')) writeFileSync(flag('--out'), rom);
  if (flag('--symbols')) writeFileSync(flag('--symbols'), JSON.stringify(assembler.labels(), null, 1) + '\n');
  console.log(`assembled ${rom.length} bytes, ${assembler.symbols.size} symbols`);
}
