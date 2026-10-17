// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const nodeGlobals = {
  process: "readonly",
  console: "readonly",
  Buffer: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  performance: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setImmediate: "readonly",
  structuredClone: "readonly",
  globalThis: "readonly",
  fetch: "readonly",
  atob: "readonly",
  queueMicrotask: "readonly",
};

// The page's modules run in a browser (ES modules loaded by index.html).
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
  fetch: "readonly",
  Image: "readonly",
  Audio: "readonly",
  URLSearchParams: "readonly",
  structuredClone: "readonly",
  globalThis: "readonly",
};

export default defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // The restoration package's own documents, tests and tools, kept unmodified as history (test/package.test.mjs runs the tests).
    "docs/development/package/**",
    // The author's source release (C++, kept as a compressed archive).
    "reference/**",
  ]),
  {
    files: ["public/**/*.mjs"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: browserGlobals },
    // The page reads and writes localStorage and plays audio inside try/catch where a failure is to be ignored (private windows, blocked storage, autoplay).
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
