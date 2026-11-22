// SPDX-License-Identifier: MIT
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(`../public/${path}`, import.meta.url), "utf8");

test("the standalone page loads the game and carries its license and credits", async () => {
  const [html, credits, license] = await Promise.all([
    read("index.html"),
    read("CREDITS.md"),
    read("LICENSE"),
  ]);
  assert.match(html, /<title>HexGL<\/title>/);
  assert.match(html, /<script src="launch\.js"><\/script>/);
  assert.match(html, /<script src="mobile-controls\.js/);
  assert.match(credits, /Thibaut Despoulain/);
  assert.match(credits, /Charnel/);
  assert.match(license, /The MIT License/);
  assert.match(license, /Despoulain/);
});

test("every script and stylesheet the page references exists", async () => {
  const html = await read("index.html");
  const refs = [...html.matchAll(/(?:src|href)="([^"#]+?)(?:\?[^"]*)?"/g)]
    .map((m) => m[1])
    .filter((p) => !p.startsWith("http") && !p.startsWith("//"));
  assert.ok(refs.length > 20, "expected the full script list");
  for (const ref of refs) {
    await assert.doesNotReject(read(ref), `missing ${ref}`);
  }
});

test("the touch layer is wired in, not just shipped", async () => {
  const launch = await read("launch.js");
  assert.match(launch, /bkcore\.MobileControls\.bind\(hexGL\)/);
  assert.match(launch, /bkcore\.Audio\.resume\(\)/);
  const audio = await read("bkcore/Audio.js");
  assert.match(audio, /bkcore\.Audio\.resume = function/);
});

test("no telemetry, ads or remote calls remain beyond the shared GoatCounter beacon", async () => {
  const [html, launch, mobile, audio] = await Promise.all([
    read("index.html"),
    read("launch.js"),
    read("mobile-controls.js"),
    read("bkcore/Audio.js"),
  ]);
  assert.doesNotMatch(html, /google-analytics|googlesyndication|_gaq|UA-\d/i);
  const allowed = [
    "https://grugnetto.goatcounter.com/count",
    "http://get.webgl.org/", // link shown only when WebGL is unavailable
  ];
  for (const [name, text] of Object.entries({ html, launch, mobile, audio })) {
    const urls = text.match(/https?:\/\/[^"'\s)]+/g) ?? [];
    for (const url of urls) {
      assert.ok(allowed.includes(url), `${name} references ${url}`);
    }
  }
});

test("the dropped Firefox OS / AppCache packaging files are gone", async () => {
  for (const gone of ["manifest.webapp", "cache.appcache", ".htaccess"]) {
    await assert.rejects(read(gone), `${gone} should not be shipped`);
  }
});
