// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // The untouched upstream C snapshot is preserved verbatim, not linted.
    "reference/**",
    "tools/oracle/out/**",
    "reference/.fetched/**",
    "release/**",
  ]),
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        URL: "readonly",
        process: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        requestAnimationFrame: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        location: "readonly",
        performance: "readonly",
        crypto: "readonly",
        Audio: "readonly",
        AudioContext: "readonly",
        URLSearchParams: "readonly",
        Uint32Array: "readonly",
        matchMedia: "readonly",
        addEventListener: "readonly",
        fetch: "readonly",
        Buffer: "readonly",
      },
    },
  },
  {
    // The oracle page runs the ORIGINAL game, which defines these as browser globals.
    files: ["tools/oracle/harness.mjs"],
    languageOptions: { globals: { Crafty: "readonly", Config: "readonly", Player: "writable", Tilemap: "writable", _Globals: "writable" } },
  },
]);

export default eslintConfig;
