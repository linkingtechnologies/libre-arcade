# docs/development/

The notes of the restoration package this game started from, and the list of what was changed in its JavaScript.

- `package/` holds the package's own documents, **unmodified**: its readme, changelog and licence note (renamed `PACKAGE_*`), its reference-provenance note, its file manifest, the milestone notes `M2` to `M15`, and `archaeology/` (the audit of the source, the rules, the computer's levels, the asset audit, the executable-identity note and a script that checks facts in the Java source). They use the package's own milestone labels and old paths (`reference/...`, `src/...`), and some say things the comparison with the original has since shown to be untrue (for instance that the browser is "source-parity certified"; `specs/port-map.md` says what was found). They are kept as history, not as a description of this folder.
- `CHANGES.md` lists the files of the package's JavaScript that were changed here, with their hashes before and after.

The facts of this integration are in `../../PROVENANCE.md`, `../../specs/port-map.md` and `../../CHANGELOG.md`.
