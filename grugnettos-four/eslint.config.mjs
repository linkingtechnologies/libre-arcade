// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-only

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const browserGlobals = {
  window: "readonly",
  document: "readonly",
  navigator: "readonly",
  console: "readonly",
  localStorage: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  requestAnimationFrame: "readonly",
  performance: "readonly",
  AudioContext: "readonly",
  Option: "readonly",
  crypto: "readonly",
  URL: "readonly",
  structuredClone: "readonly",
  atob: "readonly",
  globalThis: "readonly",
};

const nodeGlobals = {
  process: "readonly",
  console: "readonly",
  performance: "readonly",
  URL: "readonly",
  Buffer: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  structuredClone: "readonly",
  atob: "readonly",
  globalThis: "readonly",
};

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // Preserved upstream snapshots, kept byte-for-byte.
    "reference/**",
    // Generated data payloads (base64 weights, count tables); lint the
    // generators in tools/ and the adapters that read them instead.
    "public/src/players/*-weights.js",
    "public/src/players/*-knowledge.js",
  ]),
  {
    files: ["public/**/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: browserGlobals },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    files: ["test/**/*.mjs", "tools/**/*.mjs", "scripts/**/*.mjs", "*.mjs"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: nodeGlobals },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
]);

export default eslintConfig;
