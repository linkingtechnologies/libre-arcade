# License audit

## Decision

**Code path: usable for a future GPLv3 port, with one quarantined third-party header.**

### Main C++ source

The final OS4 source snapshot contains **94 C/C++ source/header files: 44 `.cpp` and 50 `.h`**.

- **93/94** contain an explicit Bubble Train notice granting redistribution/modification under **GNU GPL version 2 or, at the recipient's option, any later version**.
- Therefore those files are **GPL-2.0-or-later** and may be incorporated into a GPL-3.0-or-later derivative.
- The bundled `gpl.txt` is the GPL version 2 text; the `or later` permission comes from the source-file grant.

### Exception: `src/List.h`

`List.h` does **not** contain the Bubble Train GPL header. It instead identifies itself as `Data Structures For Game Programmers`, `Ron Penton`, `DLinkedList.h`. No redistribution/license grant was found in the file or supplied Bubble Train documentation.

Status: **QUARANTINE CODE — DO NOT COPY INTO THE PORT.**

The functionality is a generic doubly-linked-list container and should be replaced independently (prefer normal JavaScript arrays/collections). Do not translate or line-by-line port this file.

### Dependencies

The Bubble Train README names SDL, SDL_image, SDL_mixer and libxml2. The AmigaOS4 Makefile also links Vorbis/Ogg, JPEG, PNG, zlib, pthread and OS4-specific libraries. Dependency compatibility must be documented for preservation, but the browser port will not reuse these libraries.

## Scope of the project-level GPL grant

A deeper audit of the bundled level/game data found a materially stronger basis for `.lvl` and `.gms` than for audiovisual assets. The upstream root README states **“Bubble Train is released under the GPL license”** without limiting the statement to source code. Original help documentation defines `.gms` game manifests and `.lvl` levels as the editable definitions that make up a Bubble Train game. FSF licensing guidance confirms that a clear README license statement accompanying a work can be legally sufficient even when each file lacks its own header, and that GPL can cover non-software works.

Accordingly, the **61 bundled `.lvl` and 5 bundled `.gms` files are reclassified `GPL-SCOPE — HIGH CONFIDENCE`** for preservation and redistribution, with the evidence and conservative version-handling strategy documented in `level-data-license-memo.md`.

This conclusion does **not** extend automatically to unrelated graphics, music, sound effects, bitmap fonts, or user/third-party contributed levels. Those require ownership/provenance analysis. The audiovisual asset quarantine remains in force.

## Root project license

New original port code, when development begins, is intended to be **GPL-3.0-or-later**. `/reference` is excluded from that relicensing and remains subject to its original notices and the quarantine rules.

## Verdict

**GPLv3 future port: YES for the audited Bubble Train code. The bundled 61 `.lvl` and 5 `.gms` may be preserved and redistributed under the documented upstream GPL scope; `List.h` must be clean-room reimplemented and audiovisual assets remain quarantined.**

Detailed per-source-file results: `source-license-inventory.csv`.
