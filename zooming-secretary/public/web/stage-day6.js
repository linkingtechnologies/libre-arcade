/*
 * Zooming Secretary — Day6 stage adapter
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * New Libre Arcade implementation code. Historical semantic stage data is
 * kept in ../data/stage-day6-data.js under the original CC BY grant; see
 * data/README.md.
 */
import { StageDefinition } from '../src/stage.js';
import { DAY6_ORACLE, makeDay6Map } from '../data/stage-day6-data.js';
export { DAY6_ORACLE, makeDay6Map } from '../data/stage-day6-data.js';

export function makeDay6Stage(lang='en', missLimit=DAY6_ORACLE.defaultMissLimit) {
  return new StageDefinition({
    name:lang==='it'?'Giorno 6':'Day 6',
    map:makeDay6Map(),
    targetCalls:DAY6_ORACLE.targetCalls,
    topicsActive:DAY6_ORACLE.topicsActive,
    callDelay:DAY6_ORACLE.callDelay,
    missLimit,
    spawn:DAY6_ORACLE.spawn,
    phones:DAY6_ORACLE.phones,
    topics:DAY6_ORACLE.topics,
    coffee:DAY6_ORACLE.coffee,
    npc:DAY6_ORACLE.npc,
    tables:[],
    bonus:false,
    sourceOrderedInit:true
  });
}
