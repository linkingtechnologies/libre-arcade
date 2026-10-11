import {
  Grid,
  GridCreator,
  GridSolver,
  BruteForceSolver,
  AlwaysRunningTask,
  selectBestHardCandidate,
  gridToBytes,
  gridFromBytes,
} from '../core/index.js';

export const WORKER_PROTOCOL_VERSION = 1;

function asSeed(value, name) {
  try { return BigInt(value); }
  catch { throw workerError('BAD_REQUEST', `${name} must be an integer-compatible seed`); }
}

function seedForRecord(value) {
  const b = BigInt(value);
  return b >= BigInt(Number.MIN_SAFE_INTEGER) && b <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(b) : b.toString();
}

function workerError(code, message) {
  const e = new Error(message);
  e.code = code;
  return e;
}

function levelTarget(level) {
  if (level === 'easy') return GridCreator.EASY_GAME;
  if (level === 'normal') return GridCreator.NORMAL_GAME;
  if (level === 'hard') return GridCreator.HARD_GAME;
  throw workerError('BAD_REQUEST', `unknown level: ${level}`);
}

function createGeneratedRecord({ level, creatorSeed, digitSeed, hardCandidates = 3, maxAttempts = 200 }) {
  const task = new AlwaysRunningTask();
  const creator = new GridCreator(asSeed(creatorSeed, 'creatorSeed'), task);
  let grid = null;
  let attempts = 1;
  let found = 1;

  if (level === 'hard') {
    if (!Number.isInteger(hardCandidates) || hardCandidates < 1 || hardCandidates > 50) {
      throw workerError('BAD_REQUEST', 'hardCandidates must be an integer from 1 to 50');
    }
    if (!Number.isInteger(maxAttempts) || maxAttempts < hardCandidates || maxAttempts > 10000) {
      throw workerError('BAD_REQUEST', 'maxAttempts must be an integer >= hardCandidates and <= 10000');
    }
    const selected = selectBestHardCandidate(creator, hardCandidates, maxAttempts);
    grid = selected.grid;
    attempts = selected.attempts;
    found = selected.found;
  } else {
    const target = levelTarget(level);
    let internalTries = 0;
    while (!grid && internalTries < maxAttempts) {
      grid = creator.createNewUniqueGame(target);
      internalTries++;
    }
    // M2 exposed 1/1 for non-hard records even when an internal retry occurred.
    attempts = 1;
    found = grid ? 1 : 0;
  }

  if (!grid) throw workerError('GENERATION_FAILED', `unable to generate ${level} puzzle`);

  const prePuzzle = grid.shownString();
  const preSolution = grid.answerString();
  const givens = grid.getNumberOfGiven();
  grid.setupPossibleDigits();
  const singles = grid.getNumberOfSingles();
  const btDepth = grid.getBackTrackingDepth();
  const solutions = new GridSolver(task).searchSolutions(grid).length;

  // CreatorTask.storeGrid() clears temporary candidates before handing the board to the UI.
  grid.clearPencilMarks();
  Grid.setRandomSeed(asSeed(digitSeed, 'digitSeed'));
  grid.randomizeDigits();

  const record = {
    kind: 'generated',
    name: level,
    creatorSeed: seedForRecord(creatorSeed),
    digitSeed: seedForRecord(digitSeed),
    attempts,
    found,
    givens,
    singles,
    btDepth,
    solutions,
    prePuzzle,
    preSolution,
    finalPuzzle: grid.shownString(),
    finalSolution: grid.answerString(),
  };

  const bytes = gridToBytes(grid);
  return { record, gridBytes: bytes, backTrackingDepth: btDepth };
}

function gridFromSolvePayload(payload) {
  if (typeof payload.puzzle === 'string') {
    if (payload.puzzle.length !== 81) throw workerError('BAD_REQUEST', 'puzzle must contain exactly 81 characters');
    return Grid.fromPuzzle(payload.puzzle, payload.type ?? 'user');
  }
  if (payload.gridBytes != null) {
    const bytes = payload.gridBytes instanceof Uint8Array ? payload.gridBytes : new Uint8Array(payload.gridBytes);
    return gridFromBytes(bytes);
  }
  throw workerError('BAD_REQUEST', 'solve requires puzzle or gridBytes');
}

function solveRecord(payload) {
  const grid = gridFromSolvePayload(payload);
  const rules = grid.checkForRules();
  const sols = rules ? new BruteForceSolver(new AlwaysRunningTask(), Boolean(payload.findFirst)).searchSolutions(grid) : [];
  return {
    kind: 'fixture',
    name: payload.name ?? 'custom',
    rules,
    givens: grid.getNumberOfGiven(),
    solutions: sols.length,
    puzzle: typeof payload.puzzle === 'string' ? payload.puzzle : grid.shownString(),
    solution1: sols.length > 0 ? sols[0].shownString() : '',
    solution2: sols.length > 1 ? sols[1].shownString() : '',
  };
}

export function handleWorkerRequest(message) {
  if (!message || typeof message !== 'object') throw workerError('BAD_REQUEST', 'message must be an object');
  if (message.version !== WORKER_PROTOCOL_VERSION) {
    throw workerError('BAD_PROTOCOL', `expected protocol ${WORKER_PROTOCOL_VERSION}`);
  }
  const payload = message.payload ?? {};
  if (message.op === 'generate') {
    const result = createGeneratedRecord(payload);
    return { result, transfer: [result.gridBytes.buffer] };
  }
  if (message.op === 'solve') return { result: solveRecord(payload), transfer: [] };
  if (message.op === 'ping') return { result: { pong: true, protocol: WORKER_PROTOCOL_VERSION }, transfer: [] };
  throw workerError('UNKNOWN_OPERATION', `unknown worker operation: ${message.op}`);
}

export function errorPayload(error) {
  return {
    code: error?.code ?? 'WORKER_ERROR',
    message: error?.message ?? String(error),
  };
}
