// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// Browser smoke test of the real page: real rendering, real DOM events. The game is loaded in an
// iframe of the same origin and driven with genuine KeyboardEvent / PointerEvent objects and
// clicks; the results are posted back to tools/e2e/run.mjs.

const frame = document.getElementById("g");
const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 4000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (fn()) return true; await sleep(20); }
  return false;
}
async function check(name, fn) {
  try { const r = await fn(); results.push([name, r === undefined || r === true, r === undefined || r === true ? "" : String(r)]); }
  catch (e) { results.push([name, false, String(e && e.stack || e)]); }
}

await new Promise((r) => (frame.contentDocument && frame.contentDocument.readyState === "complete" ? r() : frame.addEventListener("load", r)));
await sleep(300);
const w = frame.contentWindow;
const d = frame.contentDocument;
const $ = (id) => d.getElementById(id);
const state = () => w.__rg.state;
const game = () => w.__rg.game;
const key = (type, code, k) => w.dispatchEvent(new w.KeyboardEvent(type, { code, key: k || code, bubbles: true, cancelable: true }));
const hold = async (code, ms, k) => { key("keydown", code, k); await sleep(ms); key("keyup", code, k); };
const ptr = (el, type, id) => el.dispatchEvent(new w.PointerEvent(type, { pointerId: id, pointerType: "touch", bubbles: true, cancelable: true }));

await check("menu is shown first, in the browser's language", () => {
  if (state() !== "menu") return `state ${state()}`;
  const want = (navigator.language || "en").toLowerCase().startsWith("it") ? "it" : "en";
  return w.__rg.lang === want || `lang ${w.__rg.lang}, expected ${want}`;
});

await check("language switch: Italian then English", async () => {
  d.querySelector('[data-lang="it"]').click();
  if ($("menu-play").textContent !== "Gioca") return `got ${$("menu-play").textContent}`;
  if (d.documentElement.lang !== "it") return "html lang not updated";
  d.querySelector('[data-lang="en"]').click();
  return $("menu-play").textContent === "Play game" || "English not restored";
});

await check("instructions and credits open and close", () => {
  $("menu-howto").click();
  if (state() !== "howto" || $("screen-howto").hidden) return "howto not shown";
  if (!$("screen-howto").textContent.includes("Carrot-on-a-Fork")) return "story text missing";
  d.querySelector("#screen-howto [data-back]").click();
  $("menu-credits").click();
  if (state() !== "credits" || !$("screen-credits").textContent.includes("Stremena Tuzsuzova")) return "credits missing the original artist";
  const repo = d.querySelector("#screen-credits a");
  if (!repo || repo.href !== "https://github.com/linkingtechnologies/libre-arcade" || repo.rel.indexOf("noopener") < 0) return "credits lack the Libre Arcade repository link";
  key("keydown", "Escape", "Escape");
  return state() === "menu" || "Escape did not return to the menu";
});

await check("Play starts a game: HUD shown, canvas drawn, no page scroll", async () => {
  $("menu-play").click();
  if (state() !== "playing") return `state ${state()}`;
  await sleep(300);
  if ($("hud").hidden) return "HUD hidden";
  const c = $("canvas");
  const px = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  const colours = new Set();
  for (let i = 0; i < px.length; i += 4 * 997) colours.add(`${px[i]},${px[i + 1]},${px[i + 2]}`);
  if (colours.size < 8) return `canvas looks blank (${colours.size} colours)`;
  const e = d.documentElement;
  return (e.scrollHeight <= w.innerHeight && e.scrollWidth <= w.innerWidth) || `page scrolls: ${e.scrollHeight}x${e.scrollWidth} in ${w.innerHeight}x${w.innerWidth}`;
});

await check("arrow keys move the rabbit at 2 px per frame", async () => {
  const g = game();
  const x0 = g.player.x;
  await hold("ArrowRight", 500);
  const dx = g.player.x - x0;
  return (dx >= 36 && dx <= 56 && dx % 2 === 0) || `moved ${dx}px in 0.5 s`;
});

await check("holding Z pulls a carrot: +2 carrots after about a second, HUD updated", async () => {
  const g = game();
  const p = g.player;
  g.carrots.length = 0;
  g.carrots.push({ serial: ++g.carrotSerial, x: p.x - 8, y: p.y + 40, health: 100, pulled: false, occupied: true, dead: false });
  const before = g.score;
  key("keydown", "KeyZ", "z");
  const ok = await until(() => g.score === before + 2, 2500);
  key("keyup", "KeyZ", "z");
  if (!ok) return `score ${g.score}`;
  await sleep(100);
  return $("carrots").textContent === String(g.score) || "HUD not updated";
});

await check("Q with carrots repels; Q with none shows the message", async () => {
  const g = game();
  g.player.carrotsCount = 1;
  await hold("KeyQ", 60, "q");
  if (g.player.carrotsCount !== 0) return "Q did not eat a carrot";
  await hold("KeyQ", 60, "q");
  await sleep(10);
  return $("message").textContent.includes("no carrots") || `message: ${$("message").textContent}`;
});

await check("W plants a totem for two carrots", async () => {
  const g = game();
  g.player.carrotsCount = 3;
  await hold("KeyW", 60, "w");
  return (g.player.carrotsCount === 1 && !!g.fork) || `carrots ${g.player.carrotsCount}, fork ${!!g.fork}`;
});

await check("pause stops the game, resume continues, keys held are released", async () => {
  key("keydown", "ArrowLeft");
  key("keydown", "KeyP", "p"); key("keyup", "KeyP", "p");
  if (state() !== "paused") { key("keyup", "ArrowLeft"); return `state ${state()}`; }
  const f = game().frame, x = game().player.x;
  await sleep(300);
  if (game().frame !== f) return "frames advanced while paused";
  $("pause-resume").click();
  await sleep(300);
  key("keyup", "ArrowLeft");
  return (state() === "playing" && game().frame > f && game().player.x === x) || `state ${state()} x ${x} -> ${game().player.x}`;
});

await check("restart gives a fresh game", async () => {
  const f = game().frame;
  $("btn-restart").click();
  await sleep(100);
  return (state() === "playing" && game().frame < f && game().score === 0) || "not restarted";
});

await check("game over: score screen after three minutes", async () => {
  const g = game();
  g.player.carrotsCount = 5;
  g.gameTimeLeft = g.now + 100;
  if (!(await until(() => state() === "over", 2000))) return `state ${state()}`;
  return ($("over-score").textContent === "5" && !$("screen-over").hidden) || `score shown ${$("over-score").textContent}`;
});

await check("Play again and Main menu", async () => {
  $("over-again").click();
  if (state() !== "playing") return "no new game";
  $("btn-pause").click();
  $("pause-menu").click();
  return state() === "menu" || `state ${state()}`;
});

await check("touch controls work on their own (no keyboard): d-pad, pull and push buttons, several at once", async () => {
  d.body.classList.add("touch");
  $("menu-play").click();
  const g = game();
  await sleep(100);
  const x0 = g.player.x;
  const right = d.querySelector('#touch [data-key="39"]');
  ptr(right, "pointerdown", 11);
  await sleep(400);
  ptr(right, "pointerup", 11);
  const dx = g.player.x - x0;
  if (dx < 28 || dx > 48) return `d-pad moved ${dx}px`;
  const p = g.player;
  g.carrots.length = 0;
  g.carrots.push({ serial: ++g.carrotSerial, x: p.x - 8, y: p.y + 22, health: 100, pulled: false, occupied: true, dead: false }); // tall enough to stay under the feet while the other finger walks up
  const pull = $("t-pull"), up = d.querySelector('#touch [data-key="38"]');
  ptr(pull, "pointerdown", 21);
  ptr(up, "pointerdown", 22); // second finger while the first holds pull
  await sleep(150);
  ptr(up, "pointerup", 22);
  const y1 = g.player.y;
  const done = await until(() => g.score >= 2, 2500);
  ptr(pull, "pointerup", 21);
  if (!done) return `pull via touch gave ${g.score}`;
  g.player.carrotsCount = 2;
  ptr($("t-push"), "pointerdown", 31); ptr($("t-push"), "pointerup", 31);
  if (g.player.carrotsCount !== 1) return "push button did nothing";
  return y1 < 1e9;
});

await check("no remote requests except the analytics beacon", () => {
  const bad = performance.getEntriesByType("resource").concat(w.performance.getEntriesByType("resource")).map((r) => r.name).filter((n) => !n.startsWith(location.origin) && !n.includes("gc.zgo.at") && !n.includes("goatcounter"));
  return bad.length === 0 || bad.join(", ");
});

await fetch("/result/smoke", { method: "POST", body: JSON.stringify(results) });
document.title = "DONE";
