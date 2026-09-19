# Development history

This condenses roughly ninety individual milestone/RC notes (`milestone-0.*.md`,
`qa-rc*.md`, `ui-rc*.md`, versions 0.1 through 0.11.0-rc68) into one chronological
account. Nothing here overrides the living design docs elsewhere in `specs/`
(`ai.md`, `board-design.md`, `economy.md`, `parity.md`, `pazifik.md`, ...), which
describe the current system rather than its history.

## 0.1–0.2: engine foundation

The project started as a headless proof: a seeded, deterministic simulation
running the original 32-space Grugnetto board layout with four CPU players and
no UI. 0.1 shipped with a provisional trading stand-in; 0.2 replaced it with a
source-grounded port of KludgopolB's actual Java trading logic
(`PlayerCPUTrader.java`, `CurrentState.java`, `TradeAccepterWindow.java`):
candidate-property selection, group-aware pruning, cash-balancing heuristics,
pledge-value penalties, and stochastic acceptance on the target's side. The
Java original used independent unseeded `java.util.Random` instances; the
restoration deliberately swapped in deterministic seeded streams so runs are
reproducible for tests and replays, without changing any decision formula.

## 0.3–0.7: an original board and calibrated economy

0.3 replaced a generic six-group placeholder board with four equal four-space
groups mapped onto Grugnetto Go!'s own four worlds, added two themed event
decks, and pulled in the first Grugnetto/Kenney art. 0.4 threw out placeholder
prices and derived a real economy from 2,000,000 simulated deterministic
movement turns, so every world costs roughly the same to acquire in full. 0.5
froze that board as content version 1.0.0, stripped every human-language
string out of the mechanical JSON, and added complete IT/EN/FR/DE locale
files keyed by stable space/card IDs, so localization can never influence a
seeded simulation result. 0.6 layered a themed Adventure/Setback event engine
on top (eight unique cards per deck, cycled without replacement) as a new
frozen package, v1.1, while leaving v1.0 untouched and hash-verifiable. 0.7
gave all sixteen event cards real player-facing title/text copy in all four
languages as v1.2, again without touching a single gameplay value.

## 0.8–0.10: from headless engine to browser client

0.8 wrapped the engine in a `GameController` state machine capable of mixed
human/CPU games, with explicit pending-decision states for dice, purchases,
auctions, trades and Base Camp, plus versioned JSON save/load — freezing a
backend/save contract that the UI would consume rather than reaching into
engine internals directly. 0.9 built the actual interactive browser client on
top of it: one human against 1–7 historical CPU opponents, full trade/auction/
pledge flows, a viewport-locked responsive layout, and an IT/EN/FR/DE shell.
0.9.1 polished first-run setup (no visible seed, difficulty labels instead of
internal level codes). 0.10 was presentation-only: a four-language copy
review, a friendlier trade dialog, and configurable CPU pawn tokens sourced
from Kenney's CC0 New Platformer Pack (content package v1.3).

## 0.11 RC1–RC3: hardening and the player manual

RC1 added accessibility (keyboard-focusable spaces, `aria-live`, reduced-motion
support) and viewport-locked dialog handling checked against five real device/
viewport targets. RC2–RC3 built and wired in a fully data-driven, four-language
in-game manual, grounded strictly in what `GameController` actually implements
rather than any assumed external rule set.

## 0.11 RC28: a deeper Grugnetto Go! crossover

A new frozen board package, v1.4, stayed byte-identical to v1.3 in every
gameplay value (verified by an automated deep-equal test) and added exactly
two things: Grugnetto Go!'s own goal-flag artwork on the three Portal spaces,
and a short added clause in each event card's flavor text naming a specific
Grugnetto Go! world, creature or collectible. A matching presentation layout,
`grugnetto-islands-v3`, recolored island gradients from each world's own
accent color instead of an unrelated palette.

## 0.11 RC31–RC35: the public-archaeology boundary and a trademark scrub

RC31 drew a hard line for the distributable package: none of the three
audited upstream archives (KludgopolB's binary and source ZIPs, the JAtlantik
r36 snapshot) ship in the public repository. Their filenames, upstream URLs
and SHA-256 hashes stay in `reference/EXTERNAL_ARTIFACTS.md`; the archives
themselves live only in a private research copy. RC32–RC33 then swept the
README, specs and even two `board.json` `note` fields for incidental
references to the unrelated commercial game brand this genre is best known
by, replacing them with neutral project vocabulary — consistent with this
collection's standing rule never to use a trademarked game's name as
branding. RC34 rewrote the README around the shipped product and added a
release checklist and HTTP/MIME smoke test; RC35 finished renaming leftover
internal identifiers (transport/service/detention terminology) to match.

## 0.11 RC37–RC45: the illustrated board arrives

RC37 replaced the schematic board with a single illustrated layout,
`grugnetto-islands-v4`: a central Grugnetto hub surrounded by four themed
islands in Grugnetto Go!'s canonical order, with per-space icons and
inter-world token animation along bridge waypoints — all as HTML/CSS overlays
on top of unchanged logical positions, prices and rules. RC40 bundled GNU
FreeSans locally so the UI no longer depends on whatever font happens to be
installed. RC45 completed the CPU cast: all eight AI friends (the seven
historical KludgopolB personalities plus Pazifik) now use distinct Grugnetto
Go! enemy sprites instead of mixing a handful of real characters with
abstract chips.

## 0.11 RC46–RC51: rethinking turn feedback

A run of releases reworked how the human player follows what CPU opponents
just did: a left-sidebar turn-by-turn review gated behind an explicit human
`OK` (RC46), a right sidebar simplified into a single all-player dice tracker
(RC47), stronger visual emphasis on the latest roller and doubles (RC48), and
progressive de-duplication of the same information appearing in more than one
place (RC49). RC51 swapped a placeholder frog figure on the central hub for
Grugnetto himself.

## 0.11 RC52–RC68: fitting a hand-painted board to four languages

The largest single stretch of release candidates is a long iteration on one
hard problem: an illustrated, hand-painted board and a UI that has to read
correctly in Italian, English, French and German at the same time. Passes in
this range narrowed side panels and enlarged the board (RC52–RC53), moved
detailed CPU turn review fully into the left sidebar (RC54), added a
route-direction layer and fixed human-token infrastructure (RC55–RC56),
rationalized how the 32 logical spaces map onto a hand-drawn 32-plaque
illustration including numbering and pawn-stacking overlays (RC57–RC61), and
handed plaque rendering fully to the background art instead of runtime
drawing (RC62). The genuinely recurring fight across RC63–RC68 was world
naming: any name baked into the illustrated artwork is stuck in one language,
so five consecutive passes worked through scrubbing baked Italian text,
trying plain floating labels, then a neutral parchment cartouche asset, all
while keeping the actual four-language names as live HTML overlays sourced
from board i18n — never baked into the art itself. None of this stretch
touched board coordinates, logical spaces, rules, economy, AI, RNG or save
format; every RC in this range says so explicitly, and the automated test
suite (128/128 at RC68) enforces it.
