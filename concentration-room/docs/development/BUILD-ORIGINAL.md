# Original build status

The 0.02 Makefile targets the NES with `ca65`/`ld65` (cc65 family), GNU make, and historical Python/PIL helper scripts.

The current audit environment does not contain `ca65` or `ld65`, so no claim of a clean local rebuild is made here. In addition, at least `tools/pilbmp2nes.py` uses Python-2-era iterator APIs (`pixels.next()`), so an untouched build should use a period-compatible Python/PIL environment or a controlled compatibility patch kept outside `/reference`.

A rebuild is **not required to establish the gameplay oracle**, because the official archive already includes the 24,592-byte `croom.nes` release ROM and complete source. Behavioral and visual parity in this restoration is grounded in the preserved source, release ROM, deterministic tests and source-derived renderers.
