# Disk Field HTML5 M2 — visual/UX fidelity milestone

## Goal

M2 keeps the M1 physics/level port unchanged and moves the browser experience closer to the 2007 PyWeek 5 release. The visual reference is the preserved 1.01 rendering code plus the historical PyWeek screenshots `TitleScreen.png` and `Shot4.png`.

Historical visual references:

- https://s3.eu-west-2.amazonaws.com/media.pyweek.org/5/TTTT/TitleScreen.png
- https://s3.eu-west-2.amazonaws.com/media.pyweek.org/5/TTTT/Shot4.png
- PyWeek entry: https://pyweek.org/e/TTTT/

No historical screenshot, font, music, or sound sample is bundled in the public build.

## Implemented in M2

- Recreated the 2007 yellow/black title-screen composition on Canvas.
- Restored the rotating black/white disk menu cursor.
- Added keyboard/touch/click menu navigation.
- Added a level selector modeled on `DfSplash.pickLevel()`:
  - five-row scrolling window;
  - rotating disk selector;
  - 360 × 270 live level preview on the right;
  - preview advances moving walls/field objects but deliberately does **not** simulate the disk;
  - vector arrows use half line width in preview, matching 1.01.
- Added an options screen in the same visual language.
- Added a credits screen in place of the desktop-only `Quit game` action.
- Changed pause presentation to the historical 30% white veil with centered black title.
- Added a dedicated end screen corresponding to the original `The End` state.
- Preserved the original field palette:
  - ground `#cccc00`;
  - border/walls black;
  - controllable vector component red;
  - fixed component blue;
  - killer walls red;
  - red/black goal;
  - black/white disk.
- Corrected white-hole rendering to use the same 16 px visual radius as the original `BlackHole.draw()`.
- Kept a compact modern browser toolbar only during gameplay; menu/selector/options/end use the historical full-canvas presentation.
- Kept IT/EN UI and responsive/touch support.

## Deliberate deviations

### Font

The historical `MAKISUPA.TTF` is not used because its bundled license requires written permission for redistribution as part of software/collections. M2 uses a system-font fallback stack and does not package a replacement font.

### Audio

Original music/samples remain quarantined. M2 continues to use small procedural Web Audio cues and has no background music.

### Main-menu fourth action

The desktop original displayed `Quit game`. A browser cannot reliably close its own tab, so the fourth slot is `Credits`. Start Game, Select Level, and Options retain their original roles.

### Options

The original exposed separate Sound and Music toggles. Since the public port deliberately has no historical/background music, M2 exposes Sound and Language instead.

## Regression status

M2 does not change the physics rules or level dataset. After the UI/rendering changes:

- all 7 oracle scenarios pass;
- all 85 field-vector samples pass;
- 2,238 traced ticks remain within the established M1 numeric envelope;
- discrete collision/hole/completion states still match;
- all 17 levels remain numerically stable for up to 1,200 ticks each;
- selector preview was specifically tested not to move disks;
- public code contains no references to quarantined original font/audio asset files.

Current oracle maxima are unchanged:

- field sample absolute error: about `5.98e-8`;
- position / displacement: below `0.0025 px`;
- velocity: below `0.00025` units/tick;
- rotation: below `0.0002 rad`;
- angular velocity: below `0.000005 rad/tick`.

## Status

M2 is a playable preservation build with a substantially more faithful 2007 presentation while keeping the public payload asset-clean.

The remaining visual gap is principally the unavailable/non-redistributable historical font. This is a presentation issue, not a gameplay or physics blocker.
