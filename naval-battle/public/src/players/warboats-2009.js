import { coordKey, inBounds } from '../core/rules.js';

/**
 * Faithful JavaScript port of Warboats 0.51 AI.c (Trevor Chart, 2009).
 *
 * Upstream source grant: GNU GPL v2 or later.
 * This derivative is distributed as part of BattleLab under GNU GPL v3.
 *
 * Archaeology note: targeting/state logic follows AI.c. BattleLab injects its
 * deterministic PRNG instead of emulating the platform's historical libc rand().
 */
export class HistoricalAiStallError extends Error {
  constructor(message) { super(message); this.name = 'HistoricalAiStallError'; }
}

export class Warboats2009Player {
  static archaeologyStatus = Object.freeze({
    implementation: 'source-port',
    source: 'Warboats 0.51 AI.c',
    date: '2009-11-30',
    upstreamLicense: 'GPL-2.0-or-later',
    battleLabLicense: 'GPL-3.0',
    rng: 'deterministic BattleLab PRNG; not historical libc rand()'
  });

  constructor(rng, skill = 4, name = `Warboats 0.51 (2009) L${skill}`) {
    if (!Number.isInteger(skill) || skill < 1 || skill > 4) throw new RangeError('Warboats skill must be 1..4');
    this.rng = rng;
    this.skill = skill;
    this.name = name;
    this.tried = new Set();
    this.memory = Array.from({ length: 5 }, () => ({
      state: 'PRISTINE',
      endpoints: [null, null],
      orientation: 'UNDETERMINED'
    }));
    // C code: patternLikeParity=RNG(0,1) for level 4.
    this.patternLikeParity = skill > 3 ? this.#historicalRng(0, 1) : null;
  }

  #historicalRng(low, high) {
    // Port of engine.c RNG(): retain its rounding/wrap mapping while using
    // BattleLab's deterministic random stream instead of libc rand().
    const u = this.rng.next();
    let z = low + Math.floor(0.5 + (high - low + 1) * u);
    if (z > high) z = low;
    return z;
  }

  #shipIndex(shipId) {
    const match = /^ship-(\d+)-L\d+$/.exec(shipId ?? '');
    if (!match) throw new Error(`Warboats port requires canonical BattleLab ship ids; got ${shipId}`);
    const index = Number(match[1]);
    if (index < 0 || index > 4) throw new Error(`Unexpected Warboats ship index ${index}`);
    return index;
  }

  observe(event) {
    if (!event.hit || !event.shipId) return;
    const i = this.#shipIndex(event.shipId);
    const m = this.memory[i];
    const { x, y } = event.coord;

    if (m.state === 'PRISTINE') {
      // AI.c stores the first hit as both endpoints.
      m.endpoints[0] = { x, y };
      m.endpoints[1] = { x, y };
    } else if (!event.sunk) {
      // AI.c chooses which endpoint to replace by Manhattan-adjacency to endpoint 0.
      const a = m.endpoints[0];
      const distance = a.x - x + a.y - y;
      if (distance === 1 || distance === -1) m.endpoints[0] = { x, y };
      else m.endpoints[1] = { x, y };
    }

    // In upstream this is done before state is updated, so it activates from
    // the second hit onward at skill 3+.
    if (this.skill > 2 && m.orientation === 'UNDETERMINED' && m.state === 'HIT') {
      m.orientation = m.endpoints[0].x === m.endpoints[1].x ? 'VERTICAL' : 'HORIZONTAL';
    }
    m.state = event.sunk ? 'SUNK' : 'HIT';
  }

  #targetCandidate(m) {
    const endpoint = m.endpoints[this.#historicalRng(0, 1)];
    let dirs;
    if (m.orientation !== 'UNDETERMINED' && this.skill > 2) {
      // Equivalent to (2*RNG(0,1)+orientation)%4 with C enum
      // EAST=0,NORTH=1,WEST=2,SOUTH=3; orientation VERTICAL=1,HORIZONTAL=2.
      dirs = m.orientation === 'VERTICAL' ? ['NORTH', 'SOUTH'] : ['EAST', 'WEST'];
    } else {
      dirs = ['EAST', 'NORTH', 'WEST', 'SOUTH'];
    }
    const dir = dirs[this.#historicalRng(0, dirs.length - 1)];
    switch (dir) {
      case 'NORTH': return { x: endpoint.x, y: endpoint.y - 1 };
      case 'SOUTH': return { x: endpoint.x, y: endpoint.y + 1 };
      case 'WEST': return { x: endpoint.x - 1, y: endpoint.y };
      case 'EAST': return { x: endpoint.x + 1, y: endpoint.y };
      default: throw new Error('unreachable');
    }
  }

  nextShot(state) {
    // AI.c retries until a legal, previously unknown point is found.
    for (let guard = 0; guard < 100000; guard += 1) {
      let candidate = null;

      if (this.skill > 1) {
        // Upstream iterates 4..0, explicitly prioritising smaller ships.
        for (let i = 4; i >= 0; i -= 1) {
          const m = this.memory[i];
          if (m.state === 'HIT') {
            candidate = this.#targetCandidate(m);
            break;
          }
        }
      }

      if (!candidate) {
        candidate = { x: this.#historicalRng(0, state.boardSize - 1), y: this.#historicalRng(0, state.boardSize - 1) };
        if (this.skill > 3 && ((candidate.x + candidate.y) & 1) === this.patternLikeParity) continue;
      }

      if (!inBounds(candidate, state.boardSize)) continue;
      const key = coordKey(candidate);
      if (this.tried.has(key)) continue;
      this.tried.add(key);
      return candidate;
    }
    throw new HistoricalAiStallError(`${this.name} reproduced the Warboats 0.51 targeting stall: no reachable unknown cell from the remembered endpoints`);
  }
}
