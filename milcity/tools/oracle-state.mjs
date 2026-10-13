// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// The state of the port's game as one text, built to match test/java-oracle/oracle/Harness.java's snapshot() line for line: the same
// lines, the same order, the same numbers, written from the port's own objects. The oracle compares the CRC-32 of this text after
// every tenth of a second of virtual time, and asks for the text itself when two checksums differ.
//
// The port keeps some things differently from the original, so each line says how the port's data is read in the original's terms:
//   - the original's statusGrid of a player is what the others know of that player's city; the port's `status` of a player is what
//     that player knows of the opponent's city. For two players the radar of city i is the status of the other player.
//   - a building's cells: the original's cell is "hit" when its type is burning (29) or more; the port's has a `hit` flag.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(text) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < text.length; i++) c = CRC_TABLE[(c ^ text.charCodeAt(i)) & 0xFF] ^ (c >>> 8);
  return ((c ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
}

const flag = (value) => (value ? 1 : 0);
const STATE = { construction: 0, operational: 1, destroyed: 2 };

export function snapshot(game, view = { mode: 0, timer: 0 }) {
  const vibes = game.vibrations.splice(0).map((v) => `${v.time}:${v.ms}`); // the vibrations since the last snapshot
  const lines = [];
  lines.push(`t ${game.time}`);
  const winner = game.ended ? game.players.findIndex((p) => p.won) : -1;
  lines.push(`G ${flag(game.ended)} ${winner} ${winner >= 0 ? game.players[winner].score : -1}`);
  game.players.forEach((p, i) => {
    const ai = game.ais.find((a) => a.player === p);
    let line = `P${i} ${p.money} ${p.energy} ${p.acceleration} ${p.score} ${p.ammo.missile} ${p.ammo.mortar} ${p.ammo.aircraft} ${p.ammo.nuke} ${p.ammo.spy} ${p.ammo.shield} `
      + `${p.cannotFireBefore} ${p.belowZeroSince} ${flag(p.energyBelowZero)} ${flag(p.lost)} ${flag(p.won)} ${p.constructedBuildings}`;
    if (ai) line += ` A ${ai.turn}`;
    lines.push(line);
    let cells = '';
    for (let y = 0; y < p.grid.h; y++) {
      for (let x = 0; x < p.grid.w; x++) {
        cells += `${p.grid.cells[y][x]},`;
      }
    }
    lines.push(`C${i} ${cells}`);
    lines.push(`H${i} ${p.grid.shields.length}${p.grid.shields.map((s) => ` ${s.x},${s.y},${s.until},${s.type}`).join('')}`);
    const buildings = p.grid.buildings.map((b) => {
      const tracksUpdates = b.def.production > 0 && !b.def.specialBuildTiming;
      const cells2 = b.cells.map((c) => `${c.x},${c.y}${c.hit ? 'x' : 'o'};`).join('');
      return `${b.def.id}:${STATE[b.state]}:${b.createdAt}:${tracksUpdates ? b.updatedAt : '-'}:${cells2}`;
    });
    lines.push(`B${i} ${buildings.length}${buildings.map((t) => ` ${t}`).join('')}`);
    const other = game.players.length === 2 ? game.players[1 - i] : p;
    let radar = '';
    for (let y = 0; y < p.grid.h; y++) for (let x = 0; x < p.grid.w; x++) radar += `${other.status[y][x]},`;
    lines.push(`R${i} ${radar}`);
  });
  lines.push(`V ${view.mode} ${view.timer}`);
  lines.push(`Q${vibes.map((v) => ` ${v}`).join('')}`);
  return `${lines.join('\n')}\n`;
}
