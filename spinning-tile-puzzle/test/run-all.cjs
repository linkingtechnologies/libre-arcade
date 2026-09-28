// SPDX-License-Identifier: GPL-3.0-or-later
// Each required file executes its checks at module scope and throws on
// failure; there is no test framework, matching the smoke scripts as
// delivered. See specs/ORACLE.md for what each one covers, and
// test/production-smoke.sh for the optional live-Java re-verification.
require('./game-smoke.cjs');
require('./spin-stress.cjs');
require('./i18n-smoke.cjs');
require('./spinner-parity.cjs');
require('./reference-integrity.cjs');
require('./photo-integrity.cjs');
require('./production-smoke.cjs');
