import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calibrationStorageKey,
  cloneBoardLayout,
  clearCalibratedLayout,
  exportBoardLayout,
  isValidBoardLayout,
  loadCalibratedLayout,
  saveCalibratedLayout,
  updateDebugMarkerPlacement,
  fitBoardRect
} from '../public/src/ui/BoardCalibrator.js';

function baseLayout() {
  return {
    schemaVersion: 1,
    id: 'theme',
    calibrationStatus: 'provisional',
    start: [10, 90],
    positions: Object.fromEntries(Array.from({ length: 63 }, (_, i) => [String(i + 1), [20 + (i % 10), 20 + (i % 8)]]))
  };
}

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key)
  };
}

test('board calibration validates exactly 63 normalized positions', () => {
  const layout = baseLayout();
  assert.equal(isValidBoardLayout(layout), true);
  delete layout.positions['63'];
  assert.equal(isValidBoardLayout(layout), false);
});

test('board calibration saves and reloads a local override without mutating the base', () => {
  const storage = memoryStorage();
  const base = baseLayout();
  const edited = cloneBoardLayout(base);
  edited.positions['31'] = [42.123, 61.456];
  assert.equal(saveCalibratedLayout('theme', edited, storage), true);
  assert.ok(storage.getItem(calibrationStorageKey('theme')));
  const loaded = loadCalibratedLayout('theme', base, storage);
  assert.deepEqual(loaded.positions['31'], [42.123, 61.456]);
  assert.notDeepEqual(base.positions['31'], loaded.positions['31']);
  assert.equal(loaded.calibrationStatus, 'local');
});

test('clear and export calibration are deterministic', () => {
  const storage = memoryStorage();
  const layout = baseLayout();
  saveCalibratedLayout('theme', layout, storage);
  clearCalibratedLayout('theme', storage);
  assert.equal(storage.getItem(calibrationStorageKey('theme')), null);
  const exported = JSON.parse(exportBoardLayout(layout));
  assert.equal(exported.id, 'theme');
  assert.equal(exported.calibrationStatus, 'calibrated');
  assert.equal(Object.keys(exported.positions).length, 63);
});


test('debug marker labels stay exactly on their calibrated anchor', () => {
  const vars = new Map();
  const hotspot = {
    style: { setProperty: (name, value) => vars.set(name, value) },
    dataset: {}
  };

  updateDebugMarkerPlacement(hotspot, 10, 90);
  assert.equal(vars.get('--debug-label-x'), '0px');
  assert.equal(vars.get('--debug-label-y'), '0px');
  assert.equal(hotspot.dataset.debugHorizontal, 'center');
  assert.equal(hotspot.dataset.debugVertical, 'center');
  assert.equal(hotspot.dataset.debugX, '10');
  assert.equal(hotspot.dataset.debugY, '90');
});

test('debug board fit preserves artwork aspect ratio inside a constrained editor stage', () => {
  assert.deepEqual(fitBoardRect(720, 420, 2048 / 1470), { width: 585.1428571428571, height: 420 });
  assert.deepEqual(fitBoardRect(500, 700, 2), { width: 500, height: 250 });
  assert.deepEqual(fitBoardRect(0, 700, 2), { width: 0, height: 0 });
});
