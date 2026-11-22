// SPDX-License-Identifier: GPL-3.0-only
import { SmBriscolaAdapter } from "./SmBriscolaAdapter.js";
import { SmBriscolaEmpirico2AI } from "./SmBriscolaEmpirico2AI.js";

/** BriscoLab adapter for the original smBrisCola Empirico2 player. */
export class SmBriscolaEmpirico2Adapter extends SmBriscolaAdapter {
  constructor({ ai = null } = {}) {
    super({
      method: "Empirico2",
      ai: ai ?? new SmBriscolaEmpirico2AI(),
      id: "smbriscola-empirico2",
      name: "smBrisCola Empirico2"
    });
  }
}
