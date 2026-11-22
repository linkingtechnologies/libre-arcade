// SPDX-License-Identifier: GPL-3.0-only
import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

export default defineConfig([
  js.configs.recommended,
  globalIgnores(["node_modules/**", "public/shared/**", "game/**", "reference/**"]),
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly", process: "readonly", fetch: "readonly", URL: "readonly",
        window: "readonly", document: "readonly", localStorage: "readonly", navigator: "readonly",
        setInterval: "readonly", clearInterval: "readonly", setTimeout: "readonly", clearTimeout: "readonly",
        requestAnimationFrame: "readonly", cancelAnimationFrame: "readonly", performance: "readonly",
        Image: "readonly", MutationObserver: "readonly", Audio: "readonly", getComputedStyle: "readonly", structuredClone: "readonly",
      },
    },
  },
]);
