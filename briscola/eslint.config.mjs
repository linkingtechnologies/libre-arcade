// SPDX-License-Identifier: GPL-3.0-only

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores([
    "node_modules/**",
    "game/**",
    // Preserved upstream snapshots (C#, Java, Python, Ruby, ONNX exports, ...)
    // must remain byte-for-byte faithful instead of being rewritten for this
    // lint setup, and are not JavaScript to begin with.
    "reference/**",
    "assets/**",
  ]),
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Shared browser + Node globals: the codebase splits into browser UI
        // code, Node arena/test scripts, and ONNX inference glue, but none of
        // the identifiers below collide, so one list covers all of them.
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        location: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
        console: "readonly",
        self: "readonly",
        Worker: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        Image: "readonly",
        Event: "readonly",
        EventTarget: "readonly",
        CustomEvent: "readonly",
        requestAnimationFrame: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        queueMicrotask: "readonly",
        structuredClone: "readonly",
        performance: "readonly",
        WebAssembly: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        process: "readonly",
      },
    },
    rules: {
      // Matches the Klondike lint baseline: an unused value is a warning,
      // not a build-breaking error.
      "no-unused-vars": "warn",
    },
  },
  {
    files: ["test/**/*.js"],
    rules: {
      // Test fixtures embed literal HTML/JS snippets where an escaped quote
      // documents intent even when the parser does not require it.
      "no-useless-escape": "warn",
    },
  },
  {
    files: ["src/players/**/*.js"],
    rules: {
      // AGENTS.md: "Do not silently fix, optimize, reorder, simplify, or
      // reinterpret a faithful port." A literal `true === false` (etc.) can
      // be how an upstream decision tree was written; flag it for a human,
      // don't fail the build for preserving it as-is.
      "no-constant-binary-expression": "warn",
    },
  },
]);

export default eslintConfig;
