// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // Preserved upstream notices and manifests.
    "reference/**",
  ]),
  {
    files: ["public/js/**/*.js"],
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
        performance: "readonly",
        devicePixelRatio: "readonly",
        AudioContext: "readonly",
        webkitAudioContext: "readonly",
        Blob: "readonly",
        URL: "readonly",
        confirm: "readonly",
      },
    },
    rules: {
      // Guarded localStorage and Web Audio calls deliberately swallow errors
      // when storage or audio is unavailable; see app.js and audio.js.
      "no-empty": ["error", { allowEmptyCatch: true }],
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
      },
    },
    rules: {
      // Test stubs keep the signature of what they stand in for.
      "no-unused-vars": ["error", { args: "none" }],
    },
  },
]);

export default eslintConfig;
