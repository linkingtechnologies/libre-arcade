import { GameController } from './controller.js';

export const SAVE_FORMAT = 'grugnettos-kludgopolb-save';
export const SAVE_VERSION = 1;

export function serializeSave(controller, { pretty = false } = {}) {
  if (!(controller instanceof GameController)) throw new Error('serializeSave expects a GameController');
  return JSON.stringify({
    format: SAVE_FORMAT,
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    controller: controller.toSnapshot()
  }, null, pretty ? 2 : 0);
}

export function deserializeSave({ board, json }) {
  const data = typeof json === 'string' ? JSON.parse(json) : structuredClone(json);
  if (data?.format !== SAVE_FORMAT || data?.version !== SAVE_VERSION || !data.controller) throw new Error('Unsupported save format');
  return GameController.fromSnapshot({ board, snapshot: data.controller });
}
