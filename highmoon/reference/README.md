# Reference: preserved source and native oracle

This folder is the self-contained oracle bundle delivered with the game. Its internal layout is unchanged, which is why the path `reference/reference/HighMoon/` looks doubled: the outer `reference/` is this collection's convention, the inner one belongs to the bundle.

- `reference/HighMoon/`: HighMoon 1.2.4 C++ source, license and release documents, **byte-identical** to the received archive (24 files, checked by `../tests/reference-integrity.mjs` against `ORIGINAL_FILE_MANIFEST.json`). The original graphics, sounds and icon are not here, and the original TAR is not either.
- `instrumented/HighMoon/`: a copy with opt-in `__ORACLE_TRACE__` tracing. `instrumentation.patch` is the complete diff from the preserved tree. `patch_instrumentation.py` is the script that generated the instrumentation; it has its author's working path (`/mnt/data/...`) hard-coded, so it needs adjusting before it can be rerun.
- `oracle/`: the native headless runner, the independent physics mirror, comparison and validation tools, build documentation and the compressed JSONL traces (lossless: `gzip -dc` restores them). `oracle/TRACE_FORMAT.md` describes the format.
- `ORIGINAL_FILE_MANIFEST.json`: every file of the original archive with its SHA-256, size and public or withheld classification.

Rebuilding the native oracle needs the withheld original tree restored locally (the renderer stub reads GIF dimensions) and a C++ toolchain. See `../REFERENCE_POLICY.md` and `oracle/tools/`. Do it in a disposable copy and never overwrite the checked-in traces.
