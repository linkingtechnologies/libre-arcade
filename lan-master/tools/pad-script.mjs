// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// A pad for the oracle, written as a list of presses: { at, buttons, hold }. `at` is the tick of the game's clock (counted from when the page's
// clock starts) at which the buttons go down, `hold` how many frames they stay down (6 by default: more than the one frame the game needs, and
// released long before the next press). Returns the function lockstep() takes as its `pad`.
export function padScript(presses) {
  return ({ tick }) => {
    let buttons = 0;
    for (const p of presses) if (tick >= p.at && tick < p.at + (p.hold ?? 6)) buttons |= p.buttons;
    return buttons;
  };
}

// The presses of a list of button groups, one every `gap` ticks from `from`.
export function everyTicks(list, { from = 0, gap = 12, hold = 6 } = {}) {
  return list.map((buttons, i) => ({ at: from + i * gap, buttons, hold }));
}
