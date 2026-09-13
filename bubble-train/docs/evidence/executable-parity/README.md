# Executable-parity evidence

This directory contains reproducible static-analysis evidence obtained from the historical binaries supplied during the Bubble Train archaeology audit.

## Binary hashes

See `binary-identification.txt`.

- OS4 final gameplay binary: SHA-256 `132fb1b82208554d289c2ec07b36c1c9da9d5d6c21b691c618d2216cefd97890`
- GP2X/GBAX gameplay binary: SHA-256 `7806cfecf6983414cdbff6375c77762bb3717a17f55214760308e88ca1537eab`

The binaries themselves remain inside the preserved historical packages under `reference/`; this evidence directory does not create a second modified copy.

## Disassembly evidence

The GP2X binary retains C++ symbols/debug information. Selected functions were disassembled with LLVM objdump and frozen under `disassembly/`:

- `gp2x-main.txt` — time-based RNG initialization
- `gp2x-bubble-animate.txt` — Rainbow/Speed behavior
- `gp2x-bullet-animate.txt` — linear bullet movement/no reflection
- `gp2x-cannon-rotate.txt` — rotation step, limits and cannon length
- `gp2x-level-can-fire.txt` — active bullet `<=10` quirk
- `gp2x-level-animate.txt` — source-order frame sequencing
- `gp2x-spiral-radius.txt` — exponential spiral coefficient
- `gp2x-colour-bomb.txt` — whole-train target-colour removal
- `gp2x-bomb.txt` — bomb radius
- `gp2x-match-scan.txt` — match 3+ / speed-special scan
- `gp2x-ripple.txt` — overlap-only ripple propagation
- `gp2x-touching.txt` — diameter+1 touch threshold
- `gp2x-train-station-animate.txt` — animate-before-spawn/return ordering

## OS4 corroboration

`os4-literal-scan.txt` records direct scans of the final PowerPC executable for major big-endian gameplay constants. The OS4 binary lacks useful function symbols, so literal presence is treated as corroboration rather than standalone function attribution.

## Data-port comparison

- `gp2x-level-scaling.csv` records OS4-to-GP2X coordinate/speed scaling.
- `gp2x-vs-os4-level-hashes.csv` records byte-level file comparisons across the two historical packages.

The full interpretation is in `../../executable-parity-report.md`.
