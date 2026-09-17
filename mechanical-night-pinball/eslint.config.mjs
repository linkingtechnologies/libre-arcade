// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
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
        location: "readonly",
        performance: "readonly",
        screen: "readonly",
        devicePixelRatio: "readonly",
        requestAnimationFrame: "readonly",
        addEventListener: "readonly",
        removeEventListener: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        queueMicrotask: "readonly",
        Image: "readonly",
        URLSearchParams: "readonly",
        AudioContext: "readonly",
        webkitAudioContext: "readonly",
      },
    },
    rules: {
      // Guarded audio-node stop() calls deliberately swallow errors
      // (a node already stopped/disconnected); see audio.js.
      "no-empty": ["error", { allowEmptyCatch: true }],
      // Leading-underscore params document an interface signature that a
      // given implementation/caller doesn't need; see physics-adapter.js
      // and docdonkeys-parity.js's correctKickerLimit().
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
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
      },
    },
  },
  {
    files: ["test/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        Event: "readonly",
        EventTarget: "readonly",
      },
    },
  },
]);

export default eslintConfig;
