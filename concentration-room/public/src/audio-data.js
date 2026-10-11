// Concentration Room 0.02 audio data transcribed from src/sound.s and
// src/musicseq.s. The data is intentionally kept in source-like form so the
// browser restoration can be checked byte-for-byte against the 2010 release.

export const AUDIO_NTSC = Object.freeze({
  framesPerMinute: 3606,
  fps: 3606 / 60,
  cpuHz: 39375000 / 22,
});

export const SOUND_ID = Object.freeze({
  FLIP: 0,
  PASS: 1,
  MISMATCH: 2,
  UNFLIP: 3,
  MATCH: 4,
  COMBO: 5,
  GARBAGE: 6,
  GAME_OVER_PULSE: 7,
  GAME_OVER_NOISE: 8,
  SNARE: 9,
  KICK: 10,
});

function pairs(bytes) {
  if (bytes.length % 2) throw new Error('SFX byte stream must contain pairs');
  const out = [];
  for (let i = 0; i < bytes.length; i += 2) out.push([bytes[i], bytes[i + 1]]);
  return out;
}

// channelByte mirrors psg_sound_table: low bits select APU channel and the
// high nibble is the sound-engine frame-rate divider.
export const SFX = Object.freeze([
  { name: 'turn', channelByte: 0, length: 6, data: pairs([0x4f,0x24, 0x44,0x24, 0x4f,0x29, 0x44,0x29, 0x4f,0x2e, 0x44,0x2e]) },
  { name: 'shift', channelByte: 0, length: 2, data: pairs([0x4f,0x30, 0x44,0x30]) },
  { name: 'land', channelByte: 0, length: 8, data: pairs([0x8f,0x13, 0x8d,0x0f, 0x8b,0x0c, 0x89,0x09, 0x87,0x07, 0x85,0x05, 0x83,0x03, 0x81,0x02]) },
  { name: 'lock', channelByte: 12, length: 2, data: pairs([0x06,0x03, 0x03,0x03]) },
  { name: 'line', channelByte: 0, length: 15, data: pairs([0x4f,0x27,0x4e,0x2a,0x4d,0x2c,0x4c,0x27,0x4b,0x29,0x4a,0x2c,0x89,0x27,0x88,0x2a,0x87,0x2c,0x86,0x27,0x85,0x29,0x84,0x2c,0x83,0x27,0x82,0x2a,0x81,0x2c]) },
  { name: 'homer', channelByte: 0, length: 25, data: pairs([0x4f,0x27,0x4e,0x2a,0x4d,0x2c,0x4c,0x27,0x4b,0x29,0x4a,0x2c,0x89,0x27,0x88,0x2a,0x87,0x2c,0x86,0x27,0x4f,0x2a,0x4e,0x2d,0x4d,0x2f,0x4c,0x2a,0x4b,0x2c,0x4a,0x2f,0x89,0x2a,0x88,0x2d,0x87,0x2f,0x86,0x2a,0x85,0x2c,0x84,0x2f,0x83,0x2a,0x82,0x2d,0x81,0x2f]) },
  { name: 'garbage', channelByte: 0, length: 6, data: pairs([0x4f,0x10,0x4d,0x13,0x4b,0x16,0x49,0x19,0x47,0x1c,0x45,0x1f]) },
  { name: 'die1', channelByte: 48, length: 17, data: pairs([0x0f,0x07,0x0f,0x07,0x0e,0x07,0x0d,0x07,0x0c,0x07,0x0b,0x07,0x0a,0x07,0x09,0x07,0x08,0x07,0x07,0x07,0x06,0x07,0x05,0x07,0x04,0x07,0x03,0x07,0x02,0x07,0x01,0x07,0x01,0x07]) },
  { name: 'die2', channelByte: 60, length: 17, data: pairs([0x0f,0x0c,0x0f,0x0d,0x0e,0x0e,0x0d,0x0e,0x0c,0x0e,0x0b,0x0e,0x0a,0x0e,0x09,0x0e,0x08,0x0e,0x07,0x0e,0x06,0x0e,0x05,0x0e,0x04,0x0e,0x03,0x0e,0x02,0x0e,0x01,0x0e,0x01,0x0e]) },
  { name: 'snare', channelByte: 12, length: 8, data: pairs([0x0a,0x04,0x08,0x04,0x06,0x04,0x05,0x04,0x04,0x04,0x03,0x04,0x02,0x04,0x01,0x04]) },
  { name: 'kick', channelByte: 12, length: 8, data: pairs([0x08,0x04,0x08,0x0d,0x06,0x0e,0x05,0x0e,0x04,0x0e,0x03,0x0e,0x02,0x0e,0x01,0x0e]) },
]);

export function expandSfx(id) {
  const sfx = SFX[id];
  if (!sfx) throw new RangeError(`Unknown Concentration Room SFX ${id}`);
  const rate = sfx.channelByte >>> 4;
  const channel = sfx.channelByte & 0x0c;
  const framesPerStep = rate + 1;
  return sfx.data.slice(0, sfx.length).map(([control, pitch], i) => ({
    frame: i * framesPerStep,
    frames: framesPerStep,
    channel,
    control,
    pitch,
  }));
}

export function sfxDurationFrames(id) {
  const sfx = SFX[id];
  return sfx.length * ((sfx.channelByte >>> 4) + 1);
}

// Reproduce tools/mktables.py for NTSC. The table rounds the divider before
// the APU converts it back to frequency, so this is more faithful than using
// equal-temperament frequency directly.
export function pitchPeriod(pitch) {
  const octaveBase = 39375000 / (22 * 16 * 55);
  return Math.round(octaveBase / (2 ** (pitch / 12))) - 1;
}

export function pitchHz(pitch) {
  const period = pitchPeriod(pitch);
  return AUDIO_NTSC.cpuHz / (16 * (period + 1));
}

export const MUSIC_ID = Object.freeze({ INTRO: 0, CLEARED: 1 });

const D = Object.freeze({ EIGHTH:1, DOTTED_EIGHTH:2, QUARTER:3, DOTTED_QUARTER:4, HALF:5, DOTTED_HALF:6, WHOLE:7 });
const REST = 26 * 8;
const TIE = 25 * 8;
const N = (pitch, duration = 0) => pitch * 8 + duration;

export const MUSIC_DURATIONS = Object.freeze([1,2,3,4,6,8,12,16]);

export const MUSIC_PATTERNS = Object.freeze([
  // intro_sq1
  [REST, N(10), N(15,D.QUARTER), REST, N(8), N(13,D.QUARTER), REST, N(6), N(10,D.QUARTER), TIE|D.DOTTED_QUARTER, 255],
  // intro_sq2
  [N(18,D.DOTTED_QUARTER), N(17,D.DOTTED_QUARTER), N(15,D.DOTTED_HALF), 255],
  // intro_bass
  [N(15,D.DOTTED_QUARTER), N(13,D.DOTTED_QUARTER), N(11,D.DOTTED_HALF), N(15,D.DOTTED_QUARTER), N(13,D.DOTTED_QUARTER), N(6,D.DOTTED_QUARTER), N(8,D.DOTTED_QUARTER), 255],
  // cleared_sq2
  [N(7),N(9),N(7),N(5),N(4),N(2),N(0),N(4),N(7),N(12,D.DOTTED_EIGHTH),255],
  // cleared_bass
  [N(12,D.EIGHTH),REST,N(7,D.EIGHTH),REST,N(4,D.EIGHTH),REST,N(0,D.EIGHTH),REST,255],
]);

export const MUSIC_INSTRUMENTS = Object.freeze([
  { initial:0x88, decay:0, attr:0, name:'intro-bass' },
  { initial:0x48, decay:2, attr:0, name:'intro-piano' },
]);

// Conductor commands are a literal semantic transcription of musicseq.s.
export const MUSIC_SONGS = Object.freeze([
  [
    {op:'segno'}, {op:'tempo', value:220},
    {op:'play', channel:2, pattern:2, transpose:15, instrument:0},
    {op:'play', channel:0, pattern:0, transpose:15, instrument:1},
    {op:'wait', rows:1},
    {op:'play', channel:1, pattern:1, transpose:15, instrument:1},
    {op:'wait', rows:45}, {op:'dalsegno'},
  ],
  [
    {op:'tempo', value:360},
    {op:'play', channel:2, pattern:4, transpose:24, instrument:0},
    {op:'play', channel:1, pattern:3, transpose:24, instrument:1},
    {op:'play', channel:0, pattern:4, transpose:0, instrument:1},
    {op:'wait', rows:11}, {op:'fine'},
  ],
]);
