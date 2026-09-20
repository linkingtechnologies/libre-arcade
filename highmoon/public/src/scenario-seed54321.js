// SPDX-License-Identifier: GPL-3.0-or-later
// Fixed geometry extracted from the native HighMoon 1.2.4 oracle trace.
export const oracleScenario54321 = Object.freeze({
  name: "Native oracle galaxy seed 54321",
  sourceUfo: Object.freeze({ x: 70, y: 384, width: 48 }),
  targetUfo: Object.freeze({ x: 954, y: 384, width: 48 }),
  shotWidth: 17,
  start: Object.freeze({ x: 130, y: 384 }),
  bodies: Object.freeze([
    Object.freeze({ type: "Jupiter", x: 418.59730875492096, y: 54.73898363113403, weight: 350 }),
    Object.freeze({ type: "Wormhole", x: 768.142429638654, y: 88.79847872257233, weight: 50 }),
    Object.freeze({ type: "Earth", x: 768.2772937379777, y: 279.48814058303833, weight: 300 }),
    Object.freeze({ type: "Saturn", x: 488.0864165201783, y: 715.8757975101471, weight: 250 }),
    Object.freeze({ type: "Venus", x: 454.9881248064339, y: 555.5404937267303, weight: 180 }),
    Object.freeze({ type: "Storm", x: 584.0164769552648, y: 254.98464453220367, weight: -100 }),
  ]),
});
