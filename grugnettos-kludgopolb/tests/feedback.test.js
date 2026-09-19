import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBoard } from '../public/src/node/board-loader.js';
import { Game } from '../public/src/core/game.js';
import { buildFeedbackBeats, moneyPops, popText } from '../public/src/ui/feedback.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const board = loadBoard(path.join(root, 'public', 'boards', 'grugnetto-32-v1.4', 'board.json'));
const HUMAN = 0;
const ZILLA = 1;
const QUEEN = 2;

const cash = (playerId, amount, reason) => ({ type: 'CASH_CHANGED', playerId, amount, reason });
const beatSummary = beats => beats.map(beat => `${beat.cue?.cue ?? '-'}:${beat.pops.map(pop => `${pop.playerId}${popText(pop.amount)}`).join(',')}`);

test('a floating amount reads +100 or −120, with a real minus sign', () => {
  assert.equal(popText(100), '+100');
  assert.equal(popText(-120), '−120');
  assert.equal(popText(-120).charCodeAt(0), 0x2212);
});

test('cash changes and cash moved by a trade each become signed amounts', () => {
  assert.deepEqual(moneyPops(cash(ZILLA, -75, 'tax')), [{ playerId: ZILLA, amount: -75, reason: 'tax' }]);
  assert.deepEqual(moneyPops(cash(ZILLA, 0, 'tax')), []);
  assert.deepEqual(moneyPops({ type: 'TRADE_ACCEPTED', traderId: ZILLA, targetId: QUEEN, cash: 30 }), [
    { playerId: ZILLA, amount: -30, reason: 'trade' },
    { playerId: QUEEN, amount: 30, reason: 'trade' }
  ]);
  assert.deepEqual(moneyPops({ type: 'TRADE_ACCEPTED', traderId: ZILLA, targetId: QUEEN, cash: -30 }).map(pop => pop.amount), [30, -30]);
  assert.deepEqual(moneyPops({ type: 'TRADE_ACCEPTED', traderId: ZILLA, targetId: QUEEN, cash: 0 }), []);
  assert.deepEqual(moneyPops({ type: 'DICE_ROLLED' }), []);
  assert.deepEqual(moneyPops(undefined), []);
});

test('money joins the sound of its own transaction, in the order the engine emits it', () => {
  const events = [
    { type: 'DICE_ROLLED', playerId: HUMAN, total: 8 },
    { type: 'PLAYER_MOVED', playerId: HUMAN },
    { type: 'SPACE_LANDED', playerId: HUMAN },
    { type: 'PAYMENT', payerId: HUMAN, recipientId: null, reason: 'acquisition' },
    cash(HUMAN, -120, 'acquisition'),
    { type: 'PROPERTY_ACQUIRED', playerId: HUMAN, price: 120 },
    { type: 'RENT_DUE', playerId: ZILLA, ownerId: HUMAN, amount: 14 },
    { type: 'PAYMENT', payerId: ZILLA, recipientId: HUMAN, reason: 'rent' },
    cash(ZILLA, -14, 'rent'),
    cash(HUMAN, 14, 'rent'),
    { type: 'START_PASSED', playerId: QUEEN, amount: 160 },
    cash(QUEEN, 160, 'pass-start')
  ];
  assert.deepEqual(beatSummary(buildFeedbackBeats(events, HUMAN)), ['dice:', 'purchase:0−120', 'receive:1−14,0+14', 'startPassed:2+160']);
});

test('a purchase is not credited to the dice roll that came just before it', () => {
  const beats = buildFeedbackBeats([
    { type: 'DICE_ROLLED', playerId: ZILLA },
    { type: 'PLAYER_MOVED', playerId: ZILLA },
    cash(ZILLA, -150, 'acquisition'),
    { type: 'PROPERTY_ACQUIRED', playerId: ZILLA }
  ], HUMAN);
  assert.equal(beats[0].pops.length, 0);
  assert.deepEqual(beats[1].pops, [{ playerId: ZILLA, amount: -150 }]);
});

test('tax, card, pledge, embellishment and trade money each pair with their own event', () => {
  const events = [
    { type: 'PAYMENT', payerId: HUMAN, recipientId: null, reason: 'tax' },
    cash(HUMAN, -60, 'tax'),
    { type: 'CARD_DRAWN', playerId: HUMAN, deck: 'avventure' },
    cash(HUMAN, 90, 'event'),
    cash(HUMAN, 200, 'pledge'),
    { type: 'PROPERTY_PLEDGED', playerId: HUMAN },
    cash(HUMAN, -55, 'build-embellishment'),
    { type: 'EMBELLISHMENT_BUILT', playerId: HUMAN },
    { type: 'TRADE_ACCEPTED', traderId: HUMAN, targetId: ZILLA, cash: 40 }
  ];
  assert.deepEqual(beatSummary(buildFeedbackBeats(events, HUMAN)), ['pay:0−60', 'adventure:0+90', 'pledge:0+200', 'build:0−55', 'tradeYes:0−40,1+40']);
});

test('money with no sound of its own forms a beat, and neighbouring amounts share one', () => {
  const events = [
    cash(ZILLA, -50, 'payment'),
    cash(QUEEN, 50, 'payment-received'),
    { type: 'TURN_ENDED', playerId: ZILLA },
    { type: 'TURN_ENDED', playerId: QUEEN },
    { type: 'TURN_ENDED', playerId: HUMAN },
    { type: 'TURN_ENDED', playerId: ZILLA },
    cash(QUEEN, -20, 'payment')
  ];
  assert.deepEqual(beatSummary(buildFeedbackBeats(events, HUMAN)), ['pay:1−50,2+50', 'pay:2−20']);
  assert.equal(buildFeedbackBeats(events, HUMAN)[0].paired, false);
  assert.deepEqual(buildFeedbackBeats([cash(HUMAN, 30, 'payment')], HUMAN)[0].cue, { cue: 'receive', gain: 1 });
  assert.deepEqual(buildFeedbackBeats([{ type: 'CASH_CHANGED', playerId: ZILLA, amount: 0 }, { type: 'TURN_ENDED' }], HUMAN), []);
});

test('across whole games every amount that moved shows exactly once, almost always with its own sound', () => {
  let movements = 0;
  let orphaned = 0;
  for (const seed of [1, 2, 3, 7, 12345]) {
    const game = new Game({ board, agents: ['Zilla', 'Queen', 'Wallace', 'Hans'], seed, maxTurns: 1500 });
    const events = [];
    const emit = game.emit.bind(game);
    game.emit = (type, data) => { const event = emit(type, data); events.push(event); return event; };
    game.run();

    const expected = {};
    for (const event of events) for (const pop of moneyPops(event)) expected[pop.playerId] = (expected[pop.playerId] ?? 0) + pop.amount;
    const beats = buildFeedbackBeats(events, HUMAN);
    const shown = {};
    for (const beat of beats) for (const pop of beat.pops) shown[pop.playerId] = (shown[pop.playerId] ?? 0) + pop.amount;
    assert.deepEqual(shown, expected, `seed ${seed}: amounts shown differ from amounts moved`);

    movements += events.reduce((count, event) => count + moneyPops(event).length, 0);
    orphaned += beats.filter(beat => !beat.paired).reduce((count, beat) => count + beat.pops.length, 0);
    assert.ok(beats.every(beat => beat.cue), `seed ${seed}: every beat has a sound`);
  }
  assert.ok(movements > 300, `only ${movements} money movements were compared`);
  assert.ok(orphaned / movements < 0.2, `${orphaned} of ${movements} amounts had no sound to join`);
});

test('the board shows floating amounts from every packet, in reduced-motion safe form', () => {
  const js = fs.readFileSync(path.join(root, 'public', 'src', 'ui', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'public', 'src', 'ui', 'app.css'), 'utf8');
  assert.match(js, /import \{ buildFeedbackBeats, popText \} from '\.\/feedback\.js'/);
  assert.match(js, /pops\.forEach\(showMoneyPop\)/);
  assert.match(js, /\.player-card\[data-player-id=/);
  assert.match(css, /\.money-pop\.gain\{color:#1c8a3f\}/);
  assert.match(css, /\.money-pop\.spend\{color:#d23b3b\}/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\.money-pop\{animation:none!important/);
  assert.match(css, /\.money-pop-layer\{[^}]*pointer-events:none/);
});
