/*
 * Zooming Secretary — Day3 stage adapter
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * New Libre Arcade implementation code. Historical semantic stage data is
 * kept in ../data/stage-day3-data.js under the original CC BY grant; see
 * data/README.md.
 */
import { StageDefinition } from '../src/stage.js';
import { DAY3_ORACLE, makeDay3Map } from '../data/stage-day3-data.js';
export { DAY3_ORACLE, makeDay3Map } from '../data/stage-day3-data.js';

export function makeDay3Stage(lang='en') {
  return new StageDefinition({
    name:lang==='it'?'Giorno 3':'Day 3',
    map:makeDay3Map(),
    targetCalls:DAY3_ORACLE.targetCalls,
    topicsActive:DAY3_ORACLE.topicsActive,
    callDelay:DAY3_ORACLE.callDelay,
    missLimit:DAY3_ORACLE.missLimit,
    spawn:DAY3_ORACLE.spawn,
    phones:DAY3_ORACLE.phones,
    topics:DAY3_ORACLE.topics,
    coffee:DAY3_ORACLE.coffee,
    npc:DAY3_ORACLE.npc,
    tables:[],
    bonus:false,
    sourceOrderedInit:true
  });
}
