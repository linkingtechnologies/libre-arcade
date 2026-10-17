import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBoard } from '../public/src/node/board-loader.js';
import { Game } from '../public/src/core/game.js';
import { GameController, serializeSave, deserializeSave } from '../public/src/core/index.js';
import {
  DEFAULT_RENT_ESCALATION, normalizeRentEscalation, rentLevelAt, rentMultiplierAt, nextRentRiseRound
} from '../public/src/core/escalation.js';
import { rentFor, rentTerms, propertyValue } from '../public/src/core/valuation.js';
import { getCpuProfile } from '../public/src/players/profiles.js';
import { UI_TEXT } from '../public/src/ui/i18n.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const board = loadBoard(path.join(root, 'public', 'boards', 'grugnetto-32-v1.4', 'board.json'));
const ESC = { startRound: 40, everyRounds: 20, factor: 1.25 };

const indexesOf = type => board.spaces.flatMap((space, index) => (space.type === type ? [index] : []));
const world1 = indexesOf('site').filter(index => board.spaces[index].world === 'world1');
const hubs = indexesOf('hub');
const services = indexesOf('service');
const zilla = names => names.map((n, i) => ({ type: 'cpu', profile: n, name: `${n}#${i}` }));
// every space's rent and factor tables, as plain data (a space without a table reads as null)
const tables = b => JSON.parse(JSON.stringify(b.spaces.map(s => [s.rents ?? null, s.factors ?? null])));
const newGame = (options = {}) => new Game({ board, agents: ['Zilla', 'Queen', 'Wallace', 'Hans'], seed: 11, ...options });

test('the shipped rule is +25% from round 40 and every 20 rounds after', () => {
  assert.deepEqual({ ...DEFAULT_RENT_ESCALATION }, ESC);
  assert.equal(Object.isFrozen(DEFAULT_RENT_ESCALATION), true);
  const expectations = [[0, 0, 1], [1, 0, 1], [39, 0, 1], [40, 1, 1.25], [59, 1, 1.25], [60, 2, 1.5625], [79, 2, 1.5625], [80, 3, 1.953125], [100, 4, 2.44140625]];
  for (const [round, level, multiplier] of expectations) {
    assert.equal(rentLevelAt(ESC, round), level, `level at round ${round}`);
    assert.equal(rentMultiplierAt(ESC, round), multiplier, `multiplier at round ${round}`);
  }
  assert.deepEqual([0, 39, 40, 59, 60, 100].map(round => nextRentRiseRound(ESC, round)), [40, 40, 60, 60, 80, 120]);
  assert.equal(rentLevelAt(null, 500), 0);
  assert.equal(rentMultiplierAt(null, 500), 1);
  assert.equal(nextRentRiseRound(null, 10), null);
  assert.equal(rentLevelAt(ESC, undefined), 0);
});

test('the engine accepts only a sensible rule', () => {
  assert.equal(normalizeRentEscalation(undefined), null);
  assert.equal(normalizeRentEscalation(null), null);
  assert.equal(normalizeRentEscalation(false), null);
  assert.deepEqual(normalizeRentEscalation(true), ESC);
  assert.deepEqual(normalizeRentEscalation({ startRound: 10, everyRounds: 5, factor: 1.5 }), { startRound: 10, everyRounds: 5, factor: 1.5 });
  for (const bad of [{ startRound: 0, everyRounds: 20, factor: 1.25 }, { startRound: 40.5, everyRounds: 20, factor: 1.25 }, { startRound: 40, everyRounds: 0, factor: 1.25 },
    { startRound: 40, everyRounds: 20, factor: 1 }, { startRound: 40, everyRounds: 20, factor: 0.8 }, { startRound: 40, everyRounds: 20, factor: 2.5 }, { startRound: 40, everyRounds: 20, factor: NaN }, {}]) {
    assert.throws(() => normalizeRentEscalation(bad), /rentEscalation/, JSON.stringify(bad));
  }
  assert.throws(() => newGame({ rentEscalation: { startRound: 1, everyRounds: 1, factor: 5 } }), /rentEscalation/);
});

test('off, or not yet started, the engine and its board are exactly as before', () => {
  const off = newGame();
  const never = newGame({ rentEscalation: { startRound: 100000, everyRounds: 20, factor: 1.25 } });
  for (const game of [off, never]) {
    game.roundNumber = 5000;
    assert.deepEqual(tables(game.board), tables(board));
  }
  assert.equal(off.rentMultiplier(), 1);
  const a = new Game({ board, agents: ['Zilla', 'Queen', 'Wallace', 'Hans'], seed: 12345, maxTurns: 6000 }).run();
  const b = new Game({ board, agents: ['Zilla', 'Queen', 'Wallace', 'Hans'], seed: 12345, maxTurns: 6000, rentEscalation: { startRound: 100000, everyRounds: 20, factor: 1.25 } }).run();
  assert.deepEqual(b, a, 'a rule that never starts changes nothing, to the last statistic');
});

test('from the start round the engine rescales its own board copy and never the shared one', () => {
  const printed = tables(board);
  const game = newGame({ rentEscalation: ESC });
  game.roundNumber = 39;
  assert.deepEqual(tables(game.board), printed);
  game.roundNumber = 40;
  const site = board.spaces[world1[0]];
  assert.deepEqual(game.board.spaces[world1[0]].rents, site.rents.map(rent => Math.round(rent * 1.25)));
  assert.deepEqual(game.board.spaces[services[0]].factors, board.spaces[services[0]].factors.map(f => f * 1.25));
  game.roundNumber = 85;
  assert.deepEqual(game.board.spaces[hubs[0]].rents, board.spaces[hubs[0]].rents.map(rent => Math.round(rent * 1.953125)), 'rescaled from the printed rents, not compounded on rounded ones');
  assert.deepEqual(tables(board), printed, 'the caller\'s board is untouched');
  game.roundNumber = 10;
  assert.deepEqual(tables(game.board), printed, 'going back below the start round restores the printed rents');
  assert.equal(game.rentLevel, 0);
});

function ownedGame(round) {
  const game = newGame({ rentEscalation: ESC });
  game.roundNumber = round;
  for (const index of world1) game.state[index].owner = 0; // a complete World: the doubled base rent
  game.state[world1[0]].embellishments = 0;
  game.state[board.spaces.findIndex(s => s.id === board.spaces[hubs[0]].id)].owner = 1;
  game.state[hubs[1]].owner = 1; // two portals
  game.state[services[0]].owner = 2;
  game.state[services[1]].owner = 2; // two special places
  const other = indexesOf('site').find(index => board.spaces[index].world === 'world2');
  game.state[other].owner = 3;
  game.state[other].embellishments = 3;
  return { game, other };
}

test('what the engine charges and what the board shows are the same number, at every step of the rule', () => {
  for (const round of [1, 39, 40, 60, 80, 100, 140]) {
    const { game, other } = ownedGame(round);
    const multiplier = rentMultiplierAt(ESC, round);
    for (const index of [...world1, hubs[0], hubs[1], services[0], services[1], other]) {
      const shown = rentTerms(board, game.state, index, { multiplier });
      const charged = rentFor(game, index, 7);
      const expected = shown.kind === 'dice' ? Math.round(shown.factor * 7) : shown.amount;
      assert.equal(charged, expected, `round ${round}, space ${board.spaces[index].id}`);
      assert.ok(Number.isInteger(charged), 'a rent is always a whole number of coins');
    }
  }
});

test('a rent never goes down as rounds pass, and a special place pays whole coins for any dice', () => {
  const { game } = ownedGame(1);
  const watched = [world1[0], hubs[0], services[0]];
  let before = watched.map(index => rentFor(game, index, 7));
  for (let round = 2; round <= 200; round += 1) {
    game.roundNumber = round;
    const now = watched.map(index => rentFor(game, index, 7));
    now.forEach((value, i) => assert.ok(value >= before[i], `round ${round}`));
    before = now;
    for (const dice of [2, 3, 7, 11, 12]) assert.ok(Number.isInteger(rentFor(game, services[0], dice)), `round ${round}, dice ${dice}`);
  }
  assert.ok(before[0] > rentFor(ownedGame(1).game, world1[0], 7) * 4, 'by round 200 rents are several times higher');
});

test('the computer players value places by the rents of the round, so they see the rule too', () => {
  const profile = getCpuProfile('Wallace');
  const early = newGame({ rentEscalation: ESC });
  const late = newGame({ rentEscalation: ESC });
  late.roundNumber = 100;
  const player = early.players[0];
  const lateValue = propertyValue(late, late.players[0], world1[0], profile);
  assert.ok(lateValue > propertyValue(early, player, world1[0], profile), 'a place is worth more once its rent has risen');
  const plain = newGame();
  plain.roundNumber = 100;
  assert.equal(propertyValue(plain, plain.players[0], world1[0], profile), propertyValue(early, player, world1[0], profile), 'without the rule the round does not matter');
});

test('the rule is saved with the game, restored at the right level, and old saves carry on without it', () => {
  const controller = GameController.create({ board, participants: zilla(['Zilla', 'Queen', 'Wallace', 'Hans']), seed: 5, rentEscalation: true });
  assert.deepEqual(controller.getPublicState().rentEscalation, ESC);
  controller.game.roundNumber = 65;
  const state = controller.getPublicState();
  assert.equal(state.rentMultiplier, 1.5625);
  assert.equal(state.nextRentRiseRound, 80);

  const restored = deserializeSave({ board, json: serializeSave(controller) });
  assert.deepEqual(restored.getPublicState().rentEscalation, ESC);
  assert.equal(restored.game.rentLevel, 2);
  assert.deepEqual(tables(restored.game.board), tables(controller.game.board));

  const old = JSON.parse(serializeSave(controller));
  delete old.controller.game.rentEscalation; // a save written before the rule existed
  const carriedOn = deserializeSave({ board, json: old });
  const carriedState = carriedOn.getPublicState();
  assert.equal(carriedState.rentEscalation, null);
  assert.equal(carriedState.rentMultiplier, 1);
  assert.equal(carriedState.nextRentRiseRound, null);
  assert.deepEqual(tables(carriedOn.game.board), tables(board), 'its rents stay the printed ones');
});

test('with the rule, games that never finish without it do finish', () => {
  // Seeds that are stalemates today: two players left, each with complete, fully embellished Worlds, passing the same
  // money back and forth. Games are replayed as they are in the balance study (names carry the seat).
  const stalledZilla = [100001, 100010];
  for (const seed of stalledZilla) {
    const result = new Game({ board, participants: zilla(Array(4).fill('Zilla')), seed, maxTurns: 2400, rentEscalation: true }).run();
    assert.equal(result.completed, true, `seed ${seed} finishes`);
    assert.ok(result.turns < 2400, `seed ${seed} finishes in ${result.turns} turns`);
  }
  const stalled = new Game({ board, participants: zilla(Array(4).fill('Zilla')), seed: 100001, maxTurns: 2400 }).run();
  assert.equal(stalled.completed, false, 'and without the rule the same seed does not');
});

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public', 'config', 'how-to-play', 'manifest.json'), 'utf8'));

test('the manual states the same numbers as the rule, in all four languages', () => {
  assert.equal(manifest.variables.rentEscalationStart, DEFAULT_RENT_ESCALATION.startRound);
  assert.equal(manifest.variables.rentEscalationEvery, DEFAULT_RENT_ESCALATION.everyRounds);
  assert.equal(manifest.variables.rentEscalationPercent, Math.round((DEFAULT_RENT_ESCALATION.factor - 1) * 100));
  for (const code of manifest.locales) {
    const places = JSON.parse(fs.readFileSync(path.join(root, 'public', 'config', 'how-to-play', 'i18n', `${code}.json`), 'utf8')).sections.places.paragraphs.join(' ');
    for (const key of ['rentEscalationStart', 'rentEscalationEvery', 'rentEscalationPercent']) assert.ok(places.includes(`{{${key}}}`), `${code}: the places section explains ${key}`);
  }
});

test('growing rents are a setup choice that is on by default, remembered, saved with the game and shown in the header', () => {
  const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'public', 'src', 'ui', 'app.js'), 'utf8');
  assert.match(html, /<input type="checkbox" id="rentEscalationOption" checked>/);
  assert.match(html, /id="rentBadge"/);
  assert.match(js, /GameController\.create\(\{board,participants,seed,maxTurns:6000,rentEscalation:el\('rentEscalationOption'\)\.checked\}\)/);
  assert.match(js, /el\('rentEscalationOption'\)\.checked = storage\.get\(RENT_ESCALATION_KEY\) !== '0'/);
  assert.match(js, /LOCAL_STORAGE_KEYS = \[[^\]]*RENT_ESCALATION_KEY/);
  assert.match(js, /function announceRentRise\(state\)/);
  assert.match(js, /packet=nextPacket;\s+announceRentRise\(packet\.state\);/);
});

test('the growing-rents texts exist in all four languages and use only the values the interface provides', () => {
  const provided = {
    rentEscalationHint: ['start', 'every', 'percent'],
    rentBadgeSoon: ['round'],
    rentBadgeNow: ['n'],
    rentBadgeTitle: ['percent', 'every', 'round'],
    rentRaised: ['n', 'round'],
    rentRaisedNote: ['n']
  };
  for (const lang of ['it', 'en', 'fr', 'de']) {
    assert.ok(UI_TEXT[lang].rentEscalationLabel, `${lang}.rentEscalationLabel`);
    for (const [key, names] of Object.entries(provided)) {
      const text = UI_TEXT[lang][key];
      assert.ok(text, `${lang}.${key}`);
      const used = [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]);
      assert.deepEqual([...new Set(used)].sort(), [...names].sort(), `${lang}.${key} placeholders`);
    }
  }
});
