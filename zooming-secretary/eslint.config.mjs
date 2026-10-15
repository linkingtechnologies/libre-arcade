// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
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
};

const browserGlobals = {
  window: "readonly",
  document: "readonly",
  location: "readonly",
  navigator: "readonly",
  performance: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
  addEventListener: "readonly",
  removeEventListener: "readonly",
  localStorage: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  console: "readonly",
  AudioContext: "readonly",
  webkitAudioContext: "readonly",
  HTMLElement: "readonly",
  KeyboardEvent: "readonly",
  PointerEvent: "readonly",
};

export default defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // The restoration package's own documents and tests, kept unmodified as history (test/package.test.mjs runs the tests).
    "docs/development/package/**",
  ]),
  {
    files: ["public/**/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: browserGlobals },
    // The page reads and writes localStorage inside try/catch and ignores a failure on purpose (private windows, blocked storage).
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": ["error", { caughtErrors: "none", ignoreRestSiblings: true }],
    },
  },
  {
    // Two constants of the package's drawing code that nothing uses; a test of the package checks for them in the source, so they stay.
    files: ["public/web/renderer.js"],
    rules: { "no-unused-vars": ["error", { caughtErrors: "none", ignoreRestSiblings: true, varsIgnorePattern: "^TOPIC_(COLORS|LETTERS)$" }] },
  },
  {
    files: ["test/**/*.mjs", "tools/**/*.mjs", "scripts/**/*.mjs", "eslint.config.mjs"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: nodeGlobals },
  },
]);
