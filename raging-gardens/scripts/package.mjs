#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// Production ZIP: release/raging-gardens-<version>.zip containing exactly public/ (what `build`
// copies to game/), written with node's own zlib, no tools needed. Refuses to run if the
// publication gate fails, so an unverified asset can never reach a release.

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateRawSync } from "node:zlib";
import { createHash } from "node:crypto";

const root = fileURLToPath(new URL("..", import.meta.url));
const pub = join(root, "public");

execFileSync(process.execPath, [join(root, "scripts/gate.mjs")], { stdio: "inherit" }); // throws, stopping here, if it fails

const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const walk = (dir) => readdirSync(dir).sort().flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p]; });

const DOS_TIME = 0, DOS_DATE = ((2026 - 1980) << 9) | (11 << 5) | 22; // fixed stamp: the same input gives the same ZIP
const local = [];
const central = [];
let offset = 0;
for (const abs of walk(pub)) {
  const name = Buffer.from(relative(pub, abs).split(sep).join("/"));
  const data = readFileSync(abs);
  const packed = deflateRawSync(data, { level: 9 });
  const useDeflate = packed.length < data.length;
  const body = useDeflate ? packed : data;
  const crc = crc32(data) >>> 0;
  const head = Buffer.alloc(30);
  head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(0x0800, 6);
  head.writeUInt16LE(useDeflate ? 8 : 0, 8); head.writeUInt16LE(DOS_TIME, 10); head.writeUInt16LE(DOS_DATE, 12);
  head.writeUInt32LE(crc, 14); head.writeUInt32LE(body.length, 18); head.writeUInt32LE(data.length, 22);
  head.writeUInt16LE(name.length, 26); head.writeUInt16LE(0, 28);
  local.push(head, name, body);
  const cen = Buffer.alloc(46);
  cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(0x0800, 8);
  cen.writeUInt16LE(useDeflate ? 8 : 0, 10); cen.writeUInt16LE(DOS_TIME, 12); cen.writeUInt16LE(DOS_DATE, 14);
  cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(body.length, 20); cen.writeUInt32LE(data.length, 24);
  cen.writeUInt16LE(name.length, 28); cen.writeUInt32LE(offset, 42);
  central.push(cen, name);
  offset += head.length + name.length + body.length;
}
const centralBuf = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(central.length / 2, 8); end.writeUInt16LE(central.length / 2, 10);
end.writeUInt32LE(centralBuf.length, 12); end.writeUInt32LE(offset, 16);

const zip = Buffer.concat([...local, centralBuf, end]);
const outDir = join(root, "release");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const out = join(outDir, `raging-gardens-${version}.zip`);
writeFileSync(out, zip);
const sum = createHash("sha256").update(zip).digest("hex");
writeFileSync(`${out}.sha256`, `${sum}  raging-gardens-${version}.zip\n`);
console.log(`wrote ${relative(root, out)}: ${central.length / 2} files, ${zip.length} bytes, sha256 ${sum}`);
