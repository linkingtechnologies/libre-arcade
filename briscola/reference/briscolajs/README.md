# Briscola.js historical demo reference

BriscoLab v1.7.0 reconstructed the historical S0/S1 computer-player behavior
from the deployed `app.bundle.js` supplied from the public demo:

- Demo: `https://calogxro.github.io/demo/briscola.js/index.html`
- Artifact filename: `app.bundle.js`
- SHA-256: `66d260e522dc12be4f35231cb5af15cfb2c64628f69d61fa5a73b19455c9aef5`
- Recovered module names include `../ai/minimax_decision`,
  `../ai/alpha_beta_search`, `../ai/random_decision`, and `AIPlayer`.

The original bundle is intentionally **not included** here. No explicit license
for the author's Briscola.js code was found in the recovered repository/package.
The implementation in `src/players/briscolajs/` is a newly written behavioral
reconstruction and is marked GPL-3.0-only as BriscoLab project code. The
upstream licensing status remains unverified; this note is provenance, not a
claim that the original bundle is GPL-licensed.
