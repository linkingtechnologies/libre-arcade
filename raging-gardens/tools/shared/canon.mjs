// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// The one place that decides what "the same game state" means when the
// original (read through Crafty) and the port are compared frame by frame.
// Both sides first reduce themselves to the plain object described below,
// and this turns it into a string. Entities are identified by a serial number
// (creation order within their class) instead of Crafty's entity id, because
// the original also spends ids on tiles, bars and animations that the port
// does not need to create; only the order matters, and a serial preserves it.

// snapshot = {
//   f: frames played, score: carrots held, pullID: serial of the carrot the player stands on (0 = none),
//   px, py, canPull, digObj (serial or 0), action1 (0 none, 1 down, 2 up),
//   maxCarrots, fork (0/1),
//   carrots: [{s, x, y, h, o, u}],                      // serial, position, health, occupied, pulled
//   enemies: [{s, x, y, tx, ty, os, pp, pl, cp, ds, pu, pf}],  // serial, position, target x/y, target carrot serial,
//                                                       // path position, path length, canPull, carrot being pulled, pushed, pushed-at frame
//   sounds: ["pull", ...]                               // sounds triggered during this frame (family names)
// }
export function canonical(s) {
  return JSON.stringify([
    s.f, s.score, s.pullID, s.px, s.py, s.canPull ? 1 : 0, s.digObj, s.action1, s.maxCarrots, s.fork ? 1 : 0,
    s.carrots.map((c) => [c.s, c.x, c.y, c.h, c.o ? 1 : 0, c.u ? 1 : 0]),
    s.enemies.map((e) => [e.s, e.x, e.y, e.tx, e.ty, e.os, e.pp, e.pl, e.cp ? 1 : 0, e.ds, e.pu ? 1 : 0, e.pf]),
    s.sounds,
  ]);
}

