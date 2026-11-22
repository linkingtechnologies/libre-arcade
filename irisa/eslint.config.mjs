// SPDX-License-Identifier: GPL-3.0-only
// Lints everything this folder owns: the page scripts in public/js (browser
// code) and the dev tooling and tests. Not linted: reference/ (upstream,
// frozen) and game/ (build output).

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const node = {
  console: "readonly", process: "readonly", URL: "readonly", Buffer: "readonly",
  setTimeout: "writable", clearTimeout: "readonly", performance: "readonly",
  globalThis: "writable", fetch: "readonly", WebSocket: "readonly",
};
const browser = {
  window: "readonly", document: "readonly", navigator: "readonly", localStorage: "readonly",
  requestAnimationFrame: "readonly", setTimeout: "readonly", clearTimeout: "readonly",
  performance: "readonly", Audio: "readonly", location: "readonly", URLSearchParams: "readonly",
};

export default defineConfig([
  js.configs.recommended,
  globalIgnores(["node_modules/**", "reference/**", "game/**", "dist/**"]),
  { languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: node } },
  { files: ["public/**/*.js"], languageOptions: { globals: browser } },
  { files: ["public/js/game/**/*.js"], languageOptions: { globals: { ...browser, localStorage: "readonly" } } },
]);
