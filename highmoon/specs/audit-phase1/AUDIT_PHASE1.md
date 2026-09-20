# HighMoon software archaeology — phase 1 baseline

## Status
No HTML5 port started.

### Established
- Original author/upstream: Patrick Gerdsmeier, official site highmoon.gerdsmeier.net.
- Public release line existed by January 2005; FreeBSD imported 1.0.2 on 2005-01-20.
- 1.2 (2005-02-19): shield upgrades + Heavy, Cluster and Exploding shots; language changes.
- 1.2.1 (2005-03-11): Blackholes renamed/reworked as Storms that reject shots; gameplay constants changed.
- 1.2.2 (2005-03-19): language segfault fix.
- 1.2.3 (2005-07-27): Italian language.
- 1.2.4 (2006-03-25): Dutch language; latest upstream release found.
- Official download page last changed 2007-08-06 and exposes 1.2.4 Linux and Windows archives.
- Later FreeBSD/OpenMandriva/ALT/Amiga/AROS/Dreamcast activity is packaging or porting, not upstream development.
- No direct HighMoon 2 / HD / Redux / maintained revival was found in targeted searches as of 2026-09-17.
- Architecture evidence: C++, g++, SDL 1.2, SDL_image; modules main, vector_2, language, sound, graphics, object, galaxy, shoot.
- Historical source has disabled __TRAINERMODE__ described as "Show Shootpath, toggle Weapon", potentially ideal oracle hook.

### Not yet closed
- Exact GPL grant in source headers (GPL-2.0-only vs GPL-2.0-or-later).
- Per-asset provenance and license.
- Exact 1.2.4 gravity equations/constants, timestep and numerical integration order.
- Exact CPU targeting/trajectory-solving algorithm.
- Exact hard-coded/data-driven scenario list and count.
- TODO/FIXME/dead-code audit.

These items require direct inspection of the byte-exact 1.2.4 source archive. The authoritative tarball is identified in reference/manifest.jsonl with expected SHA-256.
