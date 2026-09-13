# Bubble Train `.lvl` / `.gms` GPL scope memorandum

**Status:** HIGH-CONFIDENCE GPL SCOPE FOR BUNDLED FIRST-PARTY LEVEL/GAME DATA  
**Date:** 2026-09-13  
**Purpose:** preservation/restoration audit; not a substitute for jurisdiction-specific legal advice.

## Executive conclusion

The best-supported interpretation of the supplied historical Bubble Train distribution is that the **bundled first-party `.lvl` and `.gms` files fall within the upstream GPL grant**. They should no longer be treated as unidentified-license data merely because they lack per-file license headers.

The decisive basis is **not** that a GPL editor generated them. Output from a GPL program does not automatically become GPL. The basis is the upstream project's own package-level licensing statement, read together with the project's documentation and source notices:

1. The top-level upstream README says: **“Bubble Train is released under the GPL license.”** It does not limit that statement to C++ source code.
2. The original help documentation defines a game as being made up by specifying levels, documents `.gms` as the editable game definition, and documents `.lvl` as the editable level definition handled by Bubble Train's built-in level editor.
3. The C++ source notices identify **Bubble Train / “This program”** and grant GPL version 2 **or, at the recipient's option, any later version**.
4. The package includes the full GPLv2 text (`gpl.txt`), both at the package root and under `src/`.
5. No bundled `.lvl` or `.gms` contains a conflicting copyright, author, or license notice; no evidence of third-party provenance was found for those files.

The Free Software Foundation states that a clear README statement accompanying a program is legally sufficient to establish GPL scope even when each file lacks its own notice. The FSF also expressly explains that the GPL can be applied to non-software works and that “source” means the preferred form for modification. Bubble Train's XML files are precisely the preferred editable form documented by the authors.

## Direct evidence from the supplied upstream-derived package

### Root README

The supplied package contains the following project-level statement:

> Bubble Train is released under the GPL license

The README then separately lists SDL, SDL_image, SDL_mixer and libxml2 as dependencies. This structure supports reading the opening statement as a license declaration for Bubble Train itself, while recognizing separately sourced components.

README SHA-256:

`0d3a1eb7b80c377d59d44167ac23f5cca3452ec3f3a246d7b1ad1f00f3394a6d`

The same README is byte-identical in the preserved OS4-derived package and the independent GBAX 2006 derivative package, which strongly supports upstream provenance rather than an OS4-only addition.

### Original help documentation

The help file states that a game is made by specifying levels that are part of the game; it instructs the user to create/tweak a `.gms` file by hand and describes the built-in level editor as creating new or editing existing levels. It also describes a level as consisting of a cannon and one or more train/track definitions.

This is strong evidence that `.gms` and `.lvl` are not incidental media files: they are the documented editable definitions of Bubble Train games and levels.

Help SHA-256:

`fa2c656580a898ed3b86ac02f529b45c8521230921dfb2f211ae8c1152ec946f`

The help file is also byte-identical in the preserved OS4-derived and GBAX packages.

### Source notices

93 of the 94 audited C/C++ source/header files contain the Bubble Train notice granting redistribution/modification under GPL version 2 or any later version. The standard wording identifies Bubble Train and says **“This program is free software”**, not merely “this file”.

`src/List.h` is a documented exception of third-party origin and remains quarantined; it does not weaken the grant made by Bubble Train's authors over material they own.

### Data inventory

The original distribution contains:

- 61 `.lvl` files;
- 5 `.gms` manifests.

A search of all 66 files found **zero** `copyright`, `license`, `GPL`, or `author` notices. This absence does not itself prove GPL scope, but importantly there is no conflicting per-file notice comparable to the third-party evidence found in audiovisual assets.

Representative hashes:

- `levels/Easy.gms`: `2f17d920d046c298ee2d992b5fc92ec00c25bd294a4afe740225239b3199b4f4`
- `levels/Easy/easy-1.lvl`: `dc3151bdd33d24fb6b33db10cbed00c1b76fd5d737ba7e2228a53c827b8fc1c6`
- `levels/Everything.gms`: `87fa1d290a691c58b345ea3c109a44c7b39f16991cf104712c416e78d1cb2602`

## External licensing principles

### README notices can establish license scope

GNU GPL FAQ, “Is it enough just to put a copy of the GNU GPL in my repository?”:

<https://www.gnu.org/licenses/gpl-faq.html.en#LicenseCopyOnly>

The FSF explains that merely including a license file is ambiguous, but that **a clear statement in the program's README is legally sufficient** when it accompanies the work. Per-file notices are recommended chiefly to prevent a file becoming separated from its licensing context.

This principle maps closely to Bubble Train: there is a clear top-level statement saying Bubble Train is released under GPL, and the level/game definitions are distributed with that README.

### GPL can cover non-software information

GNU Project, “Applying Copyleft To Non-Software Information”:

<https://www.gnu.org/philosophy/nonsoftware-copyleft.html>

The FSF explains that GPL can cover copyrightable works other than software and that “source code” means the preferred form of the work for making modifications. It also notes that where notices cannot sensibly appear in every source file, the directory and accompanying documentation can carry the notice.

The XML `.lvl` and `.gms` files are human-readable, author-editable source forms and are documented that way by Bubble Train itself.

### GPL editor output is *not* automatically GPL

GNU GPL v2 FAQ:

<https://www.gnu.org/licenses/old-licenses/gpl-2.0-faq.en.html#WhatCaseIsOutputGPL>

The FSF explains that output of a GPL program is not normally GPL merely because the program produced it. Accordingly, the fact that Bubble Train's GPL level editor writes `.lvl` files is only evidence of the files' role and preferred editable form; it is **not the licensing grant**.

This distinction also means a third party's newly authored Bubble Train level would not automatically become GPL merely by being saved by the editor. The present conclusion concerns the **bundled original level/game data distributed by the Bubble Train authors under the project-level GPL notice**.

### Data-file format is separately reusable under EU software-copyright law

CJEU, *SAS Institute Inc. v World Programming Ltd*, C-406/10, judgment of 2 May 2012:

<https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62010CA0406>

The Court held that the functionality, programming language, and **format of data files** used by a program to exploit its functions are not themselves forms of expression protected by software copyright under the Software Directive.

Thus, independently of the GPL-scope conclusion, Bubble Train's XML schema, tags and parser-compatible file format may be reimplemented. This does **not** automatically make the creative content of a particular level free to copy; the GPL grant is the stronger basis for using the original 61 layouts.

## Counterarguments and why they do not defeat the level-data case

### “The archive contains third-party material, so the README cannot cover everything”

Correct as a general warning. A licensor cannot grant rights it does not own. Bubble Train's package demonstrably contains third-party audiovisual material, and those assets remain quarantined.

However, this does not make the project-level GPL statement meaningless. The proper analysis is ownership-aware: the statement can license first-party Bubble Train material while separately sourced material retains its own rights. Unlike the WAV/font/graphics evidence, no third-party provenance or conflicting notice has been found for the 61 `.lvl` and 5 `.gms` files.

### “The `.lvl` and `.gms` files have no GPL headers”

True, but not dispositive. FSF guidance expressly states that a clear README notice accompanying the work is legally sufficient. Per-file notices are safer, not mandatory to create a license grant.

### “The editor is GPL, therefore its output is GPL”

False, and this memorandum does not rely on that proposition. The editor relationship is evidence that `.lvl` is the project's preferred modifiable source format; the license grant comes from the project-level README/source notice.

### “User-created levels mentioned in the manual could have different rights”

Correct. The manual invites users to submit themes, levels or games. Such independently authored contributions would need their own provenance/license analysis. The current clearance applies only to the **61 `.lvl` and 5 `.gms` files bundled in the audited historical distribution**, absent evidence that any of them came from third parties.

## License version: remaining ambiguity

There is a small difference between **scope** and **version**:

- Scope: the evidence that bundled first-party `.lvl`/`.gms` are included in the Bubble Train GPL grant is **high confidence**.
- Version: the README says only “GPL license” and ships the GPLv2 text, while the canonical Bubble Train source notices say GPL **version 2 or any later version**.

The natural project-level reading is **GPL-2.0-or-later**, because the source notice refers to “Bubble Train / This program” rather than narrowly to a particular source file. Nevertheless, the data files themselves contain no explicit “or later” text.

### Conservative distribution strategy

Do **not** rewrite the historical XML files or insert a newly invented per-file license header.

Instead:

1. preserve the 61 `.lvl` and 5 `.gms` byte-for-byte;
2. distribute them in a clearly separate historical-data directory;
3. accompany them with the original README and GPLv2 text;
4. add a modern `LEVEL_DATA_LICENSE_EVIDENCE.md` pointing to the upstream project-level grant and source notices;
5. describe their upstream license as **“GNU GPL; project notices indicate GPL-2.0-or-later; original files preserved verbatim”** rather than pretending the XML itself contained an SPDX tag;
6. keep the new JavaScript engine under GPL-3.0-or-later.

Even under the more conservative hypothetical interpretation that the XML data were GPLv2-only, the engine and XML are independently stored works connected through a documented data-file interface. They should be distributed as separate components rather than by asserting a relicensing of the XML to GPLv3. This minimizes version-compatibility risk while retaining the exact historical campaign data.

## Risk rating

| Item | Conclusion | Confidence |
|---|---|---:|
| XML `.lvl/.gms` format/schema can be reimplemented | Yes | Very high |
| Bundled 61 `.lvl` are within upstream GPL grant | Yes | High |
| Bundled 5 `.gms` are within upstream GPL grant | Yes | High |
| Per-file GPL header required | No | High |
| GPL editor automatically GPLs user output | No | Very high |
| Bundled `.lvl/.gms` are specifically GPL-2.0-or-later | Strongly indicated, not textually explicit in each XML file | Medium-high |
| Third-party/user-submitted levels would inherit this conclusion | No | High |
| PNG/WAV/font assets become cleared by this reasoning | No | Very high |

## Audit decision

Reclassify the **bundled original 61 `.lvl` + 5 `.gms`** from `QUARANTINE` to:

**GPL-SCOPE — HIGH CONFIDENCE / PRESERVATION AND REDISTRIBUTION ACCEPTABLE WITH LICENSE-EVIDENCE NOTICE**

Keep all audiovisual assets and any unproven third-party data under their existing quarantine status.
