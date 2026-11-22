# Heal'em All: license audit (M1)

Per-file detail, hashes and evidence: [`ASSET-INVENTORY.csv`](ASSET-INVENTORY.csv). This file is the reasoning.
Rule applied throughout: **missing information is not permission.** Nothing marked unresolved may be distributed.

## Verdict at a glance

| Material | Declared / found | Status |
|---|---|---|
| Game code (CoffeeScript, `game.js`, HTML, SCSS, data, levels) | GPL-3.0, (c) 2013 Krzysztof Urbas and Paweł Madeja | **Cleared** (declared by the repository owner) |
| Graphics in `app/images/` | CC BY 4.0, artist Paweł Madeja | **Conditionally redistributable**: author-side confirmation recommended (see below) |
| Quintus engine (+ Underscore, Resig inheritance) | MIT or GPLv2 (file header) | **Redistributable**, MIT text must be shipped |
| stats.js | MIT upstream (not stated in the minified file) | Redistributable once the MIT text is confirmed |
| Fonts (Boogaloo, Jolly Lodger, Ubuntu) | Loaded remotely from Google; not in the repo | **Not packaged**; licenses to verify before localising |
| **Audio, 7 sounds x (mp3, ogg)** | "Downloaded from OpenGameArt", nothing else | **UNRESOLVED: quarantined, not distributable** |
| `favicon.ico` | Nothing stated; outside `app/images/` | Unresolved, not essential |
| Google Analytics snippet | Remote tracker of the original site | Remove |

## Code: GPL-3.0

Evidence: `README.md` "Licensing > Code" and a full GPLv3 `LICENSE`, both introduced by commit `66950cd` (2019-07-24).
The commit was *authored* by GitHub user `kmcnaught` (PR #1, empty description) and *committed by Krzysztof Urbas*, who owns the repository
(`evidence/github-pr1.json`: state closed, merged by `krzysu`). GitHub's API reports `gpl-3.0` for the repository (`evidence/github-repo.json`).
Krzysztof Urbas wrote 103 of the 119 commits. **"Or later" was not assumed:** the README says "GPLv3", no file header says otherwise, so the
code is GPL-3.0 (not GPL-2.0-only, not GPL-3.0-or-later). Libre Arcade's root license is GPLv3, so it is compatible.
No per-file license headers exist; credits must be carried in a notice file.

Historical change worth recording: until 2019 the README said the opposite ("It is forbidden to use this game for profit. All rights reserved for graphic design.").
The 2019 statement supersedes it, but any copy of the repo from 2013-2019 carries the older, stricter text.

## Graphics: CC BY 4.0 (declared), with one gap

* README (2019): all files in `app/images/` are CC BY 4.0, artist Paweł Madeja. The images look like wholly original artwork (doctor, zombie, human, tiles, HUD icons, graveyard background); I found no third-party characters or logos. [viewed: `characters.png`, `promo.png`, gameplay screenshots]
* Gap: the relicensing commit was made by Urbas, and Madeja (who holds the graphics copyright, and had the 2013 "all rights reserved" statement) left no trace in the PR. The README is signed with both names. **Recommendation:** ask Madeja (or Urbas, who can reach him) for a one-line confirmation before M5. Until then treat as *conditionally redistributable*.
* Obligation: credit "Paweł Madeja", link the license, say whether changes were made (e.g. if sprites are re-encoded).
* `promo.png` / `promo2.png` are README banners and are not used by the game: keep them out of the package.
* `bg-blured.jpg` is covered by the `app/images/` statement but is never requested at runtime in the baseline.

## Third-party code

* **Quintus** `quintus-all.js`: header "freely distributed under the MIT license or GPLv2 License" (c) 2012 Pascal Rettig, Cykod LLC. README says MIT. It embeds Underscore.js (c) Jeremy Ashkenas, DocumentCloud (MIT) and John Resig's "Simple JavaScript Inheritance" (MIT). The repo ships **no** license text for them, so M2/M4 must add the MIT texts. Unverified: whether the file is byte-identical to an official Quintus release.
* **stats.js** (mrdoob): MIT upstream. The minified file carries only a URL.
* **Grunt and plugins**: development-only, never shipped.

## Audio: the blocker

Seven sounds, each as mp3 and ogg (14 files). Sources of truth in the repo: README ("Audio downloaded from OpenGameArt") and `app/audio/missing_audio.txt` (a to-do list, not a credit list).
No author, page URL or license is recorded for any of them. Git history shows files were added 2013-11-23 and *edited* 2013-11-28
("lower music file", "shorter audio files"), so they are derivatives and a license may require indicating changes.

| File | What the embedded tags / history say | Leads found (unconfirmed) |
|---|---|---|
| `collected` | TITLE and ARTIST = "elevator ding" | An OpenGameArt "Elevator ding" CC0 entry exists; nothing ties it to this file |
| `gun_shot` | `DATE=2011` only | none |
| `human_created` | ARTIST = "SoundBible.com" (a website, not an author) | SoundBible licenses vary per sound (CC BY 3.0 or public domain); **conflicts with "OpenGameArt"** in the README |
| `player_bg` | no tags; music; volume-edited | none |
| `player_hit` | TITLE "Gut Punch 1", ARTIST "CGEffects" | an author "CGEffex" has a CC BY 3.0 pack on OpenGameArt; not confirmed to be the same |
| `zombie_mode` | empty tags; music; shortened | none |
| `zombie_notice` | no tags | none |

Consequences:
1. The README's blanket statement is not evidence of a license; at least one file points to a different origin (SoundBible).
2. CC BY 3.0 (the likely case for some) would be *compatible in practice* but requires exact attribution we cannot yet write.
3. No file may be called CC BY 4.0 or GPL just because it sits in the repo.

**Quarantine decision.** The files remain in `reference/` only as historical evidence. They must not be copied into any production package.
The build for verification must run muted. A muted original **cannot** start unchanged (see `COMPATIBILITY-ISSUES.md` C5): it hangs at 44 % loading.
Next steps to unblock: reverse-image-style search by audio is impractical, so (a) ask Krzysztof Urbas which pages the sounds came from, (b) check OpenGameArt/SoundBible/Freesound for the titles above, (c) failing that, replace the sounds in a later, explicitly approved milestone. No replacement was generated in M1.

## Trademarks and third-party characters

None identified. Characters (old scientist, zombie, human boy) look original. The healing gun resembles a generic foam-dart toy blaster, with no visible brand. The name "Heal'em All" is the original title; keep it only as attribution-style naming of the historical project. [viewed, not legally searched]

## Required notices for a future package (not created in M1)

`LICENSE` (GPLv3, verbatim), `CREDITS.md` (Urbas: code/story; Madeja: graphics, CC BY 4.0 link; Quintus MIT; Underscore MIT; Resig MIT; stats.js MIT; fonts when localised; audio only once resolved), a link to the upstream repository and to the pinned commit.

## Public-source search (2026-11-22, no author contacted, no files downloaded)

* `collected` ("elevator ding"): SoundBible has "Elevator Ding" (https://soundbible.com/1441-Elevator-Ding.html), credit **Corsica**, license **Sampling Plus 1.0**. Freesound has a CC0 "Elevator Ding.wav" by lmbubec. **File identity not verified** (no waveform comparison done). Even if it is the SoundBible one, Sampling Plus 1.0 is restrictive for redistributing a work as-is, so it does not clear the file. Status stays **unresolved**.
* `player_hit` ("Gut Punch 1", CGEffects): no "Gut Punch" found on SoundBible's punch tag page nor on page 1 of CGEffex's Freesound listing (pages 2-34 not read). CGEffex's SoundBible entries ("Sharp Punch", "Many Punches", "Batman Punch") are Sampling Plus 1.0; his OpenGameArt pack is CC BY 3.0. **Not identified.**
* `human_created` (tag SoundBible.com), `gun_shot`, `player_bg`, `zombie_mode`, `zombie_notice`: no usable lead.
* Conclusion: public sources do not resolve any of the 7 sounds. All stay quarantined.

## Decision: the original audio is replaced (2026-11-22)

The user chose not to contact anyone, public sources did not resolve the sounds, and so all 14 original audio files stay quarantined **permanently** (historical evidence only) and are replaced by `replacement-audio/` (4 Kenney CC0 sounds + 3 synthesised GPL-3.0 sounds). See `replacement-audio/README.md` for provenance and `licenses/` for the CC0 texts.
This resolves the audio blocker for distribution **once the replacements are in `public/`**. Graphics: the user may rely on the owner's 2019 CC BY 4.0 declaration without Madeja's confirmation; that residual risk is accepted by the curator and must be stated in `PROVENANCE.md`.
