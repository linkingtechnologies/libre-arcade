import assert from "node:assert/strict";
import test from "node:test";
import { createClock } from "../public/js/clock.js";
import { createSound, SOUND_FILES } from "../public/js/sound.js";
import { createI18n, format, pickLanguage, STRINGS } from "../public/js/i18n.js";

test("clock: runs, pauses with the remaining time kept, resumes, cancels", async () => {
  let t = 0;
  const clock = createClock(() => t);
  const fired = [];
  clock.after(() => fired.push("a"), 40);
  clock.after(() => fired.push("b"), 5000);
  await new Promise((r) => setTimeout(r, 60));
  assert.deepEqual(fired, ["a"]);
  t = 100;
  clock.pause();
  assert.equal(clock.isPaused, true);
  clock.after(() => fired.push("c"), 10); // scheduled while paused: waits
  await new Promise((r) => setTimeout(r, 40));
  assert.deepEqual(fired, ["a"], "nothing fires while paused");
  clock.resume();
  await new Promise((r) => setTimeout(r, 40));
  assert.deepEqual(fired, ["a", "c"]);
  clock.cancelAll();
  assert.equal(clock.pending, 0);
});

test("clock: time spent paused is not counted", async () => {
  let t = 0;
  const clock = createClock(() => t);
  const fired = [];
  clock.after(() => fired.push("x"), 80);
  await new Promise((r) => setTimeout(r, 30));
  t = 30;
  clock.pause();
  await new Promise((r) => setTimeout(r, 120)); // would have fired if running
  assert.deepEqual(fired, []);
  clock.resume();
  await new Promise((r) => setTimeout(r, 30));
  assert.deepEqual(fired, [], "about 50 ms of the 80 are still owed");
  await new Promise((r) => setTimeout(r, 80));
  assert.deepEqual(fired, ["x"]);
});

test("sound: nothing is requested before unlock; mute silences; no Chrome check", () => {
  const made = [];
  class FakeAudio {
    constructor(src) { this.src = src; this.plays = 0; this.currentTime = 5; made.push(this); }
    pause() { this.paused = true; }
    play() { this.plays += 1; return Promise.reject(new Error("blocked")); }
  }
  const sound = createSound({ AudioClass: FakeAudio });
  sound.play("move");
  assert.equal(made.length, 0);
  sound.unlock();
  sound.unlock();
  assert.equal(made.length, Object.keys(SOUND_FILES).length);
  assert.deepEqual(made.map((a) => a.src).sort(), Object.values(SOUND_FILES).map((f) => `assets/audio/${f}`).sort());
  sound.play("move");
  const move = made.find((a) => a.src.endsWith("move.mp3"));
  assert.equal(move.plays, 1);
  assert.equal(move.currentTime, 0, "rewound like upstream");
  sound.setMuted(true);
  sound.play("move");
  assert.equal(move.plays, 1);
  sound.setMuted(false);
  sound.play("move");
  assert.equal(move.plays, 2);
});

test("language: Italian browsers get Italian, everything else English, a saved choice wins", () => {
  assert.equal(pickLanguage(null, ["it-IT", "en"]), "it");
  assert.equal(pickLanguage(null, ["it"]), "it");
  assert.equal(pickLanguage(null, ["en-US", "it"]), "en");
  assert.equal(pickLanguage(null, ["fr"]), "en");
  assert.equal(pickLanguage(null, []), "en");
  assert.equal(pickLanguage("en", ["it-IT"]), "en");
  assert.equal(pickLanguage("xx", ["it-IT"]), "it");
});

test("both languages define exactly the same keys and instructions", () => {
  assert.deepEqual(Object.keys(STRINGS.it).sort(), Object.keys(STRINGS.en).sort());
  assert.equal(STRINGS.it.how.length, STRINGS.en.how.length);
  for (const lang of ["en", "it"]) {
    for (const [key, value] of Object.entries(STRINGS[lang])) {
      const text = Array.isArray(value) ? value.join(" ") : value;
      assert.ok(text.length > 0, `${lang}.${key} is empty`);
      assert.ok(!/—/.test(text), `${lang}.${key} has an em dash`);
    }
  }
  const i18n = createI18n("it");
  assert.equal(i18n.t("levelN", { n: 3, total: 20 }), "Livello 3 di 20");
  i18n.set("en");
  assert.equal(i18n.t("levelN", { n: 3, total: 20 }), "Level 3 of 20");
  assert.equal(format("{a}-{b}", { a: 1, b: 2 }), "1-2");
});
