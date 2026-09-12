// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // Preserved upstream snapshots and generated historical card data must
    // remain byte-for-byte faithful instead of being rewritten for this lint setup.
    "reference/**",
    "public/src/sprite.js",
  ]),
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Shared browser + Node globals. The codebase splits cleanly into
        // browser code (public/src) and Node scripts/tests, but
        // none of the identifiers below collide, so one list covers both
        // instead of duplicating it per glob.
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        caches: "readonly",
        fetch: "readonly",
        console: "readonly",
        self: "readonly",
        Worker: "readonly",
        URL: "readonly",
        Image: "readonly",
        matchMedia: "readonly",
        requestAnimationFrame: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        structuredClone: "readonly",
        process: "readonly",
      },
    },
    rules: {
      // Matches the pre-existing baseline: an unused destructured value stays
      // a warning, and a deliberately empty catch (silently ignored storage
      // failures) is an accepted defensive pattern, not an error.
      "no-unused-vars": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
]);

export default eslintConfig;
