// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // The untouched historical board artwork and evidence dossiers are
    // preserved verbatim, not linted.
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
        fetch: "readonly",
        localStorage: "readonly",
        location: "readonly",
        matchMedia: "readonly",
        performance: "readonly",
        crypto: "readonly",
        requestAnimationFrame: "readonly",
        addEventListener: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        ResizeObserver: "readonly",
        AudioContext: "readonly",
        webkitAudioContext: "readonly",
        Audio: "readonly",
        Blob: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        CSS: "readonly",
      },
    },
  },
  {
    files: ["scripts/**/*.mjs", "tools/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        URL: "readonly",
        fetch: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
      },
    },
  },
  {
    files: ["test/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        URL: "readonly",
      },
    },
  },
]);

export default eslintConfig;
