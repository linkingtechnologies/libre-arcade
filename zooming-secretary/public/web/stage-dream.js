/*
 * Zooming Secretary — Dream stage adapter
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * New Libre Arcade implementation code. Historical semantic stage data is
 * kept in ../data/stage-dream-data.js under the original CC BY grant; see
 * data/README.md.
 */
import { StageDefinition } from '../src/stage.js';
import { DREAM_ORACLE, makeDreamMap } from '../data/stage-dream-data.js';
export { DREAM_ORACLE, makeDreamMap } from '../data/stage-dream-data.js';

export function makeDreamStage(lang='en') {
  return new StageDefinition({
    name:lang==='it'?'Sogno':'Dream',
    map:makeDreamMap(),
    targetCalls:DREAM_ORACLE.targetCalls,
    topicsActive:DREAM_ORACLE.topicsActive,
    callDelay:DREAM_ORACLE.callDelay,
    missLimit:DREAM_ORACLE.missLimit,
    spawn:DREAM_ORACLE.spawn,
    phones:DREAM_ORACLE.phones,
    topics:[],
    coffee:null,
    npc:DREAM_ORACLE.npc,
    tables:DREAM_ORACLE.tables,
    bonus:true,
    sourceOrderedInit:true
  });
}
