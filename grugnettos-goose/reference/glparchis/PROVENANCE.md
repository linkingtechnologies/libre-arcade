# glParchis 20181125 — direct archive audit

- Original archive examined: `glparchis-20181125.tar.gz`.
- SHA-256: `17a39f659625e8a8f6113053ee2f59b403f781fbbd8c1970b365ba2b319dc730`.
- Version: `20181125` (2018-11-25).
- Author metadata: Turulomio; README also credits Nadejda Adam for French translation.
- Role in Grugnetto’s Goose: multi-player state/UI, piece management and statistics comparison.
- Historical source bundled here: **No**.
- Code copied into `public/src`: **No**.

## Code/package licensing

This snapshot contains `LICENSE.txt` with GNU GPL version 3. `setup.py` declares `GPL-3` and a GPLv3 classifier; `PKG-INFO` likewise declares `GPL-3`. This resolves the earlier GPLv2/GPLv3 ambiguity **for this 20181125 package**.

## Asset gate remains open

The same package contains a large collection of PNG/ICO/SVG images, XCF source artwork and WAV sounds. The archive does not provide a complete per-asset provenance ledger, and several generic UI-style icons/flags require separate provenance checking before we call the entire media set cleared.

For that reason the original tarball is still not placed in the public `/reference` tree. The code/package licence evidence is strong; the **asset audit is the remaining gate**.
