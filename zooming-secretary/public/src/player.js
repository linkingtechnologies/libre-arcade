/* SPDX-License-Identifier: GPL-3.0-or-later */
import { BUTTON } from './input.js';
import { FP_BITS, FP_ONE } from './movement.js';
import { DIR } from './npc.js';

export function makePlayer(x = 0, y = 0) {
  return {
    xFp: x << FP_BITS,
    yFp: y << FP_BITS,
    ladder: false,
    dir: DIR.NONE,
    dirPrev: DIR.RIGHT,
    dirCountFp: 0,
    onFloor: true,
    topic: 255,
    speedFp: 1 << FP_BITS,
    speedTargetFp: 1 << FP_BITS,
    coffee: 0,
    slowdown: false,
    knocked: 0,
    knockedAnim: 0,
    wisdom: 0,
    caught: false,
    answerTicks: 0,
    stepAnim: 0
  };
}

function wrapPlayerX(player) {
  if (player.xFp < 0) player.xFp = (256 - 16) << FP_BITS;
  if (player.xFp > ((256 - 16) << FP_BITS)) player.xFp = 0;
}

function wrapLadderY(player) {
  // This wrap is part of the behavioral oracle. It is kept in one explicit place
  // so later ROM shadow-runs can tune the exact source-order boundary if needed.
  if (player.yFp < (32 << FP_BITS)) player.yFp += 160 << FP_BITS;
  if (player.yFp > (192 << FP_BITS)) player.yFp -= 160 << FP_BITS;
}

export function alignToLadder(player, map, footY) {
  let guard = 64;
  while (!map.isLadderAt((player.xFp >> FP_BITS) + 3, footY) && guard-- > 0) {
    player.xFp += FP_ONE;
  }
  guard = 64;
  while (!map.isLadderAt((player.xFp >> FP_BITS) + 12, footY) && guard-- > 0) {
    player.xFp -= FP_ONE;
  }
  player.ladder = true;
  player.dirCountFp = 16 << FP_BITS;
}

export function tickPlayerMotion(player, map, input, events = []) {
  let px = player.xFp >> FP_BITS;
  let py = player.yFp >> FP_BITS;

  if (player.knocked) {
    player.knocked--;
    if (player.knockedAnim) player.knockedAnim--;
    return events;
  }

  // Original fall test samples two points at the feet. Any non-zero map attribute,
  // including a ladder, counts as support in this test.
  if (!map.isSupportAt(px + 4, py + 24) && !map.isSupportAt(px + 12, py + 24)) {
    player.yFp += 4 << FP_BITS;
    player.ladder = false;
    if (player.onFloor) events.push({ type: 'FALL_START' });
    player.onFloor = false;
    return events;
  }

  if (!player.onFloor) events.push({ type: 'LAND' });
  player.onFloor = true;

  if (player.dirCountFp) {
    if (player.dir === DIR.UP) {
      player.yFp -= player.speedFp;
      wrapLadderY(player);
      py = player.yFp >> FP_BITS;
      px = player.xFp >> FP_BITS;
      if (!map.isLadderAt(px + 8, py + 23)) {
        player.dirCountFp = 0;
        player.ladder = false;
        player.yFp &= ~(7 << FP_BITS);
        if (!map.isLadderAt(px + 8, py + 24)) player.yFp += 8 << FP_BITS;
      }
    } else if (player.dir === DIR.DOWN) {
      player.yFp += player.speedFp;
      wrapLadderY(player);
      py = player.yFp >> FP_BITS;
      px = player.xFp >> FP_BITS;
      if (!map.isLadderAt(px + 8, py + 24)) {
        player.dirCountFp = 0;
        player.ladder = false;
        player.yFp &= ~(7 << FP_BITS);
      }
    }

    if (player.dirCountFp) {
      player.dirCountFp -= player.speedFp;
      if (player.dirCountFp < 0 || player.dirCountFp >= 32767) player.dirCountFp = 0;
    }
  }

  // The source does not stop after a climbing step: when the 16-pixel segment has just run out it looks for a new one in the same
  // iteration, and it only touches player_ladder when a direction is pressed without a ladder to take (a player standing on a ladder
  // keeps player_ladder set and cannot walk sideways).
  if (!player.dirCountFp) {
    px = player.xFp >> FP_BITS;
    const footY = (player.yFp >> FP_BITS) + 23;
    const up = input.down(BUTTON.UP) && !input.down(BUTTON.DOWN);
    const down = input.down(BUTTON.DOWN) && !input.down(BUTTON.UP);

    if (up) {
      if (map.isLadderAt(px + 6, footY) && map.isLadderAt(px + 9, footY)) {
        alignToLadder(player, map, footY);
        player.dir = DIR.UP;
      } else {
        player.ladder = false;
      }
    }
    // The source increments py once before the DOWN test: descending samples
    // y+24, while climbing UP samples y+23. This one-pixel asymmetry matters.
    if (down) {
      if (map.isLadderAt(px + 6, footY + 1) && map.isLadderAt(px + 9, footY + 1)) {
        alignToLadder(player, map, footY + 1);
        player.dir = DIR.DOWN;
      } else {
        player.ladder = false;
      }
    }
  }

  if (player.ladder) return events;

  // Source uses independent LEFT/RIGHT tests; holding both results in a near-net-zero move.
  if (input.down(BUTTON.LEFT)) {
    player.dir = DIR.LEFT;
    player.dirPrev = DIR.LEFT;
    player.xFp -= player.speedFp;
    wrapPlayerX(player);
    player.stepAnim++;
  }
  if (input.down(BUTTON.RIGHT)) {
    player.dir = DIR.RIGHT;
    player.dirPrev = DIR.RIGHT;
    player.xFp += player.speedFp;
    wrapPlayerX(player);
    player.stepAnim++;
  }

  return events;
}

export function updatePlayerSpeed(player, frameCnt) {
  let target = (1 << FP_BITS) + ((1 << FP_BITS) >> 1) + (player.coffee >> 1);
  if (player.slowdown) target = Math.trunc(target * 4 / 6);
  player.speedTargetFp = target;

  // Source computes target before coffee decay.
  if ((frameCnt & 63) === 0 && player.coffee) player.coffee--;

  if (player.speedFp < target) player.speedFp++;
  if (player.speedFp > target) player.speedFp--;
}
