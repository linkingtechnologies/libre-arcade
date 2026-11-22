#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// No bundler on purpose: "building" copies public/ into game/ verbatim.
import { cp, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = new URL("../public", import.meta.url);
const destination = new URL("../game", import.meta.url);

// Release gate: refuses to package anything whose redistribution rights are unresolved.
execFileSync(process.execPath, [fileURLToPath(new URL("./rights.mjs", import.meta.url)), "--check"], { stdio: "inherit" });

await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });
console.log(`Packaged ${root}public -> ${root}game`);
