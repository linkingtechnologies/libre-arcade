/*
 * SPDX-License-Identifier: LicenseRef-Zooming-Secretary-CC-BY-Unspecified
 * Zooming Secretary — historical semantic stage data (Day2)
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

export const DAY2_ORACLE = Object.freeze({
  collisionSha256:'81b5e842798c17735f3962ccab79789d9b2cba0fa230549aa9e2d01d97fab777',
  spawn:Object.freeze({x:16,y:120,scanIndex:354}),
  phones:Object.freeze([
    Object.freeze({x:192,y:64, scanIndex:88, initDelay:0}),
    Object.freeze({x:56, y:128,scanIndex:327,initDelay:256}),
    Object.freeze({x:192,y:128,scanIndex:344,initDelay:512})
  ]),
  topics:Object.freeze([
    Object.freeze({id:0,x:62, y:192,scanIndex:488}),
    Object.freeze({id:1,x:174,y:192,scanIndex:502})
  ]),
  coffee:Object.freeze({x:56,y:65,scanIndex:71}),
  npc:Object.freeze({type:'chief',x:224,y:120,scanIndex:380}),
  targetCalls:15,
  topicsActive:2,
  callDelay:250,
  missLimit:3,
  expectedInit:Object.freeze({
    rng:81,
    callDelay:220,
    phoneCounters:Object.freeze([252,504,774]),
    phoneTopics:Object.freeze([0,0,0]),
    messageIndices:Object.freeze([6,6])
  })
});

function fill(map,row,from,to,tile) {
  for(let col=from; col<=to; col++) map.set(col,row,tile);
}

export function makeDay2Map() {
  const map=StageMap.empty();

  // Upper platform (screen Y=80): two ladder openings.
  fill(map,4,0,9,TILE.WALL);
  fill(map,4,10,11,TILE.LADDER);
  fill(map,4,12,12,TILE.WALL);
  fill(map,4,19,19,TILE.WALL);
  fill(map,4,20,21,TILE.LADDER);
  fill(map,4,22,31,TILE.WALL);
  for(let row=5; row<=11; row++) {
    fill(map,row,10,11,TILE.LADDER);
    fill(map,row,20,21,TILE.LADDER);
  }

  // Middle platform (screen Y=144): three ladder openings to the lower floor.
  fill(map,12,0,2,TILE.WALL);
  fill(map,12,3,4,TILE.LADDER);
  fill(map,12,5,14,TILE.WALL);
  fill(map,12,15,16,TILE.LADDER);
  fill(map,12,17,26,TILE.WALL);
  fill(map,12,27,28,TILE.LADDER);
  fill(map,12,29,31,TILE.WALL);
  for(let row=13; row<=19; row++) {
    fill(map,row,3,4,TILE.LADDER);
    fill(map,row,15,16,TILE.LADDER);
    fill(map,row,27,28,TILE.LADDER);
  }

  // Lower office floor (screen Y=208).
  fill(map,20,0,31,TILE.WALL);
  return map;
}
