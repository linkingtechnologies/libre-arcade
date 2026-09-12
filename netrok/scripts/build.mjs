#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later

// There is no bundler in this project on purpose: the game already runs as
// native ES modules. "Building" packages only the browser-facing subset —
// the playable game plus the license texts distribution requires — into
// game/, leaving out lab-only material (reference/) that never runs in the
// browser.

import { cp, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const rootUrl = new URL("../", import.meta.url);
const destinationUrl = new URL("../game/", import.meta.url);

// Playable game code, plus GPL-required license and third-party notices.
const ENTRIES = ["index.html", "favicon.svg", "src", "editor", "assets", "LICENSE", "THIRD_PARTY_NOTICES.md"];

await rm(destinationUrl, { recursive: true, force: true });
for (const entry of ENTRIES) {
  await cp(new URL(entry, rootUrl), new URL(entry, destinationUrl), { recursive: true });
}

console.log(`Packaged ${fileURLToPath(rootUrl)}{${ENTRIES.join(", ")}} -> ${fileURLToPath(destinationUrl)}`);
