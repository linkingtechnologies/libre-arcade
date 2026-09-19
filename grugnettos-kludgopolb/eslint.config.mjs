// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-only

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
  ]),
  {
    files: ["public/src/core/**/*.js", "public/src/players/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        structuredClone: "readonly",
      },
    },
  },
  {
    files: ["public/src/ui/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        fetch: "readonly",
        location: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        crypto: "readonly",
        requestAnimationFrame: "readonly",
        addEventListener: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        structuredClone: "readonly",
        ResizeObserver: "readonly",
        Blob: "readonly",
        URL: "readonly",
        getComputedStyle: "readonly",
        URLSearchParams: "readonly",
      },
    },
  },
  {
    files: ["public/src/node/**/*.js", "scripts/**/*.mjs", "scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        URL: "readonly",
      },
    },
    rules: {
      // `const { results, ...summary } = report` in arena.js deliberately
      // extracts `results` only to exclude it from the logged summary.
      "no-unused-vars": ["error", { ignoreRestSiblings: true }],
    },
  },
  {
    files: ["public/src/arena/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
      },
    },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        URL: "readonly",
      },
    },
  },
]);

export default eslintConfig;
