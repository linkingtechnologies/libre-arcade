import { createHash } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dest = join(root, 'public', 'assets', 'boards', 'original');
await mkdir(dest, { recursive: true });

const boards = [
  {
    name: 'Ganzenbord_pd.svg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Ganzenbord_pd.svg',
    expectedSha1: '2324f0f685f17a39771bb4b42617b52dc0b2953f',
    validate(buffer) {
      return buffer.subarray(0, Math.min(buffer.length, 4096)).toString('utf8').includes('<svg');
    }
  },
  {
    name: 'Ganzenbordspel.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Ganzenbordspel.jpg',
    validate(buffer) {
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
  }
];

const hash = (algorithm, buffer) => createHash(algorithm).update(buffer).digest('hex');

async function fetchWithRetries(url, attempts = 5) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': 'Grugnettos-Goose/0.13 software-archaeology asset fetcher' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

const sums = [];
for (const board of boards) {
  process.stdout.write(`Fetching ${board.name} ... `);
  const buffer = await fetchWithRetries(board.url);
  if (!board.validate(buffer)) throw new Error(`${board.name}: downloaded data has the wrong file signature`);

  if (board.expectedSha1) {
    const actualSha1 = hash('sha1', buffer);
    if (actualSha1 !== board.expectedSha1) {
      throw new Error(`${board.name}: SHA-1 mismatch (expected ${board.expectedSha1}, got ${actualSha1})`);
    }
  }

  const finalPath = join(dest, board.name);
  const partPath = `${finalPath}.part`;
  await writeFile(partPath, buffer);
  await rename(partPath, finalPath);
  const sha256 = hash('sha256', buffer);
  sums.push(`${sha256}  ${board.name}`);
  console.log(`${(buffer.length / 1024 / 1024).toFixed(2)} MiB · SHA-256 ${sha256}`);
}

await writeFile(join(dest, 'SHA256SUMS.txt'), `${sums.join('\n')}\n`, 'ascii');

// Clean up any abandoned partial files from previous interrupted attempts.
for (const board of boards) await rm(join(dest, `${board.name}.part`), { force: true });

console.log(`\nDone. Original board files are local in ${dest}`);
