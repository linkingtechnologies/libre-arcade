// SPDX-License-Identifier: GPL-3.0-only
import { SmBriscolaAI } from "./SmBriscolaAI.js";

/**
 * Faithful smBrisCola Empirico1 player.
 *
 * This thin class deliberately exposes Empirico1 as an independent player
 * while keeping the shared faithful port in SmBriscolaAI.
 */
export class SmBriscolaEmpirico1AI extends SmBriscolaAI {
  constructor() {
    super({ method: "Empirico1" });
  }
}
