import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../public/assets/decks/", import.meta.url);
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const suits = ["C", "D", "H", "S"];

async function assertCompleteDeck(deck, filename, back) {
  const files = [back, ...suits.flatMap((suit) => ranks.map((rank) => filename(suit, rank)))];
  assert.equal(files.length, 53);
  for (const file of files) {
    const info = await stat(new URL(`${deck}/${file}`, root));
    assert.ok(info.size > 100, `${deck}/${file} is missing or empty`);
  }
}

test("the letele deck has all 52 faces and its back available before play", async () => {
  await assertCompleteDeck("letele", (suit, rank) => `${suit}-${rank}.svg`, "B-1.svg");
});

test("the woodcut deck has all 52 faces and its back available before play", async () => {
  await assertCompleteDeck("woodcut", (suit, rank) => `${rank}${suit}.svg`, "back.svg");
});
