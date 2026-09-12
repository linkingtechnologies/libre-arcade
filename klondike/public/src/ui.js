// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import sprite from "./sprite.js";
import {
  availableDestinations,
  clickCard,
  createReferenceGame,
  drawCards,
  isWon,
  locate,
  moveTo,
  recycleWaste,
} from "./engine.js";
import { cardsFromMinimalDeal } from "./deal-codec.js";
import { parseRuntimeDealCache, serializeRuntimeDealCache } from "./runtime-deal-cache.js";
import { planAutoFinish } from "./auto-finish.js";

const CARD_W = 71;
const CARD_H = 96;
const HOLD_MS = 200;
const MOBILE_BASE_WIDTH = 660;
const suitRow = { h: 1, c: 2, d: 3, s: 4 };
const DECK_IDS = new Set(["historical", "readable", "letele", "woodcut"]);
const SVG_DECKS = new Set(["letele", "woodcut"]);
const DECK_ASSET_VERSION = "63";
const DECK_ASSET_BASE = new URL("../assets/decks/", import.meta.url);
const DRAW_PREFERENCE = "grugnetto-klondike-draw-mode";
const deckLoads = new Map();
const spriteImage = new Image();
spriteImage.src = sprite;
const els = {
  felt: document.querySelector("#felt"), stock: document.querySelector("#stock"),
  waste: document.querySelector("#waste"), foundations: document.querySelector("#foundations"),
  tableau: document.querySelector("#tableau"), status: document.querySelector("#status"),
  moves: document.querySelector("#moves"), timer: document.querySelector("#timer"),
  drawIndicator: document.querySelector("#draw-indicator"),
  undo: document.querySelector("#undo"), drawMode: document.querySelector("#draw-mode"),
  cardDeck: document.querySelector("#card-deck"),
  menuToggle: document.querySelector("#menu-toggle"), menuPanel: document.querySelector("#menu-panel"),
  language: document.querySelector("#language"), dialog: document.querySelector("#info-dialog"),
  dialogTitle: document.querySelector("#info-title"), dialogContent: document.querySelector("#info-content"),
  autoFinish: document.querySelector("#auto-finish"), soundToggle: document.querySelector("#sound-toggle"),
  generationOverlay: document.querySelector("#generation-overlay"),
  generationMessage: document.querySelector("#generation-message"),
  generationAction: document.querySelector("#generation-action"),
  resetDialog: document.querySelector("#reset-dialog"),
  resetCancel: document.querySelector("#reset-cancel"),
  resetConfirm: document.querySelector("#reset-confirm"),
  abandonDialog: document.querySelector("#abandon-dialog"),
  abandonCancel: document.querySelector("#abandon-cancel"),
  abandonConfirm: document.querySelector("#abandon-confirm"),
};
const COPY = {
  it: { newGame: "Nuova partita", undo: "Annulla", hint: "Suggerimento", autoFinish: "Completa automaticamente", soundOff: "Suoni disattivati", soundOn: "Suoni attivati", abandon: "Abbandonare la partita in corso?", completing: "Avvio il completamento automatico…", notCompletable: "Il finale non è ancora completabile in sicurezza.", draw: "Pesca", oneCard: "1 carta", threeCards: "3 carte", deck: "Mazzo", historicalDeck: "Storico 2017", readableDeck: "Alta leggibilità", leteleDeck: "Classico HD", woodcutDeck: "Incisione storica", loadingDeck: "Carico e preparo tutte le 53 immagini del mazzo…", deckChanged: "Mazzo cambiato: la partita resta invariata.", deckLoadFailed: "Una carta non è stata caricata: uso il mazzo ad alta leggibilità.", generating: "Cerco una nuova partita risolvibile…", candidate: "Provo una nuova distribuzione", cancel: "Annulla", retry: "Riprova", generationCancelled: "Ricerca annullata. Puoi riprovare quando vuoi.", generationTimedOut: "La ricerca ha superato 30 secondi ed è stata fermata.", generationFailed: "Non ho trovato una partita risolvibile entro il limite. Riprova.", generatedDeal: "partita risolvibile: il solver ha trovato una soluzione", rules: "Regole", stats: "Statistiche", provenance: "Provenienza", licenses: "Licenze", language: "Lingua", artifacts: "2 reperti MIT + 2 mazzi CC0", welcome: "Scegli pesca 1 o 3 e inizia una nuova partita risolvibile.", footer: "Restauro: gioco da js-solitaire; solver da MinimalKlondike; mazzi SVG CC0.", moves: "Mosse", time: "Tempo", resumed: "Partita ripresa automaticamente.", undone: "Ultima mossa annullata.", noMove: "Questa carta non ha una destinazione valida.", manual: "Carta spostata manualmente.", invalid: "Mossa non valida: la carta torna al suo posto.", analysing: "Analizzo la posizione attuale…", won: "Partita completata! Tocca l’animazione per chiuderla." },
  en: { newGame: "New game", undo: "Undo", hint: "Hint", autoFinish: "Auto-complete", soundOff: "Sounds off", soundOn: "Sounds on", abandon: "Abandon the current game?", completing: "Starting auto-completion…", notCompletable: "The ending cannot yet be completed safely.", draw: "Draw", oneCard: "1 card", threeCards: "3 cards", deck: "Deck", historicalDeck: "Historical 2017", readableDeck: "High visibility", leteleDeck: "Classic HD", woodcutDeck: "Historical woodcut", loadingDeck: "Loading all 53 deck images in advance…", deckChanged: "Deck changed: the game is unchanged.", deckLoadFailed: "A card could not be loaded: using the high-visibility deck.", generating: "Looking for a new solvable game…", candidate: "Trying a new deal", cancel: "Cancel", retry: "Retry", generationCancelled: "Search cancelled. You can retry whenever you like.", generationTimedOut: "The search exceeded 30 seconds and was stopped.", generationFailed: "No solvable game was found within the limit. Retry.", generatedDeal: "solvable game: the solver found a solution", rules: "Rules", stats: "Statistics", provenance: "Provenance", licenses: "Licenses", language: "Language", artifacts: "2 MIT artifacts + 2 CC0 decks", welcome: "Choose draw 1 or 3 and start a new solvable game.", footer: "Restoration: game from js-solitaire; solver from MinimalKlondike; CC0 SVG decks.", moves: "Moves", time: "Time", resumed: "Game resumed automatically.", undone: "Last move undone.", noMove: "This card has no valid destination.", manual: "Card moved manually.", invalid: "Invalid move: the card returns to its place.", analysing: "Analysing the current position…", won: "Game completed! Tap the animation to close it." },
};
Object.assign(COPY.it, {
  resetLocalData: "Azzera dati locali",
  resetLocalConfirm: "Cancellare partita salvata, partite generate, statistiche e preferenze di Grugnetto’s Klondike?",
  resetTitle: "Azzerare i dati locali?",
  resetDescription: "Verranno eliminate la partita salvata, le statistiche, le preferenze e le distribuzioni generate su questo dispositivo.",
  resetCancel: "Annulla",
  resetConfirm: "Azzera",
  newGameTitle: "Nuova partita?",
  newGameConfirm: "Nuova partita",
  loadingDeck: "Preparo il mazzo…",
  generatedDeal: "Nuova partita pronta.",
  drewOne: "Hai pescato una carta.",
  drewThree: "Hai pescato tre carte.",
  recycled: "Gli scarti sono tornati nel tallone.",
  cardMoved: "Carta spostata.",
  dragHelp: "Trascina la carta su una posizione evidenziata.",
  hintTimedOut: "Non ho trovato un suggerimento in tempo.",
  noSolutionHere: "Non vedo una soluzione da questa posizione.",
  hintUnavailable: "Suggerimento non disponibile.",
  nextDrawOne: "La prossima partita sarà a pesca 1.",
  nextDrawThree: "La prossima partita sarà a pesca 3.",
  cardLoadError: "Non riesco a caricare le carte. Ricarica la pagina.",
  openMenu: "Apri menu",
  closeMenu: "Chiudi menu",
  table: "Tavolo da gioco",
  stock: "Tallone",
  waste: "Scarti",
  foundations: "Fondazioni",
  tableau: "Tableau",
  cardBack: "Carta coperta",
  drawStock: "Pesca dal tallone",
  recycleStock: "Rimetti gli scarti nel tallone",
  close: "Chiudi",
  historicalDeck: "Originale",
  provenance: "Informazioni",
});
Object.assign(COPY.en, {
  resetLocalData: "Reset local data",
  resetLocalConfirm: "Delete Grugnetto’s Klondike's saved game, generated deals, statistics and preferences?",
  resetTitle: "Reset local data?",
  resetDescription: "This removes the saved game, statistics, preferences and generated deals from this device.",
  resetCancel: "Cancel",
  resetConfirm: "Reset",
  newGameTitle: "New game?",
  newGameConfirm: "New game",
  loadingDeck: "Preparing the deck…",
  generatedDeal: "New game ready.",
  drewOne: "You drew one card.",
  drewThree: "You drew three cards.",
  recycled: "The waste cards are back in the stock.",
  cardMoved: "Card moved.",
  dragHelp: "Drag the card to a highlighted position.",
  hintTimedOut: "I could not find a hint in time.",
  noSolutionHere: "I cannot see a solution from this position.",
  hintUnavailable: "Hint unavailable.",
  nextDrawOne: "The next game will use draw 1.",
  nextDrawThree: "The next game will use draw 3.",
  cardLoadError: "The cards could not be loaded. Reload the page.",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  table: "Game table",
  stock: "Stock",
  waste: "Waste",
  foundations: "Foundations",
  tableau: "Tableau",
  cardBack: "Face-down card",
  drawStock: "Draw from the stock",
  recycleStock: "Return the waste cards to the stock",
  close: "Close",
  historicalDeck: "Original",
  provenance: "About",
});
let language = localStorage.getItem("grugnetto-klondike-language") === "en" ? "en" : "it";
const t = (key) => COPY[language][key] ?? key;
let game = null;
let currentDrawCount = 3;
let preferredDrawCount = localStorage.getItem(DRAW_PREFERENCE) === "1" ? 1 : 3;
let previousDealId = null;
let activeSolver = null;
const SOLVED_CACHE = "klondike-lab-runtime-solved-v3";
const SAVED_GAME = "grugnetto-klondike-current-v1";
const STATS_KEY = "grugnetto-klondike-stats-v1";
const LOCAL_DATA_KEYS = [
  SOLVED_CACHE,
  "klondike-lab-runtime-solved-v1",
  "klondike-lab-runtime-solved-v2",
  SAVED_GAME,
  STATS_KEY,
  "grugnetto-klondike-language",
  "grugnetto-klondike-sound",
  "grugnetto-klondike-deck",
  DRAW_PREFERENCE,
];
let gesture = null;
let winShown = false;
let winRecorded = false;
let uiScale = 1;
let history = [];
let movesCount = 0;
let elapsedBase = 0;
let startedAt = Date.now();
let autoPlan = null;
let autoRunning = false;
let soundEnabled = localStorage.getItem("grugnetto-klondike-sound") === "on";
let cardDeck = DECK_IDS.has(localStorage.getItem("grugnetto-klondike-deck")) ? localStorage.getItem("grugnetto-klondike-deck") : "letele";
let audioContext = null;
let generationWorker = null;
let generationPromise = null;
let cancelActiveGeneration = null;
const GENERATION_MAX_STATES = 8000;
const FOREGROUND_BATCH_ATTEMPTS = 1;
const BACKGROUND_BATCH_ATTEMPTS = 4;
// A cold mobile browser can fail while it is still fetching and compiling the
// worker module graph. Retry with breathing room instead of surfacing an error
// that immediately disappears when the player taps Retry.
const FOREGROUND_WORKER_RETRY_DELAYS = [250, 500, 1000, 2000, 3500, 5000, 7500, 10000];

function fitTableToScreen() {
  const shell = document.querySelector(".game-shell");
  const desktop = document.querySelector(".desktop");
  if (window.innerWidth <= 720) {
    uiScale = Math.min(1, (window.innerWidth - 4) / MOBILE_BASE_WIDTH);
    // Chromium mobile supports zoom as a layout scale: unlike transform it
    // cannot leave the left half of an oversized, previously centred box off-screen.
    desktop.style.display = "block";
    desktop.style.width = "100%";
    desktop.style.padding = "2px";
    shell.style.width = `${MOBILE_BASE_WIDTH}px`;
    shell.style.minWidth = `${MOBILE_BASE_WIDTH}px`;
    shell.style.margin = "0";
    shell.style.transform = "none";
    shell.style.zoom = uiScale;
    desktop.style.height = `${Math.ceil(shell.offsetHeight * uiScale + 4)}px`;
  } else {
    uiScale = 1;
    desktop.style.display = "";
    desktop.style.width = "";
    desktop.style.padding = "";
    shell.style.width = "";
    shell.style.minWidth = "";
    shell.style.margin = "";
    shell.style.transform = "";
    shell.style.zoom = "";
    desktop.style.height = "";
  }
}

function say(message) { els.status.textContent = message; }
function playSound(kind = "move") {
  if (!soundEnabled) return;
  audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = kind === "win" ? 660 : kind === "draw" ? 220 : 380;
  gain.gain.setValueAtTime(.045, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + (kind === "win" ? .32 : .08));
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(); oscillator.stop(audioContext.currentTime + (kind === "win" ? .32 : .08));
}
function readStats() {
  try { return { started: 0, won: 0, totalMoves: 0, bestTime: null, ...JSON.parse(localStorage.getItem(STATS_KEY) ?? "{}") }; }
  catch { return { started: 0, won: 0, totalMoves: 0, bestTime: null }; }
}
function writeStats(stats) { try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {} }
function applyLanguage() {
  document.documentElement.lang = language;
  els.language.value = language;
  els.cardDeck.value = cardDeck;
  document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
  els.soundToggle.querySelector("b").textContent = t(soundEnabled ? "soundOn" : "soundOff");
  els.soundToggle.querySelector("span").textContent = soundEnabled ? "🔊" : "🔇";
  els.soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  document.querySelector("#felt").setAttribute("aria-label", t("table"));
  document.querySelector("#stock").setAttribute("aria-label", t("stock"));
  document.querySelector("#waste").setAttribute("aria-label", t("waste"));
  document.querySelector("#foundations").setAttribute("aria-label", t("foundations"));
  document.querySelector("#tableau").setAttribute("aria-label", t("tableau"));
  document.querySelector("#info-close").setAttribute("aria-label", t("close"));
  els.menuToggle.setAttribute("aria-label", t(els.menuPanel.hidden ? "openMenu" : "closeMenu"));
  if (game) render(); else updateHud();
}
function setMenu(open) {
  els.menuPanel.hidden = !open;
  els.menuToggle.setAttribute("aria-expanded", String(open));
  els.menuToggle.setAttribute("aria-label", t(open ? "closeMenu" : "openMenu"));
  if (open) requestAnimationFrame(() => els.menuPanel.querySelector("button:not([disabled]), select")?.focus());
}
function cloneGame(value = game) { return JSON.parse(JSON.stringify(value)); }
function elapsedMs() { return elapsedBase + (!game || isWon(game) ? 0 : Date.now() - startedAt); }
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
function updateHud() {
  els.drawIndicator.textContent = `${t("draw")} ${currentDrawCount}`;
  els.drawIndicator.setAttribute("aria-label", `${t("draw")}: ${currentDrawCount === 1 ? t("oneCard") : t("threeCards")}`);
  els.moves.textContent = `${t("moves")} ${movesCount}`;
  els.timer.textContent = `${t("time")} ${formatTime(elapsedMs())}`;
  els.undo.disabled = history.length === 0;
  document.querySelector("#hint").disabled = !game || Boolean(activeSolver);
  els.drawMode.value = String(preferredDrawCount);
  els.autoFinish.disabled = !game || !autoPlan || autoRunning;
}
function saveGame() {
  if (!game) return;
  try {
    localStorage.setItem(SAVED_GAME, JSON.stringify({ game, currentDrawCount, previousDealId, movesCount, elapsedMs: elapsedMs(), winRecorded }));
  } catch { /* The game remains playable when browser storage is disabled. */ }
}
function checkpoint() {
  history.push({ game: cloneGame(), movesCount, elapsedMs: elapsedMs() });
  if (history.length > 100) history.shift();
}
function commitMove(message) {
  movesCount++;
  playSound("move");
  say(message);
  render();
  saveGame();
}
function undoMove() {
  const previous = history.pop();
  if (!previous) return;
  game = previous.game;
  movesCount = previous.movesCount;
  elapsedBase = previous.elapsedMs;
  startedAt = Date.now();
  winShown = false;
  document.querySelector(".win-canvas")?.remove();
  say(t("undone"));
  render();
  saveGame();
}
function restoreSavedGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_GAME));
    if (!saved?.game?.cards || saved.game.cards.length !== 52) return false;
    game = saved.game;
    currentDrawCount = saved.currentDrawCount === 1 ? 1 : 3;
    previousDealId = saved.previousDealId ?? null;
    movesCount = Number(saved.movesCount) || 0;
    elapsedBase = Number(saved.elapsedMs) || 0;
    winRecorded = Boolean(saved.winRecorded);
    startedAt = Date.now();
    say(t("resumed"));
    return true;
  } catch { return false; }
}
function resetLocalData() {
  setMenu(false);
  els.resetDialog.showModal();
}
function removeAppStorage(storage) {
  const prefixes = ["grugnetto-klondike-", "klondike-lab-"];
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(Boolean);
  for (const key of new Set([...LOCAL_DATA_KEYS, ...keys.filter((item) => prefixes.some((prefix) => item.startsWith(prefix)))])) {
    try { storage.removeItem(key); } catch { /* Ignore unavailable browser storage. */ }
  }
}
async function confirmResetLocalData() {
  els.resetConfirm.disabled = true;
  cancelActiveGeneration?.();
  activeSolver?.terminate();
  generationWorker?.terminate();
  removeAppStorage(localStorage);
  removeAppStorage(sessionStorage);
  try {
    if ("caches" in window) await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
  } catch { /* Cache Storage may be unavailable in a private browser. */ }
  try {
    const registrations = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((registrations ?? []).map((registration) => registration.unregister()));
  } catch { /* No service worker is required by the game. */ }
  window.location.replace(`./index.html?reset=${Date.now()}`);
}
function paintCard(canvas, card) {
  const context = canvas.getContext("2d");
  const sourceX = CARD_W * (suitRow[card.suit] - 1);
  const sourceY = CARD_H * (card.rank - 1);
  context.clearRect(0, 0, CARD_W, CARD_H);
  context.drawImage(spriteImage, sourceX, sourceY, CARD_W, CARD_H, 0, 0, CARD_W, CARD_H);
}
function cardRank(card) {
  return card.rank === 1 ? "A" : card.rank === 11 ? "J" : card.rank === 12 ? "Q" : card.rank === 13 ? "K" : String(card.rank);
}
function deckCardUrl(deck, card = null) {
  if (!card) {
    const back = deck === "letele" ? "letele/B-1.svg" : "woodcut/back.svg";
    return `${new URL(back, DECK_ASSET_BASE).href}?v=${DECK_ASSET_VERSION}`;
  }
  const suit = card.suit.toUpperCase();
  const rank = cardRank(card);
  const path = deck === "letele" ? `letele/${suit}-${rank}.svg` : `woodcut/${rank}${suit}.svg`;
  return `${new URL(path, DECK_ASSET_BASE).href}?v=${DECK_ASSET_VERSION}`;
}
function svgDeckUrls(deck) {
  const urls = [deckCardUrl(deck)];
  for (const suit of ["c", "d", "h", "s"]) for (let rank = 1; rank <= 13; rank++) urls.push(deckCardUrl(deck, { suit, rank }));
  return urls;
}
function loadDeckImageOnce(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(url);
    image.onerror = () => reject(new Error(`Unable to preload ${url}`));
    image.src = url;
  });
}
async function loadDeckImage(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await loadDeckImageOnce(attempt ? `${url}&retry=${attempt}` : url); }
    catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }
}
async function preloadDeckInBatches(urls, concurrency = 6) {
  let next = 0;
  async function worker() {
    while (next < urls.length) await loadDeckImage(urls[next++]);
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
}
function preloadDeck(deck) {
  if (!SVG_DECKS.has(deck)) return Promise.resolve();
  if (!deckLoads.has(deck)) {
    const loading = preloadDeckInBatches(svgDeckUrls(deck)).catch((error) => {
      deckLoads.delete(deck);
      throw error;
    });
    deckLoads.set(deck, loading);
  }
  return deckLoads.get(deck);
}
function appendReadableCard(node, card) {
  node.classList.remove("deck-letele", "deck-woodcut");
  node.classList.add("deck-readable");
  if (!card) return;
  const rank = cardRank(card);
  const suit = { h: "♥", d: "♦", c: "♣", s: "♠" }[card.suit];
  node.classList.toggle("red", card.suit === "h" || card.suit === "d");
  const corner = document.createElement("span"); corner.className = "card-index"; corner.textContent = `${rank}${suit}`;
  const center = document.createElement("span"); center.className = "card-suit"; center.textContent = suit;
  node.append(corner, center);
}
function useReadableDeckFallback({ rerender = true } = {}) {
  if (cardDeck === "readable") return;
  cardDeck = "readable";
  els.cardDeck.value = cardDeck;
  localStorage.setItem("grugnetto-klondike-deck", cardDeck);
  say(t("deckLoadFailed"));
  if (rerender && game) render();
}
function makeSvgDeckImage(deck, card, node) {
  const image = document.createElement("img");
  image.className = "card-image"; image.alt = ""; image.draggable = false;
  image.setAttribute("aria-hidden", "true");
  const url = deckCardUrl(deck, card);
  let retries = 0;
  image.addEventListener("error", () => {
    if (cardDeck !== deck) return;
    if (retries < 2) {
      retries++;
      setTimeout(() => { image.src = `${url}&retry=${retries}`; }, 200 * retries);
      return;
    }
    useReadableDeckFallback();
  });
  image.src = url;
  return image;
}
function makeCard(id, top = 0, pileCard = true) {
  const card = game.cards[id];
  const node = document.createElement("button");
  node.type = "button";
  node.className = `card deck-${cardDeck} ${card.faceUp ? "face-up" : "face-down"}`;
  node.style.top = `${top}px`;
  if (card.faceUp) {
    if (cardDeck === "historical") {
      const canvas = document.createElement("canvas");
      canvas.width = CARD_W; canvas.height = CARD_H;
      canvas.setAttribute("aria-hidden", "true");
      if (spriteImage.complete) paintCard(canvas, card);
      else spriteImage.addEventListener("load", () => paintCard(canvas, card), { once: true });
      node.append(canvas);
    } else if (cardDeck === "readable") {
      appendReadableCard(node, card);
    } else node.append(makeSvgDeckImage(cardDeck, card, node));
  } else if (SVG_DECKS.has(cardDeck)) {
    node.append(makeSvgDeckImage(cardDeck, null, node));
  }
  node.dataset.card = id;
  node.setAttribute("aria-label", card.faceUp ? cardLabel(card) : t("cardBack"));
  if (pileCard && card.faceUp) {
    node.addEventListener("pointerdown", beginGesture);
    node.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      automaticMove(id);
    });
  }
  return node;
}
function cardLabel(card) {
  const ranks = language === "en"
    ? ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"]
    : ["Asso", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Fante", "Donna", "Re"];
  const suits = language === "en"
    ? { h: "hearts", d: "diamonds", c: "clubs", s: "spades" }
    : { h: "cuori", d: "quadri", c: "fiori", s: "picche" };
  return language === "en" ? `${ranks[card.rank - 1]} of ${suits[card.suit]}` : `${ranks[card.rank - 1]} di ${suits[card.suit]}`;
}
function tableauTop(pile, index) {
  let top = 0;
  const faceGap = window.innerWidth <= 720 ? 25 : Math.max(13, Math.min(18, Math.floor((window.innerHeight - 370) / 12)));
  const downGap = window.innerWidth <= 720 ? 8 : 6;
  for (let i = 0; i < index; i++) top += game.cards[pile[i]].faceUp ? faceGap : downGap;
  return top;
}
function render() {
  els.stock.replaceChildren(); els.waste.replaceChildren();
  els.foundations.replaceChildren(); els.tableau.replaceChildren();
  if (!game) { updateHud(); return; }
  els.stock.className = `slot ${game.stock.length ? "" : "empty-stock"}`;
  els.waste.className = `slot ${currentDrawCount === 3 ? "waste-fan" : ""}`;
  els.stock.onclick = deal;
  els.stock.onkeydown = null;
  els.stock.removeAttribute("role");
  els.stock.tabIndex = -1;
  if (game.stock.length) {
    const stockCard = makeCard(game.stock.at(-1), 0, false);
    stockCard.setAttribute("aria-label", t("drawStock"));
    els.stock.append(stockCard);
  } else if (game.waste.length) {
    els.stock.setAttribute("role", "button");
    els.stock.setAttribute("aria-label", t("recycleStock"));
    els.stock.tabIndex = 0;
    els.stock.onkeydown = (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      deal();
    };
  }
  if (game.waste.length) {
    const visibleWaste = currentDrawCount === 3 ? game.waste.slice(-3) : game.waste.slice(-1);
    visibleWaste.forEach((id, index) => {
      const isTop = index === visibleWaste.length - 1;
      const card = makeCard(id, 0, isTop);
      card.style.left = `${currentDrawCount === 3 ? index * 12 : 0}px`;
      card.style.zIndex = String(index + 1);
      if (!isTop) { card.tabIndex = -1; card.setAttribute("aria-hidden", "true"); }
      els.waste.append(card);
    });
  }
  game.foundations.forEach((pile, index) => {
    const slot = document.createElement("div");
    slot.className = `slot ${pile.length ? "" : "empty-foundation"}`;
    slot.dataset.dropArea = `foundations:${index}`;
    slot.setAttribute("aria-label", `${t("foundations")} ${index + 1}`);
    if (pile.length) slot.append(makeCard(pile.at(-1)));
    els.foundations.append(slot);
  });
  game.tableau.forEach((pile, index) => {
    const column = document.createElement("div");
    column.className = "column";
    column.dataset.dropArea = `tableau:${index}`;
    column.setAttribute("aria-label", `${t("tableau")} ${index + 1}`);
    pile.forEach((id, cardIndex) => column.append(makeCard(id, tableauTop(pile, cardIndex))));
    const columnFloor = window.innerWidth <= 720 ? 390 : Math.max(220, window.innerHeight - 274);
    column.style.minHeight = `${Math.max(columnFloor, tableauTop(pile, pile.length) + CARD_H)}px`;
    els.tableau.append(column);
  });
  if (!autoRunning) autoPlan = isWon(game) ? null : planAutoFinish(game, currentDrawCount);
  const tallest = Math.max(...game.tableau.map((pile) => tableauTop(pile, pile.length) + CARD_H));
  els.felt.style.minHeight = window.innerWidth <= 720 ? `${Math.max(650, 190 + tallest)}px` : "0px";
  updateHud();
  if (isWon(game) && !winShown) celebrate();
  if (window.innerWidth <= 720) requestAnimationFrame(fitTableToScreen);
}
function deal() {
  if (gesture || autoRunning) return;
  if (!game.stock.length && !game.waste.length) return;
  checkpoint();
  if (game.stock.length) { drawCards(game, currentDrawCount); playSound("draw"); commitMove(t(currentDrawCount === 1 ? "drewOne" : "drewThree")); }
  else { recycleWaste(game); commitMove(t("recycled")); }
}
function automaticMove(id) {
  if (autoRunning) return;
  checkpoint();
  if (clickCard(game, id)) commitMove(t("cardMoved"));
  else { history.pop(); say(t("noMove")); render(); }
}
function beginGesture(event) {
  if (autoRunning) return;
  if (event.button !== 0 && event.pointerType === "mouse") return;
  event.preventDefault();
  const id = Number(event.currentTarget.dataset.card);
  const location = locate(game, id);
  if (!location || location.area === "foundations" && location.index !== game.foundations[location.pile].length - 1) return;
  const rect = event.currentTarget.getBoundingClientRect();
  gesture = { id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
    offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, active: false, ghost: null,
    timer: setTimeout(() => activateDrag(event.clientX, event.clientY), HOLD_MS) };
  window.addEventListener("pointermove", onMove, { passive: false });
  window.addEventListener("pointerup", endGesture, { once: true });
  window.addEventListener("pointercancel", cancelGesture, { once: true });
}
function activateDrag(x, y) {
  if (!gesture) return;
  gesture.active = true;
  const location = locate(game, gesture.id);
  const source = location.pile === null ? game[location.area] : game[location.area][location.pile];
  const moving = source.slice(location.index);
  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  const gap = window.innerWidth <= 720 ? 25 : 18;
  moving.forEach((id, i) => ghost.append(makeCard(id, i * gap, false)));
  ghost.style.height = `${CARD_H + (moving.length - 1) * gap}px`;
  document.body.append(ghost); gesture.ghost = ghost;
  ghost.style.transform = `scale(${uiScale})`;
  ghost.style.transformOrigin = "top left";
  document.querySelectorAll(`[data-card="${gesture.id}"]`).forEach((n) => n.classList.add("drag-source"));
  for (const dest of availableDestinations(game, gesture.id)) {
    document.querySelector(`[data-drop-area="${dest.area}:${dest.pile}"]`)?.classList.add("finish-dest");
  }
  positionGhost(x, y); say(t("dragHelp"));
}
function positionGhost(x, y) {
  if (!gesture?.ghost) return;
  gesture.ghost.style.left = `${x - gesture.offsetX}px`;
  gesture.ghost.style.top = `${y - gesture.offsetY}px`;
}
function onMove(event) {
  if (!gesture || event.pointerId !== gesture.pointerId) return;
  event.preventDefault();
  if (gesture.active) positionGhost(event.clientX, event.clientY);
}
function destinationAt(x, y) {
  const node = document.elementFromPoint(x, y)?.closest("[data-drop-area]");
  if (!node) return null;
  const [area, pile] = node.dataset.dropArea.split(":");
  return { area, pile: Number(pile) };
}
function sameDestination(a, b) { return a && b && a.area === b.area && a.pile === b.pile; }
function endGesture(event) {
  if (!gesture || event.pointerId !== gesture.pointerId) return;
  clearTimeout(gesture.timer);
  const current = gesture;
  if (!current.active) { cleanupGesture(); automaticMove(current.id); return; }
  const destination = destinationAt(event.clientX, event.clientY);
  const valid = availableDestinations(game, current.id).some((item) => sameDestination(item, destination));
  cleanupGesture();
  if (valid) { checkpoint(); moveTo(game, current.id, destination); commitMove(t("manual")); }
  else { say(t("invalid")); render(); }
}
function cancelGesture() { if (!gesture) return; clearTimeout(gesture.timer); cleanupGesture(); render(); }
function cleanupGesture() {
  gesture?.ghost?.remove();
  document.querySelectorAll(".finish-dest,.drag-source").forEach((n) => n.classList.remove("finish-dest", "drag-source"));
  gesture = null; window.removeEventListener("pointermove", onMove);
}
function celebrate() {
  elapsedBase += Date.now() - startedAt;
  startedAt = Date.now();
  if (!winRecorded) {
    const stats = readStats();
    stats.won++; stats.totalMoves += movesCount;
    stats.bestTime = stats.bestTime === null ? elapsedBase : Math.min(stats.bestTime, elapsedBase);
    writeStats(stats); winRecorded = true;
  }
  winShown = true; say(t("won"));
  playSound("win");
  updateHud(); saveGame();
  const canvas = document.createElement("canvas"); canvas.className = "win-canvas";
  const rect = els.felt.getBoundingClientRect(); canvas.width = rect.width; canvas.height = rect.height;
  els.felt.append(canvas); const ctx = canvas.getContext("2d"); const image = new Image(); image.src = sprite;
  const particles = []; let emitted = 0;
  const emit = setInterval(() => {
    if (emitted >= 52) { clearInterval(emit); return; }
    const foundation = emitted % 4, rank = 13 - Math.floor(emitted / 4), suit = ["c", "d", "h", "s"][foundation];
    particles.push({ x: canvas.width - 4 * (CARD_W + 18) + foundation * (CARD_W + 18), y: 26,
      vx: -2 - Math.random() * 4, vy: -2 - Math.random() * 6, rank, suit }); emitted++;
  }, 70);
  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.vy += .28;
      if (p.y + CARD_H > canvas.height) { p.y = canvas.height - CARD_H; p.vy *= -.72; }
      const sx = CARD_W * p.rank - CARD_W + 1, sy = CARD_H * suitRow[p.suit] - CARD_H + 1;
      ctx.drawImage(image, sx, sy, CARD_W, CARD_H, p.x, p.y, CARD_W, CARD_H);
    }
    if (canvas.isConnected) requestAnimationFrame(frame);
  }
  image.onload = frame; canvas.onclick = () => { clearInterval(emit); canvas.remove(); };
}
function cachedDeals() {
  try { return parseRuntimeDealCache(localStorage.getItem(SOLVED_CACHE)); }
  catch { return []; }
}
function writeCachedDeals(deals) {
  try {
    localStorage.setItem(SOLVED_CACHE, serializeRuntimeDealCache(deals));
    return true;
  } catch { return false; }
}
function rememberDeal(deal) {
  const compact = { id: deal.id, seed: deal.seed, drawCount: deal.drawCount, encoded: deal.encoded, expectedMoves: deal.expectedMoves, states: deal.states, sourceTest: deal.sourceTest };
  return writeCachedDeals([compact, ...cachedDeals().filter((item) => item.id !== deal.id)]);
}
function takeCachedDeal(drawCount) {
  const all = cachedDeals();
  const matching = all.filter((deal) => deal.drawCount === drawCount && deal.id !== previousDealId);
  if (!matching.length) return null;
  const selected = matching[Math.floor(Math.random() * matching.length)];
  writeCachedDeals(all.filter((deal) => deal.id !== selected.id));
  return selected;
}
function playSolvableDeal(deal) {
  cleanupGesture();
  game = createReferenceGame(cardsFromMinimalDeal(deal));
  currentDrawCount = deal.drawCount;
  previousDealId = deal.id;
  history = [];
  movesCount = 0;
  elapsedBase = 0;
  startedAt = Date.now();
  const stats = readStats(); stats.started++; writeStats(stats);
  winShown = false;
  winRecorded = false;
  document.querySelector(".win-canvas")?.remove();
  say(`${t("generatedDeal")} ${t("draw")} ${deal.drawCount}.`);
  render();
  saveGame();
}
function randomSeed() {
  return globalThis.crypto?.getRandomValues ? globalThis.crypto.getRandomValues(new Uint32Array(1))[0] : Date.now() >>> 0;
}
function showGenerationAction(mode = null, message = null) {
  els.generationOverlay.hidden = !mode;
  els.generationAction.dataset.action = mode ?? "";
  if (mode) {
    els.generationAction.textContent = t(mode);
    els.generationMessage.textContent = message ?? t("generating");
  }
}
function generateCertifiedDeal(drawCount, foreground = false) {
  if (generationPromise) {
    if (!foreground) return generationPromise;
    cancelActiveGeneration?.();
  }
  generationPromise = new Promise((resolve) => {
    let worker = null;
    let settled = false;
    let attemptOffset = 0;
    let workerRestarts = 0;
    let timeout = null;
    const finish = (deal, message = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      worker?.terminate();
      generationWorker = null;
      generationPromise = null;
      cancelActiveGeneration = null;
      if (foreground) {
        if (message) say(t(message));
        showGenerationAction(deal ? null : "retry", message ? t(message) : null);
      }
      resolve(deal);
    };
    const launchWorker = () => {
      if (settled) return;
      worker?.terminate();
      const currentWorker = new Worker("./src/solver-worker.js?v=62", { type: "module" });
      worker = currentWorker;
      generationWorker = currentWorker;
      currentWorker.onmessage = ({ data }) => {
        if (settled || worker !== currentWorker) return;
        if (data.type === "progress") {
          if (foreground) {
            const progress = `${t("candidate")} ${attemptOffset + data.attempt}…`;
            say(progress);
            els.generationMessage.textContent = progress;
          }
          return;
        }
        if (data.type === "solved") {
          rememberDeal(data.deal);
          finish(data.deal);
          return;
        }
        if (data.type === "exhausted" && foreground) {
          attemptOffset += FOREGROUND_BATCH_ATTEMPTS;
          workerRestarts = 0;
          setTimeout(launchWorker, 50);
          return;
        }
        if (foreground) {
          const delay = FOREGROUND_WORKER_RETRY_DELAYS[Math.min(workerRestarts++, FOREGROUND_WORKER_RETRY_DELAYS.length - 1)];
          setTimeout(launchWorker, delay);
          return;
        }
        finish(null, "generationFailed");
      };
      currentWorker.onerror = () => {
        if (settled || worker !== currentWorker) return;
        currentWorker.terminate();
        worker = null;
        generationWorker = null;
        if (foreground) {
          const delay = FOREGROUND_WORKER_RETRY_DELAYS[Math.min(workerRestarts++, FOREGROUND_WORKER_RETRY_DELAYS.length - 1)];
          setTimeout(launchWorker, delay);
          return;
        }
        finish(null, "generationFailed");
      };
      currentWorker.postMessage({
        seed: randomSeed(),
        drawCount,
        maxStates: GENERATION_MAX_STATES,
        maxAttempts: foreground ? FOREGROUND_BATCH_ATTEMPTS : BACKGROUND_BATCH_ATTEMPTS,
      });
    };
    // Foreground searches use short-lived worker batches. This releases each
    // batch's search memory before trying more random deals on mobile devices.
    // The search continues until it succeeds or the player cancels it.
    timeout = foreground ? null : setTimeout(() => finish(null, "generationTimedOut"), 30000);
    cancelActiveGeneration = () => finish(null, "generationCancelled");
    if (foreground) { say(t("generating")); showGenerationAction("cancel", t("generating")); }
    launchWorker();
  });
  return generationPromise;
}
async function replenishRuntimePool() {
  if (generationPromise) return;
  const deals = cachedDeals();
  const needed = [1, 3].find((drawCount) => deals.filter((deal) => deal.drawCount === drawCount).length < 2);
  if (!needed) return;
  const deal = await generateCertifiedDeal(needed, false);
  if (deal && cachedDeals().some((item) => item.id === deal.id)) setTimeout(replenishRuntimePool, 500);
}
function solverBoardFromGame() {
  const card = (id) => {
    const value = game.cards[id];
    return { id: value.id, suit: value.suit, rank: value.rank };
  };
  const foundations = [0, 0, 0, 0];
  const suitIndex = { c: 0, d: 1, h: 2, s: 3 };
  for (const pile of game.foundations) {
    if (pile.length) foundations[suitIndex[game.cards[pile.at(-1)].suit]] = pile.length;
  }
  return {
    drawCount: currentDrawCount,
    rounds: 0,
    foundations,
    tableau: game.tableau.map((pile) => {
      const firstUp = pile.findIndex((id) => game.cards[id].faceUp);
      return { cards: pile.map(card), hidden: firstUp < 0 ? pile.length : firstUp };
    }),
    stock: game.stock.map(card),
    waste: game.waste.map(card),
  };
}
function describeHint(move) {
  const copy = (it, en) => language === "en" ? en : it;
  if (!move) return t("hintTimedOut");
  if (move.type === "draw") return copy("Suggerimento: pesca dal tallone.", "Hint: draw from the stock.");
  if (move.type === "recycle") return copy("Suggerimento: rimetti gli scarti nel tallone.", "Hint: return the waste cards to the stock.");
  if (move.type === "waste-foundation") return copy("Suggerimento: porta la carta degli scarti alle fondazioni.", "Hint: move the waste card to a foundation.");
  if (move.type === "waste-tableau") return copy(`Suggerimento: sposta la carta degli scarti sulla colonna ${move.to + 1}.`, `Hint: move the waste card to column ${move.to + 1}.`);
  if (move.type === "tableau-foundation") return copy(`Suggerimento: porta in fondazione la carta della colonna ${move.from + 1}.`, `Hint: move the card from column ${move.from + 1} to a foundation.`);
  if (move.type === "tableau-tableau") return copy(`Suggerimento: sposta ${move.count} carte dalla colonna ${move.from + 1} alla ${move.to + 1}.`, `Hint: move ${move.count} card(s) from column ${move.from + 1} to ${move.to + 1}.`);
  if (move.type === "foundation-tableau") return copy(`Suggerimento: riporta una carta dalla fondazione alla colonna ${move.to + 1}.`, `Hint: return a foundation card to column ${move.to + 1}.`);
  return copy("Suggerimento disponibile.", "Hint available.");
}
function requestHint() {
  if (!game) return;
  activeSolver?.terminate();
  const button = document.querySelector("#hint");
  button.disabled = true; say(t("analysing"));
  const worker = new Worker("./src/solver-worker.js?v=21", { type: "module" });
  activeSolver = worker;
  const timeout = setTimeout(() => {
    worker.terminate();
    if (activeSolver !== worker) return;
    activeSolver = null; button.disabled = false;
    say(t("hintTimedOut"));
  }, 10000);
  worker.onmessage = ({ data }) => {
    clearTimeout(timeout); worker.terminate();
    if (activeSolver !== worker) return;
    activeSolver = null; button.disabled = false;
    say(data.type === "hint" ? describeHint(data.move) : t("noSolutionHere"));
  };
  worker.onerror = () => {
    clearTimeout(timeout); worker.terminate();
    if (activeSolver === worker) { activeSolver = null; button.disabled = false; say(t("hintUnavailable")); }
  };
  worker.postMessage({ mode: "hint", board: solverBoardFromGame(), maxStates: 50000 });
}
function runAutoFinish() {
  if (!autoPlan?.length || autoRunning) { say(t("notCompletable")); return; }
  const steps = [...autoPlan];
  checkpoint(); autoRunning = true; setMenu(false); say(t("completing")); updateHud();
  const next = () => {
    const step = steps.shift();
    if (!step) {
      autoRunning = false; render(); saveGame(); return;
    }
    if (step.type === "draw") drawCards(game, currentDrawCount);
    else if (step.type === "recycle") recycleWaste(game);
    else moveTo(game, step.id, step.destination);
    movesCount++; playSound(step.type === "draw" ? "draw" : "move"); render();
    setTimeout(next, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 85);
  };
  next();
}
async function restartSolvable({ confirmAbandon = true } = {}) {
  if (confirmAbandon && game && movesCount > 0 && !isWon(game)) {
    setMenu(false);
    els.abandonDialog.showModal();
    return;
  }
  setMenu(false);
  activeSolver?.terminate();
  activeSolver = null;
  const drawCount = preferredDrawCount;
  let deal = takeCachedDeal(drawCount);
  const button = document.querySelector("#solvable-game");
  if (!deal) {
    button.disabled = true;
    deal = await generateCertifiedDeal(drawCount, true);
    button.disabled = false;
    if (!deal) return;
    // The newly generated deal was stored before being selected; consume it.
    takeCachedDeal(drawCount);
  }
  playSolvableDeal(deal);
  showGenerationAction(null);
  setTimeout(replenishRuntimePool, 700);
}
function pageContent(page) {
  const stats = readStats();
  const common = language === "it" ? {
    rules: ["Regole", `<p>Costruisci le quattro fondazioni dall’Asso al Re, una per seme.</p><ul><li>Nel tableau disponi valori decrescenti alternando rosso e nero.</li><li>Solo un Re può occupare una colonna vuota.</li><li>Puoi spostare insieme una sequenza valida.</li><li>La pesca può essere di una o tre carte.</li></ul>`],
    provenance: ["Informazioni", `<p>Grugnetto’s Klondike è una versione moderna del classico solitario, con partite risolvibili generate al momento.</p><p>Puoi scegliere pesca 1 o 3, cambiare mazzo, annullare una mossa, chiedere un suggerimento e riprendere automaticamente la partita dopo avere ricaricato la pagina.</p><h3>Crediti</h3><p>Il gioco utilizza componenti open source di <code>rjanjic/js-solitaire</code> e <code>ShootMe/MinimalKlondike</code>. I mazzi SVG sono di <code>letele/playing-cards</code> e <code>SONDLecT/woodcut-cards</code>. I dettagli completi sono conservati nella documentazione del progetto.</p>`],
    licenses: ["Licenze", `<p>Interfaccia, integrazione, adapter, worker, test e documentazione sono GPL-3.0-or-later.</p><p>I due reperti software e i relativi port restano MIT. I mazzi Classico HD e Incisione storica restano CC0-1.0. Testi originali, revisioni e attribuzioni sono conservati.</p><p>Il nome Grugnetto’s Klondike, i loghi e l’identità del personaggio non sono concessi dalla GPL. I dettagli sono in <code>TRADEMARKS.md</code>.</p>`],
    stats: ["Statistiche", `<div class="stat-grid"><span>Partite iniziate</span><strong>${stats.started}</strong><span>Partite vinte</span><strong>${stats.won}</strong><span>Mosse nelle vittorie</span><strong>${stats.totalMoves}</strong><span>Tempo migliore</span><strong>${stats.bestTime === null ? "—" : formatTime(stats.bestTime)}</strong></div>`],
  } : {
    rules: ["Rules", `<p>Build the four foundations from Ace to King, one for each suit.</p><ul><li>Build downward on the tableau, alternating red and black.</li><li>Only a King may occupy an empty column.</li><li>A valid sequence can be moved together.</li><li>You can draw one or three cards.</li></ul>`],
    provenance: ["About", `<p>Grugnetto’s Klondike is a modern version of the classic solitaire game, with solvable deals generated as you play.</p><p>You can choose draw 1 or 3, change the deck, undo a move, ask for a hint, and resume your game automatically after reloading the page.</p><h3>Credits</h3><p>The game uses open-source components from <code>rjanjic/js-solitaire</code> and <code>ShootMe/MinimalKlondike</code>. The SVG decks come from <code>letele/playing-cards</code> and <code>SONDLecT/woodcut-cards</code>. Full details are preserved in the project documentation.</p>`],
    licenses: ["Licenses", `<p>The interface, integration, adapters, worker, tests and documentation use GPL-3.0-or-later.</p><p>The two software artifacts and their ports remain MIT. The Classic HD and Historical woodcut decks remain CC0-1.0. Original license texts, revisions and attribution are retained.</p><p>The Grugnetto’s Klondike name, logos, and character identity are not licensed under the GPL. Details are provided in <code>TRADEMARKS.md</code>.</p>`],
    stats: ["Statistics", `<div class="stat-grid"><span>Games started</span><strong>${stats.started}</strong><span>Games won</span><strong>${stats.won}</strong><span>Moves in wins</span><strong>${stats.totalMoves}</strong><span>Best time</span><strong>${stats.bestTime === null ? "—" : formatTime(stats.bestTime)}</strong></div>`],
  };
  return common[page];
}
function openInfo(page) {
  const [title, content] = pageContent(page);
  els.dialogTitle.textContent = title; els.dialogContent.innerHTML = content;
  setMenu(false); els.dialog.showModal();
}
document.querySelector("#solvable-game").addEventListener("click", () => restartSolvable());
document.querySelector("#reset-local-data").addEventListener("click", resetLocalData);
els.resetCancel.addEventListener("click", () => els.resetDialog.close());
els.resetConfirm.addEventListener("click", confirmResetLocalData);
els.abandonCancel.addEventListener("click", () => els.abandonDialog.close());
els.abandonConfirm.addEventListener("click", () => {
  els.abandonDialog.close();
  restartSolvable({ confirmAbandon: false });
});
els.generationAction.addEventListener("click", () => {
  if (els.generationAction.dataset.action === "cancel") cancelActiveGeneration?.();
  else restartSolvable({ confirmAbandon: false });
});
document.querySelector("#hint").addEventListener("click", () => { setMenu(false); requestHint(); });
els.autoFinish.addEventListener("click", runAutoFinish);
els.soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem("grugnetto-klondike-sound", soundEnabled ? "on" : "off");
  els.soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  els.soundToggle.querySelector("span").textContent = soundEnabled ? "🔊" : "🔇";
  els.soundToggle.querySelector("b").textContent = t(soundEnabled ? "soundOn" : "soundOff");
  if (soundEnabled) playSound("move");
});
els.undo.addEventListener("click", () => { setMenu(false); undoMove(); });
els.drawMode.addEventListener("change", () => {
  preferredDrawCount = els.drawMode.value === "1" ? 1 : 3;
  localStorage.setItem(DRAW_PREFERENCE, String(preferredDrawCount));
  setMenu(false);
  say(t(preferredDrawCount === 1 ? "nextDrawOne" : "nextDrawThree"));
});
els.cardDeck.addEventListener("change", async () => {
  cardDeck = DECK_IDS.has(els.cardDeck.value) ? els.cardDeck.value : "historical";
  localStorage.setItem("grugnetto-klondike-deck", cardDeck);
  const selectedDeck = cardDeck;
  if (SVG_DECKS.has(cardDeck)) {
    say(t("loadingDeck"));
    try { await preloadDeck(cardDeck); }
    catch {
      useReadableDeckFallback();
      setMenu(false); return;
    }
  }
  if (selectedDeck !== cardDeck) return;
  say(t("deckChanged")); render(); setMenu(false);
});
els.language.addEventListener("change", () => {
  language = els.language.value;
  localStorage.setItem("grugnetto-klondike-language", language);
  applyLanguage(); setMenu(false);
});
document.querySelectorAll(".info-page").forEach((button) => button.addEventListener("click", () => openInfo(button.dataset.page)));
document.querySelector("#info-close").addEventListener("click", () => els.dialog.close());
els.dialog.addEventListener("click", (event) => { if (event.target === els.dialog) els.dialog.close(); });
els.menuToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  setMenu(els.menuPanel.hidden);
});
els.menuPanel.addEventListener("keydown", (event) => {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  const items = [...els.menuPanel.querySelectorAll("button:not([disabled]), select")];
  if (!items.length) return;
  event.preventDefault();
  const current = Math.max(0, items.indexOf(document.activeElement));
  const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
    : event.key === "ArrowDown" ? (current + 1) % items.length : (current - 1 + items.length) % items.length;
  items[next].focus();
});
document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".game-menu")) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") { setMenu(false); els.menuToggle.focus(); }
});
spriteImage.addEventListener("error", () => say(t("cardLoadError")), { once: true });
const resumedGame = restoreSavedGame();
applyLanguage();
fitTableToScreen();
preloadDeck(cardDeck).catch(() => {
  useReadableDeckFallback({ rerender: false });
}).then(() => {
  if (resumedGame) { render(); setTimeout(replenishRuntimePool, 1000); }
  else restartSolvable({ confirmAbandon: false });
});
let resizeTimer = null;
window.addEventListener("resize", () => {
  fitTableToScreen();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(render, 100);
});
setInterval(updateHud, 1000);
