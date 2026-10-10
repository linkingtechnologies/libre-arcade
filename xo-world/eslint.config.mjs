// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const nodeGlobals = {
  require: "readonly",
  module: "writable",
  exports: "writable",
  process: "readonly",
  console: "readonly",
  __dirname: "readonly",
  Buffer: "readonly",
};

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // Preserved upstream source (Java), not JavaScript.
    "reference/**",
    // Generated from src/ by tools/build-browser.js; test/bundle.test.js checks it.
    "public/xoworld-bundle.js",
  ]),
  {
    // The historical engine is a direct port of the Java source and keeps its
    // shape on purpose (see specs/port-map.md); lint only what could be a bug.
    files: ["src/**/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "commonjs", globals: nodeGlobals },
    rules: {
      "no-unused-vars": ["error", { args: "none", varsIgnorePattern: "^(NONE|znakX|znakO|TACNO|NETACNO|SAFE|CLEAN|COUNT|SETFLAGS|CHECK|DUBINA)$" }],
    },
  },
  {
    files: ["tools/**/*.js", "test/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: { ...nodeGlobals, window: "readonly" },
    },
    rules: {
      // Cleanup of optional features (localStorage, dialog APIs) swallows errors on purpose.
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    files: ["public/app.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        getComputedStyle: "readonly",
        ResizeObserver: "readonly",
      },
    },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }],
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { process: "readonly", console: "readonly", URL: "readonly" },
    },
  },
]);

export default eslintConfig;
