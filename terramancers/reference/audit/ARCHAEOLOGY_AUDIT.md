# Archaeology audit

## Identification

- Title: **Terramancers**
- Author / programmer: **Shai Shapira**
- Event: **Liberated Pixel Cup 2012**
- Historical SourceForge project: **Vakho Arena** (`vakhoarena`)
- Game description in original README: “A real-time action-reversi game, straight from the Liberated Pixel Cup.”
- Original implementation: Java 6-era AWT/Swing.

## Preserved primary artifact

`reference/originals/Terramancers-LPC-2012.zip`

SHA-256:

`100a77340a9004a271ccd8a00e2387a368ade52e7a96882da0feaa01147f081a`

Archive inventory:

- 196 regular files
- 45 `.java` source files
- 62 PNG files
- `Terramancers.jar`
- original README / AUTHORS / COPYING / license texts
- historical `.svn` working-copy metadata
- Java source plus substantial leftovers from the pre-Terramancers Vakho Arena project

The archive has been copied without modification and also extracted under `reference/extracted/` for inspection.

## JAR

Historical `Terramancers.jar` SHA-256:

`1527dcfcd22088d23ced043580bd7c30bf0425aa93d8ae32dfa479795f22b8fb`

Manifest main class: `shai.lpc.Main`.

The JAR includes both the Terramancers classes and stale classes from the predecessor project. Resources are external rather than bundled into the JAR.

## Source-control integrity

The archive is a historical SVN working copy. All 45 inspected Java working files are byte-identical to their corresponding `.svn/text-base/*.svn-base` copies: no local source modifications were found in the submitted working tree.

The working-copy metadata is mixed-revision. Terramancers Java files are at r14 because r15/r16 changed project/readme metadata rather than Java source. The repository history establishes r16 as the final source-tree baseline.

## Timeline

- r9 — 2012-07-22: final commit for the original project; commit message says the project will change course.
- r10 — 2012-07-25: first Terramancers commit, a new game built on the remains of the previous project.
- r11 — 2012-07-27: Reversi algorithm and first single-player tree entities.
- r12 — 2012-07-29: improved capture algorithm, level generator and graphics.
- r13 — 2012-07-30: multiplayer, polished single-player, menu graphics infrastructure.
- r14 — 2012-07-31: “Project completion”; menus, difficulty levels, final polish, license notice on source files.
- r15 — 2012-07-31: README correction and Eclipse project files.
- r16 — 2012-07-31: one more README change.

The SourceForge project page later shows a 2013 “last update”, but that is not evidence of a later source revision; the SVN code history ends in 2012.

## Abandonment status

No formal “abandoned” declaration has been found. For preservation classification, Terramancers is **dormant / abandoned de facto**: no continuing upstream source development was found after the 2012 LPC line, and no active successor port was identified during the audit.

## Historical sources

- https://sourceforge.net/projects/vakhoarena/
- https://sourceforge.net/p/vakhoarena/code/
- https://opengameart.org/content/terramancers
- https://shaishapira.com/terramancers/
