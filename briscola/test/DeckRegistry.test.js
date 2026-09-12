// SPDX-License-Identifier: GPL-3.0-only
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  getCardImageUrl,
  getDeckAspectRatio,
  getDeckBackUrl,
  parseDeckManifest,
  preloadDeckImages
} from "../src/ui/DeckRegistry.js";

async function loadDeck(folder) {
  const manifestPath = fileURLToPath(new URL(`../assets/decks/${folder}/briscolab_manifest.json`, import.meta.url));
  const manifestUrl = pathToFileURL(manifestPath);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  return { manifest, deck: parseDeckManifest(manifest, { manifestUrl }) };
}

test("Viterbesi manifest maps all 40 logical Briscola cards", async () => {
  const { deck } = await loadDeck("viterbesi-murari-1900");
  assert.equal(deck.id, "viterbesi-murari-1900");
  assert.equal(Object.keys(deck.cardFiles).length, 40);
  assert.match(getCardImageUrl(deck, { id: "coppe-1" }), /cups_ace\.png$/);
  assert.match(getCardImageUrl(deck, { id: "spade-10" }), /swords_king\.png$/);
  assert.match(getCardImageUrl(deck, { id: "denari-9" }), /coins_knight\.png$/);
  assert.match(getCardImageUrl(deck, { id: "bastoni-8" }), /batons_jack\.png$/);
  assert.match(getDeckBackUrl(deck), /back\.png$/);
  assert.equal("insetPercent" in (deck.manifest.back ?? {}), false);
});

test("Pignalosa manifest maps all 40 logical Briscola cards", async () => {
  const { deck } = await loadDeck("napoletane-pignalosa-1882");
  assert.equal(deck.id, "napoletane-pignalosa-1882");
  assert.equal(Object.keys(deck.cardFiles).length, 40);
  assert.match(getCardImageUrl(deck, { id: "denari-1" }), /coins_ace\.png$/);
  assert.match(getCardImageUrl(deck, { id: "coppe-8" }), /cups_jack\.png$/);
  assert.match(getCardImageUrl(deck, { id: "spade-10" }), /swords_king\.png$/);
  assert.match(getCardImageUrl(deck, { id: "bastoni-9" }), /batons_knight\.png$/);
  assert.match(getDeckBackUrl(deck), /back\.png$/);
  assert.equal("insetPercent" in (deck.manifest.back ?? {}), false);
});

test("deck geometry trusts width/height over rounded aspectRatio", async () => {
  const { manifest, deck } = await loadDeck("viterbesi-murari-1900");
  assert.equal(deck.cardSize.width, 315);
  assert.equal(deck.cardSize.height, 580);
  assert.equal(getDeckAspectRatio(deck), 315 / 580);
  assert.notEqual(getDeckAspectRatio(deck), manifest.cardSize.aspectRatio);
});

test("deck index preserves both bundled historical decks", async () => {
  const index = JSON.parse(await readFile(new URL("../assets/decks/index.json", import.meta.url), "utf8"));
  const manifests = index.decks.map((item) => item.manifest).sort();
  assert.deepEqual(manifests, [
    "./napoletane-pignalosa-1882/briscolab_manifest.json",
    "./viterbesi-murari-1900/briscolab_manifest.json"
  ]);
});

test("all deck faces and the back are decoded once before play", async () => {
  let instances = 0;
  let decodes = 0;
  class FakeImage {
    constructor() {
      instances += 1;
      this.listeners = {};
    }
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    }
    set src(value) {
      this.value = value;
      queueMicrotask(() => this.listeners.load());
    }
    async decode() {
      decodes += 1;
    }
  }

  const deck = {
    kind: "image",
    cardFiles: { a: "test://preload/face-a", b: "test://preload/face-b" },
    backUrl: "test://preload/back"
  };
  const progress = [];
  assert.deepEqual(
    await preloadDeckImages(deck, { ImageCtor: FakeImage, onProgress: (item) => progress.push(item.loaded) }),
    { loaded: 3, total: 3 }
  );
  assert.equal(instances, 3);
  assert.equal(decodes, 3);
  assert.equal(progress.length, 3);

  await preloadDeckImages(deck, { ImageCtor: FakeImage });
  assert.equal(instances, 3, "the retained preload cache should reuse decoded images");
});

test("symbolic deck needs no image preload", async () => {
  assert.deepEqual(await preloadDeckImages({ kind: "css" }), { loaded: 0, total: 0 });
});
