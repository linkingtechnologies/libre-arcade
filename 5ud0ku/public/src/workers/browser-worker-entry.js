import { handleWorkerRequest, errorPayload } from './worker-handler.js';

self.onmessage = (event) => {
  const message = event.data;
  const id = message?.id ?? null;
  try {
    const { result, transfer } = handleWorkerRequest(message);
    self.postMessage({ id, ok: true, result }, transfer);
  } catch (error) {
    self.postMessage({ id, ok: false, error: errorPayload(error) });
  }
};
