import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GANZENBORD_PD, GANZENBORDSPEL, HISTORIC_BOARD_THEMES, getHistoricBoardTheme } from '../public/src/ui/historicBoardLayout.js';

const readLayout = (id) => JSON.parse(fs.readFileSync(new URL(`../public/data/board-layouts/${id}.json`, import.meta.url), 'utf8'));

for (const id of ['ganzenbord-pd', 'ganzenbordspel']) {
  test(`${id} layout contains one normalized centre for every square`, () => {
    const layout = readLayout(id);
    const keys = Object.keys(layout.positions).map(Number).sort((a, b) => a - b);
    assert.deepEqual(keys, Array.from({ length: 63 }, (_, i) => i + 1));
    assert.equal(layout.start.length, 2);
    for (const [index, point] of Object.entries(layout.positions)) {
      assert.equal(point.length, 2, `square ${index}`);
      assert.ok(point[0] >= 0 && point[0] <= 100, `x out of bounds for square ${index}`);
      assert.ok(point[1] >= 0 && point[1] <= 100, `y out of bounds for square ${index}`);
    }
  });
}

test('historical board theme catalogue points to the real source-artwork filenames', () => {
  assert.deepEqual(HISTORIC_BOARD_THEMES.map((theme) => theme.id), ['ganzenbord-pd', 'ganzenbordspel']);
  assert.equal(GANZENBORD_PD.artworkUrl, './assets/boards/original/Ganzenbord_pd.svg');
  assert.equal(GANZENBORDSPEL.artworkUrl, './assets/boards/original/Ganzenbordspel.jpg');
  assert.equal('remoteArtworkUrl' in GANZENBORD_PD, false);
  assert.equal('remoteArtworkUrl' in GANZENBORDSPEL, false);
  assert.equal(GANZENBORD_PD.nominalWidth, 956);
  assert.equal(GANZENBORD_PD.nominalHeight, 684);
  assert.equal(GANZENBORDSPEL.nominalWidth, 2048);
  assert.equal(GANZENBORDSPEL.nominalHeight, 1470);
  assert.equal(getHistoricBoardTheme('missing').id, 'ganzenbord-pd');
});

test('ordinary neighbouring squares remain a continuous route in both layouts', () => {
  const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  for (const id of ['ganzenbord-pd', 'ganzenbordspel']) {
    const { positions } = readLayout(id);
    for (let i = 1; i < 62; i += 1) {
      assert.ok(distance(positions[i], positions[i + 1]) < 20, `${id}: unexpected jump ${i} -> ${i + 1}`);
    }
    assert.ok(distance(positions[62], positions[63]) < 35, `${id}: unexpected finish jump`);
  }
});

test('Ganzenbordspel has an independent calibration derived from the bundled scan', () => {
  const pd = readLayout('ganzenbord-pd');
  const historic = readLayout('ganzenbordspel');
  assert.equal(pd.calibrationStatus, 'calibrated');
  assert.equal(historic.calibrationStatus, 'calibrated-from-upload');
  assert.notDeepEqual(pd.positions, historic.positions);
  assert.deepEqual(historic.positions['1'], [31.3477, 85.3061]);
  assert.deepEqual(historic.positions['63'], [69.8242, 43.4014]);
});
