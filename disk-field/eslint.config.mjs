// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // Historical Python sources and their compatibility stubs; not JavaScript.
    "tools/**",
  ]),
  {
    files: ["public/js/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        localStorage: "readonly",
        location: "readonly",
        navigator: "readonly",
        performance: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        addEventListener: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        URLSearchParams: "readonly",
        AudioContext: "readonly",
        webkitAudioContext: "readonly",
      },
    },
    rules: {
      // Guarded browser-API/storage/audio calls deliberately swallow errors
      // (storage unavailable, node already stopped); see settings.mjs,
      // progress.mjs and audio.mjs.
      "no-empty": ["error", { allowEmptyCatch: true }],
      // A few helpers keep the shape of their historical call sites (e.g.
      // canvasText's spare `weight` argument); unused parameters are not
      // worth changing runtime code for.
      "no-unused-vars": ["error", { args: "none" }],
    },
  },
  {
    // Byte-pinned: tests/m4-release-checks.mjs asserts the SHA-256 of these
    // two files against the validated simulation baseline, so they cannot be
    // edited to satisfy lint (engine.mjs carries an unused `dot` helper).
    files: ["public/js/engine.mjs", "public/js/levels.mjs"],
    rules: {
      "no-unused-vars": "off",
    },
  },
  {
    files: ["scripts/**/*.mjs", "tests/**/*.mjs"],
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
