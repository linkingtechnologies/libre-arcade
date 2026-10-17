// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// The page's pictures against the original's data files, pixel for pixel (tools/check-assets.mjs). It needs the data folder of the unpacked source archive, which is 135 MB (all 19 language files
// are needed) and is not kept unpacked here: set RILI_DATA to it (after `tools/oracle/build.sh`, it is build/Ri-li-2.0.1/data), or the test is skipped.
import assert from 'node:assert/strict';
import test from 'node:test';
import { checkAssets } from '../tools/check-assets.mjs';

const dir = process.env.RILI_DATA;
test('the 2,506 sprite frames, the 1,501 label images of the 19 languages and the labels of their names are the original\'s pixels', { skip: dir ? false : 'RILI_DATA is not set' }, () => {
  const { problems, summary } = checkAssets(dir);
  assert.deepEqual(problems, []);
  assert.equal(summary.frames, 2506);
  assert.equal(summary.labels, 1501);
  assert.equal(summary.languages, 19);
});
