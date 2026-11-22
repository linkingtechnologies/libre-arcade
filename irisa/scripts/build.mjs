#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// Dev tooling only: packages public/ (the whole game, no bundler needed) into game/.

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
