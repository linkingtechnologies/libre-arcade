// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// The page's modules (public/src) are plain scripts that put themselves on `globalThis` (and on `module.exports` when there is one). Node
// would read them as ES modules, because the folder's package.json says "type": "module", and they would export nothing, so the tools
// run them in a `vm` context, the way a page runs them, and take what they put there.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'src');
const ORDER = ['levels.js', 'core.js', 'nes-assets.js', 'nes-gfx.js', 'transitions.js', 'audio-data.js', 'famitone.js', 'nes-audio.js'];

let cached = null;

// { LanMasterCore, LanMasterNESAssets, LanMasterNESGfx, LanMasterTransitions, LanMasterFamiTone, LanMasterNESAudio, LanMasterAudioData,
//   LAN_MASTER_LEVELS, LAN_MASTER_PASSWORDS, LAN_MASTER_ENDING_CODE }
export function packageModules() {
  if (cached) return cached;
  const context = { console, atob: (s) => Buffer.from(s, 'base64').toString('binary') };
  context.globalThis = context;
  vm.createContext(context);
  for (const file of ORDER) vm.runInContext(readFileSync(join(SRC, file), 'utf8'), context, { filename: file });
  cached = context;
  return cached;
}
