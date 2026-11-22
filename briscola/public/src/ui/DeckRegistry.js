// SPDX-License-Identifier: GPL-3.0-only

const DEFAULT_CARD_SIZE = Object.freeze({ width: 707, height: 1000, aspectRatio: 0.707 });
const DEFAULT_INDEX_URL = new URL("../../assets/decks/index.json", import.meta.url);

const SUIT_TO_ENGINE = Object.freeze({
  cups: "coppe",
  swords: "spade",
  coins: "denari",
  batons: "bastoni",
  coppe: "coppe",
  spade: "spade",
  denari: "denari",
  bastoni: "bastoni"
});

const RANK_TO_ENGINE = Object.freeze({
  ace: 1,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  jack: 8,
  "8": 8,
  knight: 9,
  "9": 9,
  king: 10,
  "10": 10
});

const FALLBACK_DECK = Object.freeze({
  id: "symbols",
  name: "Simboli",
  kind: "css",
  bundled: true,
  cardCount: 40,
  cardSize: DEFAULT_CARD_SIZE,
  imageFormat: null,
  cardFiles: Object.freeze({}),
  backUrl: null,
  note: "Renderer interno"
});

let byId = new Map([[FALLBACK_DECK.id, FALLBACK_DECK]]);
const preloadedImages = new Map();

function assertManifest(condition, message) {
  if (!condition) throw new Error(`Deck manifest non valido: ${message}`);
}

function toAbsoluteUrl(path, baseUrl) {
  return new URL(path, baseUrl).href;
}

export function getDeckAspectRatio(deck) {
  const width = Number(deck?.cardSize?.width);
  const height = Number(deck?.cardSize?.height);
  if (width > 0 && height > 0) return width / height;

  const declared = Number(deck?.cardSize?.aspectRatio);
  if (declared > 0) return declared;

  return DEFAULT_CARD_SIZE.width / DEFAULT_CARD_SIZE.height;
}

export function parseDeckManifest(manifest, { manifestUrl } = {}) {
  assertManifest(manifest && typeof manifest === "object", "JSON mancante");
  assertManifest(manifest.format === "briscolab-deck-manifest", `format '${manifest.format ?? ""}' non supportato`);
  assertManifest(Number(manifest.version) === 1, `version '${manifest.version ?? ""}' non supportata`);
  assertManifest(typeof manifest.slug === "string" && manifest.slug.length > 0, "slug mancante");
  assertManifest(typeof manifest.title === "string" && manifest.title.length > 0, "title mancante");
  assertManifest(Array.isArray(manifest.cards), "cards deve essere un array");
  assertManifest(Number(manifest.cardCount) === manifest.cards.length, "cardCount non coincide con cards.length");

  const width = Number(manifest.cardSize?.width);
  const height = Number(manifest.cardSize?.height);
  const declaredAspect = Number(manifest.cardSize?.aspectRatio);
  assertManifest((width > 0 && height > 0) || declaredAspect > 0, "cardSize deve indicare width/height o aspectRatio");

  const baseUrl = manifestUrl
    ? new URL(".", manifestUrl).href
    : new URL(`../../assets/decks/${manifest.deckFolder ?? manifest.slug}/`, import.meta.url).href;

  const cardFiles = {};
  for (const item of manifest.cards) {
    const engineSuit = SUIT_TO_ENGINE[item.suit];
    const engineRank = RANK_TO_ENGINE[String(item.rank).toLowerCase()];
    assertManifest(engineSuit, `seme '${item.suit}' non supportato`);
    assertManifest(engineRank, `rango '${item.rank}' non supportato`);
    assertManifest(typeof item.file === "string" && item.file.length > 0, `file mancante per ${item.id ?? "carta"}`);

    const logicalId = `${engineSuit}-${engineRank}`;
    assertManifest(!cardFiles[logicalId], `carta logica duplicata '${logicalId}'`);
    cardFiles[logicalId] = toAbsoluteUrl(item.file, baseUrl);
  }

  assertManifest(Object.keys(cardFiles).length === 40, `un mazzo italian-40 deve mappare 40 carte, trovate ${Object.keys(cardFiles).length}`);

  const backUrl = manifest.back?.file ? toAbsoluteUrl(manifest.back.file, baseUrl) : null;
  const cardSize = Object.freeze({
    width: width > 0 ? width : null,
    height: height > 0 ? height : null,
    aspectRatio: declaredAspect > 0 ? declaredAspect : null
  });

  const deck = {
    id: manifest.slug,
    name: manifest.title,
    kind: "image",
    bundled: true,
    cardCount: Number(manifest.cardCount),
    deckType: manifest.deckType ?? null,
    deckFolder: manifest.deckFolder ?? manifest.slug,
    cardSize,
    imageFormat: manifest.imageFormat ?? null,
    cardFiles: Object.freeze(cardFiles),
    backUrl,
    manifestUrl: manifestUrl ? String(manifestUrl) : null,
    manifest: Object.freeze({ ...manifest }),
    note: [
      `${manifest.cardCount} carte`,
      width > 0 && height > 0 ? `${width}×${height}` : null,
      manifest.imageFormat ? String(manifest.imageFormat).toUpperCase() : null
    ].filter(Boolean).join(" · ")
  };

  return Object.freeze(deck);
}

export async function initializeDeckRegistry({ indexUrl = DEFAULT_INDEX_URL, fetchImpl = globalThis.fetch } = {}) {
  byId = new Map([[FALLBACK_DECK.id, FALLBACK_DECK]]);
  if (typeof fetchImpl !== "function") return listDecks();

  try {
    const resolvedIndexUrl = indexUrl instanceof URL ? indexUrl : new URL(indexUrl, import.meta.url);
    const indexResponse = await fetchImpl(resolvedIndexUrl);
    if (!indexResponse.ok) throw new Error(`HTTP ${indexResponse.status}`);
    const index = await indexResponse.json();
    if (index.format !== "briscolab-deck-index" || Number(index.version) !== 1 || !Array.isArray(index.decks)) {
      throw new Error("indice deck non valido");
    }

    for (const item of index.decks) {
      try {
        const manifestUrl = new URL(item.manifest, resolvedIndexUrl);
        const response = await fetchImpl(manifestUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const deck = parseDeckManifest(await response.json(), { manifestUrl });
        byId.set(deck.id, deck);
      } catch (error) {
        console.warn("BriscoLab: deck ignorato", item?.manifest, error);
      }
    }
  } catch (error) {
    console.warn("BriscoLab: impossibile caricare assets/decks/index.json; uso il renderer simbolico", error);
  }

  return listDecks();
}

export function listDecks() {
  return [...byId.values()];
}

export function getDeck(id) {
  return byId.get(id) ?? FALLBACK_DECK;
}

export function getCardImageUrl(deck, card) {
  if (!deck || deck.kind !== "image" || !card?.id) return null;
  return deck.cardFiles?.[card.id] ?? null;
}

export function getDeckBackUrl(deck) {
  return deck?.kind === "image" ? (deck.backUrl ?? null) : null;
}

function preloadImage(url, ImageCtor) {
  if (preloadedImages.has(url)) return preloadedImages.get(url);

  const promise = new Promise((resolve, reject) => {
    const image = new ImageCtor();
    image.decoding = "async";
    image.addEventListener("load", async () => {
      try {
        await image.decode?.();
        resolve(image);
      } catch (error) {
        reject(new Error(`Impossibile decodificare l'immagine '${url}'`, { cause: error }));
      }
    }, { once: true });
    image.addEventListener("error", () => {
      reject(new Error(`Impossibile caricare l'immagine '${url}'`));
    }, { once: true });
    image.src = url;
  }).catch((error) => {
    preloadedImages.delete(url);
    throw error;
  });

  preloadedImages.set(url, promise);
  return promise;
}

/** Load and decode every face and the back before a game starts. */
export async function preloadDeckImages(deck, {
  ImageCtor = globalThis.Image,
  onProgress = null
} = {}) {
  if (!deck || deck.kind !== "image") return Object.freeze({ loaded: 0, total: 0 });
  if (typeof ImageCtor !== "function") throw new Error("Il browser non supporta il precaricamento delle immagini");

  const urls = [...new Set([
    ...Object.values(deck.cardFiles ?? {}),
    deck.backUrl
  ].filter(Boolean))];
  let loaded = 0;
  await Promise.all(urls.map(async (url) => {
    await preloadImage(url, ImageCtor);
    loaded += 1;
    onProgress?.({ loaded, total: urls.length, url });
  }));
  return Object.freeze({ loaded, total: urls.length });
}
