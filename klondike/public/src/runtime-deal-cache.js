// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { validateMinimalDeal } from "./deal-codec.js";

export const RUNTIME_CACHE_VERSION = 1;
export const RUNTIME_CACHE_KIND = "klondike-runtime-certified";

export function normalizeRuntimeDeal(deal) {
  if (!validateMinimalDeal(deal)) return null;
  if (!/^js-(1|3)-\d+$/.test(deal.id ?? "")) return null;
  if (![1, 3].includes(deal.drawCount)) return null;
  if (!Number.isInteger(deal.seed) || deal.seed < 0 || deal.seed > 0xffffffff) return null;
  if (!Number.isInteger(deal.expectedMoves) || deal.expectedMoves < 1) return null;
  if (!Number.isInteger(deal.states) || deal.states < 1) return null;
  if (deal.sourceTest !== "MinimalKlondike JS on-demand") return null;
  return {
    id: deal.id,
    seed: deal.seed,
    drawCount: deal.drawCount,
    encoded: deal.encoded,
    expectedMoves: deal.expectedMoves,
    states: deal.states,
    sourceTest: deal.sourceTest,
  };
}

export function parseRuntimeDealCache(raw) {
  try {
    const value = JSON.parse(raw ?? "null");
    if (value?.kind !== RUNTIME_CACHE_KIND || value?.version !== RUNTIME_CACHE_VERSION || !Array.isArray(value.deals)) return [];
    return value.deals.map(normalizeRuntimeDeal).filter(Boolean).slice(0, 12);
  } catch { return []; }
}

export function serializeRuntimeDealCache(deals) {
  const valid = deals.map(normalizeRuntimeDeal).filter(Boolean).slice(0, 12);
  return JSON.stringify({ kind: RUNTIME_CACHE_KIND, version: RUNTIME_CACHE_VERSION, deals: valid });
}
