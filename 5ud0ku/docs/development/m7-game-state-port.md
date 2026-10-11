# 5ud0ku M7 — Game state, history and persistence port

## Scope
M7 ports the non-visual gameplay state surrounding the M6 generator/solver core. No final UI is included.

Ported from the 5ud0ku 1.8 source:

- `MoveStack` semantics (including the historical 100-slot / 99-undo sentinel behavior);
- pen and pencil input state;
- `Display Digit` hint and its undo/redo behavior;
- Beginner Mode candidate recalculation;
- local conflict detection;
- Grid binary serialization/deserialization;
- RMS-style named save/load abstraction;
- `AUTO_SAVE` semantics;
- startup restore before new-game creation;
- pause/destroy autosave;
- custom-puzzle edit exclusion from autosave;
- quick save;
- load/new-grid reset of move history and pencil input mode.

## New modules

- `src/core/move-stack.js`
- `src/core/grid-codec.js`
- `src/core/grid-store.js`
- `src/core/game-session.js`
- `src/core/app-lifecycle.js`

`Grid` also gains the original local `getConflictPositions()` behavior.

## Historical save compatibility

The Java 1.8 serialization format was reproduced exactly:

1. 81 one-byte cell states (`original*100 + shown*10 + answer`);
2. 8-byte signed big-endian elapsed time;
3. Java `DataOutputStream.writeUTF` compatible type string;
4. pencil-mark lists, introduced by bytes 100..108 and terminated by byte 110.

The M3 Java fixture (`normal`, elapsed `1234567`, calculated pencil marks plus extra mark 9 at r1c3) is stored as:

`tests/fixtures/m3-java-save-normal.hex`

The M7 JavaScript serializer produces the **exact same bytes**. Loading that Java fixture and re-saving it in JavaScript is also byte-identical.

Representative fixture size: **288 bytes**.

## Test results

- M2 generator/solver oracle: **13/13 PASS**
- Generator uniqueness regression: **300/300 unique**
- M3 gameplay-state parity port: **41/41 PASS**
  - includes the original 36 M3 behavioral checks plus 5 session-level checks
- M7 lifecycle/autosave checks: **8/8 PASS**
- Historical Java save compatibility: **2/2 PASS**

## Deliberately preserved behavior

- `MoveStack` has an array of 100 entries but exposes only 99 undoable moves because `startPos == endPos` is also the empty/full sentinel.
- `stepBack()` can apply the oldest remaining undo and return `null`; the historical UI worked around this by reading `getNextUndoPosition()` first. `GameSession.undo()` preserves the state effect while returning the pre-read position for sane controller use.
- New moves after an undo invalidate the redo branch.
- Hint (`Display Digit`) is a normal undoable pen move.
- The undo stack is not serialized and is reset after load.
- Pencil marks are persisted; history is not.
- Custom puzzle edit mode is excluded from autosave.

## Browser persistence

`GridStore` is backend-agnostic. M7 provides:

- `MemoryStorageBackend` for tests;
- `LocalStorageBackend` for the future browser UI.

The value stored in localStorage is only a transport encoding (Base64) of the original binary save blob; the binary payload itself is the historical 5ud0ku format.

## Remaining before UI integration

M7 intentionally does not yet add:

- Web Workers for generator/custom brute-force solving;
- final timer controller tied to browser visibility;
- menu/renderer/input UI;
- IT/EN localization layer;
- responsive layout.

The recommended next milestone is M8: move generation and custom-puzzle solving behind Web Workers, with cancellation/progress messages and parity tests unchanged.
