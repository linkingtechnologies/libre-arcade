#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// Tiny dependency-free server for the behavioural oracle.
//
//   /                      tools/oracle/            (harness page and modules)
//   /orig/...              reference/.fetched/orig/ (the untouched original game)
//   /shared/...            tools/shared/            (bot and canonical snapshot, used by both sides)
//   POST /result/<name>    writes tools/oracle/out/<name>.json

import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = join(here, "../..");
const outDir = join(here, "out");

const mounts = [
  ["/orig/", join(root, "reference/.fetched/orig")],
  ["/shared/", join(root, "tools/shared")],
  ["/public/", join(root, "public")],
  ["/", here],
];
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css", ".png": "image/png", ".ogg": "audio/ogg", ".json": "application/json", ".ico": "image/x-icon",
};

export function startServer(port = 0) {
  mkdirSync(outDir, { recursive: true });
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (req.method === "POST" && url.pathname.startsWith("/result/")) {
      const name = url.pathname.slice("/result/".length).replace(/[^\w.-]/g, "_");
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        writeFileSync(join(outDir, `${name}.json`), Buffer.concat(chunks));
        res.writeHead(204).end();
      });
      return;
    }
    let pathname = decodeURIComponent(url.pathname);
    for (const [prefix, dir] of mounts) {
      if (!pathname.startsWith(prefix)) continue;
      let rel = normalize(pathname.slice(prefix.length));
      if (rel.startsWith("..")) break;
      if (rel === "" || rel === ".") rel = "harness.html";
      const file = join(dir, rel);
      if (existsSync(file) && statSync(file).isFile()) {
        res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
        res.end(readFileSync(file));
        return;
      }
    }
    res.writeHead(404).end("not found");
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  const server = await startServer(Number(process.env.PORT) || 8099);
  console.log(`oracle server on http://127.0.0.1:${server.address().port}/`);
}
