// SPDX-License-Identifier: GPL-3.0-only
import { QBriscolaAdapter } from "../../../src/players/qbriscola/QBriscolaAdapter.js";
import { CuperativaAdapter } from "../../../src/players/cuperativa/CuperativaAdapter.js";
import { SmBriscolaEmpirico1Adapter } from "../../../src/players/smbriscola/SmBriscolaEmpirico1Adapter.js";
import { SmBriscolaEmpirico2Adapter } from "../../../src/players/smbriscola/SmBriscolaEmpirico2Adapter.js";
import { JBriscolaAdapter } from "../../../src/players/jbriscola/JBriscolaAdapter.js";
import { PryscolaAdapter } from "../../../src/players/pryscola/PryscolaAdapter.js";
import { BriscolaBotAdapter } from "../../../src/players/briscolabot/BriscolaBotAdapter.js";
import { BriscolaBotDeterministicRuntime } from "../../../src/players/briscolabot/BriscolaBotDeterministicRuntime.js";
import { RandomAdapter } from "../../../src/players/random/RandomAdapter.js";
import { PiGAdapter, PiHAdapter, PiCAdapter } from "../../../src/players/giacomelli/GiacomelliAdapter.js";
import { CardFrameworkCpu0Adapter, CardFrameworkCpu1Adapter, CardFrameworkCpu2Adapter } from "../../../src/players/cardframework/CardFrameworkAdapter.js";
import { BriscolaJsS0Adapter, BriscolaJsS1Adapter } from "../../../src/players/briscolajs/BriscolaJsAdapter.js";
import { PoianaAdapter } from "../../../src/players/poiana/PoianaAdapter.js";
import { PoianaDeterministicRuntime } from "../../../src/players/poiana/PoianaDeterministicRuntime.js";
import { POIANA_MODELS_BY_WIN_RATE } from "../../../src/players/poiana/PoianaModels.js";

/** Historical/core benchmark set, including Giacomelli 2026 policies. */
export const arenaPlayers = Object.freeze([
  { id: "qbriscola", name: "QBriscola", create: () => new QBriscolaAdapter() },
  { id: "cuperativa", name: "Cuperativa", create: () => new CuperativaAdapter() },
  {
    id: "smbriscola-empirico1",
    name: "smBrisCola Empirico1",
    create: () => new SmBriscolaEmpirico1Adapter()
  },
  {
    id: "smbriscola-empirico2",
    name: "smBrisCola Empirico2",
    create: () => new SmBriscolaEmpirico2Adapter()
  },
  {
    id: "jbriscola",
    name: "JBriscola",
    create: (randomSeed = 0x4a425249) => new JBriscolaAdapter({ randomSeed })
  },
  { id: "pryscola", name: "Pryscola", create: () => new PryscolaAdapter() },
  {
    id: "random",
    name: "Random",
    create: (randomSeed = 0x52414e44) => new RandomAdapter({ randomSeed })
  },
  { id: "giacomelli-pig", name: "πG Greedy", create: () => new PiGAdapter() },
  { id: "giacomelli-pih", name: "πH Hoarder", create: () => new PiHAdapter() },
  { id: "giacomelli-pic", name: "πC Counter", create: () => new PiCAdapter() },
  {
    id: "cardframework-cpu0",
    name: "CardFramework Cpu0",
    create: (randomSeed = 0x43463030) => new CardFrameworkCpu0Adapter({ randomSeed })
  },
  {
    id: "cardframework-cpu1",
    name: "CardFramework Cpu1",
    create: (randomSeed = 0x43463031) => new CardFrameworkCpu1Adapter({ randomSeed })
  },
  {
    id: "cardframework-cpu2",
    name: "CardFramework Cpu2",
    create: (randomSeed = 0x43463032) => new CardFrameworkCpu2Adapter({ randomSeed })
  },
  {
    id: "briscolajs-s0",
    name: "Briscola.js S0",
    create: () => new BriscolaJsS0Adapter()
  },
  {
    id: "briscolajs-s1",
    name: "Briscola.js S1",
    create: () => new BriscolaJsS1Adapter()
  },
  {
    id: "briscolabot-v3",
    name: "BriscolaBot v3",
    create: (randomSeed = 0x42524953) => new BriscolaBotAdapter({
      randomSeed,
      runtime: new BriscolaBotDeterministicRuntime()
    })
  }
]);

export const poianaArenaPlayers = Object.freeze(
  POIANA_MODELS_BY_WIN_RATE.map((model) => Object.freeze({
    id: model.id,
    name: model.displayName,
    create: () => new PoianaAdapter({
      model,
      runtime: new PoianaDeterministicRuntime({
        modelName: model.name,
        architecture: model.architecture
      })
    })
  }))
);

export const allArenaPlayers = Object.freeze([...arenaPlayers, ...poianaArenaPlayers]);

export function getArenaPlayer(id) {
  const player = allArenaPlayers.find((item) => item.id === id);
  if (!player) {
    const available = allArenaPlayers.map((item) => item.id).join(", ");
    throw new Error(`Unknown Arena player '${id}'. Available players: ${available}`);
  }
  return player;
}
