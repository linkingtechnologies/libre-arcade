import { gridFromBytes } from './grid-codec.js';

export const WORKER_PROTOCOL_VERSION = 1;

export class SudokuWorkerError extends Error {
  constructor(code, message) { super(message); this.name = 'SudokuWorkerError'; this.code = code; }
}

function listen(worker, type, handler) {
  if (typeof worker.addEventListener === 'function') {
    const wrapped = type === 'message' ? (event) => handler(event.data) : handler;
    worker.addEventListener(type, wrapped);
    return () => worker.removeEventListener?.(type, wrapped);
  }
  if (typeof worker.on === 'function') {
    worker.on(type, handler);
    return () => worker.off?.(type, handler);
  }
  throw new TypeError('Unsupported Worker implementation');
}

export class SudokuWorkerClient {
  constructor(workerFactory, { defaultTimeoutMs = 0 } = {}) {
    if (typeof workerFactory !== 'function') throw new TypeError('workerFactory must be a function');
    this.workerFactory = workerFactory;
    this.defaultTimeoutMs = defaultTimeoutMs;
    this.worker = null;
    this.current = null;
    this.nextId = 1;
    this.unlisten = [];
  }

  ensureWorker() {
    if (this.worker) return this.worker;
    const worker = this.workerFactory();
    this.worker = worker;
    this.unlisten = [
      listen(worker, 'message', (data) => this.onMessage(data)),
      listen(worker, 'error', (error) => this.onWorkerError(error)),
    ];
    return worker;
  }

  cleanupListeners() {
    for (const fn of this.unlisten) { try { fn(); } catch {} }
    this.unlisten = [];
  }

  disposeWorker() {
    const worker = this.worker;
    this.cleanupListeners();
    this.worker = null;
    if (worker) { try { worker.terminate(); } catch {} }
  }

  finishCurrent() {
    const current = this.current;
    if (!current) return null;
    clearTimeout(current.timer);
    if (current.signal && current.abortHandler) current.signal.removeEventListener('abort', current.abortHandler);
    this.current = null;
    return current;
  }

  onMessage(data) {
    if (!this.current || data?.id !== this.current.id) return;
    const current = this.finishCurrent();
    if (data.ok) current.resolve(data.result);
    else current.reject(new SudokuWorkerError(data.error?.code ?? 'WORKER_ERROR', data.error?.message ?? 'Worker operation failed'));
  }

  onWorkerError(error) {
    const current = this.finishCurrent();
    this.disposeWorker();
    if (current) current.reject(new SudokuWorkerError('WORKER_CRASH', error?.message ?? String(error)));
  }

  request(op, payload = {}, { timeoutMs = this.defaultTimeoutMs, signal = null } = {}) {
    if (this.current) return Promise.reject(new SudokuWorkerError('WORKER_BUSY', 'a worker operation is already running'));
    if (signal?.aborted) return Promise.reject(new SudokuWorkerError('WORKER_CANCELLED', 'operation cancelled'));

    const worker = this.ensureWorker();
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const current = { id, resolve, reject, timer: null, signal, abortHandler: null };
      this.current = current;
      if (timeoutMs > 0) {
        current.timer = setTimeout(() => this.cancelCurrent('WORKER_TIMEOUT', `operation timed out after ${timeoutMs} ms`), timeoutMs);
      }
      if (signal) {
        current.abortHandler = () => this.cancelCurrent('WORKER_CANCELLED', 'operation cancelled');
        signal.addEventListener('abort', current.abortHandler, { once: true });
      }
      try {
        worker.postMessage({ version: WORKER_PROTOCOL_VERSION, id, op, payload });
      } catch (error) {
        this.finishCurrent();
        reject(new SudokuWorkerError('POST_MESSAGE_FAILED', error?.message ?? String(error)));
      }
    });
  }

  cancelCurrent(code = 'WORKER_CANCELLED', message = 'operation cancelled') {
    const current = this.finishCurrent();
    this.disposeWorker();
    if (current) current.reject(new SudokuWorkerError(code, message));
    return Boolean(current);
  }

  generate(level, { creatorSeed, digitSeed, hardCandidates = 3, maxAttempts = 200, timeoutMs, signal } = {}) {
    return this.request('generate', {
      level,
      creatorSeed: String(creatorSeed),
      digitSeed: String(digitSeed),
      hardCandidates,
      maxAttempts,
    }, { timeoutMs, signal });
  }

  solvePuzzle(puzzle, { name = 'custom', findFirst = false, timeoutMs, signal } = {}) {
    return this.request('solve', { puzzle, name, findFirst }, { timeoutMs, signal });
  }

  solveGridBytes(gridBytes, { name = 'custom', findFirst = false, timeoutMs, signal } = {}) {
    return this.request('solve', { gridBytes, name, findFirst }, { timeoutMs, signal });
  }

  ping(options = {}) { return this.request('ping', {}, options); }

  terminate() {
    const current = this.finishCurrent();
    this.disposeWorker();
    if (current) current.reject(new SudokuWorkerError('WORKER_TERMINATED', 'worker terminated'));
  }
}

export function generatedResultToGrid(result) {
  const grid = gridFromBytes(result.gridBytes);
  grid.setBackTrackingDepth(result.backTrackingDepth ?? result.record?.btDepth ?? 0);
  return grid;
}

export function createBrowserSudokuWorkerClient(options = {}) {
  const url = options.url ?? new URL('../workers/browser-worker-entry.js', import.meta.url);
  return new SudokuWorkerClient(
    () => new Worker(url, { type: 'module', name: '5ud0ku-engine' }),
    options,
  );
}
