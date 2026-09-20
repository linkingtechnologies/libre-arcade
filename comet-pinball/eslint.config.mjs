// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    "reference/**",
    "reports/**",
  ]),
  {
    // Browser runtime: classic scripts (no bundler, no modules) sharing globals.
    files: ["public/js/**/*.js", "public/data/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        performance: "readonly",
        requestAnimationFrame: "readonly",
        console: "readonly",
        module: "writable",
      },
    },
    rules: {
      // Guarded audio/storage/language calls deliberately swallow errors
      // (unsupported API, blocked storage); see audio.js and i18n.js.
      "no-empty": ["error", { allowEmptyCatch: true }],
      // visuals.js keeps a documented, intentionally unpainted drawArt() stub
      // with its original signature.
      "no-unused-vars": ["error", { args: "none" }],
    },
  },
  {
    // Validated engine baseline: the oracle comparisons and regression tests were
    // run against these exact bytes (MANIFEST-SHA256.txt), so they are not edited
    // for style. physics.js carries an unused `prevA` in the flipper-corner sweep.
    // (reports/M10.1-IMMUTABLE-ENGINE-SHA256.txt is an earlier snapshot: physics.js
    // was deliberately changed afterwards by the M13.9-M13.12 boundary fixes.)
    files: ["public/js/physics.js", "public/data/playfield.js"],
    rules: {
      "no-unused-vars": "off",
    },
  },
  {
    // Node regressions and tooling: CommonJS.
    files: ["tests/**/*.js", "tools/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "writable",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        global: "writable",
        window: "writable",
        setTimeout: "readonly",
      },
    },
  },
  {
    files: ["scripts/**/*.mjs"],
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
