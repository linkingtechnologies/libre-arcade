import { parentPort } from 'node:worker_threads';
import { handleWorkerRequest, errorPayload } from './worker-handler.js';

if (!parentPort) throw new Error('node-worker-entry must run in a Worker');
parentPort.on('message', (message) => {
  const id = message?.id ?? null;
  try {
    const { result, transfer } = handleWorkerRequest(message);
    parentPort.postMessage({ id, ok: true, result }, transfer);
  } catch (error) {
    parentPort.postMessage({ id, ok: false, error: errorPayload(error) });
  }
});
