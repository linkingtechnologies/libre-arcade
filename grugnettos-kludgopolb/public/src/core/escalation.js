// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-only

// Growing Revenue: an optional rule that raises every rent as a game goes on, so that long games end.
// Without it, two players who each own complete, fully embellished Worlds pass the same money back and forth
// for ever, and a table with a player who never trades (Pazifik) often never finishes (see specs/balance.md).
// Pure functions of the round number, shared by the engine, the board display and the manual.

/** The rule as shipped: from round 40, and every 20 rounds after that, every rent rises by 25%. */
export const DEFAULT_RENT_ESCALATION = Object.freeze({ startRound: 40, everyRounds: 20, factor: 1.25 });

/**
 * Validates a rule given to the engine. `null`, `undefined` and `false` mean no escalation, `true` the shipped rule.
 * @returns {{startRound: number, everyRounds: number, factor: number} | null}
 */
export function normalizeRentEscalation(option) {
  if (option == null || option === false) return null;
  if (option === true) return { ...DEFAULT_RENT_ESCALATION };
  const { startRound, everyRounds, factor } = option;
  if (!Number.isInteger(startRound) || startRound < 1) throw new Error('rentEscalation.startRound must be a whole round number from 1');
  if (!Number.isInteger(everyRounds) || everyRounds < 1) throw new Error('rentEscalation.everyRounds must be a whole number of rounds from 1');
  if (!Number.isFinite(factor) || factor <= 1 || factor > 2) throw new Error('rentEscalation.factor must be above 1 and at most 2');
  return { startRound, everyRounds, factor };
}

/** How many times rents have been raised once `round` has begun: 0 before the start round. */
export function rentLevelAt(escalation, round) {
  if (!escalation || !(round >= escalation.startRound)) return 0;
  return Math.floor((round - escalation.startRound) / escalation.everyRounds) + 1;
}

/** What every rent is multiplied by in `round`. */
export function rentMultiplierAt(escalation, round) {
  return escalation ? escalation.factor ** rentLevelAt(escalation, round) : 1;
}

/** The round in which rents next rise, or null when there is no escalation. */
export function nextRentRiseRound(escalation, round) {
  if (!escalation) return null;
  return escalation.startRound + rentLevelAt(escalation, round) * escalation.everyRounds;
}
