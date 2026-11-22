// What ships in public/ is self-contained, static, and complete.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { ROOT } from "./helpers/engine.mjs";

const PUB = join(ROOT, "public");
function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = walk(PUB);
const text = (f) => readFileSync(f, "utf8");
const code = files.filter((f) => /\.(html|css|js)$/.test(f));

test("no remote dependency except the arcade's own GoatCounter beacon", () => {
  const allowed = [/gc\.zgo\.at\/count\.js/, /grugnetto\.goatcounter\.com\/count/];
  for (const f of code) {
    const lines = text(f).split("\n");
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/(?:src|href|url\()\s*=?\s*["']?((?:https?:)?\/\/[^"'\s)]+)/g)) {
        const url = m[1];
        if (allowed.some((a) => a.test(url))) continue;
        // Plain <a href> links to people and pages are navigation, not requests.
        assert.ok(/<a\s/.test(line) || /href="http/.test(line) && /<a /.test(line), `${f}:${i + 1} requests ${url}`);
      }
      assert.ok(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|import\s*\(\s*["']http/.test(line), `${f}:${i + 1} network call`);
    });
  }
});

test("no framework, bundle or build output ships", () => {
  assert.ok(!files.some((f) => /bundle|vue|\.min\./i.test(f)));
  for (const f of code.filter((x) => x.endsWith(".js"))) assert.ok(!/from ['"][^./]/.test(text(f)), `${f} imports a package`);
});

test("GoatCounter snippet is present exactly as the collection prescribes", () => {
  const html = text(join(PUB, "index.html"));
  assert.ok(html.includes('<script data-goatcounter="https://grugnetto.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>'));
  assert.ok(!/Content-Security-Policy/i.test(html));
});

test("every local file the page and stylesheet name exists", () => {
  const refs = [];
  const html = text(join(PUB, "index.html"));
  for (const m of html.matchAll(/(?:src|href)="([^"#:]+)"/g)) {
    if (m[1].startsWith("//") || m[1] === "../../index.html") continue; // beacon, arcade landing page
    refs.push(join(PUB, m[1]));
  }
  for (const m of text(join(PUB, "css", "app.css")).matchAll(/url\(([^)]+)\)/g)) refs.push(join(PUB, "css", m[1]));
  for (const f of files.filter((x) => x.endsWith(".js"))) {
    for (const m of text(f).matchAll(/from '(\.[^']+)'/g)) refs.push(join(f, "..", m[1]));
  }
  for (const r of refs) {
    assert.ok(existsSync(r), `missing ${r}`);
  }
  for (const f of ["CREDITS.md", "LICENSE"]) assert.ok(existsSync(join(PUB, f)), f);
  for (const n of ["freezetime", "lose", "move", "reverse", "teleport", "win"]) assert.ok(existsSync(join(PUB, "assets", "audio", `${n}.mp3`)));
});

test("the page is responsive and does not scroll", () => {
  const html = text(join(PUB, "index.html"));
  assert.match(html, /name="viewport"[^>]*width=device-width/);
  const css = text(join(PUB, "css", "app.css"));
  assert.match(css, /overflow:\s*hidden/);
  assert.match(css, /touch-action:\s*none/);
  assert.match(css, /overscroll-behavior:\s*none/);
});

test("the game logic still contains no DOM, Vue or timer calls of its own", () => {
  for (const f of readdirSync(join(PUB, "js", "game"))) {
    // store.js keeps one default, the injected clock's real-timer fallback.
    const src = text(join(PUB, "js", "game", f))
      .split("\n")
      .filter((l) => !l.includes("clock: {"))
      .join("\n");
    const noComments = src.replace(/\/\/.*$/gm, "");
    assert.ok(!/setTimeout\(|alert\(|document\.|navigator\.|location\./.test(noComments), f);
  }
});

test("MANIFEST.sha256.txt is current (run npm run manifest after changing a file)", async () => {
  const { buildManifest } = await import("../scripts/manifest.mjs");
  assert.equal(readFileSync(join(ROOT, "MANIFEST.sha256.txt"), "utf8"), buildManifest());
});
