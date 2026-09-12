import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("on-demand worker uses the JS solver and returns only solved deals", async () => {
  const source = await readFile(new URL("../public/src/solver-worker.js", import.meta.url), "utf8");
  assert.match(source, /solveMinimalKlondike/);
  assert.match(source, /result\.result !== "solved"/);
  assert.match(source, /type: "solved"/);
  assert.match(source, /solution: result\.moves/);
  assert.match(source, /maxAttempts === 0 \|\| attempt < maxAttempts/);
});

test("foreground generation releases worker memory between automatic batches", async () => {
  const source = await readFile(new URL("../public/src/ui.js", import.meta.url), "utf8");
  assert.match(source, /GENERATION_MAX_STATES = 8000/);
  assert.match(source, /FOREGROUND_BATCH_ATTEMPTS = 1/);
  assert.match(source, /BACKGROUND_BATCH_ATTEMPTS = 4/);
  assert.match(source, /FOREGROUND_WORKER_RETRY_DELAYS = \[250, 500, 1000, 2000, 3500, 5000, 7500, 10000\]/);
  assert.match(source, /data\.type === "exhausted" && foreground/);
  assert.match(source, /setTimeout\(launchWorker, 50\)/);
  assert.match(source, /worker !== currentWorker/);
  assert.match(source, /FOREGROUND_WORKER_RETRY_DELAYS\[Math\.min\(workerRestarts\+\+, FOREGROUND_WORKER_RETRY_DELAYS\.length - 1\)\]/);
  assert.doesNotMatch(source, /workerRestarts < FOREGROUND_WORKER_RETRY_DELAYS\.length/);
  assert.match(source, /maxStates: GENERATION_MAX_STATES/);
  assert.match(source, /maxAttempts: foreground \? FOREGROUND_BATCH_ATTEMPTS : BACKGROUND_BATCH_ATTEMPTS/);
  assert.doesNotMatch(source, /maxAttempts: foreground \? 0 : 20/);
});
