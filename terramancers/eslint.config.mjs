// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // The untouched upstream 2012 Java/SVN snapshot is preserved verbatim, not linted.
    "reference/**",
  ]),
  {
    files: ["public/src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        performance: "readonly",
        screen: "readonly",
        devicePixelRatio: "readonly",
        Image: "readonly",
        requestAnimationFrame: "readonly",
        addEventListener: "readonly",
        module: "readonly",
        globalThis: "readonly",
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
        globalThis: "readonly",
        queueMicrotask: "readonly",
        setImmediate: "readonly",
      },
    },
  },
]);

export default eslintConfig;
