import assert from "node:assert/strict";
import test from "node:test";
import { shuffledMinimalDeal } from "../src/solver/minimal-klondike-js.js";
import {
  RUNTIME_CACHE_KIND,
  RUNTIME_CACHE_VERSION,
  normalizeRuntimeDeal,
  parseRuntimeDealCache,
  serializeRuntimeDealCache,
} from "../public/src/runtime-deal-cache.js";

const validDeal = () => ({
  id: "js-3-1987", seed: 1987, drawCount: 3,
  encoded: shuffledMinimalDeal(1987), expectedMoves: 121, states: 4567,
  sourceTest: "MinimalKlondike JS on-demand",
});

test("runtime cache round-trips only complete certified browser deals", () => {
  const encoded = serializeRuntimeDealCache([validDeal()]);
  const parsed = parseRuntimeDealCache(encoded);
  assert.equal(parsed.length, 1);
  assert.deepEqual(parsed[0], validDeal());
});

test("runtime cache rejects old schemas, malformed cards and duplicate cards", () => {
  const deal = validDeal();
  const duplicate = { ...deal, encoded: deal.encoded.slice(0, 153) + deal.encoded.slice(0, 3) };
  assert.equal(parseRuntimeDealCache(JSON.stringify([deal])).length, 0);
  assert.equal(parseRuntimeDealCache(JSON.stringify({ kind: RUNTIME_CACHE_KIND, version: RUNTIME_CACHE_VERSION + 1, deals: [deal] })).length, 0);
  assert.equal(normalizeRuntimeDeal(duplicate), null);
  assert.equal(normalizeRuntimeDeal({ ...deal, drawCount: 2 }), null);
  assert.equal(normalizeRuntimeDeal({ ...deal, sourceTest: "bundled catalog" }), null);
});

test("runtime cache drops invalid entries and caps its local reserve", () => {
  const deals = Array.from({ length: 15 }, (_, index) => ({ ...validDeal(), id: `js-3-${index}`, seed: index }));
  const parsed = parseRuntimeDealCache(serializeRuntimeDealCache([{}, ...deals]));
  assert.equal(parsed.length, 12);
  assert.ok(parsed.every((deal) => deal.id.startsWith("js-3-")));
});
