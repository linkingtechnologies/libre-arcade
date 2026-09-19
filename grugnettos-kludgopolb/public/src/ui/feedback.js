// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-only

// What a packet of game events shows and plays, one beat at a time: the sound cue of an event together with the
// floating "+100" / "−120" of the money that moved with it. Pure functions, no DOM: app.js paces and draws the beats.

import { cueForEvent, NEUTRAL_GAIN } from './sound.js';

// The event that carries the sound of each kind of money movement, so an amount pops up together with its sound.
const CASH_REASON_EVENTS = {
  acquisition: ['PROPERTY_ACQUIRED'],
  rent: ['RENT_DUE'],
  'pass-start': ['START_PASSED'],
  tax: ['PAYMENT'],
  'base-camp-fee': ['PAYMENT'],
  event: ['CARD_DRAWN'],
  pledge: ['PROPERTY_PLEDGED'],
  redeem: ['PROPERTY_REDEEMED'],
  'build-embellishment': ['EMBELLISHMENT_BUILT', 'EMBELLISHMENT_GRANTED'],
  'sell-embellishment': ['EMBELLISHMENT_SOLD'],
  trade: ['TRADE_ACCEPTED']
};
// A transaction's events are emitted next to each other; anything further apart is a different transaction.
const PAIRING_WINDOW = 6;
const ORPHAN_CLUSTER_GAP = 2;

/** The amounts an event moves: [{ playerId, amount (signed), reason }]. */
export function moneyPops(event) {
  if (!event) return [];
  if (event.type === 'CASH_CHANGED') {
    return event.amount ? [{ playerId: event.playerId, amount: event.amount, reason: event.reason }] : [];
  }
  // Trades move cash directly, without CASH_CHANGED events: the accepted trade carries it (positive: the trader pays).
  if (event.type === 'TRADE_ACCEPTED' && event.cash) {
    return [
      { playerId: event.traderId, amount: -event.cash, reason: 'trade' },
      { playerId: event.targetId, amount: event.cash, reason: 'trade' }
    ];
  }
  return [];
}

/**
 * Groups a packet's events into beats: { cue, pops } in event order. A cue-bearing event opens a beat; each money
 * movement joins the nearest event that carries its sound, and money with no such event forms a beat of its own
 * (`paired: false`) with a plain coin sound, so no amount moves in silence.
 * @returns {{cue: {cue: string, gain: number, rate?: number}, paired: boolean, pops: {playerId: number, amount: number}[]}[]}
 */
export function buildFeedbackBeats(events = [], humanId = null) {
  const beats = [];
  events.forEach((event, index) => {
    const cue = cueForEvent(event, humanId);
    if (cue) beats.push({ index, type: event.type, cue, paired: true, pops: [] });
  });

  const orphans = [];
  events.forEach((event, index) => {
    for (const pop of moneyPops(event)) {
      const carriers = CASH_REASON_EVENTS[pop.reason] ?? [];
      let owner = null;
      for (const beat of beats) {
        const distance = Math.abs(beat.index - index);
        if (carriers.includes(beat.type) && distance <= PAIRING_WINDOW && (!owner || distance < Math.abs(owner.index - index))) owner = beat;
      }
      if (owner) {
        owner.pops.push({ playerId: pop.playerId, amount: pop.amount });
        continue;
      }
      const last = orphans.at(-1);
      if (last && index - last.lastIndex <= ORPHAN_CLUSTER_GAP) {
        last.pops.push({ playerId: pop.playerId, amount: pop.amount });
        last.lastIndex = index;
      } else {
        orphans.push({ index, lastIndex: index, type: null, cue: null, paired: false, pops: [{ playerId: pop.playerId, amount: pop.amount }] });
      }
    }
  });

  for (const orphan of orphans) orphan.cue = plainMoneyCue(orphan.pops, humanId);
  return [...beats, ...orphans].sort((a, b) => a.index - b.index).map(({ cue, paired, pops }) => ({ cue, paired, pops }));
}

// Money that moved without a more specific event: a low coin when it is spent, a high one when it is received.
function plainMoneyCue(pops, humanId) {
  const mine = pops.find(pop => pop.playerId === humanId);
  const lead = mine ?? pops[0];
  return { cue: lead.amount < 0 ? 'pay' : 'receive', gain: mine ? 1 : NEUTRAL_GAIN };
}

/** "+100" or "−120" (a real minus sign), the text of a floating amount. */
export function popText(amount) {
  return `${amount > 0 ? '+' : '−'}${Math.abs(amount)}`;
}
