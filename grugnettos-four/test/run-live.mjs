// Runs the whole suite with every native/Python oracle executed for real
// (needs cc/gcc, g++ and python3 with numpy). Add CONNECTLAB_RECORD_ORACLES=1
// to refresh the recordings in test/fixtures/.
process.env.CONNECTLAB_LIVE_ORACLES = '1';
await import('./run-all.mjs');
