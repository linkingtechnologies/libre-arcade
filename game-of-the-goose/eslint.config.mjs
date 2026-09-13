// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // The untouched upstream 2019-2021 boardgame.io snapshot is preserved verbatim, not linted.
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
        console: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        navigator: "readonly",
        location: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        CustomEvent: "readonly",
        URL: "readonly",
        HTMLElement: "readonly",
        structuredClone: "readonly",
      },
    },
  },
  {
    files: ["public/src/rulesets.js"],
    rules: {
      // Every condition/event/escapeCondition callback in this ruleset table
      // is invoked by game.js as fn(G, ctx, ...) regardless of whether a
      // given implementation needs both leading arguments; dropping them
      // would misrepresent the shared callback shape the table relies on.
      "no-unused-vars": ["error", { args: "none" }],
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        URL: "readonly",
        console: "readonly",
      },
    },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        console: "readonly",
        process: "readonly",
      },
    },
  },
]);

export default eslintConfig;
