import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { SudokuWorkerClient, SudokuWorkerError, generatedResultToGrid } from '../public/src/core/index.js';

const expected = JSON.parse(fs.readFileSync(new URL('./oracles.json', import.meta.url), 'utf8'));
const workerUrl = new URL('../public/src/workers/node-worker-entry.js', import.meta.url);
const client = new SudokuWorkerClient(() => new Worker(workerUrl, { type: 'module' }));
let pass = 0, fail = 0;
function ok(name, value, detail='') {
  console.log(`${value?'PASS':'FAIL'} | ${name}${detail?` | ${detail}`:''}`);
  value ? pass++ : fail++;
}
async function expectCode(name, fn, code) {
  try { await fn(); ok(name, false, 'resolved unexpectedly'); }
  catch (e) { ok(name, e instanceof SudokuWorkerError && e.code === code, `code=${e.code}`); }
}

try {
  const pong = await client.ping({ timeoutMs: 2000 });
  ok('worker handshake/protocol', pong.pong === true && pong.protocol === 1);

  for (const entry of expected.generated) {
    const result = await client.generate(entry.name, {
      creatorSeed: entry.creatorSeed,
      digitSeed: entry.digitSeed,
      hardCandidates: 3,
      maxAttempts: 200,
      timeoutMs: 5000,
    });
    assert.deepEqual(result.record, entry);
    const grid = generatedResultToGrid(result);
    ok(`worker generator oracle ${entry.name}`, grid.shownString() === entry.finalPuzzle && grid.answerString() === entry.finalSolution);
    let marks=0;for(let r=0;r<9;r++)for(let c=0;c<9;c++)marks+=grid.getSlot(r,c).getPencilMarks()!==0?1:0;
    ok(`worker generated ${entry.name} clears transient pencil marks`, marks===0);
  }

  const hardEntry = expected.solver_fixtures.find(x => x.name === 'hard');
  for (const entry of expected.solver_fixtures) {
    let ticks = 0;
    const timer = entry === hardEntry ? setInterval(() => ticks++, 20) : null;
    const start = performance.now();
    // The 17-given 'hard' fixture takes about 5 s on a quiet machine and 16 s on a loaded one: the limit is generous on purpose.
    const result = await client.solvePuzzle(entry.puzzle, { name: entry.name, timeoutMs: 120000 });
    const elapsed = performance.now() - start;
    if (timer) clearInterval(timer);
    const { ms: _ms, ...wanted } = entry;
    assert.deepEqual(result, wanted);
    ok(`worker solver oracle ${entry.name}`, true, `${elapsed.toFixed(1)}ms`);
    if (entry === hardEntry) ok('main event loop remains responsive during hard solver', elapsed > 500 && ticks >= 10, `ticks=${ticks} elapsed=${elapsed.toFixed(1)}ms`);
  }

  await expectCode('unknown operation is structured error', () => client.request('does-not-exist', {}, { timeoutMs: 1000 }), 'UNKNOWN_OPERATION');

  await expectCode('application timeout terminates long solver', () => client.solvePuzzle(hardEntry.puzzle, { name:'timeout', timeoutMs: 30 }), 'WORKER_TIMEOUT');
  const afterTimeout = await client.solvePuzzle(expected.solver_fixtures[0].puzzle, { name:'after-timeout', timeoutMs: 2000 });
  ok('client restarts clean worker after timeout', afterTimeout.solutions === 1);

  const controller = new AbortController();
  const cancelled = client.solvePuzzle(hardEntry.puzzle, { name:'cancel', timeoutMs: 15000, signal:controller.signal });
  setTimeout(() => controller.abort(), 30);
  await expectCode('AbortSignal cancellation terminates worker', () => cancelled, 'WORKER_CANCELLED');
  const afterCancel = await client.ping({ timeoutMs: 2000 });
  ok('client restarts clean worker after cancellation', afterCancel.pong === true);

  const busyPromise = client.solvePuzzle(hardEntry.puzzle, { name:'busy', timeoutMs:15000 });
  await new Promise(r => setTimeout(r, 10));
  await expectCode('concurrent request rejected as busy', () => client.ping(), 'WORKER_BUSY');
  client.cancelCurrent();
  try { await busyPromise; } catch {}

} catch (error) {
  console.error(error);
  fail++;
} finally {
  client.terminate();
}

console.log(`SUMMARY | pass=${pass} fail=${fail}`);
if (fail) process.exit(1);
