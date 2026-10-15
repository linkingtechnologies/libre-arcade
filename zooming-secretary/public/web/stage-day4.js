/*
 * Zooming Secretary — Day4 stage adapter
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * New Libre Arcade implementation code. Historical semantic stage data is
 * kept in ../data/stage-day4-data.js under the original CC BY grant; see
 * data/README.md.
 */
import { StageDefinition } from '../src/stage.js';
import { DAY4_ORACLE, makeDay4Map } from '../data/stage-day4-data.js';
export { DAY4_ORACLE, makeDay4Map } from '../data/stage-day4-data.js';

export function makeDay4Stage(lang='en') {
  return new StageDefinition({
    name:lang==='it'?'Giorno 4':'Day 4',
    map:makeDay4Map(),
    targetCalls:DAY4_ORACLE.targetCalls,
    topicsActive:DAY4_ORACLE.topicsActive,
    callDelay:DAY4_ORACLE.callDelay,
    missLimit:DAY4_ORACLE.missLimit,
    spawn:DAY4_ORACLE.spawn,
    phones:DAY4_ORACLE.phones,
    topics:DAY4_ORACLE.topics,
    coffee:DAY4_ORACLE.coffee,
    npc:DAY4_ORACLE.npc,
    tables:[],
    bonus:false,
    sourceOrderedInit:true
  });
}
