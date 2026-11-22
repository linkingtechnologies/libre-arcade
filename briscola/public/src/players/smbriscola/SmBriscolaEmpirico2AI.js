// SPDX-License-Identifier: GPL-3.0-only
import { SmBriscolaAI } from "./SmBriscolaAI.js";

/**
 * Faithful smBrisCola Empirico2 player.
 *
 * This thin class deliberately exposes Empirico2 as an independent player
 * while keeping the shared faithful port in SmBriscolaAI.
 */
export class SmBriscolaEmpirico2AI extends SmBriscolaAI {
  constructor() {
    super({ method: "Empirico2" });
  }
}
