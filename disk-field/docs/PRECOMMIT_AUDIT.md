# Pre-commit check — v0.6.2

- Full M6.2 baseline regression suite: PASS on the original full bundle.
- Repo-clean regression suite: PASS (historical archives absent; optional hash checks explicitly SKIP).
- Simulation engine and level data unmodified; pinned SHA-256 checked on every `npm test` run.
- No original font/audio recordings or original source archives in this package.
- Includes runnable tests and solvability replay corpus, unlike the former `public-clean` ZIP.
- Browser automation: not certified here (headless Chromium could not complete in the container). Screenshot-level selector/touch/audio real-device acceptance remains manual.
- Full historic source and assets remain separate; do not commit the original `reference/` directory.
