# Archaeology summary

## Identity

5ud0ku is a Java ME Sudoku application by **Ivonne Engemann and Marcus Wagner (Ive&Case)**. The recovered release is **1.8**, dated to 2006 and distributed for CLDC 1.0 / MIDP 1.0 devices. The released standard JAR is 63,862 bytes.

## Recovered originals

The project preservation baseline consists of the recovered source distribution, released JAR and JAD in `reference/`. The source archive contains 28 Java source files, build metadata, licence files, dictionaries and the original PNG graphics.

## Why it is significant

5ud0ku is not a puzzle viewer. The application contains a complete on-device Sudoku generator, two solving paths, uniqueness validation, difficulty selection, pencil marks, hints, undo/redo, RMS persistence, custom-puzzle input and pointer support, all designed for very small Java ME devices.

Its main preservation value is the algorithmic and resource-constrained design rather than its visual presentation.

## Build environment recorded by the source distribution

The recovered `building.txt` documents development/build use of Eclipse 3.1, EclipseME, Antenna 0.9.13, Sun Wireless Toolkit 2.2 and ProGuard 3.4. The external build compiled against MIDP 2.0 / CLDC 1.0 while the released JAD/manifest continued to state MIDP 1.0, with runtime capability detection.

## Runtime certification

The released JAR was exercised through a minimal compatibility runtime and successfully booted/rendered at both 240×320 and 128×128. Pointer input and autosave restoration were also verified on the historical binary. A 128×128 pointer-hitbox overlap was documented as a historical UI limitation and intentionally not reproduced in the normal browser UI.

## Restoration principle

Parity is defined primarily as:

**same puzzle/input → same algorithmic behaviour → same solution/unicity result → compatible difficulty classification**, where reproducible.

The browser UI may correct historical presentation/input defects without replacing the generator or solver algorithms.
