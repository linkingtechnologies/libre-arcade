# Arena results

This folder stores benchmark artifacts separately from simulation code.

Historical baselines retained from development:

- `benchmark-v0.7.json` — four-player baseline.
- `benchmark-v0.8.json` — five-player baseline including JBriscola.
- `benchmark-v0.9.json` — six-player baseline including Pryscola.
- `benchmark-v1.0.2.json` — seven-player baseline including deterministic BriscolaBot v3 policy sampling.
- `benchmark-v1.0.2.md` — human-readable summary of the historical seven-player baseline before Random was added.
- `benchmark-v1.2.0-random.json` — Random baseline against all seven pre-existing players.
- `benchmark-v1.2.0-random.md` — human-readable Random baseline summary.

New Arena runs use `latest-*` names by default or a caller-provided output base.
Canonical result JSON intentionally omits timestamps so identical inputs can be
compared deterministically.

- `briscolab-final-global-v1.7.0.*` — 39-player final global benchmark, 100 paired seeds per matchup, 148,200 games; includes Briscola.js S0/S1.
