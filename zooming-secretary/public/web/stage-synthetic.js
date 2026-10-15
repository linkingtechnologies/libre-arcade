/* SPDX-License-Identifier: GPL-3.0-or-later */
import { StageDefinition } from '../src/stage.js';
import { makeSyntheticOfficeMap } from '../src/map.js';

export function makeTrainingStage(lang = 'en') {
  return new StageDefinition({
    name: lang === 'it' ? 'Ufficio prova' : 'Training office',
    map: makeSyntheticOfficeMap(),
    targetCalls: 2,
    topicsActive: 2,
    callDelay: 125,
    missLimit: 3,
    spawn: { x: 104, y: 80 },
    phones: [
      { x: 24, y: 96 },
      { x: 220, y: 160 }
    ],
    topics: [
      { id: 0, x: 76, y: 80, messageIndex: 0 },
      { id: 1, x: 164, y: 144, messageIndex: 0 }
    ],
    coffee: { x: 128, y: 145 },
    npc: { type: 'chief', x: 152, y: 80 },
    tables: [],
    bonus: false,
    sourceOrderedInit: false
  });
}
