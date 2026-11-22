// SPDX-License-Identifier: MIT
// Lints this folder's own dev tooling (scripts/, tools/, test/). The game in
// public/ and the snapshot in reference/ are third-party code, kept as their
// authors shipped them (see public/CREDITS.md and PROVENANCE.md). The
// integration layer in public/js/ is checked by tests rather than by this config.

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores(["node_modules/**", "public/**", "game/**", "reference/**", "test/results/**", "screenshots/**"]),
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly", process: "readonly", fetch: "readonly", URL: "readonly", Buffer: "readonly",
        WebSocket: "readonly", setTimeout: "readonly", clearTimeout: "readonly",
      },
    },
  },
  {
    // tools/virtual-clock.js runs inside the page, not in Node
    files: ["tools/virtual-clock.js"],
    languageOptions: { sourceType: "script", globals: { window: "writable", performance: "writable", Phaser: "readonly" } },
  },
]);

export default eslintConfig;
