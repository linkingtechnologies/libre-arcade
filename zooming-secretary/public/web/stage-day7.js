/*
 * Zooming Secretary — Day7 stage adapter
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * New Libre Arcade implementation code. Historical semantic stage data is
 * kept in ../data/stage-day7-data.js under the original CC BY grant; see
 * data/README.md.
 */
import { StageDefinition } from '../src/stage.js';
import { DAY7_ORACLE, makeDay7Map } from '../data/stage-day7-data.js';
export { DAY7_ORACLE, makeDay7Map } from '../data/stage-day7-data.js';

export function makeDay7Stage(lang='en', missLimit=DAY7_ORACLE.defaultMissLimit) {
  return new StageDefinition({
    name:lang==='it'?'Giorno 7':'Day 7',
    map:makeDay7Map(),
    targetCalls:DAY7_ORACLE.targetCalls,
    topicsActive:DAY7_ORACLE.topicsActive,
    callDelay:DAY7_ORACLE.callDelay,
    missLimit,
    spawn:DAY7_ORACLE.spawn,
    phones:DAY7_ORACLE.phones,
    topics:DAY7_ORACLE.topics,
    coffee:DAY7_ORACLE.coffee,
    npc:DAY7_ORACLE.npc,
    tables:[],
    bonus:false,
    sourceOrderedInit:true
  });
}
