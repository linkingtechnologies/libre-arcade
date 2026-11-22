// SPDX-License-Identifier: GPL-3.0-only
import { BriscolaGame } from "./core/BriscolaGame.js";
import { CuperativaAdapter } from "./players/cuperativa/CuperativaAdapter.js";
import { QBriscolaAdapter } from "./players/qbriscola/QBriscolaAdapter.js";
import { SmBriscolaEmpirico1Adapter } from "./players/smbriscola/SmBriscolaEmpirico1Adapter.js";
import { SmBriscolaEmpirico2Adapter } from "./players/smbriscola/SmBriscolaEmpirico2Adapter.js";
import { JBriscolaAdapter } from "./players/jbriscola/JBriscolaAdapter.js";
import { PryscolaAdapter } from "./players/pryscola/PryscolaAdapter.js";
import { BriscolaBotAdapter } from "./players/briscolabot/BriscolaBotAdapter.js";
import { RandomAdapter } from "./players/random/RandomAdapter.js";
import { PiGAdapter, PiHAdapter, PiCAdapter } from "./players/giacomelli/GiacomelliAdapter.js";
import { CardFrameworkCpu0Adapter, CardFrameworkCpu1Adapter, CardFrameworkCpu2Adapter } from "./players/cardframework/CardFrameworkAdapter.js";
import { BriscolaJsS0Adapter, BriscolaJsS1Adapter } from "./players/briscolajs/BriscolaJsAdapter.js";
import { PoianaAdapter } from "./players/poiana/PoianaAdapter.js";
import { POIANA_MODELS_BY_WIN_RATE } from "./players/poiana/PoianaModels.js";
import { initializeDeckRegistry } from "./ui/DeckRegistry.js";
import { WebUI } from "./ui/WebUI.js";

await initializeDeckRegistry();

const params = new URLSearchParams(location.search);
const seed = Number(params.get("seed")) || Date.now();

const qbriscola = new QBriscolaAdapter();
const cuperativa = new CuperativaAdapter();
const smEmpirico1 = new SmBriscolaEmpirico1Adapter();
const smEmpirico2 = new SmBriscolaEmpirico2Adapter();
const jbriscola = new JBriscolaAdapter({ randomSeed: seed ^ 0x4a425249 });
const pryscola = new PryscolaAdapter();
const briscolaBot = new BriscolaBotAdapter({ randomSeed: seed ^ 0x424f5456 });
const random = new RandomAdapter({ randomSeed: seed ^ 0x52414e44 });
const piG = new PiGAdapter();
const piH = new PiHAdapter();
const piC = new PiCAdapter();
const cardFrameworkCpu0 = new CardFrameworkCpu0Adapter({ randomSeed: seed ^ 0x43463030 });
const cardFrameworkCpu1 = new CardFrameworkCpu1Adapter({ randomSeed: seed ^ 0x43463031 });
const cardFrameworkCpu2 = new CardFrameworkCpu2Adapter({ randomSeed: seed ^ 0x43463032 });
const briscolaJsS0 = new BriscolaJsS0Adapter();
const briscolaJsS1 = new BriscolaJsS1Adapter();
const poiana = POIANA_MODELS_BY_WIN_RATE.map((model) => new PoianaAdapter({ model }));

const opponents = [
  qbriscola,
  cuperativa,
  smEmpirico1,
  smEmpirico2,
  jbriscola,
  pryscola,
  briscolaBot,
  random,
  piG,
  piH,
  piC,
  cardFrameworkCpu0,
  cardFrameworkCpu1,
  cardFrameworkCpu2,
  briscolaJsS0,
  briscolaJsS1,
  ...poiana
];

const requestedOpponent =
  params.get("ai") ||
  localStorage.getItem("briscolab.opponent") ||
  localStorage.getItem("briscola.opponent") ||
  "qbriscola";
const opponent = opponents.find((item) => item.id === requestedOpponent) ?? qbriscola;

const game = new BriscolaGame({ seed, firstPlayer: 0 });
const ui = new WebUI(game, document.querySelector("#app"), {
  players: [null, opponent],
  opponents,
  computerDelayMs: 500
});

// Laboratory internals stay available from DevTools without polluting the normal player UI.
window.briscolab = {
  game,
  ui,
  opponents,
  qbriscola,
  cuperativa,
  smEmpirico1,
  smEmpirico2,
  jbriscola,
  pryscola,
  briscolaBot,
  random,
  piG,
  piH,
  piC,
  cardFrameworkCpu0,
  cardFrameworkCpu1,
  cardFrameworkCpu2,
  briscolaJsS0,
  briscolaJsS1,
  poiana: Object.fromEntries(poiana.map((player) => [player.model.name, player]))
};
