/*
 * SPDX-License-Identifier: LicenseRef-Zooming-Secretary-CC-BY-Unspecified
 * Zooming Secretary — historical semantic stage data (Day6)
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

export const DAY6_ORACLE = Object.freeze({
  collisionSha256:'0b35b5cab87744bc99e7871af7d2245fdfde103a9f7056ebb490d7978c1eb185',
  spawn:Object.freeze({x:56,y:120,scanIndex:359}),
  phones:Object.freeze([
    Object.freeze({x:32, y:128,scanIndex:324,initDelay:0}),
    Object.freeze({x:216,y:128,scanIndex:347,initDelay:256}),
    Object.freeze({x:96, y:192,scanIndex:588,initDelay:512}),
    Object.freeze({x:152,y:192,scanIndex:595,initDelay:768})
  ]),
  topics:Object.freeze([
    Object.freeze({id:0,x:86, y:128,scanIndex:235}),
    Object.freeze({id:2,x:150,y:128,scanIndex:243}),
    Object.freeze({id:1,x:14, y:192,scanIndex:482}),
    Object.freeze({id:3,x:222,y:192,scanIndex:508})
  ]),
  coffee:Object.freeze({x:104,y:73,scanIndex:109}),
  npc:Object.freeze({type:'manbox',x:184,y:120,scanIndex:375}),
  targetCalls:35,
  topicsActive:4,
  callDelay:400,
  defaultMissLimit:3,
  expectedInit:Object.freeze({
    rng:125,
    callDelay:360,
    phoneCounters:Object.freeze([408,678,926,1163]),
    phoneTopics:Object.freeze([0,0,3,1]),
    // Binary-real cc65 factoid indices, in stage topic order
    // [Earth, Books, History, Space].
    messageIndices:Object.freeze([8,0,6,17]),
    npcDir:2
  })
});

function fill(map,row,from,to,tile) {
  for(let col=from; col<=to; col++) map.set(col,row,tile);
}

export function makeDay6Map() {
  const map=StageMap.empty();

  // Three ladder tails above the upper office area. The central tail reaches
  // the small upper platform; the side tails participate in vertical wrap.
  for(let row=0; row<=3; row++) {
    fill(map,row,5,6,TILE.LADDER);
    fill(map,row,16,17,TILE.LADDER);
    fill(map,row,25,26,TILE.LADDER);
  }

  // Upper edge platforms plus central descent.
  fill(map,4,0,6,TILE.WALL);
  fill(map,4,16,17,TILE.LADDER);
  fill(map,4,25,31,TILE.WALL);
  fill(map,5,10,21,TILE.WALL);

  // Middle office platform (support Y=144), with two descents.
  fill(map,12,0,7,TILE.WALL);
  fill(map,12,8,9,TILE.LADDER);
  fill(map,12,10,12,TILE.WALL);
  fill(map,12,19,21,TILE.WALL);
  fill(map,12,22,23,TILE.LADDER);
  fill(map,12,24,31,TILE.WALL);
  for(let row=13; row<=19; row++) {
    fill(map,row,8,9,TILE.LADDER);
    fill(map,row,22,23,TILE.LADDER);
  }

  // Lower platform and three wrap ladder tails.
  fill(map,20,0,4,TILE.WALL);
  fill(map,20,5,6,TILE.LADDER);
  fill(map,20,7,15,TILE.WALL);
  fill(map,20,16,17,TILE.LADDER);
  fill(map,20,18,24,TILE.WALL);
  fill(map,20,25,26,TILE.LADDER);
  fill(map,20,27,31,TILE.WALL);
  fill(map,21,5,6,TILE.LADDER);
  fill(map,21,16,17,TILE.LADDER);
  fill(map,21,25,26,TILE.LADDER);
  return map;
}
