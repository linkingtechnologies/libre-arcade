# Persistence

The restoration preserves the historical grid serialization format and stores its byte stream in browser localStorage as Base64.

## Grid payload

Each of the 81 cells is encoded compactly with the historical shown/answer/original state. The payload also includes elapsed time, game type and compressed pencil-mark data.

A representative M3 fixture serializes to 288 bytes.

The JavaScript implementation has been verified byte-for-byte against a save produced by the Java 1.8 source implementation.

## Browser storage

- `AUTO_SAVE` is maintained automatically during normal play.
- Named saves use the historical 32-character name limit.
- Undo/redo history is not persisted, matching the original behaviour.
- Custom-puzzle editing is excluded from autosave until it becomes a solved/playable game.
- Settings offers a user-visible reset that deletes autosave, named saves and local UI preferences.
