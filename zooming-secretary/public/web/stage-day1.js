/*
 * Zooming Secretary — Day1 stage adapter
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * New Libre Arcade implementation code. Historical semantic stage data is
 * kept in ../data/stage-day1-data.js under the original CC BY grant; see
 * data/README.md.
 */
import { StageDefinition } from '../src/stage.js';
import { DAY1_ORACLE, makeDay1Map } from '../data/stage-day1-data.js';
export { DAY1_ORACLE, makeDay1Map } from '../data/stage-day1-data.js';

export function makeDay1Stage(lang='en') {
  return new StageDefinition({
    name: lang === 'it' ? 'Giorno 1' : 'Day 1',
    map: makeDay1Map(),
    targetCalls: DAY1_ORACLE.targetCalls,
    topicsActive: DAY1_ORACLE.topicsActive,
    callDelay: DAY1_ORACLE.callDelay,
    missLimit: DAY1_ORACLE.missLimit,
    spawn: DAY1_ORACLE.spawn,
    phones: DAY1_ORACLE.phones,
    topics: DAY1_ORACLE.topics,
    coffee:null,
    npc:null,
    tables:[],
    bonus:false,
    sourceOrderedInit:true
  });
}
