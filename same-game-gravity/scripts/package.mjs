#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// Production ZIP for Libre Arcade: public/ + licence files, no tests, reference
// or specs. Dev tooling only. Writes the zip itself (zlib, forward-slash names)
// so it needs no external tool and behaves the same on every OS.
import { Buffer } from "node:buffer";
import { readdir, readFile, writeFile, mkdir, rm, stat } from "node:fs/promises";
import { deflateRawSync, crc32 } from "node:zlib";
import { fileURLToPath } from "node:url";
import { join, relative, sep } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const TOP = "same-game-gravity";

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out.sort();
}

const entries = [];
for (const f of await walk(join(root, "public"))) entries.push([relative(join(root, "public"), f).split(sep).join("/"), f]);
for (const f of ["ASSETS.md", "README.md", "CHANGELOG.md"]) entries.push([f, join(root, f)]);
const seen = new Set();
const files = entries.filter(([n]) => (seen.has(n) ? false : seen.add(n)));

const chunks = [], central = [];
let offset = 0;
for (const [name, path] of files) {
  const data = await readFile(path);
  const comp = deflateRawSync(data);
  const nm = Buffer.from(`${TOP}/${name}`);
  const crc = crc32(data);
  const time = 0, date = (46 << 9) | (1 << 5) | 1; // fixed 2026-01-01: reproducible archive
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(8, 8); local.writeUInt16LE(time, 10); local.writeUInt16LE(date, 12);
  local.writeUInt32LE(crc, 14); local.writeUInt32LE(comp.length, 18); local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nm.length, 26);
  chunks.push(local, nm, comp);
  const c = Buffer.alloc(46);
  c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8);
  c.writeUInt16LE(8, 10); c.writeUInt16LE(time, 12); c.writeUInt16LE(date, 14);
  c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(data.length, 24);
  c.writeUInt16LE(nm.length, 28); c.writeUInt32LE(offset, 42);
  central.push(c, nm);
  offset += local.length + nm.length + comp.length;
}
const cd = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);

const dist = join(root, "dist");
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
const out = join(dist, `same-game-gravity-${pkg.version}.zip`);
await writeFile(out, Buffer.concat([...chunks, cd, end]));
console.log("wrote", out, `(${(await stat(out)).size} bytes, ${files.length} files)`);
