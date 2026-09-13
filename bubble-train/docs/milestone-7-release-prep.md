# Milestone 7 — Release Candidate / automated release prep

## Goal

Turn the M6 playable restoration into a reproducible Release Candidate without overstating parity. This milestone focuses on stability, preservation integrity, local delivery and explicit release gates.

## New automated gates

### `tools/release-check.mjs`

Verifies:

- 3 preserved reference archives against `reference/MANIFEST.sha256`;
- 66 historical level/game XML files against the frozen data manifest;
- 33 clean assets against `assets-clean/MANIFEST.sha256`;
- all eight clean theme backgrounds;
- runnable code/data does not reference quarantined historical media.

### `tools/release-soak.mjs`

Runs all **61 unique historical levels**, three deterministic automated attempts each. Current run:

- 61 levels
- 183 attempts
- **128,589 ticks**
- 79 attempts reached a normal terminal state during the capped run
- 0 exceptions
- 0 non-finite carriage positions
- 0 non-finite bullet positions

The soak is a stability test, not evidence that the automated shooter can solve the campaigns.

### `tools/http-smoke.mjs`

Starts the local server and verifies successful delivery/MIME types for:

- demo HTML
- JavaScript module
- clean SVG gameplay art
- clean SVG theme art
- historical `.gms`
- historical `.lvl`

The local server was hardened to declare SVG/XML MIME types explicitly and to use a stricter root-path guard.

## M6 bug fixed

Opening Options or Fastest Times while playing paused simulation but left procedural music running. Dialog open/close now pauses/resumes gameplay music consistently with simulation.

## Responsive shell review

The existing shell retains:

- `viewport-fit=cover`;
- safe-area padding;
- responsive 4:3 canvas;
- a short-viewport layout at `max-height:700px`;
- touch-action suppression on the gameplay canvas;
- on-screen controls below 760 px width;
- keyboard and pointer controls on larger screens.

A real browser/device matrix remains mandatory before final release. The container's Chromium executable was not accepted as release evidence because headless initialization in this environment did not complete reliably; no visual browser pass is claimed.

## RC decision

**Automated release gate: PASS**

**Native differential parity: PENDING**

**Manual browser/device/accessibility matrix: PENDING**

Therefore the correct label is **Release Candidate**, not final/parity-certified.
