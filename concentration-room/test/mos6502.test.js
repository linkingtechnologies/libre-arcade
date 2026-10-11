// The 6502 core of the executable oracle (tools/mos6502.mjs) is only as good as its own tests. The arithmetic is checked
// against independent formulas for every operand pair; the rest against hand-written programs whose results are known.
import assert from 'node:assert/strict';
import { Cpu6502, OPCODES } from '../tools/mos6502.mjs';

class Ram {
  constructor() { this.m = new Uint8Array(0x10000); }
  read(a) { return this.m[a & 0xFFFF]; }
  write(a, v) { this.m[a & 0xFFFF] = v & 0xFF; }
}
function machine(program, origin = 0x0200) {
  const bus = new Ram();
  program.forEach((b, i) => { bus.m[origin + i] = b; });
  bus.m[0xFFFC] = origin & 0xFF; bus.m[0xFFFD] = origin >> 8;
  const cpu = new Cpu6502(bus);
  cpu.reset();
  return { cpu, bus };
}
const run = (m, steps) => { for (let i = 0; i < steps; i++) m.cpu.step(); return m; };

// 151 documented opcodes, and nothing else
assert.equal(OPCODES.filter(Boolean).length, 151);

// ADC and SBC: every accumulator, operand and carry, against the definition of the flags
for (let a = 0; a < 256; a++) {
  for (let m = 0; m < 256; m++) {
    for (let c = 0; c < 2; c++) {
      const adc = machine([0x69, m]);
      adc.cpu.a = a; adc.cpu.c = c; run(adc, 1);
      const sum = a + m + c;
      const signedSum = (a << 24 >> 24) + (m << 24 >> 24) + c;
      assert.equal(adc.cpu.a, sum & 0xFF);
      assert.equal(adc.cpu.c, sum > 255 ? 1 : 0);
      assert.equal(adc.cpu.v, signedSum < -128 || signedSum > 127 ? 1 : 0);
      assert.equal(adc.cpu.z, (sum & 0xFF) === 0 ? 1 : 0);
      assert.equal(adc.cpu.n, (sum >> 7) & 1);

      const sbc = machine([0xE9, m]);
      sbc.cpu.a = a; sbc.cpu.c = c; run(sbc, 1);
      const diff = a - m - (1 - c);
      const signedDiff = (a << 24 >> 24) - (m << 24 >> 24) - (1 - c);
      assert.equal(sbc.cpu.a, diff & 0xFF);
      assert.equal(sbc.cpu.c, diff >= 0 ? 1 : 0);
      assert.equal(sbc.cpu.v, signedDiff < -128 || signedDiff > 127 ? 1 : 0);
      assert.equal(sbc.cpu.z, (diff & 0xFF) === 0 ? 1 : 0);
      assert.equal(sbc.cpu.n, ((diff & 0xFF) >> 7) & 1);
    }
    const cmp = machine([0xC9, m]);
    cmp.cpu.a = a; run(cmp, 1);
    assert.equal(cmp.cpu.c, a >= m ? 1 : 0);
    assert.equal(cmp.cpu.z, a === m ? 1 : 0);
    assert.equal(cmp.cpu.n, (((a - m) & 0xFF) >> 7) & 1);
    assert.equal(cmp.cpu.a, a);
  }
}

// logic, loads, transfers and flags
{
  const m = machine([0xA9, 0xF0, 0x29, 0x3C, 0x09, 0x01, 0x49, 0xFF, 0xAA, 0xA8, 0xE8, 0x88, 0x88]);
  run(m, 9);
  assert.equal(m.cpu.a, 0xCE);          // (F0 & 3C) = 30; | 01 = 31; ^ FF = CE
  assert.equal(m.cpu.x, 0xCF); assert.equal(m.cpu.y, 0xCC);
  assert.equal(m.cpu.n, 1);
}

// shifts and rotates, accumulator and memory, with the carry
{
  const m = machine([0xA9, 0x81, 0x0A, 0x2A, 0x4A, 0x6A, 0x85, 0x10, 0x06, 0x10, 0x46, 0x10, 0x26, 0x10, 0x66, 0x10]);
  run(m, 10);
  // A=81: ASL -> 02 C=1; ROL -> 05 C=0; LSR -> 02 C=1; ROR -> 81 C=0
  assert.equal(m.cpu.a, 0x81); assert.equal(m.cpu.c, 0);
  // memory 81: ASL -> 02 C=1, LSR -> 01 C=0, ROL -> 02 C=0, ROR -> 01 C=0
  assert.equal(m.bus.m[0x10], 0x01);
}

// INC and DEC on memory, wrapping, with N and Z
{
  const m = machine([0xE6, 0x10, 0xC6, 0x11, 0xC6, 0x11]);
  m.bus.m[0x10] = 0xFF; m.bus.m[0x11] = 0x01;
  run(m, 1); assert.equal(m.bus.m[0x10], 0); assert.equal(m.cpu.z, 1);
  run(m, 1); assert.equal(m.bus.m[0x11], 0); assert.equal(m.cpu.z, 1);
  run(m, 1); assert.equal(m.bus.m[0x11], 0xFF); assert.equal(m.cpu.n, 1);
}

// the addressing modes: zero page wraps, indexed absolute, and the two indirect forms
{
  const m = machine([0xA2, 0x05, 0xB5, 0xFE, 0xA0, 0x03, 0xB1, 0x20, 0xA1, 0x30, 0xBD, 0xFE, 0x02]);
  m.bus.m[0x03] = 0x77;                                                  // $FE + X = $103 wraps to $03
  m.bus.m[0x20] = 0xFD; m.bus.m[0x21] = 0x02; m.bus.m[0x300] = 0x66;      // ($20),Y = $02FD + 3 = $0300
  m.bus.m[0x35] = 0x00; m.bus.m[0x36] = 0x04; m.bus.m[0x400] = 0x99;      // ($30,X) with X=5 reads the pointer at $35
  m.bus.m[0x303] = 0xAB;                                                  // $02FE,X = $0303
  run(m, 2); assert.equal(m.cpu.a, 0x77);
  run(m, 2); assert.equal(m.cpu.a, 0x66);
  run(m, 1); assert.equal(m.cpu.a, 0x99);
  run(m, 1); assert.equal(m.cpu.a, 0xAB);
}

// stack, JSR, RTS, PHP, PLP
{
  const m = machine([0x20, 0x10, 0x02, 0xEA, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xA9, 0x42, 0x48, 0x08, 0xA9, 0x00, 0x28, 0x68, 0x60]);
  run(m, 1); assert.equal(m.cpu.pc, 0x0210); assert.equal(m.cpu.sp, 0xFB);
  run(m, 6); assert.equal(m.cpu.a, 0x42);               // PHA, PHP, LDA #0, PLP (flags back), PLA
  run(m, 1); assert.equal(m.cpu.pc, 0x0203);            // RTS lands after the JSR
  assert.equal(m.cpu.sp, 0xFD);
}

// branches: not taken 2 cycles, taken 3, taken across a page 4
{
  const m = machine([0xD0, 0x02, 0xEA, 0xEA, 0xF0, 0x7F]);
  m.cpu.z = 0; const c0 = m.cpu.cycles; run(m, 1);
  assert.equal(m.cpu.cycles - c0, 3); assert.equal(m.cpu.pc, 0x0204);
  const c1 = m.cpu.cycles; m.cpu.z = 0; run(m, 1);
  assert.equal(m.cpu.cycles - c1, 2);
  const far = machine([0xF0, 0x7F], 0x02F0);
  far.cpu.z = 1; const c2 = far.cpu.cycles; run(far, 1);
  assert.equal(far.cpu.cycles - c2, 4); assert.equal(far.cpu.pc, 0x0371);
}

// JMP (indirect) does not carry into the high byte of the pointer
{
  const m = machine([0x6C, 0xFF, 0x03]);
  m.bus.m[0x03FF] = 0x34; m.bus.m[0x0300] = 0x12; m.bus.m[0x0400] = 0x99;
  run(m, 1); assert.equal(m.cpu.pc, 0x1234);
}

// BIT, and cycle counts of the indexed read that crosses a page
{
  const m = machine([0x24, 0x10, 0xBD, 0xFF, 0x02]);
  m.bus.m[0x10] = 0xC0; m.cpu.a = 0x3F;
  run(m, 1); assert.equal(m.cpu.z, 1); assert.equal(m.cpu.n, 1); assert.equal(m.cpu.v, 1);
  m.cpu.x = 1; const c = m.cpu.cycles; run(m, 1);
  assert.equal(m.cpu.cycles - c, 5);
}

// NMI: pushes the return address and the flags (without B), sets I, jumps through $FFFA; RTI restores them
{
  const m = machine([0xEA, 0xEA]);
  m.bus.m[0xFFFA] = 0x00; m.bus.m[0xFFFB] = 0x03;
  m.bus.m[0x0300] = 0x40;                               // RTI
  m.cpu.nmiPending = true; m.cpu.c = 1; m.cpu.i = 0;
  run(m, 1);                                            // takes the NMI, then executes the RTI of the handler
  assert.equal(m.cpu.pc, 0x0200);                       // back where it was interrupted
  assert.equal(m.cpu.c, 1); assert.equal(m.cpu.i, 0);   // flags restored
  assert.equal(m.cpu.sp, 0xFD);
  assert.equal(m.bus.m[0x01FD], 0x02); assert.equal(m.bus.m[0x01FC], 0x00);   // the pushed return address
  assert.equal(m.bus.m[0x01FB] & 0x10, 0);              // B clear in the pushed flags
  assert.equal(m.bus.m[0x01FB] & 0x04, 0);              // and I as it was
}

console.log('All 6502 core tests passed.');
