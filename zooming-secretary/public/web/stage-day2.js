/*
 * Zooming Secretary — Day2 stage adapter
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * New Libre Arcade implementation code. Historical semantic stage data is
 * kept in ../data/stage-day2-data.js under the original CC BY grant; see
 * data/README.md.
 */
import { StageDefinition } from '../src/stage.js';
import { DAY2_ORACLE, makeDay2Map } from '../data/stage-day2-data.js';
export { DAY2_ORACLE, makeDay2Map } from '../data/stage-day2-data.js';

export function makeDay2Stage(lang='en') {
  return new StageDefinition({
    name:lang==='it'?'Giorno 2':'Day 2',
    map:makeDay2Map(),
    targetCalls:DAY2_ORACLE.targetCalls,
    topicsActive:DAY2_ORACLE.topicsActive,
    callDelay:DAY2_ORACLE.callDelay,
    missLimit:DAY2_ORACLE.missLimit,
    spawn:DAY2_ORACLE.spawn,
    phones:DAY2_ORACLE.phones,
    topics:DAY2_ORACLE.topics,
    coffee:DAY2_ORACLE.coffee,
    npc:DAY2_ORACLE.npc,
    tables:[],
    bonus:false,
    sourceOrderedInit:true
  });
}
