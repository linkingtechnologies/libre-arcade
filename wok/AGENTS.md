# AGENTS.md

This repository is a preservation project. Keep `reference/` byte-for-byte
historical. Do not rewrite, normalize, reformat, or relicence files under it.

For gameplay changes, compare against `reference/wok-1.0/*.c` first. Preserve
physics constants and fixed-step behavior unless a change is explicitly labeled
as a modern optional mode. New code belongs under `src/` and is GPL-3.0-or-later.

Do not replace original assets silently. Any derived or remastered assets must be
kept separate and documented in `THIRD_PARTY_NOTICES.md` and `specs/`.
