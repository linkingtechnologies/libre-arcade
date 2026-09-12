#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Dev tooling only — does not apply to the vendored game in public/, which
// keeps its own license (see public/LICENSE* and public/CREDITS.md).

// There is no bundler here on purpose: the game already runs as plain
// HTML/CSS/JS. "Building" only packages public/ into game/ so it can be
// copied onto any web server as-is.

import { cp, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = new URL("../public", import.meta.url);
const destination = new URL("../game", import.meta.url);

await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });

console.log(`Packaged ${root}public -> ${root}game`);
