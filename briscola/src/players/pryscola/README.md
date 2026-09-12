# Pryscola player

This directory contains a faithful JavaScript port of the CPU embedded in
Pryscola revision `20070908` (Git snapshot HEAD
`6e354cf2b915adf12973b65e374a102113953264`).

Reference source: `reference/pryscola/briscola.py`.
License: GPL-3.0-or-later, matching the upstream source header.

The CPU is intentionally kept simple. When leading it returns hand index 0.
When replying it stably sorts its hand by points, tries the first same-suit card
with a larger point value, otherwise may spend a trump on a point-bearing
opponent card, and finally falls back to index 0.

`PryscolaAdapter` preserves the legacy hand ordering across tricks because the
original AI sorts `Player.hand` in place before a reply and subsequent draws are
appended to that mutated list.
