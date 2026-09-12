// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { QBriscolaAI } from "../src/players/qbriscola/QBriscolaAI.js";
import { qCarta } from "../src/players/qbriscola/QBriscolaCard.js";

const ai = () => new QBriscolaAI();

function state(overrides = {}) {
  return {
    mano: [qCarta("denari", 2), qCarta("coppe", 4), qCarta("bastoni", 5)],
    briscola: qCarta("spadi", 7),
    uscite: [],
    brUscite: [],
    cartaAvversario: null,
    mazzoMax: 20,
    ...overrides
  };
}

test("cercaMinPriorita ignores trump cards", () => {
  const bot = ai();
  bot.setState(state({
    mano: [qCarta("spadi", 2), qCarta("coppe", 4), qCarta("denari", 5)]
  }));
  assert.equal(bot.cercaMinPriorita(), 1);
});

test("cercaMinBriscola chooses the lowest-priority trump", () => {
  const bot = ai();
  bot.setState(state({
    mano: [qCarta("spadi", 1), qCarta("spadi", 4), qCarta("spadi", 7)]
  }));
  assert.equal(bot.cercaMinBriscola(), 1);
});

test("cercaCaricoLibero recognizes a Three when the same-suit Ace is already out", () => {
  const bot = ai();
  bot.setState(state({
    mano: [qCarta("denari", 3), qCarta("coppe", 5), qCarta("bastoni", 6)],
    uscite: [qCarta("denari", 1)]
  }));
  assert.equal(bot.cercaCaricoLibero(), 0);
});

test("cercaCartaLibera recognizes a card when the same-suit Ace and Three are known", () => {
  const bot = ai();
  bot.setState(state({
    mano: [qCarta("denari", 7), qCarta("coppe", 5), qCarta("bastoni", 6)],
    uscite: [qCarta("denari", 1), qCarta("denari", 3)]
  }));
  assert.equal(bot.cercaCartaLibera(), 0);
});

test("giocaComputer leads a non-trump Ace when all other trumps are known", () => {
  const bot = ai();
  const trumps = [1, 2, 3, 4, 5, 6, 8, 9, 10].map((n) => qCarta("spadi", n));
  const chosen = bot.scegliCarta(state({
    mano: [qCarta("denari", 1), qCarta("coppe", 3), qCarta("bastoni", 5)],
    brUscite: trumps,
    mazzoMax: 5
  }));
  assert.equal(chosen, 0);
});

test("rispostaComputer captures an opponent Ace with a trump", () => {
  const bot = ai();
  const chosen = bot.scegliCarta(state({
    mano: [qCarta("denari", 2), qCarta("spadi", 4), qCarta("coppe", 5)],
    cartaAvversario: qCarta("denari", 1)
  }));
  assert.equal(chosen, 1);
});

test("rispostaComputer uses the cheapest sufficient trump when holding only trumps", () => {
  const bot = ai();
  const chosen = bot.scegliCarta(state({
    mano: [qCarta("spadi", 4), qCarta("spadi", 7), qCarta("spadi", 1)],
    cartaAvversario: qCarta("spadi", 5)
  }));
  // 7 (priority 5) beats 5 (priority 3) and is the cheapest sufficient card.
  assert.equal(chosen, 1);
});

test("cercaBriscolaConsecutive can jump to a higher trump when intermediate ranks are known", () => {
  const bot = ai();
  bot.setState(state({
    mano: [qCarta("spadi", 2), qCarta("spadi", 5), qCarta("denari", 7)],
    brUscite: [qCarta("spadi", 4)]
  }));
  const min = bot.cercaMinBriscola();
  assert.equal(min, 0);
  // Priorities: 2 -> 1, 4 -> 2, 5 -> 3. Priority step 2 has already been played.
  assert.equal(bot.cercaBriscolaConsecutive(min), 1);
});
