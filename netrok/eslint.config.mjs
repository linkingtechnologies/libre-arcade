// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // Preserved upstream snapshots must remain byte-for-byte faithful,
    // not rewritten for this lint setup.
    "reference/**",
  ]),
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        console: "readonly",
        confirm: "readonly",
        alert: "readonly",
        prompt: "readonly",
        fetch: "readonly",
        Audio: "readonly",
        Image: "readonly",
        AudioContext: "readonly",
        webkitAudioContext: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        URL: "readonly",
        Blob: "readonly",
        FileReader: "readonly",
        btoa: "readonly",
        atob: "readonly",
        performance: "readonly",
        process: "readonly",
        URLSearchParams: "readonly",
        CustomEvent: "readonly",
        getComputedStyle: "readonly",
        MutationObserver: "readonly",
        module: "readonly",
      },
    },
    rules: {
      // Matches the pre-existing baseline established for other ported
      // games in this collection.
      "no-unused-vars": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
]);

export default eslintConfig;
