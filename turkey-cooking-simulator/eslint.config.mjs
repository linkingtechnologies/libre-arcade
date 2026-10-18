// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const nodeGlobals = {
  process: "readonly",
  console: "readonly",
  Buffer: "readonly",
  URL: "readonly",
  performance: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
};

const browserGlobals = {
  window: "readonly",
  document: "readonly",
  location: "readonly",
  navigator: "readonly",
  performance: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
  addEventListener: "readonly",
  removeEventListener: "readonly",
  localStorage: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  console: "readonly",
  AudioContext: "readonly",
  Audio: "readonly",
  webkitAudioContext: "readonly",
  HTMLElement: "readonly",
  KeyboardEvent: "readonly",
  PointerEvent: "readonly",
};

export default defineConfig([
  js.configs.recommended,
  globalIgnores([
    "game/**",
    "node_modules/**",
    // The original's files (not our code) and the restoration package's own documents and tests, kept unmodified as history.
    "reference/**",
    "docs/development/package/**",
  ]),
  {
    files: ["public/**/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: browserGlobals },
    // The package's page reads and writes localStorage and the audio context inside try/catch and ignores a failure on purpose (private windows, blocked storage, no audio).
    rules: { "no-empty": ["error", { allowEmptyCatch: true }] },
  },
  {
    files: ["test/**/*.mjs", "scripts/**/*.mjs", "eslint.config.mjs"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: nodeGlobals },
  },
]);
