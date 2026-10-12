// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const nodeGlobals = {
  process: "readonly",
  console: "readonly",
  Buffer: "readonly",
  URL: "readonly",
  performance: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  structuredClone: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  AbortController: "readonly",
  crypto: "readonly",
  globalThis: "readonly",
};

// The game runs in a page; its pure modules (rules, generator, state machine, tables) are also loaded by the Node tests.
const browserGlobals = {
  window: "readonly",
  document: "readonly",
  navigator: "readonly",
  location: "readonly",
  localStorage: "readonly",
  performance: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  console: "readonly",
  URL: "readonly",
  Image: "readonly",
  Audio: "readonly",
  AudioContext: "readonly",
  webkitAudioContext: "readonly",
  ResizeObserver: "readonly",
  fetch: "readonly",
  addEventListener: "readonly",
  Uint8Array: "readonly",
  HTMLElement: "readonly",
  KeyboardEvent: "readonly",
  matchMedia: "readonly",
  globalThis: "readonly",
};

const eslintConfig = defineConfig([
  js.configs.recommended,
  {
    rules: {
      // Guarded cleanup calls swallow errors on purpose; underscore names mark values taken out of a destructuring.
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": ["error", { caughtErrors: "none", varsIgnorePattern: "^_" }],
    },
  },
  globalIgnores([
    "game/**",
    "node_modules/**",
    // Preserved upstream sources (6502 assembly, the Borland C++ level editor, the ROM), not JavaScript.
    "reference/**",
  ]),
  {
    files: ["public/**/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: browserGlobals },
  },
  {
    files: ["test/**/*.js", "tools/**/*.mjs", "scripts/**/*.mjs"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: nodeGlobals },
  },
]);

export default eslintConfig;
