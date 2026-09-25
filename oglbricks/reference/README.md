# Original OGLBricks reference material

This directory documents the exact historical material used to study and port OGLBricks while keeping the public Libre Arcade repository safe to redistribute.

## What is included here

- `SOURCES.md` — upstream locations, archive names, versions and acquisition notes.
- `MANIFEST.sha256` — SHA-256 fingerprints of the four historical archives used during the audit.
- `OGLBricks-MIT-LICENSE.txt` — original MIT license text recovered from the OGLBricks sources.

## What is intentionally not included in this public commit

The following unmodified historical archives were acquired and audited, but are **not bundled in the public commit ZIP**:

- `oglbricks_src_0-1.7z`
- `oglbricks_src_0-1-1.7z`
- `oglbricks_src_0-2.7z`
- `oglbricks_0-2.7z`

The Windows distribution also contains third-party runtime DLLs and historical assets. Keeping only provenance, hashes and the original license in this public package avoids treating those third-party files as if they were part of the GPLv3 Libre Arcade release.

Anyone doing archaeological verification can obtain the upstream material listed in `SOURCES.md` and compare it against `MANIFEST.sha256`.

## Evidence used during the audit

A real OGLBricks 0.2 Windows session was also used to verify save/load, configurable field size, configurable piece categories and line clearing. The resulting test save and screenshots belong to the archaeological working dossier and are intentionally excluded from this public commit.

See `../specs/AUDIT.md` for the preservation notes and the distinction between source-derived behavior and behavior observed on the historical Windows executable.
