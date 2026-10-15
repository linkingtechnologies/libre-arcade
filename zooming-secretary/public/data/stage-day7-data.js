/*
 * SPDX-License-Identifier: LicenseRef-Zooming-Secretary-CC-BY-Unspecified
 * Zooming Secretary — historical semantic stage data (Day7)
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

export const DAY7_ORACLE = Object.freeze({
  collisionSha256:'001540386831a1bea579ef090bcba039aecdec2314de09a54deef6149bfcc326',
  spawn:Object.freeze({x:112,y:120,scanIndex:366}),
  phones:Object.freeze([
    Object.freeze({x:64, y:64, scanIndex:72, initDelay:0}),
    Object.freeze({x:176,y:64, scanIndex:86, initDelay:256}),
    Object.freeze({x:24, y:192,scanIndex:579,initDelay:512}),
    Object.freeze({x:224,y:192,scanIndex:604,initDelay:768})
  ]),
  topics:Object.freeze([
    Object.freeze({id:0,x:70, y:128,scanIndex:233}),
    Object.freeze({id:2,x:166,y:128,scanIndex:245}),
    Object.freeze({id:1,x:70, y:192,scanIndex:489}),
    Object.freeze({id:3,x:166,y:192,scanIndex:501})
  ]),
  coffee:Object.freeze({x:136,y:193,scanIndex:593}),
  npc:Object.freeze({type:'dibrov',x:248,y:184,scanIndex:639}),
  targetCalls:40,
  topicsActive:4,
  callDelay:450,
  defaultMissLimit:3,
  expectedInit:Object.freeze({
    rng:125,
    callDelay:410,
    phoneCounters:Object.freeze([452,704,959,1199]),
    phoneTopics:Object.freeze([0,0,2,1]),
    // Binary-real cc65 factoid indices in stage topic order
    // [Earth, Books, History, Space].
    messageIndices:Object.freeze([2,0,8,3]),
    npcDir:1
  })
});

function fill(map,row,from,to,tile) {
  for(let col=from; col<=to; col++) map.set(col,row,tile);
}

export function makeDay7Map() {
  const map=StageMap.empty();

  // Central ladder tail above the upper office.
  for(let row=0; row<=3; row++) fill(map,row,13,14,TILE.LADDER);

  // Upper platform: three ladder openings.
  fill(map,4,0,2,TILE.WALL);
  fill(map,4,3,4,TILE.LADDER);
  fill(map,4,5,16,TILE.WALL);
  fill(map,4,17,18,TILE.LADDER);
  fill(map,4,19,26,TILE.WALL);
  fill(map,4,27,28,TILE.LADDER);
  fill(map,4,29,31,TILE.WALL);
  for(let row=5; row<=11; row++) {
    fill(map,row,3,4,TILE.LADDER);
    fill(map,row,17,18,TILE.LADDER);
    fill(map,row,27,28,TILE.LADDER);
  }

  // Middle office platform with two descents.
  fill(map,12,0,5,TILE.WALL);
  fill(map,12,6,7,TILE.LADDER);
  fill(map,12,8,23,TILE.WALL);
  fill(map,12,24,25,TILE.LADDER);
  fill(map,12,26,31,TILE.WALL);
  for(let row=13; row<=19; row++) {
    fill(map,row,6,7,TILE.LADDER);
    fill(map,row,24,25,TILE.LADDER);
  }

  // Lower platform and central wrap ladder tail.
  fill(map,20,0,12,TILE.WALL);
  fill(map,20,13,14,TILE.LADDER);
  fill(map,20,15,31,TILE.WALL);
  fill(map,21,13,14,TILE.LADDER);
  return map;
}
