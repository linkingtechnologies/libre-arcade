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
  fetch: "readonly",
  WebSocket: "readonly",
  atob: "readonly",
  queueMicrotask: "readonly",
};

// The page's scripts are plain scripts, not modules: each wraps itself (some as a UMD that also runs in Node), and they find one another on globalThis.
const browserGlobals = {
  window: "readonly",
  document: "readonly",
  location: "readonly",
  navigator: "readonly",
  performance: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
  localStorage: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  console: "readonly",
  AudioContext: "readonly",
  webkitAudioContext: "readonly",
  Element: "readonly",
  atob: "readonly",
  queueMicrotask: "readonly",
  module: "writable",
  Buffer: "readonly",
};

export default defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // The restoration package's own documents, tests and tools, kept unmodified as history (test/package.test.mjs runs the tests).
    "docs/development/package/**",
    // The author's source and release (reference/source has no JavaScript; the folder is listed for safety).
    "reference/**",
  ]),
  {
    files: ["public/**/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "script", globals: browserGlobals },
    // The page reads and writes localStorage inside try/catch where a failure is to be ignored (private windows, blocked storage).
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": ["error", { caughtErrors: "none", ignoreRestSiblings: true }],
    },
  },
  {
    files: ["test/**/*.mjs", "tools/**/*.mjs", "scripts/**/*.mjs", "eslint.config.mjs"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: nodeGlobals },
  },
]);
