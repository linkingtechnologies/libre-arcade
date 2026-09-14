# Reference audit — 2026-09-13

This document records what Grugnetto’s Goose actually learned from the historical implementations examined so far.

## Admission matrix

| Reference | What we use | What we do not use | Status |
|---|---|---|---|
| `goose-game` | compact turn/move/tile flow; bounce/Goose/Bridge parity cases | code, UI, incomplete board as rule authority | licence metadata conflict; behavioural reference only |
| `game-of-the-goose` | responsive board-game UI patterns; classic-rules comparison | goose SVG/player SVG, server architecture, exact visual styling | UI/UX reference only; asset provenance unresolved |
| SnakesLadders | Human/CPU state flow; manual vs automatic dice; data-driven transitions | C++/MFC code and BMP/WAV/ICO assets | quarantine |
| LudoX 2.1/2.2 | chronology of local multiplayer -> AI; compact AWT game-state/UI comparison | Java code and PNG artwork | GPLv2 qualifier unresolved; reference only |
| glParchis 20181125 | multi-player UI/state/statistics concepts | code/assets in Grugnetto’s Goose | GPLv3 confirmed for package; full media provenance not closed |
| Tibetan Sho | MVC/state comparison with another traditional race game | Sho rules and unfinished features | source audit pending |

## UI findings

The strongest visual reference found so far is `rriesebos/game-of-the-goose`:

- the board itself is HTML/CSS rather than a single board bitmap;
- player identity and current turn remain visible outside the board;
- dice form a clear central interaction point;
- the layout scales down responsively;
- special/move-again squares are visually differentiated without filling the board with large artwork.

Grugnetto’s Goose adopted the *principles* (clear state, persistent player panel, central dice, responsive board) but not its 2.5D geometry, palette, SVG goose artwork or source code.

## Rule differences that matter

`game-of-the-goose` includes both a modern and a classic ruleset. Its classic variant confirms the full traditional Goose sequence and major special spaces, but it differs from our selected baseline in several places:

- Inn/Hotel 19: its classic code skips **one** turn; Grugnetto’s Goose currently uses two;
- Maze 42: its classic code returns to **37**; Grugnetto’s Goose uses 39;
- Well/Prison: its classic mode uses replacement/release behaviour, which is conceptually close to Grugnetto’s Goose;
- Death/Graveyard 58: returns to Start in both;
- exact landing on 63 with backwards bounce is shared.

These divergences are evidence that the historical game has multiple rule traditions. They must stay explicit in `rules.md`; a software implementation is not treated as the authority.

## Legal conclusion

The archaeology work has already changed one assumption: historical project-page labels are not enough. LudoX and SnakesLadders demonstrate why direct archive evidence matters; glParchis 20181125 demonstrates the opposite case, where GPLv3 is directly present in the package. Even then, media provenance is audited separately.
