#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// There is no bundler in this project on purpose: the game already runs as
// native ES modules. "Building" packages the runtime tree from public/ into
// game/, leaving out lab-only material that never runs in the browser.

import { cp, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = new URL("../public", import.meta.url);
const destination = new URL("../game", import.meta.url);

await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });

console.log(`Packaged ${root}public -> ${root}game`);
