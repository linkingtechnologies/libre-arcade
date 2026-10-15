# THIRD_PARTY_NOTICES

## Zooming Secretary historical reference

This package does **not** redistribute the original Zooming Secretary ROM, CHR graphics,
nametable/map source files, music, FamiTracker data, cartridge labels, manual, screenshots,
or original C/assembly source.

Historical attribution documented by the 2011 release:

- **Shiru** — code, gameplay design, sound/music, direction, some graphics.
- **Alexei “PinWizz” Bespalko** — visual design, most graphics, fact-message text.
- **Gibson** — testing.

The original package states Creative Commons Attribution / “CC BY 2011”; the exact CC license
version remains unresolved in the archaeology audit. Original historical media are therefore
not treated as GPL-licensed content in this distributable.

## Day 1 and Day 2 functional topology

M15/M16 include new JavaScript descriptions of **functional collision/layout relationships**
(platform/ladder geometry and gameplay object coordinates) derived from the v1.02 behavioral
oracle. They contain no original nametable bytes or tile art. These semantic layouts remain
provenance-explicit and subject to the final redistribution review defined in M13.

## New implementation

The JavaScript core, browser shell, renderer, controls, tests, semantic level builders and
programmatic drawing code are new Libre Arcade work under **GPL-3.0-or-later**.

No AI-generated assets are used.

## M17 Day 3

Day 3 collision geometry, entity coordinates and behavior constants are represented as new semantic reconstruction code derived from the archaeology oracle. No original `map3_nam.h`, nametable byte stream, CHR data or original visual/audio assets are included.

## M18 Day 4

Day 4 collision geometry, coordinates and Chatter behavior constants are represented as new semantic reconstruction code derived from the binary/runtime oracle. No original `map4_nam.h`, nametable byte stream, CHR data or original visual/audio assets are included.

## M19 Dream

The Dream collision geometry, six table coordinates, player/Ghost coordinates and behavioral constants are represented as new semantic reconstruction code derived from the certified v1.02 behavioral/runtime oracle. No original bonus nametable byte stream, CHR data, graphics, music, text, or original source files are included.

The placeholder tables and Ghost drawing in the browser renderer are new Libre Arcade shapes under GPL-3.0-or-later and are not traced from the original pixel art.

## M20 Day 5

Day 5 collision geometry, player/phone/cabinet/coffee/Geek coordinates and behavior constants are represented as new semantic reconstruction code derived from the certified v1.02 behavioral/runtime oracle. No original `map5` nametable byte stream, CHR data, graphics, music, fact text, or original source files are included.

The browser Geek treatment is a new placeholder drawing under GPL-3.0-or-later and is not traced from the original pixel art. Decorative-heart RNG calls are simulated only to preserve deterministic gameplay state; no original heart artwork is distributed.

## M21 Day 6

M21 adds a new semantic reconstruction of Day 6 and a new placeholder rendering for ManBox. No historical Day 6 nametable bytes or ManBox artwork are included. Behavioral coordinates, timing constants, hashes and RNG/state vectors are archaeology metadata used to verify the clean-room implementation.

## M22 Day 7 and Ending

M22 adds a new semantic reconstruction of Day 7 and a new clean-room placeholder rendering for Dibrov. No historical Day 7 nametable bytes, Dibrov artwork, ending artwork, music, fact text, or original source code are included. Behavioral coordinates, timing constants, collision fingerprints and RNG/state vectors are archaeology metadata used to verify the implementation.

The final ending screen is newly written Libre Arcade UI/text under GPL-3.0-or-later and does not reproduce the historical ending artwork or wording.

## M23 production audio and final clean-room visuals

M23 does not add historical media. The browser build now uses a small **Web Audio** synthesizer
implemented in `web/audio.js`; all audible effects are created at runtime from oscillators and
short procedural noise buffers. There is **no bundled audio** sample data, no copied FamiTracker
sequence data, and no AI-generated audio or visual asset.

For archaeology/licensing reference, Shiru's 2019 OpenGameArt collection **“NES 8-bit sound
effects”** states that it contains effects taken from several of his freeware NES games,
including Zooming Secretary, and that users may choose **CC0** or CC-BY 3.0. That collection
remains a valid GREEN replacement source under the M13 strategy, but its ZIP is **not bundled**
in M23. M23 therefore has no runtime dependency on OpenGameArt or on the historical sound set.

OpenGameArt reference: `https://opengameart.org/content/nes-8-bit-sound-effects`

The M23 browser renderer is new programmatic Libre Arcade artwork under GPL-3.0-or-later. It is
not traced from the historical CHR graphics. No AI-generated assets are used.

## M24 final release audit

M24 adds no historical media and does not change the clean-room boundary established in M13–M23.
It removes obsolete standalone demo harnesses and hardens the production UI for small landscape
touch devices. Runtime graphics, UI and procedural Web Audio remain GPL-3.0-or-later Libre Arcade
work and no AI-generated assets are used.

The exact semantic level topology remains provenance-explicit and subject to the final public
redistribution review documented in M13/M24. The archival title `Zooming Secretary` is retained for
the release candidate, but M24 does not represent a trademark clearance or a new permission grant.

## M25 preservation-route licensing split

M25 resolves the semantic-topology release decision by adopting the **preservation route** defined
in M13. The exact historical functional topology and object-coordinate data are now physically
separated under `data/` from the GPL implementation code.

The `data/stage-*-data.js` component is redistributed under the original 2011 project's stated
**Creative Commons Attribution / CC BY** grant, with the exact CC version explicitly recorded as
**unspecified** because the historical release did not provide a version or legal-code URL. M25
does not relicense these values as GPL and does not silently reinterpret the grant as CC BY 3.0
or CC BY 4.0. Full attribution and modification/provenance notes are in `data/README.md`.

All algorithms, browser adapters, renderer/UI, procedural audio and other new implementation code
remain GPL-3.0-or-later. No original ROM, nametable byte stream, CHR art, music, fact-message prose,
manual/label art, or historical C/assembly source is added by this licensing split.

For naming, M25 retains `Zooming Secretary` only as the historical game identifier and qualifies
public metadata as **“Zooming Secretary — Libre Arcade Restoration”**. No historical logo or trade
dress is reused, and no endorsement by Shiru, PinWizz, or later port authors/publishers is implied.


## M28 NES visual-fidelity pass

M28 uses historical screenshots and the preserved ROM/source only as a **visual oracle** for broad,
non-literal characteristics such as screen composition, high contrast, black playfield, bright
cyan/white HUD, striped office floors, ladder/cabinet/telephone metaphors and the general warm
red/orange identity of the protagonist. The runtime renderer remains newly authored JavaScript
procedural drawing under GPL-3.0-or-later.

M28 does **not** import, decode, trace or redraw the historical CHR tiles or sprite bitmaps. No
historical screenshot is bundled in the release. The original PinWizz/Shiru graphics remain
reference-only under the unresolved versioned-CC-BY boundary documented in M6/M13.


## M29 playability certification

M29 adds only headless input/reachability tests and release documentation. It does not add or
modify gameplay media. The M28 clean-room renderer and M26 procedural audio engine remain
byte-identical; no historical expressive asset is introduced by this milestone.


## M31 title screen and ringing

The M31 browser title screen is newly authored DOM/CSS geometry and text. It does not reuse the original NES title/logo pixels, CHR data, screenshots, or later-port artwork. The historical v1.02 title state is used only as a behavioural oracle for the existence of a title screen, its idle RNG consumption cadence, and the documented 72-frame post-Start transition.

M31 does not add sampled audio. The existing procedural Web Audio `ring` cue is retriggered by browser-layer scheduling while a gameplay phone remains in a ringing heat state. `web/audio.js` and the deterministic phone state machine are unchanged.

## M32 browser input reliability

M32 adds `web/directional-input.js` and related browser-only input cleanup as new Libre Arcade GPL-3.0-or-later code. It changes no historical semantic stage data and imports no historical media. The deterministic movement/simulation core, clean-room renderer and procedural audio engine remain unchanged.
