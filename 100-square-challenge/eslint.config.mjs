// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // Preserved historical archives and their Java sources.
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
        setTimeout: "readonly",
        clearTimeout: "readonly",
        requestAnimationFrame: "readonly",
        ResizeObserver: "readonly",
        AudioContext: "readonly",
        webkitAudioContext: "readonly",
      },
    },
    rules: {
      // Guarded localStorage and Web Audio calls deliberately swallow errors
      // (storage or audio unavailable); see app.js and sound.js.
      "no-empty": ["error", { allowEmptyCatch: true }],
      // Leading-underscore parameters document a signature an implementation
      // does not need; see restart(_state) in game.js.
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["test/**/*.js", "scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        URL: "readonly",
      },
    },
  },
]);

export default eslintConfig;
