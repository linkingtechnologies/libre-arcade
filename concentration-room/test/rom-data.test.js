// The English text of the story, the opponents and the instruction screens, the table of the ten story stages, the sound and music data,
// the five layouts of the table and the palettes are the original's. Every line of text is looked for in the program of the preserved release ROM (the original stores its text as plain
// ASCII rows, one per screen line), and each table is looked for byte for byte.
import assert from 'node:assert/strict';
import { loadRom } from '../tools/rom-oracle.mjs';
import { SFX, MUSIC_PATTERNS, MUSIC_SONGS, MUSIC_INSTRUMENTS } from '../public/src/audio-data.js';
import { DEAL_PATTERNS } from '../public/src/layouts.js';
import { CARD_PALETTES, GAME_PALETTE } from '../public/src/nes-visual.js';
import { STORY_OPENING_LINES, SOLO_INSTRUCTION_LINES, TWO_PLAYER_INSTRUCTION_LINES, STORY_STAGES, storyScene } from '../public/src/story.js';

const rom = loadRom();
const program = Buffer.from(rom.subarray(16, 16 + rom[4] * 0x4000));

const lines = [...STORY_OPENING_LINES.en, ...SOLO_INSTRUCTION_LINES.en, ...TWO_PLAYER_INSTRUCTION_LINES.en];
for (let scene = 64; scene < 79; scene++) lines.push(...storyScene(scene, 'en').text.split('\n'));
const wanted = lines.filter(Boolean);
assert.ok(wanted.length >= 85, `expected a full set of lines, got ${wanted.length}`);

const missing = wanted.filter((line) => !program.includes(Buffer.from(line, 'latin1')));
assert.deepEqual(missing, [], 'these English lines are not in the ROM');

// the opening text appears in the ROM in the same order as the port shows it (each row ends with a line feed there)
let last = 0;
for (const line of STORY_OPENING_LINES.en.filter(Boolean)) {
  const at = program.indexOf(Buffer.from(`${line}\n`, 'latin1'), last);
  assert.ok(at >= 0, `the opening text is out of order at: ${line}`);
  last = at;
}

// storyStages (litemain.s): per stage eight bytes, difficulty, CPU noise (-1: Solitaire), two unused, the scene and the next stage after a win, then after a loss
const table = Buffer.from(STORY_STAGES.flatMap((stage) => [stage.difficulty, stage.aiNoiseLevel & 0xFF, 0, 0, stage.winScene & 0xFF, stage.winNext & 0xFF, stage.loseScene & 0xFF, stage.loseNext & 0xFF]));
assert.equal(table.length, 80);
const at = program.indexOf(table);
assert.ok(at >= 0, 'the story table is not in the ROM');
assert.equal(program.indexOf(table, at + 1), -1, 'the story table is in the ROM twice');

// the sound effects (sound.s) are streams of (control, pitch) byte pairs; the music patterns (musicseq.s, music.s) are one byte per note
const findOnce = (bytes, what) => {
  const buffer = Buffer.from(bytes);
  assert.ok(program.includes(buffer), `${what} is not in the ROM`);
};
for (const sfx of SFX) findOnce(sfx.data.slice(0, sfx.length).flat(), `sound effect "${sfx.name}"`);
MUSIC_PATTERNS.forEach((pattern, i) => findOnce(pattern, `music pattern ${i}`));
// the conductor of each song (musicseq.h: CON_PLAYPAT $00+channel, CON_WAITROWS $20, CON_FINE $21, CON_SEGNO $22, CON_DALSEGNO $23, CON_SETTEMPO $30+bits 8-9)
const CON = { wait: 0x20, fine: 0x21, segno: 0x22, dalsegno: 0x23, tempo: 0x30 };
MUSIC_SONGS.forEach((song, i) => findOnce(song.flatMap((c) => {
  if (c.op === 'play') return [c.channel, c.pattern, c.transpose, c.instrument];
  if (c.op === 'tempo') return [CON.tempo + (c.value >> 8), c.value & 0xFF];
  if (c.op === 'wait') return [CON.wait, c.rows];
  return [CON[c.op]];
}), `conductor of song ${i}`));
findOnce(MUSIC_INSTRUMENTS.flatMap((ins) => [ins.initial, ins.decay, ins.attr, 0]), 'the instrument table');
findOnce([10, 9], 'the drum sound table');

// the five layouts of the table (shuffle.s, one byte per column) and the palettes of the cards and of the table (drawcards.s)
findOnce(DEAL_PATTERNS.flat(), 'the five layouts');
findOnce(CARD_PALETTES, 'the card palettes');
findOnce(GAME_PALETTE, 'the table palette');

console.log(`All Concentration Room data checks passed (${wanted.length} English lines, the 10-stage story table, ${SFX.length} sound effects, ${MUSIC_PATTERNS.length} music patterns, ${MUSIC_SONGS.length} conductors, the instrument table, the five layouts and the palettes found in the ROM).`);
