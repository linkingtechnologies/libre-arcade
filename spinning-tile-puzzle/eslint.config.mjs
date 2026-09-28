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
    // Preserved upstream archives.
    "reference/**",
  ]),
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        requestAnimationFrame: "readonly",
        devicePixelRatio: "readonly",
        Image: "readonly",
        FileReader: "readonly",
        globalThis: "readonly",
        module: "readonly",
      },
    },
    rules: {
      // A guarded setPointerCapture call deliberately swallows errors on
      // browsers/pointers where it is not supported; see app.js.
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["test/**/*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        process: "readonly",
        console: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
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
