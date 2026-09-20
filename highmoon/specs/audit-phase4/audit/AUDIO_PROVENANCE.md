# HighMoon 1.2.4 — Audio provenance audit

## Result

All eight WAV files are **third-party or externally-derived candidates**. None should be
copied into a new Libre Arcade production build without a stronger per-file license chain.
The archival `/reference` copy remains untouched.

Seven WAVs map with high/very-high confidence to the historical OpenOffice.org/StarOffice
gallery sound family. `click.wav` maps with very-high confidence to QNetWalk's
`connect.wav` (3056 bytes, LHA CRC `d93d`, dated 2002).

The conservative production policy is therefore simple: **replace all eight sounds**.

## Structural evidence

| HighMoon file | PCM | Frames | Evidence / lineage |
|---|---:|---:|---|
| `applause.wav` | 8-bit 11025 Hz | 45214 | OpenOffice.org gallery `applause.wav` (HIGH) |
| `click.wav` | 16-bit 22050 Hz | 1505 | QNetWalk `connect.wav` (itself documented as from LBreakout2 in modern QNetWalk) (VERY_HIGH) |
| `curve.wav` | 16-bit 22050 Hz | 67308 | OpenOffice.org gallery `curve.wav` (VERY_HIGH); embedded RIFF date `1995-04-28` |
| `explosion.wav` | 8-bit 11025 Hz | 23744 | OpenOffice.org gallery `explos.wav` (HIGH) |
| `kling.wav` | 8-bit 11025 Hz | 23166 | OpenOffice.org gallery `kling.wav` (VERY_HIGH) |
| `laser.wav` | 16-bit 22050 Hz | 4182 | OpenOffice.org gallery `laser.wav` (VERY_HIGH); embedded RIFF date `1995-04-28` |
| `pluck.wav` | 8-bit 11025 Hz | 14233 | OpenOffice.org gallery `pluck.wav` (VERY_HIGH) |
| `strom.wav` | 8-bit 11025 Hz | 42531 | OpenOffice.org gallery `strom.wav` (VERY_HIGH) |

## Historical OpenOffice licensing nuance

OpenOffice.org's own licensing FAQ states that prior versions used LGPL 2.1 and that the
1.x line also used SISSL. The 2 September 2005 license-simplification FAQ says source
code **and binaries** through OpenOffice.org 2 Beta 2 were dual-licensed LGPL/SISSL.

That is meaningful evidence that the gallery sounds were distributed inside a freely
redistributable OpenOffice product. It is **not** the same thing as a per-file authorship
record proving that each sample was originally contributed under those terms. HighMoon
also provides no attribution linking its WAV conversions to OpenOffice.

Therefore this audit intentionally does not promote these WAVs to production-green status.

## `click.wav`

A separate lineage was found:

- HighMoon `snd/click.wav`: 3056 bytes.
- QNetWalk `sounds/connect.wav`: 3056 bytes.
- Both OS4Depot LHA listings report CRC `d93d`.
- The QNetWalk file is dated 24 February 2002.
- Modern QNetWalk documentation says its sounds were taken from LBreakout2.

The byte-level identity indicated by size+archive CRC makes accidental correspondence
implausible. This still does not give a clean ultimate provenance chain, so it is replaced
in the public port as well.

## Clean-room replacement

For the future Web Audio implementation, synthesize or source new effects with explicit
CC0 / compatible licensing and preserve the *semantic roles* only:

- UI click
- charge/curve
- projectile/laser
- impact/explosion
- pickup/bonus
- storm
- applause/win
- miscellaneous feedback

Do not waveform-trace the original samples.
