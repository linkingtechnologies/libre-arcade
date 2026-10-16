// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// The addresses of the program's labels, from its own source. The source in reference/source/ is assembled by tools/assemble.mjs, and the
// bytes that come out are checked against the ROM that the oracle runs: they are the same file, bit for bit (see PROVENANCE.md), so the labels
// say where things are in that ROM. If they were not the same the oracle would stop, since the addresses could not be trusted.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assembleSource } from './assemble.mjs';

const SOURCE = join(dirname(fileURLToPath(import.meta.url)), '..', 'reference', 'source');

let cached = null;

export function loadSymbols(rom) {
  if (cached) return cached;
  const { rom: assembled, assembler } = assembleSource(SOURCE);
  if (assembled.length !== rom.length || assembled.some((b, i) => b !== rom[i])) {
    throw new Error('the source in reference/source does not assemble to the ROM that was given: the labels cannot be trusted');
  }
  cached = assembler.labels();
  return cached;
}
