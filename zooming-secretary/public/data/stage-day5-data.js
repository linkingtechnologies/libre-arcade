/*
 * SPDX-License-Identifier: LicenseRef-Zooming-Secretary-CC-BY-Unspecified
 * Zooming Secretary — historical semantic stage data (Day5)
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

export const DAY5_ORACLE = Object.freeze({
  collisionSha256:'2a0f5e2a1d2a6bc066cd9fb6b842c282ddb0f78018cf85c8093acf6e6d890dfd',
  spawn:Object.freeze({x:24,y:120,scanIndex:355}),
  phones:Object.freeze([
    Object.freeze({x:80, y:128,scanIndex:330,initDelay:0}),
    Object.freeze({x:168,y:128,scanIndex:341,initDelay:256}),
    Object.freeze({x:160,y:192,scanIndex:596,initDelay:512})
  ]),
  topics:Object.freeze([
    Object.freeze({id:1,x:46, y:80, scanIndex:38}),
    Object.freeze({id:3,x:190,y:80, scanIndex:56}),
    Object.freeze({id:0,x:14, y:192,scanIndex:482}),
    Object.freeze({id:2,x:222,y:192,scanIndex:508})
  ]),
  coffee:Object.freeze({x:88,y:193,scanIndex:587}),
  npc:Object.freeze({type:'geek',x:216,y:120,scanIndex:379}),
  targetCalls:30,
  topicsActive:4,
  callDelay:275,
  defaultMissLimit:3,
  expectedInit:Object.freeze({
    rng:139,
    callDelay:245,
    phoneCounters:Object.freeze([283,553,801]),
    phoneTopics:Object.freeze([0,0,3]),
    // Binary-real cc65 factoid indices, expressed in stage topic order
    // [History, Space, Earth, Books].
    messageIndices:Object.freeze([8,0,6,7]),
    npcDir:2
  })
});

function fill(map,row,from,to,tile) {
  for(let col=from; col<=to; col++) map.set(col,row,tile);
}

export function makeDay5Map() {
  const map=StageMap.empty();

  // Central ladder tail above the upper office platform. Together with the
  // matching lower tail it implements the original vertical wrap route.
  for(let row=0; row<=5; row++) fill(map,row,15,16,TILE.LADDER);

  // Upper platform (screen support Y=96 / player Y≈72).
  fill(map,6,5,26,TILE.WALL);

  // Middle platform (support Y=144) with two ladders to the lower floor.
  fill(map,12,0,5,TILE.WALL);
  fill(map,12,6,7,TILE.LADDER);
  fill(map,12,8,23,TILE.WALL);
  fill(map,12,24,25,TILE.LADDER);
  fill(map,12,26,31,TILE.WALL);
  for(let row=13; row<=19; row++) {
    fill(map,row,6,7,TILE.LADDER);
    fill(map,row,24,25,TILE.LADDER);
  }

  // Lower floor and central ladder tail used to wrap back to the upper floor.
  fill(map,20,0,14,TILE.WALL);
  fill(map,20,15,16,TILE.LADDER);
  fill(map,20,17,31,TILE.WALL);
  fill(map,21,15,16,TILE.LADDER);
  return map;
}
