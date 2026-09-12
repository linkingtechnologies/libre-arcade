// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later
//
// This config lints this repository's own GPL-3.0-or-later code: the
// browser-shell/build tooling and the faithful game-logic port in
// public/src/. It does not extend to the preserved 2001 material under
// reference/, which keeps its own LicenseRef-NKlein-Universal-NonExclusive
// — see PROVENANCE.md, REUSE.toml and docs/LICENSE-RESEARCH.md.

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // The untouched upstream 2001 C++/SDL snapshot is preserved verbatim, not linted.
    "reference/**",
  ]),
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        performance: "readonly",
        Image: "readonly",
        AudioContext: "readonly",
        webkitAudioContext: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
  },
]);

export default eslintConfig;
