// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // Preserved historical Python source, kept byte-identical.
    "reference/**",
  ]),
  {
    files: ["public/src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        localStorage: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        requestAnimationFrame: "readonly",
        AudioContext: "readonly",
        webkitAudioContext: "readonly",
        KeyboardEvent: "readonly",
        HTMLElement: "readonly",
        Blob: "readonly",
        URL: "readonly",
        confirm: "readonly",
      },
    },
    rules: {
      // Guarded localStorage and Web Audio calls deliberately swallow errors
      // (storage or audio unavailable); see storage.js and sound.js.
      "no-empty": ["error", { allowEmptyCatch: true }],
      // Leading-underscore parameters document a signature an implementation
      // does not need.
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["test/**/*.mjs", "scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
    rules: {
      // Test stubs stand in for real functions and keep their signature even
      // where the body ignores an argument, e.g. uniform:(a,b)=>a.
      "no-unused-vars": ["error", { args: "none" }],
    },
  },
]);

export default eslintConfig;
