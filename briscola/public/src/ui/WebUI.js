// SPDX-License-Identifier: GPL-3.0-only
import { createCardBackElement, createCardElement, cardLabel } from "./CardRenderer.js";
import {
  getCardImageUrl,
  getDeck,
  getDeckAspectRatio,
  getDeckBackUrl,
  listDecks,
  preloadDeckImages
} from "./DeckRegistry.js";

const SUIT_ICON = {
  denari: "🪙",
  coppe: "🏆",
  spade: "⚔️",
  bastoni: "🌿"
};

export function freshGameSeed(previousSeed, now = Date.now()) {
  const previous = Number(previousSeed) >>> 0;
  const candidate = Number(now) >>> 0;
  return candidate === previous ? (candidate + 1) >>> 0 : candidate;
}

export function nextSeriesScore(score, { winner, draw }, winsNeeded = 2) {
  const wins = [...score];
  if (!draw && (winner === 0 || winner === 1)) wins[winner] += 1;
  return {
    wins,
    complete: wins.some((value) => value >= winsNeeded)
  };
}

export function nextStartingPlayer(currentFirstPlayer) {
  return currentFirstPlayer === 0 ? 1 : 0;
}

// The normal game UI exposes only an indicative difficulty. The actual engine
// remains deliberately masked; exact engines are still selectable from the
// laboratory options and visible in Debug AI.
const CPU_LEVELS = Object.freeze([
  {
    id: "1",
    icon: "🙂",
    label: "Allenamento",
    stars: "★☆☆☆☆",
    pool: ["random", "cardframework-cpu0"]
  },
  {
    id: "2",
    icon: "🌱",
    label: "Principiante",
    stars: "★★☆☆☆",
    pool: [
      "jbriscola",
      "poiana-cosmic-firebrand",
      "poiana-hardy-galaxy",
      "giacomelli-pih",
      "giacomelli-pic",
      "briscolajs-s0"
    ]
  },
  {
    id: "3",
    icon: "🎯",
    label: "Intermedio",
    stars: "★★★☆☆",
    pool: [
      "pryscola",
      "giacomelli-pig",
      "cardframework-cpu1",
      "briscolajs-s1",
      "poiana-smart-dragon",
      "poiana-amber-lake",
      "poiana-dark-salad",
      "poiana-selfplay-best",
      "poiana-skilled-serenity",
      "poiana-warm-river",
      "poiana-rich-mountain",
      "poiana-earnest-night",
      "poiana-easy-shape",
      "poiana-bumbling-leaf",
      "poiana-spring-snowflake",
      "poiana-lively-cosmos",
      "poiana-mild-aardvark"
    ]
  },
  {
    id: "4",
    icon: "🔥",
    label: "Esperto",
    stars: "★★★★☆",
    pool: [
      "smbriscola-empirico1",
      "smbriscola-empirico2",
      "cardframework-cpu2",
      "poiana-snowy-shape",
      "poiana-laced-pond",
      "poiana-true-star",
      "poiana-toasty-pine",
      "poiana-devout-paper",
      "poiana-autumn-night",
      "qbriscola",
      "cuperativa",
      "poiana-blooming-bird",
      "poiana-graceful-darkness"
    ]
  },
  {
    id: "5",
    icon: "👑",
    label: "Maestro",
    stars: "★★★★★",
    pool: ["briscolabot-v3"]
  }
]);


const PLAYER_YEAR = Object.freeze({
  random: "2026",
  "cardframework-cpu0": "2024",
  "cardframework-cpu1": "2024",
  "cardframework-cpu2": "2024",
  jbriscola: "2009",
  pryscola: "2007",
  qbriscola: "2008",
  cuperativa: "2021",
  "smbriscola-empirico1": "2005",
  "smbriscola-empirico2": "2005",
  "briscolabot-v3": "2023",
  "briscolajs-s0": "2015",
  "briscolajs-s1": "2015",
  "giacomelli-pig": "2026",
  "giacomelli-pih": "2026",
  "giacomelli-pic": "2026"
});

function playerYear(id) {
  if (id.startsWith("poiana-")) return "2024";
  return PLAYER_YEAR[id] ?? "n.d.";
}

const TRICK_HOLD_MS = 1050;
const TRICK_COLLECT_DELAY_MS = 480;
const DEAL_ANIMATION_MS = 560;
const PLAY_ANIMATION_MS = 420;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cpuLevel(levelId) {
  return CPU_LEVELS.find((level) => level.id === String(levelId)) ?? CPU_LEVELS[2];
}

function normalizedSeed(seed) {
  return Number(seed) >>> 0;
}

export class WebUI {
  constructor(game, root, { players = [null, null], opponents = [], computerDelayMs = 650 } = {}) {
    this.game = game;
    this.root = root;
    this.players = players;
    this.opponents = opponents;
    this.computerDelayMs = computerDelayMs;
    this.revealBothHands = false;
    this.debugVisible = false;
    this.menuOpen = false;
    this.started = false;
    this.screen = "setup";
    this.infoModalOpen = false;

    const defaultDeckId = listDecks().find((deck) => deck.kind === "image")?.id ?? "symbols";
    const storedDeckId =
      localStorage.getItem("briscolab.deck") ||
      localStorage.getItem("briscola.deck") ||
      defaultDeckId;
    const storedDeck = getDeck(storedDeckId);
    this.deckId = storedDeck.kind === "image" ? storedDeck.id : defaultDeckId;
    this.pendingDeckId = this.deckId;

    this.cpuLevelId = localStorage.getItem("briscolab.cpuLevel") || "3";
    this.pendingCpuLevelId = this.cpuLevelId;
    this.labOpponentId = "";
    this.pendingLabOpponentId = "";
    this.pendingSeed = this.game.getPublicState().seed;
    this.matchMode = localStorage.getItem("briscolab.matchMode") || "single";
    this.pendingMatchMode = this.matchMode;
    this.seriesWins = [0, 0];
    this.seriesComplete = false;
    this.currentFirstPlayer = 0;

    this.computerTimer = null;
    this.computerBusy = false;
    this.generation = 0;
    this.lastComputerDecision = null;
    this.message = null;

    // Presentation state intentionally sits outside BriscolaGame. The engine
    // resolves tricks synchronously; the UI keeps the two played cards visible
    // long enough for a human to follow the trick and its winner.
    this.visualTable = [];
    this.lastPlayedVisual = null;
    this.presentationLock = false;
    this.presentationTimers = [];
    this.dealAnimationUntil = 0;

    this.game.addEventListener("cardplayed", (event) => {
      const { playerId, card } = event.detail;
      this.visualTable.push({ playerId, card: { ...card } });
      this.lastPlayedVisual = {
        playerId,
        cardId: card.id,
        at: Date.now()
      };
      this.message = playerId === 0 ? cardLabel(card) : "Avversario gioca";
    });

    this.game.addEventListener("statechange", () => {
      if (this.screen === "game" && !this.presentationLock) this.render();
      if (!this.presentationLock) this.#scheduleComputerTurn();
    });

    this.game.addEventListener("trickwon", (event) => {
      this.#holdResolvedTrick(event.detail);
    });

    this.game.addEventListener("gameover", (event) => {
      const { winner, draw } = event.detail;
      if (this.matchMode === "best-of-3") {
        const series = nextSeriesScore(this.seriesWins, { winner, draw });
        this.seriesWins = series.wins;
        this.seriesComplete = series.complete;
      } else {
        this.seriesComplete = true;
      }
      this.message = draw ? "Pareggio" : winner === 0 ? "Hai vinto" : "Ha vinto l’avversario";
    });

    this.game.addEventListener("reset", () => {
      this.visualTable = [];
      this.lastPlayedVisual = null;
      this.presentationLock = false;
      this.dealAnimationUntil = Date.now() + DEAL_ANIMATION_MS;
    });

    this.render();
  }

  render() {
    if (this.screen === "setup") {
      this.#renderSetup();
      return;
    }
    this.#renderGame();
  }

  #renderSetup() {
    const state = this.game.getPublicState();
    const deck = getDeck(this.pendingDeckId);
    const deckOptions = listDecks()
      .filter((item) => item.kind === "image")
      .map((item) =>
        `<option value="${escapeHtml(item.id)}" ${item.id === deck.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`
      ).join("");

    const levelOptions = CPU_LEVELS.map((level) =>
      `<option value="${level.id}" ${level.id === this.pendingCpuLevelId ? "selected" : ""}>${level.icon} ${level.stars} · ${escapeHtml(level.label)}</option>`
    ).join("");

    this.root.innerHTML = `
      <section class="section setup-screen">
        <div class="container setup-container">
          <div class="box setup-card">
            <header class="setup-header has-text-centered">
              <div class="setup-mark" aria-hidden="true">🐽's</div>
              <h1 class="title is-2 mb-1">Briscola</h1>
            </header>

            <form id="game-setup" class="setup-form">
              <div class="field">
                <div class="setup-label-row">
                  <label class="label mb-0" for="setup-cpu-level">Bravura avversario</label>
                  <button id="difficulty-info" class="difficulty-info-button" type="button" aria-label="Informazioni sugli algoritmi per livello" title="Algoritmi e anni">ⓘ</button>
                </div>
                <div class="control">
                  <div class="select is-fullwidth is-medium">
                    <select id="setup-cpu-level">${levelOptions}</select>
                  </div>
                </div>
              </div>

              <div class="field">
                <label class="label" for="setup-deck"><span aria-hidden="true">🃏</span> Mazzo</label>
                <div class="control">
                  <div class="select is-fullwidth is-medium">
                    <select id="setup-deck">${deckOptions}</select>
                  </div>
                </div>
              </div>

              <div class="field">
                <label class="label" for="setup-match-mode"><span aria-hidden="true">🏆</span> Formula</label>
                <div class="control">
                  <div class="select is-fullwidth is-medium">
                    <select id="setup-match-mode">
                      <option value="single" ${this.pendingMatchMode === "single" ? "selected" : ""}>Partita secca</option>
                      <option value="best-of-3" ${this.pendingMatchMode === "best-of-3" ? "selected" : ""}>Al meglio delle 3</option>
                    </select>
                  </div>
                </div>
              </div>

              <details class="setup-advanced">
                <summary>⚙️ Opzioni avanzate</summary>

                <div class="field mt-4">
                  <label class="label" for="setup-opponent">Engine specifico</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select id="setup-opponent">
                        <option value="">Automatico · mascherato</option>
                        ${this.#opponentOptions(this.pendingLabOpponentId)}
                      </select>
                    </div>
                  </div>
                  <p class="help">Se scelto, sostituisce il livello automatico. Il nome resta visibile solo nel debug.</p>
                </div>

                <div class="field mt-4">
                  <label class="label" for="setup-seed">Seed</label>
                  <div class="control has-icons-left">
                    <input id="setup-seed" class="input" type="number" inputmode="numeric" value="${Number(this.pendingSeed ?? state.seed)}">
                    <span class="icon is-left" aria-hidden="true">#</span>
                  </div>
                </div>
              </details>

              <div class="setup-actions mt-5">
                <button id="setup-play" class="button is-primary is-medium is-fullwidth" type="submit">
                  <span aria-hidden="true">▶</span><span>Gioca</span>
                </button>
                <p id="setup-loading-status" class="setup-loading-status" role="status" aria-live="polite"></p>
                ${this.started ? `
                  <button id="resume-game" class="button is-ghost is-fullwidth" type="button">
                    <span aria-hidden="true">←</span><span>Torna alla partita</span>
                  </button>` : ""}
              </div>
            </form>
          </div>
          <footer class="app-footer"><span class="footer-powered">Powered by <strong>BriscoLab</strong></span><span class="footer-separator" aria-hidden="true"> · </span><span class="footer-payoff">Preserving, porting and benchmarking Briscola AIs</span></footer>
        </div>
      </section>
      ${this.infoModalOpen ? this.#difficultyInfoModal() : ""}
    `;

    this.root.querySelector("#difficulty-info")?.addEventListener("click", () => {
      this.infoModalOpen = true;
      this.render();
    });
    this.root.querySelector("#difficulty-info-close")?.addEventListener("click", () => {
      this.infoModalOpen = false;
      this.render();
    });
    this.root.querySelector("#difficulty-info-modal")?.addEventListener("click", (event) => {
      if (event.target.id === "difficulty-info-modal") {
        this.infoModalOpen = false;
        this.render();
      }
    });

    this.root.querySelector("#setup-deck")?.addEventListener("change", (event) => {
      this.pendingDeckId = event.target.value;
    });

    this.root.querySelector("#setup-cpu-level")?.addEventListener("change", (event) => {
      this.pendingCpuLevelId = event.target.value;
    });

    this.root.querySelector("#setup-opponent")?.addEventListener("change", (event) => {
      this.pendingLabOpponentId = event.target.value;
    });

    this.root.querySelector("#setup-match-mode")?.addEventListener("change", (event) => {
      this.pendingMatchMode = event.target.value;
    });

    this.root.querySelector("#setup-seed")?.addEventListener("input", (event) => {
      this.pendingSeed = Number(event.target.value) || state.seed;
    });

    this.root.querySelector("#game-setup")?.addEventListener("submit", (event) => {
      event.preventDefault();
      void this.#startFromSetup();
    });

    this.root.querySelector("#resume-game")?.addEventListener("click", () => {
      this.screen = "game";
      this.menuOpen = false;
      this.render();
      this.#scheduleComputerTurn();
    });
  }

  #difficultyInfoModal() {
    const byId = new Map(this.opponents.map((player) => [player.id, player]));
    const groups = CPU_LEVELS.map((level) => {
      const rows = level.pool.map((id) => {
        const player = byId.get(id);
        const name = player?.name ?? id;
        return `<li><span>${escapeHtml(name)}</span><time>${escapeHtml(playerYear(id))}</time></li>`;
      }).join("");
      return `<section class="difficulty-info-tier">
        <h3>${level.icon} ${escapeHtml(level.stars)} · ${escapeHtml(level.label)}</h3>
        <ul>${rows}</ul>
      </section>`;
    }).join("");
    return `<div id="difficulty-info-modal" class="difficulty-info-modal" role="dialog" aria-modal="true" aria-labelledby="difficulty-info-title">
      <div class="difficulty-info-card">
        <header>
          <div>
            <h2 id="difficulty-info-title">Algoritmi per livello</h2>
            <p>L'anno indica l'anno del codice/reperto restaurato.</p>
          </div>
          <button id="difficulty-info-close" class="delete" type="button" aria-label="Chiudi"></button>
        </header>
        <div class="difficulty-info-body">${groups}</div>
        <p class="difficulty-info-note"><strong>n.d.</strong> = anno non determinato con sufficiente certezza dalle fonti conservate.</p>
      </div>
    </div>`;
  }

  #renderGame() {
    const state = this.game.getPublicState();
    const activePlayer = state.turn;
    const deck = getDeck(this.deckId);
    this.#applyDeckGeometry(deck);
    const player0Name = this.#playerName(0);
    const player1Name = this.#playerName(1);
    const isHumanTurn = state.phase === "playing" && activePlayer === 0 && !this.presentationLock;
    const level = cpuLevel(this.cpuLevelId);
    const turnLabel = state.phase === "finished"
      ? "Partita conclusa"
      : this.presentationLock
        ? (this.message ?? "Presa")
        : isHumanTurn
          ? "Tocca una carta"
          : "Avversario pensa…";

    this.root.innerHTML = `
      <section class="game-shell">
        <header class="game-topbar">
          <div class="brand-area">
            <div class="brand-mini" title="Grugnetto's Briscola">
              <span class="brand-pig" aria-hidden="true">🐽's</span>
              <strong>Briscola</strong>
              <span class="brand-mobile">Briscola</span>
            </div>
            ${this.matchMode === "best-of-3" && state.phase === "playing" && this.seriesWins[0] + this.seriesWins[1] > 0
              ? `<div class="series-running" aria-label="Risultato manche: tu ${this.seriesWins[0]}, avversario ${this.seriesWins[1]}">Manche <span aria-hidden="true">👤</span> <strong>${this.seriesWins[0]}–${this.seriesWins[1]}</strong> <span aria-hidden="true">🤖</span></div>`
              : ""}
          </div>

          <div class="scoreboard" aria-label="Punteggio: ${escapeHtml(player0Name)} ${state.scores[0]}, ${escapeHtml(player1Name)} ${state.scores[1]}">
            <span class="score-side" title="${escapeHtml(player0Name)}"><span aria-hidden="true">👤</span><strong>${state.scores[0]}</strong></span>
            <span class="score-separator">·</span>
            <span class="score-side" title="${escapeHtml(player1Name)}"><strong>${state.scores[1]}</strong><span aria-hidden="true">🤖</span></span>
          </div>

          <div class="dropdown is-right ${this.menuOpen ? "is-active" : ""}">
            <div class="dropdown-trigger">
              <button id="menu-toggle" class="button is-dark is-rounded icon-button" type="button" aria-haspopup="true" aria-controls="game-menu" aria-expanded="${this.menuOpen}" title="Menu">
                <span aria-hidden="true">☰</span><span class="is-sr-only">Menu</span>
              </button>
            </div>
            <div class="dropdown-menu" id="game-menu" role="menu">
              <div class="dropdown-content">
                <button id="menu-new-game" class="dropdown-item menu-item-button" type="button"><span aria-hidden="true">↻</span> Nuova partita</button>
                <button id="menu-reveal" class="dropdown-item menu-item-button" type="button"><span aria-hidden="true">${this.revealBothHands ? "🙈" : "👁"}</span> ${this.revealBothHands ? "Nascondi carte avversario" : "Mostra carte avversario"}</button>
                <button id="menu-debug" class="dropdown-item menu-item-button" type="button"><span aria-hidden="true">🧪</span> ${this.debugVisible ? "Chiudi debug" : "Debug AI"}</button>
                <hr class="dropdown-divider">
                <div class="dropdown-item game-meta">
                  <span>${escapeHtml(deck.name)}</span>
                  <small>#${state.seed}</small>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main class="table-area ${isHumanTurn ? "is-human-turn" : "is-ai-turn"} ${this.presentationLock ? "is-resolving" : ""}">
          <section class="player-zone opponent-zone" aria-label="Mano dell’avversario">
            <div class="hand-row">
              <span class="turn-label">Avversario</span>
              <span class="turn-dot ${activePlayer === 1 && !this.presentationLock ? "is-active" : ""}" aria-hidden="true"></span>
              <div id="hand-1" class="hand opponent-hand"></div>
            </div>
          </section>

          <section class="center-table" aria-label="Tavolo">
            <div class="deck-side">
              <div class="deck-cluster">
                <div class="stock" title="${state.stockCount} carte" aria-label="${state.stockCount} carte nel tallone">
                  <div id="stock-card"></div>
                  <strong class="stock-count">${state.stockCount}</strong>
                </div>
                <div class="trump" title="Briscola: ${escapeHtml(state.trumpSuit)}">
                  <div id="visible-trump"></div>
                </div>
              </div>
              <p class="turn-message ${this.message ? "has-event" : ""}" aria-live="polite">${escapeHtml(this.message ?? turnLabel)}</p>
            </div>

            <div class="play-zone">
              <div id="played-table" class="played-table"></div>
            </div>
          </section>

          <section class="player-zone human-zone" aria-label="La tua mano">
            <div class="hand-row">
              <span class="turn-label">Tu</span>
              <span class="turn-dot ${activePlayer === 0 && !this.presentationLock ? "is-active" : ""}" aria-hidden="true"></span>
              <div id="hand-0" class="hand"></div>
            </div>
          </section>
        </main>

        ${this.debugVisible ? `
          <section class="box debug-panel">
            <div class="level is-mobile mb-2">
              <div class="level-left"><strong>🧪 ${escapeHtml(this.#technicalPlayerName(1))}</strong></div>
              <div class="level-right"><button id="debug-close" class="delete" type="button" aria-label="Chiudi debug"></button></div>
            </div>
            <p class="is-size-7 mb-2">Livello mascherato: ${escapeHtml(level.stars)} · ${escapeHtml(level.label)}</p>
            ${this.lastComputerDecision ? `<p class="is-size-7 mb-2"><strong>Ultima decisione:</strong> ${escapeHtml(this.#decisionSummary(this.lastComputerDecision))}</p>` : ""}
            <pre>${escapeHtml(JSON.stringify(state.phase === "playing" && state.turn != null ? this.game.getObservation(state.turn) : state, null, 2))}</pre>
          </section>` : ""}
        <footer class="app-footer app-footer-game"><span class="footer-powered">Powered by <strong>BriscoLab</strong></span><span class="footer-separator" aria-hidden="true"> · </span><span class="footer-payoff">Preserving, porting and benchmarking Briscola AIs</span></footer>
      </section>

      ${state.phase === "finished" && !this.presentationLock ? this.#gameOverModal(state) : ""}
    `;

    this.#renderHand(0, state, deck);
    this.#renderHand(1, state, deck);
    this.#renderTable(deck);
    this.#renderStock(state, deck);
    this.#renderTrump(state, deck);
    this.#wireGameControls();
  }

  #wireGameControls() {
    this.root.querySelector("#menu-toggle")?.addEventListener("click", () => {
      this.menuOpen = !this.menuOpen;
      this.render();
    });

    this.root.querySelector("#menu-new-game")?.addEventListener("click", () => this.#openSetup({ freshSeed: true }));

    this.root.querySelector("#menu-reveal")?.addEventListener("click", () => {
      this.revealBothHands = !this.revealBothHands;
      this.menuOpen = false;
      this.render();
    });

    this.root.querySelector("#menu-debug")?.addEventListener("click", () => {
      this.debugVisible = !this.debugVisible;
      this.menuOpen = false;
      this.render();
    });

    this.root.querySelector("#debug-close")?.addEventListener("click", () => {
      this.debugVisible = false;
      this.render();
    });

    this.root.querySelector("#gameover-rematch")?.addEventListener("click", () => {
      this.#restartSameSettings(freshGameSeed(this.game.getPublicState().seed), {
        newSeries: this.matchMode === "single" || this.seriesComplete
      });
    });

    this.root.querySelector("#gameover-settings")?.addEventListener("click", () => this.#openSetup({ freshSeed: true }));
  }

  async #startFromSetup() {
    const levelId = this.root.querySelector("#setup-cpu-level")?.value ?? this.pendingCpuLevelId;
    const labOpponentId = this.root.querySelector("#setup-opponent")?.value ?? this.pendingLabOpponentId;
    const deckId = this.root.querySelector("#setup-deck")?.value ?? this.pendingDeckId;
    const matchMode = this.root.querySelector("#setup-match-mode")?.value ?? this.pendingMatchMode;
    const seedInput = Number(this.root.querySelector("#setup-seed")?.value);
    const seed = seedInput || Date.now();
    const selectedDeck = getDeck(deckId);
    const nextOpponent = labOpponentId
      ? this.opponents.find((opponent) => opponent.id === labOpponentId)
      : this.#chooseMaskedOpponent(levelId, seed);

    if (!nextOpponent) throw new Error("Nessun avversario disponibile");

    const playButton = this.root.querySelector("#setup-play");
    const status = this.root.querySelector("#setup-loading-status");
    if (playButton?.disabled) return;
    if (playButton) {
      playButton.disabled = true;
      playButton.classList.add("is-loading");
    }
    if (status) status.textContent = "Caricamento carte…";

    try {
      await preloadDeckImages(selectedDeck, {
        onProgress: ({ loaded, total }) => {
          if (status) status.textContent = `Caricamento carte ${loaded}/${total}…`;
        }
      });
    } catch (error) {
      console.error("BriscoLab: precaricamento mazzo fallito", error);
      if (playButton) {
        playButton.disabled = false;
        playButton.classList.remove("is-loading");
      }
      if (status) {
        status.classList.add("has-text-danger");
        status.textContent = "Impossibile caricare tutte le carte. Riprova.";
      }
      return;
    }

    this.#cancelComputerTurn();
    this.#cancelPresentation();
    this.generation += 1;
    this.players[1]?.reset?.();
    if (nextOpponent !== this.players[1]) nextOpponent.reset?.();
    this.players[1] = nextOpponent;
    this.cpuLevelId = labOpponentId ? this.#levelForOpponent(nextOpponent.id) : String(levelId);
    this.pendingCpuLevelId = this.cpuLevelId;
    this.labOpponentId = labOpponentId;
    this.pendingLabOpponentId = labOpponentId;
    this.deckId = selectedDeck.id;
    this.pendingDeckId = this.deckId;
    this.pendingSeed = seed;
    this.matchMode = matchMode === "best-of-3" ? "best-of-3" : "single";
    this.pendingMatchMode = this.matchMode;
    this.seriesWins = [0, 0];
    this.seriesComplete = false;
    localStorage.setItem("briscolab.cpuLevel", this.cpuLevelId);
    localStorage.setItem("briscolab.opponent", nextOpponent.id);
    localStorage.setItem("briscolab.deck", this.deckId);
    localStorage.setItem("briscolab.matchMode", this.matchMode);
    this.lastComputerDecision = null;
    this.message = null;
    this.menuOpen = false;
    this.started = true;
    this.screen = "game";
    this.currentFirstPlayer = 0;
    this.game.reset({ seed, firstPlayer: this.currentFirstPlayer });
  }

  #restartSameSettings(seed, { newSeries = false } = {}) {
    this.#cancelComputerTurn();
    this.#cancelPresentation();
    this.generation += 1;
    for (const player of this.players) player?.reset?.();
    this.lastComputerDecision = null;
    this.message = null;
    this.menuOpen = false;
    this.screen = "game";
    this.started = true;
    if (newSeries) {
      this.seriesWins = [0, 0];
      this.seriesComplete = false;
    }
    this.pendingSeed = seed;
    this.currentFirstPlayer = nextStartingPlayer(this.currentFirstPlayer);
    this.game.reset({ seed, firstPlayer: this.currentFirstPlayer });
  }

  #openSetup({ freshSeed = false } = {}) {
    this.#cancelComputerTurn();
    for (const timer of this.presentationTimers) clearTimeout(timer);
    this.presentationTimers = [];
    this.presentationLock = false;
    this.menuOpen = false;
    const state = this.game.getPublicState();
    // Preserve an unresolved card if the player briefly opens settings and
    // returns to the current game.
    this.visualTable = state.table.map((play) => ({ playerId: play.playerId, card: { ...play.card } }));
    this.lastPlayedVisual = null;
    this.pendingDeckId = this.deckId;
    this.pendingCpuLevelId = this.cpuLevelId;
    this.pendingLabOpponentId = this.labOpponentId;
    this.pendingMatchMode = this.matchMode;
    this.pendingSeed = freshSeed ? freshGameSeed(state.seed) : state.seed;
    this.screen = "setup";
    this.render();
  }

  #chooseMaskedOpponent(levelId, seed) {
    const level = cpuLevel(levelId);
    let candidates = level.pool
      .map((id) => this.opponents.find((opponent) => opponent.id === id))
      .filter(Boolean);
    if (candidates.length === 0) candidates = [...this.opponents];
    if (candidates.length === 0) return null;

    const mixed = (normalizedSeed(seed) ^ Math.imul(Number(level.id), 0x9e3779b1)) >>> 0;
    return candidates[mixed % candidates.length];
  }

  #levelForOpponent(opponentId) {
    const found = CPU_LEVELS.find((level) => level.pool.includes(opponentId));
    return found?.id ?? "3";
  }

  #opponentOptions(selectedId) {
    const standard = this.opponents.filter((opponent) => !opponent.id.startsWith("poiana-"));
    const poiana = this.opponents.filter((opponent) => opponent.id.startsWith("poiana-"));
    const render = (items) => items.map((opponent) =>
      `<option value="${escapeHtml(opponent.id)}" ${selectedId === opponent.id ? "selected" : ""}>${escapeHtml(opponent.name)}</option>`
    ).join("");

    return [
      standard.length ? `<optgroup label="Engine e baseline">${render(standard)}</optgroup>` : "",
      poiana.length ? `<optgroup label="PoIAna · reinforcement learning">${render(poiana)}</optgroup>` : ""
    ].join("");
  }


  #gameOverModal(state) {
    const draw = state.result?.draw;
    const winner = state.result?.winner;
    const seriesMode = this.matchMode === "best-of-3";
    const seriesWinner = this.seriesWins[0] >= 2 ? 0 : this.seriesWins[1] >= 2 ? 1 : null;
    const title = seriesMode && this.seriesComplete
      ? (seriesWinner === 0 ? "Hai vinto la serie" : "L’avversario vince la serie")
      : draw ? "Pareggio" : winner === 0 ? "Hai vinto" : "Ha vinto l’avversario";
    const icon = draw ? "🤝" : winner === 0 ? "🏆" : "🤖";
    const rematchLabel = seriesMode && !this.seriesComplete ? "Prossima manche" : "Rigioca";
    return `
      <div class="modal is-active gameover-modal">
        <div class="modal-background"></div>
        <div class="modal-card gameover-card">
          <section class="modal-card-body has-text-centered">
            <div class="gameover-icon" aria-hidden="true">${icon}</div>
            <h2 class="title is-3 mb-2">${escapeHtml(title)}</h2>
            <p class="gameover-score">${state.scores[0]} <span>–</span> ${state.scores[1]}</p>
            ${seriesMode ? `<p class="gameover-series">Serie: <strong>${this.seriesWins[0]} – ${this.seriesWins[1]}</strong></p>` : ""}
            <div class="buttons is-centered mt-5">
              <button id="gameover-rematch" class="button is-primary"><span aria-hidden="true">↻</span><span>${rematchLabel}</span></button>
              <button id="gameover-settings" class="button is-light"><span aria-hidden="true">⚙</span><span>Nuova partita</span></button>
            </div>
          </section>
        </div>
      </div>`;
  }

  #cardImageUrl(deck, card) {
    return getCardImageUrl(deck, card);
  }

  #applyDeckGeometry(deck) {
    const aspect = getDeckAspectRatio(deck);
    const safeAspect = aspect > 0 ? aspect : 1 / 1.414;
    this.root.style.setProperty("--card-aspect", String(safeAspect));
    this.root.style.setProperty("--card-height-factor", String(1 / safeAspect));
    this.root.dataset.deck = deck.id;
  }

  #renderHand(playerId, state, deck) {
    const container = this.root.querySelector(`#hand-${playerId}`);
    if (!container) return;
    const isHidden = playerId === 1 && !this.revealBothHands;
    const dealing = Date.now() < this.dealAnimationUntil;

    if (isHidden) {
      for (let i = 0; i < state.handCounts[playerId]; i += 1) {
        const element = createCardBackElement({
          deck,
          imageUrl: getDeckBackUrl(deck)
        });
        if (dealing && i === state.handCounts[playerId] - 1) element.classList.add("is-dealt", "deal-to-cpu");
        container.append(element);
      }
      return;
    }

    state.hands[playerId].forEach((card, index) => {
      const isComputer = Boolean(this.players[playerId]);
      const disabled = this.presentationLock || state.phase !== "playing" || state.turn !== playerId || isComputer;
      const element = createCardElement(card, {
        deck,
        imageUrl: this.#cardImageUrl(deck, card),
        disabled,
        onClick: () => {
          if (this.presentationLock) return;
          this.message = cardLabel(card);
          try {
            this.game.playCard(playerId, card.id);
          } catch (error) {
            this.message = error.message;
            this.render();
          }
        }
      });
      if (dealing && index === state.hands[playerId].length - 1) {
        element.classList.add("is-dealt", playerId === 0 ? "deal-to-human" : "deal-to-cpu");
      }
      element.title = cardLabel(card);
      element.setAttribute("aria-label", `Gioca ${cardLabel(card)}`);
      container.append(element);
    });
  }

  #renderTable(deck) {
    const container = this.root.querySelector("#played-table");
    if (!container) return;
    if (this.visualTable.length === 0) {
      container.innerHTML = '<span class="empty-table" aria-hidden="true"></span>';
      return;
    }

    for (const play of this.visualTable) {
      const wrapper = document.createElement("div");
      wrapper.className = `played-card player-${play.playerId}`;
      const justPlayed =
        this.lastPlayedVisual?.cardId === play.card.id &&
        Date.now() - this.lastPlayedVisual.at <= PLAY_ANIMATION_MS + 120;
      if (justPlayed) wrapper.classList.add("is-entering", play.playerId === 0 ? "from-human" : "from-cpu");
      wrapper.dataset.playerId = String(play.playerId);
      wrapper.setAttribute("aria-label", `${this.#playerName(play.playerId)}: ${cardLabel(play.card)}`);
      wrapper.append(createCardElement(play.card, {
        deck,
        imageUrl: this.#cardImageUrl(deck, play.card),
        disabled: true
      }));
      container.append(wrapper);
    }
  }

  #renderStock(state, deck) {
    const container = this.root.querySelector("#stock-card");
    if (!container || state.stockCount <= 0) return;
    container.append(createCardBackElement({
      deck,
      imageUrl: getDeckBackUrl(deck)
    }));
  }

  #renderTrump(state, deck) {
    const container = this.root.querySelector("#visible-trump");
    if (!container) return;
    if (state.visibleTrump) {
      const element = createCardElement(state.visibleTrump, {
        deck,
        imageUrl: this.#cardImageUrl(deck, state.visibleTrump),
        disabled: true
      });
      element.title = `Briscola: ${cardLabel(state.visibleTrump)}`;
      container.append(element);
    } else {
      container.innerHTML = '<span class="trump-taken" title="Briscola pescata" aria-label="Briscola pescata">✓</span>';
    }
  }

  #holdResolvedTrick({ winner, points }) {
    this.#cancelComputerTurn();
    this.#cancelPresentation();
    this.presentationLock = true;
    this.message = `${this.#playerName(winner)} +${points}`;

    // At this point the preceding cardplayed statechange has already rendered
    // both cards. Keep that DOM alive, then animate the pair toward the winner.
    const collectTimer = setTimeout(() => {
      if (this.screen !== "game") return;
      const table = this.root.querySelector("#played-table");
      table?.classList.add("is-collecting", winner === 0 ? "to-human" : "to-cpu");
    }, TRICK_COLLECT_DELAY_MS);

    const releaseTimer = setTimeout(() => {
      this.presentationLock = false;
      this.visualTable = [];
      this.lastPlayedVisual = null;
      this.dealAnimationUntil = Date.now() + DEAL_ANIMATION_MS;
      this.presentationTimers = [];
      if (this.screen === "game") this.render();
      this.#scheduleComputerTurn();
    }, TRICK_HOLD_MS);

    this.presentationTimers = [collectTimer, releaseTimer];
  }

  #playerName(playerId) {
    if (playerId == null) return "—";
    if (playerId === 0) return "Tu";
    return "Avversario";
  }

  #technicalPlayerName(playerId) {
    if (playerId == null) return "—";
    return this.players[playerId]?.name ?? this.#playerName(playerId);
  }

  #decisionSummary(decision) {
    const parts = [decision.algorithm ?? "Computer"];
    if (decision.rule) parts.push(`regola ${decision.rule}`);
    if (decision.model) parts.push(`modello ${decision.model}`);
    if (decision.chosenLabel) parts.push(decision.chosenLabel);
    if (Number.isInteger(decision.chosenIndex)) parts.push(`indice mano ${decision.chosenIndex}`);
    return parts.join(" · ");
  }

  #cancelComputerTurn() {
    if (this.computerTimer != null) {
      clearTimeout(this.computerTimer);
      this.computerTimer = null;
    }
  }

  #cancelPresentation() {
    for (const timer of this.presentationTimers) clearTimeout(timer);
    this.presentationTimers = [];
    this.presentationLock = false;
    this.visualTable = [];
    this.lastPlayedVisual = null;
  }

  #scheduleComputerTurn() {
    if (!this.started || this.screen !== "game" || this.presentationLock) return;
    const state = this.game.getPublicState();
    if (state.phase !== "playing" || state.turn == null) return;

    const computer = this.players[state.turn];
    if (!computer || this.computerBusy || this.computerTimer != null) return;
    if (state.table.length >= 2) return;

    const playerId = state.turn;
    const generation = this.generation;
    this.computerTimer = setTimeout(() => {
      this.computerTimer = null;
      if (generation !== this.generation || this.screen !== "game" || this.presentationLock) return;
      void this.#runComputerTurn(playerId, generation);
    }, this.computerDelayMs);
  }

  async #runComputerTurn(playerId, generation) {
    const computer = this.players[playerId];
    const state = this.game.getPublicState();
    if (!computer || state.phase !== "playing" || state.turn !== playerId || this.screen !== "game" || this.presentationLock) return;

    this.computerBusy = true;
    try {
      const observation = this.game.getObservation(playerId);
      const action = await computer.chooseAction(observation);
      if (generation !== this.generation || this.screen !== "game" || this.presentationLock) return;

      const legal = this.game.legalActions(playerId);
      if (!legal.some((item) => item.type === action.type && item.cardId === action.cardId)) {
        throw new Error(`${computer.name ?? "Computer"} ha proposto una mossa illegale: ${action.cardId}`);
      }

      this.lastComputerDecision = action.debug ?? { algorithm: computer.name ?? "Computer" };
      this.message = "Avversario gioca";
      this.game.playCard(playerId, action.cardId);
    } catch (error) {
      this.message = `Errore AI: ${error.message}`;
      this.render();
    } finally {
      this.computerBusy = false;
      this.#scheduleComputerTurn();
    }
  }
}
