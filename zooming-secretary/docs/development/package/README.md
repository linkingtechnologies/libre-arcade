# Zooming Secretary — Libre Arcade Restoration 1.0 RC9 (M32)

An unofficial browser restoration of the 2011 NES homebrew **Zooming Secretary**, rebuilt from the
certified v1.02 gameplay oracle with new HTML5/JavaScript implementation code, new programmatic
clean-room visuals and procedural Web Audio sound effects.

The complete campaign is playable:

**Day 1 → Day 2 → Day 3 → Day 4 → Dream → Day 5 → Day 6 → Day 7 → Ending**

M31 was versioned **1.0.0-rc.8**. It restores two presentation behaviours that were still too far from the NES baseline: a real title screen before Day 1 and a recurring telephone ring while a call remains active. The title screen is a new clean-room DOM/CSS composition, not the historical logo or artwork. While it idles, it consumes the same two-step `rand16()` cadence documented for the original title state; pressing Start freezes that derived seed and runs a 72-logical-tick transition before the Day 1 onboarding card.

The phone now emits the existing clean-room Web Audio ring cue when ringing begins **and repeats it every 50 logical ticks while at least one phone remains active**. Answering/missing the last ringing phone naturally stops repetition because no active ring state remains. `web/audio.js`, the M28 gameplay renderer and the certified deterministic gameplay core remain byte-identical.

M32 advances the candidate to **1.0.0-rc.9** and fixes a browser-input failure that could make ladders appear to stop working after a stale opposite vertical direction remained held. The gameplay core still preserves the original UP+DOWN cancellation rule; the browser adapter now makes the **latest vertical press win** and clears held directions on pause, stage/title transitions, blur and hidden-tab transitions. Ordinary ladder shafts are stress-tested at initial, normal and maximum coffee-boost speeds. Historical top/bottom ladder-wrap routes remain directional and are now explained in the stage intro.

M30 was versioned **1.0.0-rc.7** and remains the answer-mechanic onboarding pass. M29 remains the playability certification: input-only tests win Day 1 and Day 2, while the movement-state audit confirms all **56/56 gameplay interaction positions** across Day 1–7 and Dream are reachable from their real spawns.

## Run

Serve this directory over HTTP, for example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.

## How to answer a call

There is **no Answer button**. When a phone rings, it shows a topic symbol. Touch the filing cabinet with the same symbol to memorize that topic, then move into the ringing phone; the answer happens automatically. Touching a different cabinet replaces the remembered topic. In the Dream, topic matching is bypassed: just reach the ringing phone.

## Controls

- Arrow keys or WASD: move
- P / Esc: pause
- M: sound on/off
- Touch controls: shown on touch/small-screen devices, including short landscape screens
- Audio, Credits and language: top bar

Language and sound preference are stored locally. **Reset preferences** is available in Credits.

## Licensing boundary

The release intentionally has two clearly separated licensing domains:

- **New Libre Arcade implementation** (`src/`, `web/`, renderer/UI/procedural audio):
  GPL-3.0-or-later.
- **Historical semantic stage data** (`data/stage-*-data.js`): redistributed under the original
  project's stated **Creative Commons Attribution / CC BY** grant, whose exact version was not
  specified by the 2011 release. These values are not relicensed as GPL.

See `data/README.md`, `data/LICENSE.txt`, `THIRD_PARTY_NOTICES.md` and
`docs/M25_RELEASE_DECISION.md`.

No original ROM, CHR, NES nametable byte streams, graphics, music, manual, labels, fact-message
prose or historical C/assembly source are redistributed. No AI-generated assets are used.

## Naming

`Zooming Secretary` is retained only as the historical work identifier. Public page metadata uses
**“Zooming Secretary — Libre Arcade Restoration”**; no original logo/trade dress is reused and no
endorsement by the original authors or later port teams is implied.

See `docs/M25_TITLE_REVIEW.md`.

For the RC9 ladder-input reliability pass, see `docs/M32_REPORT.md` and `docs/M32_BROWSER_QA.md`. For the RC8 title/ringing pass, see `docs/M31_REPORT.md` and `docs/M31_BROWSER_QA.md`. The RC7 onboarding pass remains in `docs/M30_REPORT.md` and `docs/M30_BROWSER_QA.md`. The M29 playability results remain in `docs/M29_REPORT.md` and `docs/M29_PLAYABILITY_AUDIT.md`; the M28 visual-fidelity audit remains in `docs/M28_VISUAL_AUDIT.md`; M26 audio verification remains in `docs/M26_REPORT.md`.

## Release status

- Complete deterministic campaign: GREEN
- Automated regression suite: GREEN
- Syntax/static distribution audit: GREEN
- Local HTTP smoke: GREEN
- Historical expressive-media exclusion: GREEN
- Semantic-topology preservation-route policy: ACCEPTED
- Archival title/naming project policy: ACCEPTED
- Manual visual browser smoke: REQUIRED EXTERNALLY

M32 remains RC9 until the final human/browser feel and audible-output smoke is confirmed. Automated gameplay playability, movement reachability, ladder-input de-sticking, ladder stress, title-state/RNG cadence, instruction coverage and recurring Web Audio ring scheduling are GREEN; physical speaker/headphone output and the final browser feel check still require a real browser/device.
