# HighMoon 1.2.4 — Phase 4 asset audit and final port gate

## Final status

**ARCHAEOLOGICAL AUDIT: POSITIVE**

**PUBLIC HTML5 PORT GATE: GO, WITH CLEAN-ROOM ASSETS**

The code/simulation gate was already positive after Phase 3: HighMoon is GPL-2.0-or-later,
the historical gravity and AI are captured by a native oracle, and no direct maintained
successor was identified.

Phase 4 closes the remaining asset question by making the production boundary explicit:
**no original graphics or sound are required by, or permitted in, the new production
build until independently cleared.**

This means unresolved historical asset provenance no longer blocks preservation of the
software behavior.

## What was established

1. The upstream archive contains no per-asset credits or separate media license.
2. All graphics remain provenance-unresolved; planet/moon textures receive the highest
   caution.
3. Seven of eight WAVs have high/very-high-confidence lineage to the historical
   OpenOffice.org gallery sound family.
4. `curve.wav` and `laser.wav` contain an embedded RIFF creation date `1995-04-28`,
   proving those samples predate HighMoon by roughly a decade.
5. `click.wav` is byte-identifiable via size+LHA CRC with QNetWalk `connect.wav`, dated 2002.
6. OpenOffice.org's historical product license was LGPL 2.1 / SISSL in the relevant era,
   but product-level licensing is not treated here as a substitute for per-sample
   provenance.
7. Therefore **all historical media are preserved but quarantined from the public port**.

## Decision matrix

| Component | Archaeological preservation | Reuse in new public build |
|---|---|---|
| C++ source / algorithms | YES | YES, under GPL-2.0-or-later |
| Physics / AI behavior | YES | YES, oracle-controlled |
| Original GIF/PNG | YES in `/reference` | NO; clean-room replacement |
| Original WAV | YES in `/reference` | NO; clean-room replacement |
| Historical logical dimensions | YES | YES as simulation data |
| Original pixels/waveforms | YES in reference | NO |

## Port recommendation

The audit prerequisite is now satisfied. The next engineering phase may begin with:

**HTML5 + vanilla JavaScript + Canvas 2D + Web Audio**

Architecture requirement:

- deterministic simulation module;
- rendering module with no authority over physics state;
- explicit PRNG abstraction reproducing the chosen historical reference sequence;
- logical geometry/config independent from artwork;
- oracle JSONL regression tests before any gameplay tuning;
- new clean-room graphics/audio only.

Do **not** tune trajectories by eye. A JavaScript port is accepted only when the relevant
oracle scenarios match at the agreed numeric tolerance/bit policy.
