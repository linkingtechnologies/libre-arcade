// SPDX-License-Identifier: MIT
// Lints only this folder's own dev tooling (scripts/, test/). The game in
// public/ is vendored third-party code, preserved as its original authors
// shipped it (see public/CREDITS.md) — not reformatted or relinted here.

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores(["node_modules/**", "public/**", "game/**"]),
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        fetch: "readonly",
        URL: "readonly",
      },
    },
  },
]);

export default eslintConfig;
