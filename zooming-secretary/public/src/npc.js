/*
 * Zooming Secretary M9 reference-run harness
 * Copyright (C) 2026 Libre Arcade contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const DIR = Object.freeze({ NONE: 0, LEFT: 1, RIGHT: 2, UP: 4, DOWN: 8 });

export function chiefRandomDelay(rng) {
  return 64 + (rng.rand8() & 31);
}

export function tickBouncer(npc, frameCnt) {
  if (frameCnt & 3) return npc;
  if (npc.dir === DIR.LEFT) {
    npc.x--;
    if (npc.x < 9) npc.dir = DIR.RIGHT;
  } else if (npc.dir === DIR.RIGHT) {
    npc.x++;
    if (npc.x > 231) npc.dir = DIR.LEFT; // 256-16-9
  }
  return npc;
}

export function chatterContact({ npc, player, rng, topicsActive }) {
  if (npc.wait) return false;
  const sameFloor = player.y === npc.y;
  const close = !((npc.x - 16) >= (player.x + 16) || (npc.x + 32) < player.x);
  if (!sameFloor || !close) return false;

  player.topic = rng.rand8() % topicsActive;
  npc.dir = DIR.NONE;
  npc.wait = 100;
  npc.counter = 50;
  return true;
}

export function tickChatterInteraction(npc) {
  if (!npc.wait) return "FREE";
  if (npc.counter) {
    npc.counter--;
    return "TALK";
  }
  npc.wait--;
  return "COOLDOWN";
}

export function manBoxContact({ npc, player }) {
  if (player.y !== npc.y) return false;
  // The source copies the NPC's position into an unsigned char (px=npc_x), so an NPC that is partly off the left edge (x from -8 to -1)
  // is at 248 to 255 for this test.
  const nx = npc.x & 0xff;
  const overlap = !((player.x + 12) < nx || player.x >= (nx + 12));
  if (!overlap) return false;

  if (!player.knocked) {
    player.knocked = 48;
    player.knockedAnim = 8;
    npc.dir = npc.dir === DIR.LEFT ? DIR.RIGHT : DIR.LEFT;
  } else {
    // Original quirk: sustained overlap extends knock time.
    player.knocked++;
  }
  return true;
}

export function dibrovContact({ npc, player }) {
  if (player.y !== npc.y) return false;
  const nx = npc.x & 0xff; // unsigned char in the source, as for ManBox
  const overlap = !((player.x + 12) < nx || player.x >= (nx + 12));
  if (!overlap) return false;

  if (!player.wisdom) player.wisdom = 500;
  npc.speed = 2;
  npc.dir = player.x < npc.x ? DIR.RIGHT : DIR.LEFT; // moves away from player
  return true;
}

export function tickGhost(npc, player) {
  if (npc.wait) {
    npc.wait--;
    return { caught: false };
  }

  npc.counter++;
  if (npc.counter >= 100) npc.counter = 0;

  const caught = !(
    npc.xFp + (16 << 4) < player.xFp ||
    npc.xFp + (8 << 4) >= player.xFp + (16 << 4) ||
    npc.yFp + (16 << 4) < player.yFp ||
    npc.yFp + (8 << 4) >= player.yFp + (24 << 4)
  );

  if (caught) {
    npc.wait = 255;
    return { caught: true };
  }

  if (player.xFp < npc.xFp) {
    if (npc.yFp < (240 << 4) && npc.dx > -16) npc.dx--;
  } else {
    if (npc.yFp < (240 << 4) && npc.dx < 16) npc.dx++;
  }

  if (player.yFp < npc.yFp) {
    if (npc.dy > -12) npc.dy--;
  } else {
    if (npc.dy < 12) npc.dy++;
  }

  npc.xFp += npc.dx;
  npc.yFp += npc.dy;
  return { caught: false };
}
