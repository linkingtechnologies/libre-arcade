// SPDX-License-Identifier: MIT
// Dev tooling. Deterministic frame-by-frame driver for the ORIGINAL upstream
// build (reference/, served by scripts/serve.mjs) and the RESTORED build
// (public/). Both run under tools/virtual-clock.js, so the same input script
// must produce the same scene digest on every frame.

import { readFileSync } from "node:fs";
import { launch } from "./cdp.mjs";

const CLOCK = readFileSync(new URL("./virtual-clock.js", import.meta.url), "utf8");
export const URLS = {
  original: process.env.E1_ORIGINAL_URL ?? "http://localhost:8103/index.dev.html",
  restored: process.env.E1_RESTORED_URL ?? "http://localhost:8102/#play",
};
const KEYS = { left: 37, up: 38, right: 39, down: 40, space: 32, z: 90, x: 88, enter: 13 };

export async function open(kind, opts = {}) {
  const level = opts.level ?? "level1";
  const page = await launch();
  const log = { errors: [], requests: [], failed: [] };
  page.on((m) => {
    if (m.method === "Runtime.exceptionThrown") log.errors.push((m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).split("\n")[0]);
    if (m.method === "Network.requestWillBeSent") log.requests.push(m.params.request.url);
    if (m.method === "Network.responseReceived" && m.params.response.status >= 400) log.failed.push(`${m.params.response.status} ${m.params.response.url}`);
    if (m.method === "Network.loadingFailed") log.failed.push(`failed ${m.params.errorText}`);
  });
  await page.send("Page.addScriptToEvaluateOnNewDocument", { source: CLOCK });
  await page.goto(URLS[kind]);
  const api = {
    page, log,
    step: (n = 1) => page.eval(`__step(${n})`),
    digest: async () => JSON.parse(await page.eval("JSON.stringify(__digest())")),
    state: () => page.eval('typeof Phaser !== "undefined" && Phaser.GAMES[0] ? Phaser.GAMES[0].state.current : null'),
    key: (name, down) => page.eval(`window.dispatchEvent(new KeyboardEvent('${down ? "keydown" : "keyup"}',{bubbles:true,cancelable:true,keyCode:${KEYS[name]},which:${KEYS[name]}}))`),
    async untilState(name, maxChunks = 2000) {
      for (let i = 0; i < maxChunks; i++) {
        if ((await api.state()) === name) return true;
        await api.step(3);
        await page.sleep(15);
      }
      throw new Error(`never reached state ${name} (at ${await api.state()})`);
    },
    close: () => page.close(),
  };
  if (kind === "original") await page.sleep(300);
  await api.untilState("mainmenu");
  // let the menu fade-in tweens run a little, then press Enter exactly as a player would
  for (let i = 0; i < 30; i++) await api.step(1);
  // Phaser seeds game.rnd from the (virtual) clock at boot, which differs by load timing; reseed so clouds match.
  await page.eval("Phaser.GAMES[0].rnd.sow(['elemental-one'])");
  await page.eval("__align(6000000)");
  await api.key("enter", true); await api.step(2); await api.key("enter", false);
  await api.untilState("level1");
  if (level !== "level1") {
    // Same call the game itself makes when a level is completed (main.js: game.state.start(game.nextState)).
    await page.eval(`Phaser.GAMES[0].state.start(${JSON.stringify(level)})`);
    await api.untilState(level);
    await api.step(2);
  }
  return api;
}

export const player = (d) => d.objs.find((o) => o[0] === "p1");

/** Replay a script of [frame, "down"|"up", keyName] and return one digest per frame. */
export async function replay(api, script, frames, onFrame) {
  const byFrame = new Map();
  for (const step of script) (byFrame.get(step[0]) ?? byFrame.set(step[0], []).get(step[0])).push(step);
  const trace = [];
  for (let f = 0; f < frames; f++) {
    for (const [, act, a, b] of byFrame.get(f) ?? []) {
      if (act === "tp") await api.page.eval(`__tp(${a},${b})`);
      else await api.key(a, act === "down");
    }
    await api.step(1);
    const d = JSON.stringify(await api.digest());
    trace.push(d);
    if (onFrame) await onFrame(f, JSON.parse(d));
  }
  return trace;
}
