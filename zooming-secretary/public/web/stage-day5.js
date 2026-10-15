/*
 * Zooming Secretary — Day5 stage adapter
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * New Libre Arcade implementation code. Historical semantic stage data is
 * kept in ../data/stage-day5-data.js under the original CC BY grant; see
 * data/README.md.
 */
import { StageDefinition } from '../src/stage.js';
import { DAY5_ORACLE, makeDay5Map } from '../data/stage-day5-data.js';
export { DAY5_ORACLE, makeDay5Map } from '../data/stage-day5-data.js';

export function makeDay5Stage(lang='en', missLimit=DAY5_ORACLE.defaultMissLimit) {
  return new StageDefinition({
    name:lang==='it'?'Giorno 5':'Day 5',
    map:makeDay5Map(),
    targetCalls:DAY5_ORACLE.targetCalls,
    topicsActive:DAY5_ORACLE.topicsActive,
    callDelay:DAY5_ORACLE.callDelay,
    missLimit,
    spawn:DAY5_ORACLE.spawn,
    phones:DAY5_ORACLE.phones,
    topics:DAY5_ORACLE.topics,
    coffee:DAY5_ORACLE.coffee,
    npc:DAY5_ORACLE.npc,
    tables:[],
    bonus:false,
    sourceOrderedInit:true
  });
}
