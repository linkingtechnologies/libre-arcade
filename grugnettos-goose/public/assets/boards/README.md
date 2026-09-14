# Board artwork

`original/` contains the two checksum-verified historical board images
actually loaded by the browser at runtime — see `original/README.md`. They
can be re-acquired independently with `tools/fetch-original-boards.sh` (or
the `.ps1`/`.cmd`/`.mjs` equivalents) for reproducibility.

Earlier iterations of this project (through v0.11) kept a separate
`local/` folder of adapted/working renderings alongside a placeholder
`ganzenbordspel-inspired.svg`, so a reconstruction in progress would never
be confused with the verified archival source. As of v1.0.0 the verified
historical originals are loaded directly and neither `local/` nor the
placeholder SVG exist anymore; `test/release-contract.test.js` asserts
their absence.
