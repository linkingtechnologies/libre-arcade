// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// The normalised state that tools/rom-run.mjs reads from the ROM and tools/js-run.mjs reads from the port, as text (one line per
// part), its checksum, and the first line on which two of them differ.

// The program keeps one set of NPC variables for whatever character a stage has, and a stage does not clear what its character does not
// use: Day 5 starts with the Geek's `npc_wait` at 255 if the Dream was lost to the Ghost, and a retried Day 2 starts with the Chief's
// `npc_tx` where the last attempt left it. So each character is compared on the fields that the game reads for it (the Chief's speech
// bubble position only once it has been placed: `ty` is 240 while there is none, and it is drawn and not read).
const NPC_FIELDS = {
  chief: ['type', 'x', 'y', 'dir', 'cnt', 'ty'], bouncer: ['type', 'x', 'y', 'dir'], chatter: ['type', 'x', 'y', 'dir', 'cnt', 'wait'],
  geek: ['type', 'x', 'y', 'dir'], manbox: ['type', 'x', 'y', 'dir', 'cnt'], dibrov: ['type', 'x', 'y', 'dir', 'cnt', 'speed'],
  ghost: ['type', 'x', 'y', 'dir', 'cnt', 'wait', 'dx', 'dy'],
};
const npcFields = (npc) => (npc.type === 'chief' && npc.ty !== 240 ? [...NPC_FIELDS.chief, 'tx'] : NPC_FIELDS[npc.type]);

export function canonical(state) {
  const lines = [];
  lines.push(`t rng ${state.rng} frame ${state.frame} ring ${state.ring} calls ${state.calls} missed ${state.missed} delay ${state.callDelay}`);
  // the program's pause (START) counts from 50 down to 25 and waits there; the line is only there while the game is paused, or in the 24
  // iterations after it, so that a state with no pause reads as it always did
  if (state.pause) lines.push(`U pause ${state.pause}`);
  lines.push(`P ${Object.entries(state.player).map(([k, v]) => `${k} ${v}`).join(' ')}`);
  lines.push(`C ${state.coffee ? `${state.coffee.x} ${state.coffee.y} ${state.coffee.wait}` : '-'}`);
  state.phones.forEach((p, i) => lines.push(`H${i} x ${p.x} y ${p.y} cnt ${p.cnt} level ${p.level} topic ${p.topic}`));
  state.topics.forEach((t, i) => lines.push(`T${i} id ${t.id} x ${t.x} y ${t.y} msg ${t.msg}`));
  lines.push(`N ${state.npc ? npcFields(state.npc).map((k) => `${k} ${state.npc[k]}`).join(' ') : '-'}`);
  lines.push(`G ptr ${state.hearts.ptr} life ${state.hearts.life.join(' ')}`);
  lines.push(`D ${state.dream ? `run ${state.dream.runaway} max ${state.dream.runawayMax} table ${state.dream.table}` : '-'}`);
  return lines.join('\n');
}

// CRC-32, the same as the other games' oracles use for the per-step fingerprint of a state.
const TABLE = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1; return c; });
export function crc32(text) {
  let c = -1;
  for (let i = 0; i < text.length; i++) c = (c >>> 8) ^ TABLE[(c ^ text.charCodeAt(i)) & 0xff];
  return (c ^ -1) >>> 0;
}

// The first difference between two normalised states as text: what the ROM has and what the port has.
export function firstDifference(rom, port) {
  const a = canonical(rom).split('\n'), b = canonical(port).split('\n');
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === b[i]) continue;
    const ta = (a[i] ?? '').split(' '), tb = (b[i] ?? '').split(' ');
    const fields = [];
    for (let j = 0; j < Math.max(ta.length, tb.length); j += 1) if (ta[j] !== tb[j] && isNaN(Number(ta[j]) ) === false) fields.push(`${ta[j - 1] ?? ''}: ROM ${ta[j]} port ${tb[j]}`);
    return `line "${(a[i] ?? b[i]).split(' ')[0]}"\n  ROM:  ${a[i]}\n  port: ${b[i]}${fields.length ? `\n  differing: ${fields.join(', ')}` : ''}`;
  }
  return null;
}
