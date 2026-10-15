/*
 * SPDX-License-Identifier: LicenseRef-Zooming-Secretary-CC-BY-Unspecified
 * Zooming Secretary — historical semantic stage data (Day1)
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

export const DAY1_ORACLE = Object.freeze({
  collisionSha256: '67cbe336548cd2b4f2928ace7afa86b1a9171f5fccb89fb09a874bb857cbf4b6',
  spawn: Object.freeze({ x:120, y:152, scanIndex:495 }),
  phones: Object.freeze([
    Object.freeze({ x:56,  y:96, scanIndex:199, initDelay:0 }),
    Object.freeze({ x:192, y:96, scanIndex:216, initDelay:256 })
  ]),
  topics: Object.freeze([
    Object.freeze({ id:0, x:46,  y:160, scanIndex:358 }),
    Object.freeze({ id:1, x:190, y:160, scanIndex:376 })
  ]),
  targetCalls:10,
  topicsActive:2,
  callDelay:250,
  missLimit:3,
  expectedInit:Object.freeze({
    rng:64,
    callDelay:230,
    phoneCounters:Object.freeze([252,504]),
    phoneTopics:Object.freeze([0,0]),
    messageIndices:Object.freeze([2,7])
  })
});

export function makeDay1Map() {
  const map = StageMap.empty();

  // Functional reconstruction of the v1.02 collision topology.
  // Lower office floor: full-width support at screen Y=176.
  for (let col=0; col<32; col++) map.set(col,16,TILE.WALL);

  // Upper platform: screen Y=112, spanning x=40..215. The ladder cells are
  // support too, exactly as NES tile attributes are used by the movement code.
  for (let col=5; col<=26; col++) map.set(col,8,TILE.WALL);

  // Two 16-pixel-wide ladder shafts connect lower and upper floors.
  for (const col of [10,11,20,21]) {
    for (let row=8; row<=15; row++) map.set(col,row,TILE.LADDER);
  }

  return map;
}
