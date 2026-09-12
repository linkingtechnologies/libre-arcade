// SPDX-License-Identifier: GPL-3.0-only
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "decks");
const entries = await readdir(root, { withFileTypes: true });
const decks = [];

for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
  if (!entry.isDirectory()) continue;
  const manifestPath = path.join(root, entry.name, "briscolab_manifest.json");
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (manifest.format !== "briscolab-deck-manifest" || Number(manifest.version) !== 1) continue;
    decks.push({ manifest: `./${entry.name}/briscolab_manifest.json` });
  } catch (error) {
    if (error?.code !== "ENOENT") console.warn(`Skipping ${entry.name}: ${error.message}`);
  }
}

const index = {
  format: "briscolab-deck-index",
  version: 1,
  decks
};

await writeFile(path.join(root, "index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");
console.log(`Indexed ${decks.length} deck(s).`);
