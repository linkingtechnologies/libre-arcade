/*
 * SPDX-License-Identifier: LicenseRef-Zooming-Secretary-CC-BY-Unspecified
 * Zooming Secretary — historical semantic stage data (Day4)
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

export const DAY4_ORACLE = Object.freeze({
  collisionSha256:'2f475cb2a4c87ca8f0695a2fb9667b1e93eefaea6c1ed0dac9255bf6f775691f',
  spawn:Object.freeze({x:24,y:56,scanIndex:99}),
  phones:Object.freeze([
    Object.freeze({x:56, y:64,scanIndex:71,initDelay:0}),
    Object.freeze({x:192,y:64,scanIndex:88,initDelay:256})
  ]),
  topics:Object.freeze([
    Object.freeze({id:0,x:22, y:192,scanIndex:483}),
    Object.freeze({id:1,x:118,y:192,scanIndex:495}),
    Object.freeze({id:2,x:214,y:192,scanIndex:507})
  ]),
  coffee:Object.freeze({x:120,y:129,scanIndex:335}),
  npc:Object.freeze({type:'chatter',x:152,y:120,scanIndex:371}),
  targetCalls:25,
  topicsActive:3,
  callDelay:250,
  missLimit:3,
  expectedInit:Object.freeze({
    rng:207,
    callDelay:230,
    phoneCounters:Object.freeze([252,504]),
    phoneTopics:Object.freeze([1,1]),
    // Binary-real cc65 factoid modulo from M12.
    messageIndices:Object.freeze([7,8,3]),
    npcDir:0,
    npcCounter:20,
    npcWait:0
  })
});

function fill(map,row,from,to,tile) {
  for(let col=from; col<=to; col++) map.set(col,row,tile);
}

export function makeDay4Map() {
  const map=StageMap.empty();

  // Vertical wrap ladder tails above the upper platform.
  for(let row=0; row<=3; row++) {
    fill(map,row,10,11,TILE.LADDER);
    fill(map,row,20,21,TILE.LADDER);
  }

  // Upper office platform (screen Y=80), with two descents.
  fill(map,4,0,2,TILE.WALL);
  fill(map,4,3,4,TILE.LADDER);
  fill(map,4,5,12,TILE.WALL);
  fill(map,4,19,26,TILE.WALL);
  fill(map,4,27,28,TILE.LADDER);
  fill(map,4,29,31,TILE.WALL);
  for(let row=5; row<=11; row++) {
    fill(map,row,3,4,TILE.LADDER);
    fill(map,row,27,28,TILE.LADDER);
  }

  // Middle platform (screen Y=144), where coffee and Chatter live.
  fill(map,12,0,5,TILE.WALL);
  fill(map,12,6,7,TILE.LADDER);
  fill(map,12,8,23,TILE.WALL);
  fill(map,12,24,25,TILE.LADDER);
  fill(map,12,26,31,TILE.WALL);
  for(let row=13; row<=19; row++) {
    fill(map,row,6,7,TILE.LADDER);
    fill(map,row,24,25,TILE.LADDER);
  }

  // Lower platform plus ladder tails used by vertical wrap.
  fill(map,20,0,9,TILE.WALL);
  fill(map,20,10,11,TILE.LADDER);
  fill(map,20,12,19,TILE.WALL);
  fill(map,20,20,21,TILE.LADDER);
  fill(map,20,22,31,TILE.WALL);
  fill(map,21,10,11,TILE.LADDER);
  fill(map,21,20,21,TILE.LADDER);
  return map;
}
