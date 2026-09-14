# Nova Pinball parity spec — 1.0.0

Baseline: Nova Pinball v0.2.3.

## Dati congelati dall'originale

- tavolo: 58 componenti
- 31 wall
- 18 trigger
- 3 bumper
- 2 kicker
- 2 flipper
- 2 gate
- raggio pallina: 15 px
- gravità: `12 * 64 = 768 px/s²`
- velocità pallina: clamp per asse `[-1000, +1000] px/s`
- wall restitution: `0.4`
- gate restitution: `0.25`
- kicker restitution: `4`
- bumper restitution: `clamp(radius / 10, 1, 4)`
- flipper fixture restitution: `0`
- densità flipper: `1.5`
- coppia applicata dall'originale: `±2,000,000`
- limiti flipper sinistro: `-5° .. +30°`
- limiti flipper destro: `-30° .. +5°`
- lancio: i trigger della corsia destra impostano `vx=0`, `vy=-1000`
- nudge originale: impulso verticale casuale tra `-100` e `0`; il gioco usa `0..0` sull'asse X
- TILT: 3 nudge; un conteggio decade ogni 5 s
- palline per partita: 6
- Safe Mode storico: 30 s

## Scopo di questa build

Verificare prima di tutto il *feeling* meccanico. Missioni e presentazione non devono mascherare una fisica sbagliata.

## Scostamenti noti

La build web **non usa Box2D**. Il collision solver è una reimplementazione pulita e minimale circle-vs-segment/polygon. I valori numerici originali sono riportati, mentre il trasferimento di impulso dei flipper resta il principale punto da verificare empiricamente contro l'eseguibile storico.

La catena missioni, Safe Mode, multiball, Black Hole, Wormhole, scoring, target manager e high score sono implementati. Gli SFX sono una sostituzione procedurale pulita; la musica tracker originale resta in quarantena. Le immagini originali non vengono copiate: il tavolo viene ridisegnato proceduralmente a partire dalla geometria storica.

## Camera originale (implementata in prototype 0.2)

- modalità predefinita: `Ball`
- `Ball`: scala 1:1; segue verticalmente la pallina
- offset verticale: `viewportHeight / 2`
- bordo statico alto/basso: `viewportHeight / 2.5`
- clamp della Y seguita tra `table.y1 + border` e `table.y2 - border`
- easing storico per frame: `cameraY += (targetY - cameraY) * 0.1`
- nudge: shake verticale iniziale di 20 px, dimezzato progressivamente
- `Table`: fit per altezza, poi `drawScale -= 0.1`, offset superiore 45 px

Questi valori sono derivati direttamente da `nova-pinball-engine/init.lua` e `modules/play-state.lua` della v0.2.3.

## Gameplay parity added in prototype 0.3

- bumper contact: 5,000 points
- kicker contact: 7,500 points
- completing N/O/V/A: 12,500 points; individual letters do not score
- left/right two-dot target bank completion: 1,000 points
- target banks reset immediately after all members are lit
- mission dependencies are ordered
- mission 1 `red giant`: `nova word`, +10,000, star becomes red
- mission 2 `hydrogen release`: `left ramp` then `right ramp`, +12,500
- tilt suppresses scoring and mission checks; stationary target switching still occurs
- bumper component cooldown from table data: 0.01 s; default tagged-contact cooldown remains 0.1 s


## Intentional input deviation (web restoration)

The historical desktop release uses Left Shift / Right Shift for the flippers. The web restoration deliberately does **not** bind Shift because repeated Shift presses can invoke Windows Sticky Keys. Default web controls are **Z / M**, with **Left / Right Arrow** as alternatives. This is a documented UX/accessibility deviation; gameplay physics and flipper behaviour remain parity targets. Space key auto-repeat is ignored so a held key cannot generate repeated nudges.

## Main mission chain parity added in prototype 0.4

The v0.2.3 source defines these dependencies in strict order:

1. `red giant`: `nova word` — +10,000
2. `hydrogen release`: `left ramp` -> `right ramp` — +12,500
3. `fusion stage 1`: `left targets` -> `left ramp` -> `left bumper` — +15,000
4. `fusion stage 2`: `right targets` -> `right ramp` -> `right bumper` — +17,500
5. `fusion burn`: wait 30 s -> `left ramp` -> `right ramp` -> `nova word`
6. `fusion unstable`: wait 30 s -> `left ramp` -> `right ramp` -> `nova word`
7. `collapse star`: `left ramp` -> `right ramp` -> `nova word` — +22,500; Black Hole becomes active
8. `wormhole`: `black hole` -> `black hole` -> `black hole`
9. `reset`: wait 7 s — +500,000 Supergravity Bonus

A visible Black Hole contact also awards the independent 250,000-point Gravity Lock bonus, freezes the ball at the hole for one second and releases it with each velocity component in the 300..900 px/s range. The original random sign selection is asymmetric; the web prototype retains the same bias.

On Wormhole activation the original sets gravity to `-0.2 * pixelsPerMeter` (`-12.8 px/s²` with 64 px/m), ball linear damping to `1`, and activates Safe Mode for 30 seconds. These behaviours are implemented in 0.4. The renderer represents mission sprites procedurally rather than copying the quarantined original media.

### Safe Mode correction

`safeModePeriod` is 30 s. The v0.2.3 source contains a call intended to activate Safe Mode on the first launch, but that call is commented out; therefore the historical first ball does **not** receive that automatic grace period. Active uses include the Wormhole and the later bonus-ball/multiball mission.

## Matter Jettison / multiball parity added in prototype 0.5

After the first `reset`, upstream `play.insertBonusMission()` inserts two persistent steps **after `hydrogen release`**. Because the mission engine has already wrapped to step 1 before the callback, the branch first appears in the following cycle:

1. `bonus ball notice`: wait 30 s; LED text `Matter Jetisson` / `Score another ball`
2. `bonus ball`: `left bumper` -> `nova word` -> `right bumper` -> `nova word` -> `middle bumper` -> `left targets` -> `right targets`

Completion awards **150,000**, calls `pinball:newBall()` and activates Safe Mode for 30 s. The browser runtime now supports multiple simultaneous balls, including ball/ball contact, per-ball tagged-contact cooldown and ball-specific Black Hole locking.

During multiball the original camera sorts the active balls and follows the visually lowest one (greatest table Y). Prototype 0.5 does the same.

The numbered `Balls` counter is decremented only when the final ball in play drains. A bonus-ball drain therefore does not consume a player's numbered ball while another ball remains.

### Safe Mode drain quirk

The original Safe Mode callback invokes `play.launchBall(false)`. With zero balls remaining this creates a replacement ball; with another multiball still alive, that function follows its normal in-play branch and nudges the survivor(s) rather than adding a replacement. Prototype 0.5 preserves this source-level behaviour and documents it as a historical quirk.

## Product layer added in prototype 0.6

- Historical high-score capacity preserved at 8 entries.
- Default 2015 score table (AAA 9000 through HHH 2000) is used as the initial browser table.
- Qualifying final scores accept up to three alphanumeric initials and persist via JSON/localStorage, replacing the ambiguous upstream `pickle.lua` serializer.
- Escape pauses play; Space resumes from pause. A browser-friendly start/menu layer replaces the desktop-only Leave action.
- Camera mode and SFX preference persist locally.
- Safe Mode is surfaced with a 30-second countdown and green status bar; TILT disables flippers and receives a stronger visual overlay.
- Original WAV and tracker music remain quarantined. Prototype 0.6 generates new Web Audio effects procedurally and contains no copied audio samples.

## Product polish added in prototype 0.7

- Mission display now exposes the localized current phase plus the ordered dependency step.
- Table presentation uses a deterministic procedural star field, generated hit sparks and floating score feedback; these are new presentation layers and are not copied media.
- Fullscreen uses the browser Fullscreen API and complements the historical fullscreen/window preference.
- Touch UI is responsive in portrait and compact landscape. The centre action changes between launch and nudge according to game state.
- Clean Web Audio SFX remain original to the restoration; a compressor/master bus reduces clipping during multiball and mission bonuses.

These are presentation/UX additions. They do not change mission ordering, point values, ball count, camera target, Safe Mode, tilt or core physics constants.


## RC2 freeze

RC2 keeps the RC1 gameplay and presentation behaviour frozen for final comparison against the historical executable. No gameplay constants were changed. The public-package policy is now explicit: historical tracker music is documented but not redistributed because the available materials do not clearly establish redistribution terms for this modified web restoration. No replacement soundtrack is introduced.


## RC3 hardening freeze

RC3 changes only browser robustness and release metadata. Gameplay, physics constants, mission sequencing, scoring, camera behavior and multiball semantics remain frozen from RC2. Persistent state now passes through a guarded storage adapter with an in-memory fallback, and losing page focus/visibility releases flipper inputs and pauses active play.


## RC4 audio/layout hardening freeze

RC4 leaves gameplay, physics constants, mission sequencing, scoring, camera behavior and multiball semantics unchanged. It fixes two browser-product issues only: fullscreen footer controls are kept on one row at desktop fullscreen widths, and clean Web Audio effects are queued until the browser AudioContext is actually running instead of being dropped during asynchronous resume. The procedural SFX master level is raised from 0.24 to 0.48 because the previous level was unnecessarily quiet on ordinary laptop speakers. No historical audio is introduced.

## RC5 UI/presentation parity freeze

RC5 changes presentation rather than mechanics. The v0.2.3 source and media were re-audited and the following source-level behaviours are now parity targets:

- main menu order `Play/Continue`, `Scores`, `Settings`, `About` (desktop `Leave` intentionally omitted on web);
- ball-style menu cursor and Up/Down + Space/Enter navigation;
- pre-launch table preview pan at 50 px/s;
- 20 px in-canvas status strip with Score/Balls and Safe Mode feedback;
- 36 px bottom LED display, green text, 150 px/s vertical message motion and priority/sticky queue semantics;
- Mission Hints modes `LED`, `Lights`, `Both`, `None`;
- teal pause panel with pale-green border;
- cyan/yellow About line presentation with opposing slide directions;
- Game Over table scroll at 150 px/s with magenta message.

The visual renderer now uses a clean procedural reconstruction informed by the original palette and asset proportions. Historical image/font bytes are still excluded. Gameplay, score values, mission sequence, multiball, camera rules and physics constants remain unchanged from RC4.


## RC6 audio/font modernization freeze

RC6 leaves table geometry, physics, scoring, mission sequencing, camera rules and multiball semantics unchanged from RC5. The changes are presentation/audio only:

- the historical HUD/LED look is rendered by a new clean 5×7 dot-matrix renderer (`public/src/dotfont.js`); no historical TTF/OTF font binary is redistributed;
- the 18 historical WAV roles that are actually referenced by v0.2.3 are mapped to clean Web Audio synthesis with role-specific envelopes/timings; the unused historical `powerup-2.wav` remains archaeological evidence only;
- the historical Beyond tracker soundtrack remains excluded;
- three optional **modern CC0** background loops are bundled under `public/assets/music-modern/`, with `None` as the default archival choice and `Playlist` as an optional modern convenience;
- music selection and music volume persist separately from SFX preference.

The modern background tracks are explicitly a documented divergence and are not presented as preserved Nova Pinball media. Exact provenance and SHA-256 values are recorded in `public/assets/music-modern/CREDITS.md`.
