/*
 * SPDX-License-Identifier: LicenseRef-Zooming-Secretary-CC-BY-Unspecified
 * Zooming Secretary — historical semantic stage data (Dream)
 *
 * LICENSE BOUNDARY (M25 preservation route):
 * The functional topology, object coordinates and historical gameplay constants
 * in this file are derived from the 2011 Zooming Secretary release and are
 * redistributed under that release's original Creative Commons Attribution
 * grant ("CC BY"; exact version was not specified by the historical package).
 * They are NOT relicensed under GPL. See data/README.md and THIRD_PARTY_NOTICES.md.
 *
 * This file contains no original NES nametable bytes, CHR graphics, music,
 * prose fact messages, manual/label art or historical C/assembly source.
 */
import { StageMap, TILE } from '../src/map.js';

export const DREAM_ORACLE = Object.freeze({
  collisionSha256:'cebe42ab657f4ff557a3f2a27cc6d8988f138c42fcee3253100e1c5155a3a5f0',
  spawn:Object.freeze({x:120,y:120,scanIndex:367}),
  // The Dream phone is created after the row-major map scan. scanIndex=9999 is
  // a local ordering sentinel, not a historical tile coordinate.
  phones:Object.freeze([
    Object.freeze({x:176,y:192,scanIndex:9999,initDelay:25})
  ]),
  tables:Object.freeze([
    Object.freeze({x:72, y:64, scanIndex:73}),
    Object.freeze({x:176,y:64, scanIndex:86}),
    Object.freeze({x:72, y:128,scanIndex:329}),
    Object.freeze({x:176,y:128,scanIndex:342}),
    Object.freeze({x:72, y:192,scanIndex:585}),
    Object.freeze({x:176,y:192,scanIndex:598})
  ]),
  npc:Object.freeze({type:'ghost',x:16,y:240,scanIndex:256}),
  targetCalls:1,
  topicsActive:0,
  callDelay:0,
  missLimit:3,
  expectedInit:Object.freeze({
    rng:8,
    callDelay:0,
    phoneCounters:Object.freeze([29]),
    phoneTopics:Object.freeze([null]),
    phoneLevel:0,
    tableCurrent:5,
    phoneRunaway:5,
    phoneRunawayMax:5,
    ghost:Object.freeze({x:16,y:240,counter:50,wait:150,dx:0,dy:0,dir:1})
  })
});

function fill(map,row,from,to,tile) {
  for(let col=from; col<=to; col++) map.set(col,row,tile);
}

export function makeDreamMap() {
  const map=StageMap.empty();

  // Upper platform at screen Y=80 with two ladder shafts.
  fill(map,4,8,11,TILE.WALL);
  fill(map,4,12,13,TILE.LADDER);
  fill(map,4,14,17,TILE.WALL);
  fill(map,4,18,19,TILE.LADDER);
  fill(map,4,20,23,TILE.WALL);
  for(let row=5; row<=11; row++) {
    fill(map,row,12,13,TILE.LADDER);
    fill(map,row,18,19,TILE.LADDER);
  }

  // Middle platform at screen Y=144, reached from the outer ladder shafts.
  fill(map,12,4,5,TILE.LADDER);
  fill(map,12,6,25,TILE.WALL);
  fill(map,12,26,27,TILE.LADDER);
  for(let row=13; row<=19; row++) {
    fill(map,row,4,5,TILE.LADDER);
    fill(map,row,26,27,TILE.LADDER);
  }

  // Full lower floor at screen Y=208. The six tables are interaction markers,
  // not collision tiles, so they are intentionally absent from this map.
  fill(map,20,0,31,TILE.WALL);
  return map;
}
