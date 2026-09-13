# Bubble Train — history and provenance

## Identity

Bubble Train is a 2D SDL action/puzzle game credited in the source and help documentation to **Adam Child (Dwarf City)** and **Craig Marshall**. Source headers are dated **2004**. The preserved AmigaOS4 distribution is labelled **1.0final** and OS4Depot dates that release to **27 October 2005**.

## Provenance timeline

- **2004** — source headers identify Bubble Train copyright by Adam Child and Craig Marshall. This is the strongest evidence currently available for project origin, but not an exact first public-release date.
- **21 Oct 2005** — an earlier AmigaOS4 upload is recorded historically on Aminet. The supplied earlier `.lha` is consistent with a pre-final OS4 snapshot but has not been proven byte-identical to that upload.
- **27 Oct 2005** — OS4Depot 1.0final update enables F11 fullscreen and fixes mouse/fullscreen usability.
- **24 Jan 2006** — RISC OS port documentation records screen-mode options and a 16bpp speed-oriented default.
- **2006** — Flavor's GP2X Bubble Train entry wins GBAX 2006; its package is a modified derivative and should not be used as the original parity baseline.
- Later ports/redistributions include Wiz, Dreamcast, Pandora and AROS-era packaging. These are preservation leads, not evidence of continued Dwarf City upstream development.

## Upstream vs OS4

OS4Depot credits `adam@dwarfcity.co.uk` as author and ToAks/Tony Aksnes as OS4 porter. Its readme says the port required work around XML, endian handling and paths. It also states the original source package lacked runtime files found in the Windows binary installer, so the OS4 distribution combined source with recovered runtime data.

Direct comparison of the two supplied OS4 archives finds **five changed files**. Only one C++ source file changes: `src/BubbleTrainWorld.cpp`, where the final archive enables `SDL_WM_ToggleFullScreen(SDL_GetVideoSurface())` on F11. Other changes are the rebuilt binary and runtime state (`bubbletrain.hsc`, `configuration.xml`, `log.txt`). See `os4-diff.csv`.

## Status

The original game is best classified as **complete and long-abandoned/dormant upstream**. Later package dates are ports or redistributions. A pristine upstream archive is still a preservation TODO.
