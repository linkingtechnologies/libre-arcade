// Runs every ConnectLab test in order. A test that needs a native or Python
// oracle replays the output recorded in test/fixtures/ (see oracle-fixtures.mjs);
// one whose recording is missing is reported as SKIPPED, never as passed.
// Set CONNECTLAB_LIVE_ORACLES=1 to run every oracle for real instead.

const tests = [
  'childsplay-fourrow-oracle',
  'framework',
  'melilli-parity',
  'stratzilla-parity',
  'arena-round-robin',
  'petters-mcts-parity',
  'pons-parity',
  'markus-thill-td-parity',
  'markus-thill-mcts',
  'michael-bell-bota-parity',
  'jacob-downing-genetic-parity',
  'zeta36-alpha-zero-parity',
  'aman-virmani-qlearning-parity',
  'gcompris-4stattack-parity',
  'allis-threat-space',
  'uci-naive-bayes',
  'gnome-velena-parity',
  'kfourinline-parity',
  'gnome-velena-proof-number',
  'gnome-velena-hybrid',
  'gnome-velena-rule-engine',
  'markus-thill-alphabeta',
  'gnome-velena-full-integration',
  'connectlab-ensemble',
  'control-baseline',
  'release-candidate',
  'strength-lab',
  'strength-levels',
  'public-ui',
];

const skipped = [];
for (const name of tests) {
  try {
    await import(`./${name}.mjs`);
  } catch (error) {
    if (error?.code === 'NO_RECORDED_ORACLE') {
      console.log(`SKIPPED ${name}: no recorded oracle output (needs a native toolchain; see test/oracle-fixtures.mjs)`);
      skipped.push(name);
      continue;
    }
    console.error(`FAILED ${name}`);
    throw error;
  }
}

console.log(`\n${tests.length - skipped.length} of ${tests.length} test files passed${skipped.length ? `, ${skipped.length} skipped: ${skipped.join(', ')}` : ''}.`);
