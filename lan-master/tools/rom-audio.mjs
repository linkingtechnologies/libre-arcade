// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// What the ROM does with the sound, watched from outside. The program reaches FamiTone through a handful of routines (update, music start,
// music stop, music pause, sound effect start, sample stop); the oracle hooks the first instruction of each, and
//   * records every call the ROM makes (with the tick of the page's clock it falls in, when the caller says what that is), and
//   * optionally makes the same call on the page's player (public/src/famitone.js, a port of FamiTone v1.24) at the same point of the same
//     frame, so that after every frame the player's output (the 11 bytes it would send to the sound chip) can be compared with the ROM's
//     (FT_OUT_BUF). That check is on the player, which is where the notes, the envelopes and the sound effects are. It needs the NTSC
//     console: on the PAL one the ROM runs FamiTone's PAL speed adjustment (every fifth frame is shorter), which the page's player does not have
//     since the page runs it at 60 updates a second, as the NTSC console does.
// The page's choice of what to play and when is checked in tools/lockstep.mjs, against the calls recorded here.

import { packageModules } from './package-modules.mjs';
import { loadSymbols } from './symbols.mjs';

const FT_OUT_BUF = 0x270;

// Attaches the hooks to `game` (a RomGame). `clock` (optional) says which tick of the page's clock a call falls in.
// Returns { engine, log, symbols }: the player (when `drive`), a record of the calls the ROM made, and the writes it made to the sound chip's sample registers.
export function watchAudio(game, romBytes, { drive = false, clock = null } = {}) {
  const symbols = loadSymbols(romBytes);
  const { LanMasterFamiTone: FT, LanMasterAudioData: AD } = packageModules();
  const engine = drive ? new FT.Engine(FT.b64(AD.prgB64), { sfxTable: AD.sfxTable, dpcmTable: AD.dpcmTable }) : null;
  const at = new Map([
    [symbols.FamiToneUpdate, 'update'], [symbols.FamiToneMusicStart, 'musicStart'], [symbols.FamiToneMusicStop, 'musicStop'],
    [symbols.FamiToneMusicPause, 'musicPause'], [symbols.FamiToneSfxStart, 'sfxStart'], [symbols.FamiToneSampleStop, 'sampleStop'],
  ]);
  const chan1 = symbols.FT_SFX_CH1;
  const log = { calls: [], updates: 0, samples: [], engineSamples: [] };
  const record = (call) => { log.calls.push({ frame: game.frames, tick: clock ? clock() : undefined, ...call }); };
  const previous = game.m.beforeStep;
  game.m.beforeStep = (cpu) => {
    if (previous) previous(cpu);
    const name = at.get(cpu.pc);
    if (!name) return;
    switch (name) {
      case 'update': {
        if (engine) { engine.update(); for (const id of engine.sampleEvents) { const info = engine.dpcmInfo(id); log.engineSamples.push({ frame: game.frames, start: info.startReg, length: info.lengthReg, pitch: info.pitchReg }); } }
        log.updates++; break;
      }
      case 'musicStart': { const addr = cpu.x | (cpu.y << 8); engine?.musicStart(addr); record({ name, addr }); break; }
      case 'musicStop': engine?.musicStop(); record({ name }); break;
      case 'musicPause': engine?.musicPause(cpu.a !== 0); record({ name, paused: cpu.a !== 0 }); break;
      case 'sfxStart': { const stream = cpu.x === chan1 ? 1 : 0; engine?.sfxStart(cpu.a, stream); record({ name, id: cpu.a, stream }); break; }
      case 'sampleStop': record({ name }); break;
      default: break;
    }
  };
  // a sample is started by writing the length to the DMC (a write to $4013 is followed by $4015 with bit 4)
  const hook = (address, value) => { if (address === 0x4012 || address === 0x4013 || address === 0x4010 || address === 0x4015) log.samples.push({ frame: game.frames, address, value }); };
  game.writes.push(hook);
  return { engine, log, symbols };
}

// The samples the ROM started, as (start, length, pitch) registers of the sound chip's sample channel in the frame of each: the writes to $4010, $4012
// and $4013 that are followed by the one to $4015 that turns the channel on.
export function romSamples(log) {
  const out = [];
  let pitch = null, start = null, length = null;
  for (const w of log.samples) {
    if (w.address === 0x4010) pitch = w.value;
    else if (w.address === 0x4012) start = w.value;
    else if (w.address === 0x4013) length = w.value;
    else if (w.address === 0x4015 && (w.value & 0x10) && start !== null && length !== null) { out.push({ frame: w.frame, start, length, pitch }); start = length = null; }
  }
  return out;
}

// kept for the older scripts
export const driveEngine = (game, romBytes, options = {}) => watchAudio(game, romBytes, { drive: true, ...options });

// The bytes the ROM has in its output buffer.
export const romOut = (game) => game.ram.slice(FT_OUT_BUF, FT_OUT_BUF + 11);
