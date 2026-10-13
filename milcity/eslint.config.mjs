// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-only

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
  URLSearchParams: "readonly",
  localStorage: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  ResizeObserver: "readonly",
  console: "readonly",
};

export default defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // The preserved upstream sources (Java) and the oracle's stand-ins are not JavaScript.
    "reference/**",
    "test/java-oracle/**",
  ]),
  {
    files: ["public/**/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: browserGlobals },
    // The page reads and writes localStorage inside try/catch and ignores a failure on purpose (private windows, blocked storage).
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": ["error", { caughtErrors: "none" }],
    },
  },
  {
    files: ["test/**/*.mjs", "tools/**/*.mjs", "scripts/**/*.mjs", "eslint.config.mjs"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: nodeGlobals },
  },
]);
