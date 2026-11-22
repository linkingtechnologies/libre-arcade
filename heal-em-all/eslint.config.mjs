// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

// Lints this folder's own tooling and the one page script written here (public/compat.js).
// The vendored game and engine in public/ are preserved as their authors shipped them (see specs/design.md).
export default defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    "reference/**",
    "evidence/**",
    "replacement-audio/**",
    "public/scripts/game.js",
    "public/scripts/lib/**",
    "tools/probe-original.js", // evaluated inside the original page, uses its globals
    "tools/probe-m3.js",
  ]),
  {
    files: ["public/compat.js", "public/i18n.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: { window: "readonly", document: "readonly", navigator: "readonly", setTimeout: "readonly", clearTimeout: "readonly", Promise: "readonly" },
    },
  },
  {
    files: ["test/**/*.mjs", "tools/**/*.mjs", "scripts/**/*.mjs", "eslint.config.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // tools/*.mjs also pass functions to page.evaluate(), which run in the browser and use these globals
      globals: { process: "readonly", console: "readonly", Buffer: "readonly", URL: "readonly", fetch: "readonly", setTimeout: "readonly",
        Game: "readonly", window: "readonly", document: "readonly", navigator: "readonly", performance: "readonly", requestAnimationFrame: "readonly",
        localStorage: "readonly", OfflineAudioContext: "readonly", Uint8Array: "readonly", innerWidth: "readonly", innerHeight: "readonly" },
    },
  },
]);
