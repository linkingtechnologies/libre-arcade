/*
 * SPDX-License-Identifier: LicenseRef-Zooming-Secretary-CC-BY-Unspecified
 * Zooming Secretary — historical semantic stage data (Day3)
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

export const DAY3_ORACLE = Object.freeze({
  collisionSha256:'846def0c8a5bfc2d6a67579351d5d50b3645b2b78e632da374d770124286ea87',
  spawn:Object.freeze({x:40,y:56,scanIndex:101}),
  phones:Object.freeze([
    Object.freeze({x:120,y:128,scanIndex:335,initDelay:0}),
    Object.freeze({x:32, y:192,scanIndex:580,initDelay:256}),
    Object.freeze({x:216,y:192,scanIndex:603,initDelay:512})
  ]),
  topics:Object.freeze([
    Object.freeze({id:0,x:38, y:128,scanIndex:229}),
    Object.freeze({id:1,x:198,y:128,scanIndex:249}),
    Object.freeze({id:2,x:118,y:192,scanIndex:495})
  ]),
  coffee:Object.freeze({x:120,y:65,scanIndex:79}),
  npc:Object.freeze({type:'bouncer',x:200,y:56,scanIndex:121}),
  targetCalls:20,
  topicsActive:3,
  callDelay:250,
  missLimit:3,
  expectedInit:Object.freeze({
    rng:162,
    callDelay:220,
    phoneCounters:Object.freeze([266,496,759]),
    phoneTopics:Object.freeze([2,0,0]),
    // Binary-real cc65 factoid modulo from M12, not the idealized C result.
    messageIndices:Object.freeze([1,5,0]),
    npcDir:1
  })
});

function fill(map,row,from,to,tile) {
  for(let col=from; col<=to; col++) map.set(col,row,tile);
}

export function makeDay3Map() {
  const map=StageMap.empty();

  // Upper platform (screen Y=80), with two 16px ladder openings.
  fill(map,4,0,1,TILE.WALL);
  fill(map,4,2,3,TILE.LADDER);
  fill(map,4,4,27,TILE.WALL);
  fill(map,4,28,29,TILE.LADDER);
  fill(map,4,30,31,TILE.WALL);
  for(let row=5; row<=11; row++) {
    fill(map,row,2,3,TILE.LADDER);
    fill(map,row,28,29,TILE.LADDER);
  }

  // Middle platform (screen Y=144), two descents to the lower office.
  fill(map,12,0,7,TILE.WALL);
  fill(map,12,8,9,TILE.LADDER);
  fill(map,12,10,21,TILE.WALL);
  fill(map,12,22,23,TILE.LADDER);
  fill(map,12,24,31,TILE.WALL);
  for(let row=13; row<=19; row++) {
    fill(map,row,8,9,TILE.LADDER);
    fill(map,row,22,23,TILE.LADDER);
  }

  // Lower office floor (screen Y=208).
  fill(map,20,0,31,TILE.WALL);
  return map;
}
