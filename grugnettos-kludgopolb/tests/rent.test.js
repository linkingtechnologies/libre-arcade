import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBoard } from '../public/src/node/board-loader.js';
import { Game } from '../public/src/core/game.js';
import { rentTerms } from '../public/src/core/index.js';
import { propertiesOwnedBy, sameGroup } from '../public/src/core/valuation.js';
import { isProperty } from '../public/src/core/board.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const board = loadBoard(path.join(root, 'public', 'boards', 'grugnetto-32-v1.4', 'board.json'));

const indexesOf = type => board.spaces.flatMap((space, index) => (space.type === type ? [index] : []));
const emptyStates = () => board.spaces.map(() => ({ owner: null, pledged: false, embellishments: 0 }));
const world1 = indexesOf('site').filter(index => board.spaces[index].world === 'world1');
const hubs = indexesOf('hub');
const services = indexesOf('service');

function own(states, indexes, owner = 0) {
  for (const index of indexes) states[index].owner = owner;
  return states;
}

test('a free place, or a space that cannot be owned, collects no rent', () => {
  const states = emptyStates();
  assert.equal(rentTerms(board, states, world1[0]), null);
  assert.equal(rentTerms(board, states, hubs[0]), null);
  for (const index of board.spaces.keys()) if (!isProperty(board.spaces[index])) assert.equal(rentTerms(board, states, index), null);
  assert.equal(rentTerms(board, own(emptyStates(), [world1[0]]), 0), null, 'start is not a property');
});

test('a site collects its rent for the current embellishment level, doubled when its world is complete', () => {
  const site = board.spaces[world1[0]];
  const states = own(emptyStates(), [world1[0]]);
  assert.deepEqual(rentTerms(board, states, world1[0]), { kind: 'fixed', amount: site.rents[0], level: 0, doubled: false });

  own(states, world1);
  assert.deepEqual(rentTerms(board, states, world1[0]), { kind: 'fixed', amount: site.rents[0] * 2, level: 0, doubled: true });

  states[world1[0]].embellishments = 2;
  assert.deepEqual(rentTerms(board, states, world1[0]), { kind: 'fixed', amount: site.rents[2], level: 2, doubled: false });
  assert.equal(rentTerms(board, states, world1[1]).doubled, true, 'the others still get the complete-world bonus');

  states[world1[0]].embellishments = 99;
  assert.equal(rentTerms(board, states, world1[0]).level, site.rents.length - 1, 'the level is capped at the last rent');

  states[world1[0]].owner = 3;
  assert.equal(rentTerms(board, states, world1[1]).doubled, false, 'a world split between owners is not complete');
});

test('pledged places collect nothing and break the complete-world bonus, unless asked what redeeming would give', () => {
  const states = own(emptyStates(), world1);
  states[world1[1]].pledged = true;
  assert.equal(rentTerms(board, states, world1[1]), null);
  assert.equal(rentTerms(board, states, world1[0]).doubled, false);
  assert.deepEqual(rentTerms(board, states, world1[1], { ifRedeemed: true }), { kind: 'fixed', amount: board.spaces[world1[1]].rents[0] * 2, level: 0, doubled: true });
  states[world1[2]].pledged = true;
  assert.equal(rentTerms(board, states, world1[1], { ifRedeemed: true }).doubled, false, 'another pledged place still blocks the bonus');
});

test('portals collect by how many portals their owner holds, and a pledged portal does not count', () => {
  const hub = board.spaces[hubs[0]];
  const states = own(emptyStates(), [hubs[0]]);
  assert.deepEqual(rentTerms(board, states, hubs[0]), { kind: 'fixed', amount: hub.rents[0], level: 0, doubled: false });
  own(states, [hubs[1]]);
  assert.equal(rentTerms(board, states, hubs[0]).amount, hub.rents[1]);
  own(states, [hubs[2]]);
  assert.equal(rentTerms(board, states, hubs[0]).amount, hub.rents[2]);
  states[hubs[1]].pledged = true;
  assert.equal(rentTerms(board, states, hubs[0]).amount, hub.rents[1]);
  assert.equal(rentTerms(board, states, hubs[1], { ifRedeemed: true }).amount, board.spaces[hubs[1]].rents[2]);
  states[hubs[2]].owner = 3;
  assert.equal(rentTerms(board, states, hubs[0]).amount, hub.rents[0], 'portals held by someone else do not count');
});

test('special places collect a multiple of the dice by how many their owner holds', () => {
  const service = board.spaces[services[0]];
  const states = own(emptyStates(), [services[0]]);
  assert.deepEqual(rentTerms(board, states, services[0]), { kind: 'dice', factor: service.factors[0], level: 0 });
  own(states, [services[1]]);
  assert.deepEqual(rentTerms(board, states, services[0]), { kind: 'dice', factor: service.factors[1], level: 1 });
  states[services[1]].pledged = true;
  assert.equal(rentTerms(board, states, services[0]).factor, service.factors[0]);
  assert.equal(rentTerms(board, states, services[1]), null);
});

// The rent rule as it was written inside the engine before it was shared with the board display: an independent
// reference to check the shared rule against across whole games.
function legacyRent(game, index, diceTotal) {
  const s = game.board.spaces[index];
  const st = game.state[index];
  if (!isProperty(s) || st.owner == null || st.pledged) return 0;
  const owner = game.playerById(st.owner);
  if (!owner || owner.bankrupt) return 0;
  if (s.type === 'site') {
    const level = Math.min(st.embellishments, s.rents.length - 1);
    let rent = s.rents[level];
    if (level === 0) {
      const complete = sameGroup(game.board, s).every(gs => {
        const gi = game.board.spaces.indexOf(gs);
        return game.state[gi].owner === owner.id && !game.state[gi].pledged;
      });
      if (complete) rent *= 2;
    }
    return rent;
  }
  if (s.type === 'hub') {
    const count = propertiesOwnedBy(game, owner).filter(x => x.space.type === 'hub' && !game.state[x.index].pledged).length;
    return s.rents[Math.min(Math.max(count - 1, 0), s.rents.length - 1)];
  }
  const count = propertiesOwnedBy(game, owner).filter(x => x.space.type === 'service' && !game.state[x.index].pledged).length;
  return s.factors[Math.min(Math.max(count - 1, 0), s.factors.length - 1)] * diceTotal;
}

test('the shared rent rule charges exactly what the engine charged before, across whole games', () => {
  let checked = 0;
  const kinds = new Set();
  for (const seed of [1, 2, 3, 7, 12345]) {
    const game = new Game({ board, agents: ['Zilla', 'Queen', 'Wallace', 'Hans'], seed, maxTurns: 1500 });
    const emit = game.emit.bind(game);
    let lastDiceTotal = 7;
    game.emit = (type, data) => {
      if (type === 'DICE_ROLLED') lastDiceTotal = data.total;
      if (type === 'RENT_DUE') {
        const terms = rentTerms(board, game.state, data.index);
        assert.equal(data.amount, legacyRent(game, data.index, lastDiceTotal), `seed ${seed}, space ${data.index}`);
        assert.equal(terms.kind === 'dice' ? terms.factor * lastDiceTotal : terms.amount, data.amount);
        kinds.add(`${board.spaces[data.index].type}${terms.doubled ? '-doubled' : ''}`);
        checked += 1;
      }
      return emit(type, data);
    };
    game.run();
  }
  assert.ok(checked >= 100, `only ${checked} rent events were compared`);
  for (const kind of ['site', 'hub']) assert.ok(kinds.has(kind), `no ${kind} rent was exercised`);
});

test('board tiles and place details use the shared rule and label rents accessibly', () => {
  const js = fs.readFileSync(path.join(root, 'public', 'src', 'ui', 'app.js'), 'utf8');
  assert.match(js, /import \{[^}]*rentTerms[^}]*\} from '\.\.\/core\/index\.js'/);
  assert.match(js, /rentTerms\(board, state\.spaces, index, \{ ifRedeemed: true \}\)/);
  assert.match(js, /terms\.kind === 'dice' \? `×\$\{terms\.factor\}` : String\(terms\.amount\)/);
  assert.match(js, /` · \$\{t\('rent'\)\}: /);
  assert.match(js, /const terms = packet\?\.state\?\.spaces \? rentTerms\(board, packet\.state\.spaces, index\) : null;/);
  // the details dialog no longer carries its own copy of the rent rule
  assert.doesNotMatch(js, /ownedCount/);
});
