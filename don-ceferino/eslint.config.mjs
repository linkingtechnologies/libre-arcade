// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // The untouched upstream 2004-2005 C++/SDL/autotools snapshot is preserved verbatim, not linted.
    "reference/**",
  ]),
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        matchMedia: "readonly",
        innerWidth: "readonly",
        location: "readonly",
        performance: "readonly",
        Image: "readonly",
        Audio: "readonly",
        requestAnimationFrame: "readonly",
        addEventListener: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
  },
]);

export default eslintConfig;
