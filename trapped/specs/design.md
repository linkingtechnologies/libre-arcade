# Design: Trapped

## What the story is (analysis of the original)

36 passages: 32 are story passages, 4 are metadata or code (`StoryTitle`,
`StoryAuthor`, the annotation `Open House`, and the script passage `cyclinglink`,
a 2012 community macro for links that cycle their text).

Variables set in `Start`: `myFloor`, `myRoom`, `killerRoom`, `roomList`, `key1`,
`key2`, `loopz`. Macros used: `set`, `if/else if/else/endif`, `display`, `print`,
`cyclinglink`, and the function `either()`.

### Flow

```
Start -> Look around -> Walk -> Walk towards the light -> left side / right side
right side -> back of the house -> Climb up the barrels -> collapsed section -> storage_room (floor 2)
storage_room <-> hallway <-> first_bedroom, sec_bedroom, sec_bathroom, master_bedroom
hallway -> first floor -> livingRoom <-> kitchen, first_bathroom, garage, table, front door
livingRoom -> second floor -> hallway
```

### Endings (links back to `Start`) and loops

1. **Welded door**: living room, table, newspaper, `Run to the main door`, "RIP".
2. **Toast**: `Run to the kitchen`, "You grab a bite right before your imminent death."
3. **Escape**: take the key from the dolls (`key1`), enter the master bedroom (sets `key2`), `Try the front door`, "I jam the key and turn it.", "Everything goes black."
4. **Death by the killer**: `death` passage; its only link goes to `Walk towards the light` (a loop to the house, not to `Start`).
5. **Hiding**: when the killer is in your room on floor 2 (storage room, a bedroom, garage) the `hide` text is shown and you survive.

### The antagonist

`wheresKiller` is displayed at the top of room passages. It picks `killerRoom` with
`either()` from a list that depends on `myFloor`: floor 1 `living room, bathroom,
garage, kitchen`; floor 2 `hallway, bathroom, master bedroom, first bedroom down the
hall, second bedroom down the hall, storage room`. If `killerRoom` equals the room you
enter, you die (or hide in rooms with a hiding place).

### Original quirks, kept

- `myFloor` is set to 2 only by `storage_room`; climbing the stairs from the living room does not set it, so the killer keeps picking floor-1 rooms until the roof route is used.
- `<<set $key2 to 1>>` runs in the master bedroom as soon as `key1` is true, whether or not you look under the bed.
- Two conditions compare the array `$roomList` to a string and are never true.
- `death` ends in a loop to the house, not to `Start`.

## What this restoration adds

| Original | Restored | Why |
|---|---|---|
| Twine 1.4.2 default page | same file, two injected tags (`theme.css`, `enhance.js`) | readability and accessibility without touching the story |
| small grey sidebar with restart and bookmark | hidden; replaced by the page header | consistent Libre Arcade menu |
| mouse only | keys 1 to 9, Up/Down, Enter; links are focusable (`role="link"`) | accessibility |
| state only in the page | progress saved on the device; language switch keeps the place | resume |
| English only | Italian layer in `translations/it.json`, applied at build time | translation stored separately from the original |
| `confirm()` on restart | the page asks for confirmation | same |

The room names (`"living room"` and so on) are code-level strings compared in many
passages. The Italian build translates them consistently everywhere (they are also what
`<<print $killerRoom>>` shows), so behaviour is identical in both languages.

## Parity

| Historical behaviour | Restored behaviour | Result | Evidence |
|---|---|---|---|
| Story text, links, order, macros | `trapped.en.html` identical apart from two injected tags | same | `story.test.mjs` (file diff) |
| 32 story passages reachable from `Start` | same; every one visited by seeded random walks | same | graph test, exploration test |
| Three endings that return to `Start` | reproduced by scripted paths | same | ending tests |
| Killer kills in the same room, hides on floor-2 rooms, moves each passage | reproduced with `Math.random` pinned | same | antagonist tests |
| `key1`, `key2`, `loopz`, `myFloor` updates | observed in the real engine | same | ending 3, roof route tests |
| English prose | unchanged | same | build diff |
| Italian | new, separate layer; same graph and variables | added | Italian tests |
| Runs in Chrome; the author says Safari problems | not tested in Safari | unknown | n/a |
