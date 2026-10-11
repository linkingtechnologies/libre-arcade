# Test report

## Automated suite

`npm test` passes all restoration checks:

- behavioral oracle
- frame state machine
- AI and Story progression
- Story presentation
- historical audio data/sequencing
- title/menu flow
- visual parity
- final gameplay/input parity
- production-ready browser shell

Latest result:

```text
All Concentration Room behavioral-oracle tests passed.
All Concentration Room state-machine tests passed.
All Concentration Room AI/story tests passed.
All Concentration Room story-presentation tests passed.
All Concentration Room historical-audio tests passed.
All Concentration Room title/menu tests passed.
All Concentration Room visual-parity tests passed.
All Concentration Room final-parity tests passed.
All Concentration Room production-ready tests passed.
```

## Responsive canvas checks

The native playfield remains 256×240 internally. CSS size is calculated from the actual free area in `#screenStack`:

- 900×510 available → 512×480 (2× integer scale)
- 768×720 available → 768×720 (3× integer scale)
- 384×600 available → 384×360 (1.5× fractional fit)

Whole-number scaling is preferred when at least 2× fits; below that threshold the full available area is used instead of forcing a tiny 1× display.

## Asset regeneration

The gameplay, story and title asset generators complete successfully. The deterministic gameplay oracle remains:

`62cb439b33ea630bdf316659679b175f20eb29d2603ead907a0a01337846696a  assets/derived/gameplay/board-oracle.png`

## Baseline integrity

The preserved historical archive remains byte-identical:

`0e9773924b5d8b53d727f3359b62f3730ec95f139d64242236cb9ec28f871566  reference/ConcentrationRoom-0.02.zip`

## HTTP smoke test

Local server returned HTTP 200 for:

- `/`
- `/src/app.js`
- `/src/viewport.js`
- `/assets/original/gamegfx.png`
- `/LICENSE`

## Browser-capture limitation

Automated Chromium screenshot certification is not claimed in this container because the installed headless Chromium does not terminate reliably during capture. A final interactive playthrough in the target browser remains recommended.
