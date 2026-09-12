import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = [join('public', 'main.js'), ...walk(join('public', 'src')), ...walk('tools')]
  .filter((file) => /\.(?:js|mjs)$/.test(file) && !file.endsWith('check-syntax.mjs'));

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Syntax OK: ${files.length} JavaScript files`);
