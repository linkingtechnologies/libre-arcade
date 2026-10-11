import { GridCreator, BruteForceSolver, AlwaysRunningTask } from '../public/src/core/index.js';

const task = new AlwaysRunningTask();
const levels = [
  ['easy', GridCreator.EASY_GAME, 11000],
  ['normal', GridCreator.NORMAL_GAME, 22000],
  ['hard', GridCreator.HARD_GAME, 33000],
];
let failures = 0;
const summary = [];
for (const [name, level, baseSeed] of levels) {
  const t0 = performance.now();
  let minGiven = 81, maxGiven = 0, totalAttempts = 0;
  for (let i = 0; i < 100; i++) {
    const creator = new GridCreator(BigInt(baseSeed + i), task);
    let g = null, attempts = 0;
    while (!g && attempts < 100) { g = creator.createNewUniqueGame(level); attempts++; }
    if (!g) { console.error(`FAIL ${name} seed=${baseSeed+i}: generation`); failures++; continue; }
    totalAttempts += attempts;
    const givens = g.getNumberOfGiven(); minGiven = Math.min(minGiven, givens); maxGiven = Math.max(maxGiven, givens);
    const solutions = new BruteForceSolver(task, false).searchSolutions(g).length;
    if (solutions !== 1) { console.error(`FAIL ${name} seed=${baseSeed+i}: solutions=${solutions}`); failures++; }
  }
  const ms = performance.now() - t0;
  const row = { level:name, count:100, unique:100-(failures - summary.reduce((n,r)=>n+r.failures,0)), minGiven, maxGiven, avgAttempts:totalAttempts/100, ms };
  const prevFailures = summary.reduce((n,r)=>n+r.failures,0);
  row.failures = failures - prevFailures;
  summary.push(row);
  console.log(`${name}: failures=${row.failures} givens=${minGiven}-${maxGiven} avgAttempts=${row.avgAttempts.toFixed(2)} time=${ms.toFixed(1)}ms`);
}
console.log(JSON.stringify(summary, null, 2));
if (failures) process.exit(1);
