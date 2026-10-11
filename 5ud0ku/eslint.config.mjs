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
};

const browserGlobals = {
  window: "readonly",
  document: "readonly",
  navigator: "readonly",
  location: "readonly",
  localStorage: "readonly",
  performance: "readonly",
  requestAnimationFrame: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  console: "readonly",
  Worker: "readonly",
  URL: "readonly",
  atob: "readonly",
  btoa: "readonly",
  matchMedia: "readonly",
  addEventListener: "readonly",
  self: "readonly",
  structuredClone: "readonly",
  KeyboardEvent: "readonly",
  HTMLElement: "readonly",
  crypto: "readonly",
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
    // Preserved upstream sources (Java and text), not JavaScript.
    "reference/**",
    // Archived scripts from the restoration package, kept as history.
    "docs/**",
  ]),
  {
    files: ["public/src/browser/**/*.js", "public/src/workers/browser-worker-entry.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: browserGlobals },
  },
  {
    files: ["public/src/core/**/*.js", "public/src/workers/worker-handler.js", "public/src/workers/node-worker-entry.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: { ...nodeGlobals, ...browserGlobals } },
  },
  {
    files: ["test/**/*.js", "tools/**/*.mjs", "scripts/**/*.mjs"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: nodeGlobals },
  },
]);

export default eslintConfig;
