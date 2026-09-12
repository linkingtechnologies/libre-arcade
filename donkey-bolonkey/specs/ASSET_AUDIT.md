# Asset audit

The historical Allegro datafile `reference/dkbk/dkbk.dat` is retained for research but excluded from Git by default.

The original documentation identifies media with uncertain or non-free provenance, including three backgrounds from an unspecified CD, a motor sound sourced from *Colin McRae Rally* for PlayStation, at least one sound of unknown origin, additional sounds involving family contributors without a separately documented redistribution grant, and raster fonts whose source typeface has not yet been established.

## Runtime rule

No object from `dkbk.dat` may be copied into `/assets` or used by the web runtime until that object's provenance and redistribution terms are individually cleared.

Milestone 4 uses procedural replacement art for backgrounds, donkeys, gates, crusher machinery and particles. Audio is synthesized at runtime with Web Audio; no historical sample or derived recording is bundled.


## Public repository boundary

The repo-safe package also omits the historical `oldcapt1.pcx` and `oldcapt2.pcx` screenshots. They are useful archaeological evidence but are not required by the runtime or parity tests, so the public package takes the conservative approach of not redistributing historical binary imagery whose complete asset provenance is not independently documented.
