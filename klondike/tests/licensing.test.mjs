// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the project ships complete texts for every declared license", async () => {
  const [gpl, mit, cc0] = await Promise.all([
    read("LICENSES/GPL-3.0-or-later.txt"),
    read("LICENSES/MIT.txt"),
    read("LICENSES/CC0-1.0.txt"),
  ]);
  assert.match(gpl, /GNU GENERAL PUBLIC LICENSE/);
  assert.match(mit, /MIT License/);
  assert.match(cc0, /CC0 1\.0 Universal/);
});

test("the distributable standalone build carries the same license boundary", async () => {
  const [license, notices, mit, cc0] = await Promise.all([
    read("public/LICENSE"),
    read("public/THIRD_PARTY_NOTICES.md"),
    read("public/LICENSES/MIT.txt"),
    read("public/LICENSES/CC0-1.0.txt"),
  ]);
  assert.match(license, /GNU GENERAL PUBLIC LICENSE/);
  assert.match(notices, /rjanjic\/js-solitaire/);
  assert.match(notices, /ShootMe\/MinimalKlondike/);
  assert.match(mit, /MIT License/);
  assert.match(cc0, /CC0 1\.0 Universal/);
});

test("the repository and standalone build preserve the trademark boundary", async () => {
  const [readme, repositoryNotice, standaloneNotice] = await Promise.all([
    read("README.md"),
    read("TRADEMARKS.md"),
    read("public/TRADEMARKS.md"),
  ]);
  assert.match(readme, /TRADEMARKS\.md/);
  for (const notice of [repositoryNotice, standaloneNotice]) {
    assert.match(notice, /Grugnetto’s Klondike/);
    assert.match(notice, /trademarks of Umberto Bresciani/);
    assert.match(notice, /not licensed under the GNU General Public License/);
    assert.match(notice, /https:\/\/www\.grugnett\.org\//);
  }
});

test("REUSE metadata separates project, preserved code, ports and decks", async () => {
  const reuse = await read("REUSE.toml");
  for (const id of ["GPL-3.0-or-later", "MIT", "CC0-1.0"]) assert.match(reuse, new RegExp(id));
  for (const path of ["reference/rjanjic-js-solitaire", "reference/minimal-klondike", "decks/letele", "decks/woodcut"]) {
    assert.ok(reuse.includes(path), `missing licensing rule for ${path}`);
  }
});

test("representative authored and ported files carry concise SPDX headers", async () => {
  const authored = await read("public/src/ui.js");
  const solverPort = await read("public/src/solver-core.js");
  assert.match(authored, /SPDX-License-Identifier: GPL-3\.0-or-later/);
  assert.match(authored, /SPDX-FileCopyrightText: 2026 Umberto Bresciani/);
  assert.match(solverPort, /SPDX-License-Identifier: MIT/);
  assert.match(solverPort, /SPDX-FileCopyrightText: 2021 DevilSquirrel/);
});
