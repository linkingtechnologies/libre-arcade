import fs from 'node:fs';
import { Worker } from 'node:worker_threads';
import {
  GridStore,
  MemoryStorageBackend,
  AUTO_SAVE_FILENAME,
  SudokuWorkerClient,
  customSolutionToGrid,
  emptyCustomGrid,
  normalizeCustomPuzzle,
} from '../public/src/core/index.js';

const expected = JSON.parse(fs.readFileSync(new URL('./oracles.json', import.meta.url), 'utf8'));
const fixtures = Object.fromEntries(expected.solver_fixtures.map(x => [x.name, x]));
const workerUrl = new URL('../public/src/workers/node-worker-entry.js', import.meta.url);
const client = new SudokuWorkerClient(() => new Worker(workerUrl, { type:'module' }));
let pass=0, fail=0;
function ok(name, value, detail='') { console.log(`${value?'PASS':'FAIL'} | ${name}${detail?` | ${detail}`:''}`); value?pass++:fail++; }

try {
  const blank=emptyCustomGrid();
  ok('custom editor starts with empty 81-cell puzzle', blank.shownString()==='0'.repeat(81));
  blank.getSlot(0,0).setShown(5);
  ok('custom editor accepts direct givens without original-lock flag', blank.getSlot(0,0).getShown()===5 && !blank.getSlot(0,0).isOriginalDigit());
  ok('custom puzzle normalization accepts dots', normalizeCustomPuzzle('.'.repeat(81))==='0'.repeat(81));

  const unique = await client.solvePuzzle(fixtures.unique.puzzle,{name:'m10-unique',timeoutMs:5000});
  ok('custom unique puzzle solves once', unique.rules && unique.solutions===1);
  const playable=customSolutionToGrid(fixtures.unique.puzzle,unique.solution1,{play:true,type:'user'});
  ok('Solve & Play keeps givens visible', playable.shownString()===fixtures.unique.puzzle);
  ok('Solve & Play stores complete answer', playable.answerString()===unique.solution1);
  let originalMismatch=0;
  for(let i=0;i<81;i++){
    const s=playable.getSlot(Math.trunc(i/9),i%9);
    if(s.isOriginalDigit() !== (fixtures.unique.puzzle[i]!=='0')) originalMismatch++;
  }
  ok('Solve & Play preserves original-given flags', originalMismatch===0);
  ok('Solve & Play starts unsolved', !playable.isSolved());

  const solved=customSolutionToGrid(fixtures.unique.puzzle,unique.solution1,{play:false,type:'user'});
  ok('Solve displays the first full solution', solved.shownString()===unique.solution1 && solved.isSolved());

  const multiple=await client.solvePuzzle(fixtures.multiple.puzzle,{name:'m10-multiple',timeoutMs:5000});
  ok('multiple custom puzzle reports two solutions and stops', multiple.rules && multiple.solutions===2 && multiple.solution1 && multiple.solution2);
  const impossible=await client.solvePuzzle(fixtures.impossible.puzzle,{name:'m10-impossible',timeoutMs:5000});
  ok('locally-valid impossible puzzle reports zero solutions', impossible.rules && impossible.solutions===0);
  const contradictory=await client.solvePuzzle(fixtures.contradictory.puzzle,{name:'m10-contradictory',timeoutMs:5000});
  ok('contradictory custom puzzle fails simple-rule check', contradictory.rules===false && contradictory.solutions===0);

  const backend=new MemoryStorageBackend();
  const store=new GridStore(backend);
  ok('named save succeeds', store.saveGrid(playable,'Default'));
  ok('named save supports 32-character historical RMS limit name', store.saveGrid(playable,'12345678901234567890123456789012'));
  const loaded=store.loadGrid('Default');
  ok('named load round-trips puzzle and answer', loaded.shownString()===playable.shownString() && loaded.answerString()===playable.answerString());
  ok('named load preserves user game type', loaded.getType()==='user');
  store.autosaveGrid(playable);
  const names=store.getStoredGridFilenames();
  ok('store retains AUTO_SAVE plus explicit names as historical storage does', names.includes(AUTO_SAVE_FILENAME)&&names.includes('Default'));
  ok('manual UI can filter AUTO_SAVE without deleting it', names.filter(n=>n!==AUTO_SAVE_FILENAME).length===2);
  ok('delete named save leaves autosave intact', store.deleteGrid('Default') && store.getAutoSaveGrid()!=null);

} catch(error) {
  console.error(error); fail++;
} finally {
  client.terminate();
}
console.log(`SUMMARY | pass=${pass} fail=${fail}`);
if(fail) process.exit(1);
