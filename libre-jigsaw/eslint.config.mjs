// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // Generated from src/*.js by scripts/build-bundle.py; lint the source
    // instead of its concatenation.
    "public/app.bundle.js",
    // Preserved upstream archives and screenshots.
    "reference/**",
  ]),
  {
    files: ["src/**/*.js"],
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
        devicePixelRatio: "readonly",
        crypto: "readonly",
        Image: "readonly",
        FileReader: "readonly",
        Blob: "readonly",
        URL: "readonly",
        Path2D: "readonly",
      },
    },
    rules: {
      // Guarded localStorage calls deliberately swallow errors (storage
      // unavailable or full); see savePref/loadPref in app.js.
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
        window: "readonly",
        document: "readonly",
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        Path2D: "readonly",
        globalThis: "readonly",
      },
    },
  },
]);

export default eslintConfig;
