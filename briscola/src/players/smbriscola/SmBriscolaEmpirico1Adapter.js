// SPDX-License-Identifier: GPL-3.0-only
import { SmBriscolaAdapter } from "./SmBriscolaAdapter.js";
import { SmBriscolaEmpirico1AI } from "./SmBriscolaEmpirico1AI.js";

/** BriscoLab adapter for the original smBrisCola Empirico1 player. */
export class SmBriscolaEmpirico1Adapter extends SmBriscolaAdapter {
  constructor({ ai = null } = {}) {
    super({
      method: "Empirico1",
      ai: ai ?? new SmBriscolaEmpirico1AI(),
      id: "smbriscola-empirico1",
      name: "smBrisCola Empirico1"
    });
  }
}
