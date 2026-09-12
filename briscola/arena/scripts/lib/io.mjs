// SPDX-License-Identifier: GPL-3.0-only
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
export const projectRoot = resolve(scriptsDirectory, "../../..");

export function resolveProjectPath(path) {
  return resolve(projectRoot, path);
}

export function writeReports(basePath, report, markdown) {
  const jsonPath = `${basePath}.json`;
  const markdownPath = `${basePath}.md`;
  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(markdownPath, markdown);
  return { jsonPath, markdownPath };
}
