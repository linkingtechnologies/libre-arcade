# What was changed in the package's page and modules

The page and its modules in `public/` started as `index.html`, `src/`, `web/` and `data/` of the package
`zooming-secretary-1.0.0-rc9-m32-source.zip`, copied byte for byte (SHA-256 below), and changed only where the comparison with the ROM,
the original's own features that the package had not ported, or the way the page is put together in this collection called for it. The
reason for each change in the game's rules is in `specs/port-map.md` ("What the oracle found in the package's port"); this is the list of
files. `public/data/` and the other files of `src/` and `web/` are the package's, unchanged.

| File | Package's SHA-256 | Now | Lines (added, removed) |
|---|---|---|---|
| `src/player.js` | `a83dc581c96647f355734836f0a750b449cfa3c23d5f3b37aab1afeb2cd60ce9` | `be4104a7a3e5e7a1872274079c4598e35f98ad663780fc67ffa974c1f4bc55bc` | +28 -19 |
| `src/npc.js` | `be3be1bdea5881ce8565cb797a2b3370ed933a140d771341a5c025689ffa823b` | `1ed4fdec7e10146a34938bf0899a65b67bc3ea77ec1df1f822ee1a9e2c4bc1b7` | +6 -2 |
| `src/npc-full.js` | `d32107b5952982aa3c9d639c52b775d4bef418d3a9b0f8b1834c053a77463123` | `b6a5c66f9ae4c489b71494dda69262f16f8eeb8aa3f8ef681c007f51d3371e62` | +10 -5 |
| `src/simulation.js` | `ae1e1fb10d34e5fdd2003ae7b41a4e13233f094cfff7548de59a9b4c4be17168` | `ccacbd77525fcc82fae14f3aea052d403ebd3d1bc5bc756c1248502a010bf394` | +34 -9 |
| `src/input.js` | `64c8ed4fa8860807fcaddb5b52434a68c73fb540f3128c90ceb3b1568d951d43` | `e670f6413144f5cc97983cbb19faae7ebfe32291f8afdfb062238272589a0829` | +17 -0 |
| `src/index.js` | `b128577027e62dc965442640a0e6d82450b3115d4645862eadad54004d9f0247` | `3d9cb3521cef70f1a4cbf42e52d52d7343fe5ef8a039761b6e67b91b2de2406f` | +1 -0 |
| `src/hearts.js` | (new) | `484a953cc43016dca10c85b920df851eebdaebfa9082d6135f19ed5bf7b1ee77` | |
| `src/frontend.js` | (new) | `4b19e243b9b7076ae40abfdd59ab7f1aa27f5f90a875354be1be7281acdf3b63` | |
| `web/app.js` | `99ecaad4b03fb526ed3e126ac779189ec738462315c4ab6789d7928715228fc7` | `415fb38b6c91199265f95c7c7fa56be45c7810331c41c4715259b1ae8d425588` | +167 -38 |
| `web/style.css` | `8ebcc43b204ff3e9413d97813b4e08e416abe138ce40f30b8f4c46609604a8f5` | `b9d3cbeed93ab7370a638bdbfa026a57ffd4ad7f8bb6c8f1e0528fd6612a4733` | +32 -2 |
| `web/sounds.js` | (new) | `4eef23e6d664dc7f161f598f55aa43bbb5e474dc484347ce45dc6313c1a2ed97` | |
| `index.html` | `52bf231f7af0aeb3acd6d8288fe46ef1d0f27382b660ddedc38542b49d1a12f9` | `263b0f78d10958df9bed743b532f5816e2e6cf3479e4eac322a278f14c1b192b` | +2 -0 |

By file:

- `player.js` (`tickPlayerMotion`): a climbing step no longer ends the iteration: when the 16-pixel segment has just run out the player
  looks for the next one in the same iteration, as the source does; `player.ladder` is left alone unless a direction is pressed
  without a ladder to take, and a player who is still flagged as on a ladder cannot walk sideways; `player.dir` keeps its last value
  when nothing is pressed (the Geek reads it).
- `npc.js` (`manBoxContact`, `dibrovContact`): the character's x is taken as an unsigned byte in the contact test, as the source's
  `px=npc_x` does, so that at x from -8 to -1 it is 248 to 255.
- `npc-full.js` (`tickNpc`): the Chief's test of how near he is wraps below x = 32 (cc65 compares the difference as an unsigned 16-bit
  number), so he does not slow the player from there; a heart is added through `Hearts` (see below) by the Geek and by Dibrov,
  where the port used to take two numbers from the generator each time.
- `hearts.js` (new), `index.js`: the eight heart slots, whose occupancy decides whether `hearts_add()` takes two numbers
  from the generator.
- `simulation.js`: the decorative heart of non-bonus wisdom is added through `Hearts` and half of the hearts move each iteration (the
  snapshot has them); and the program's pause, which is START: `tick` begins with the top of the program's loop (the pause counting
  down from 50, waiting at 25 for a new START with a read of the pad of its own, then 24 passes in which START does nothing), the pass
  that reads START does nothing else, and a stage can begin with the pad as the program last read it (`padPolled`).
- `input.js`, `frontend.js` (new): `PadPoll`, the program's `pad_poll` (what is newly pressed since the previous read), and the program's
  front end: the title screen's random numbers, the hidden code, the sound test and the choice of the level, one pass at a time. Neither
  was in the package: the package did not port the hidden choice of the level, the sound test or the program's own pause (its page had a pause of its own).
- `app.js`: each stage starts from the random generator's byte that the stage before it ended with (`carriedSeed`), and the first
  from the byte of the title screen, where the package started every stage but the first from 1; the credits are in plain language in
  English and Italian (the package's wording had "clean-room", "semantic level topology" and the like); the title screen is driven by
  `Frontend` (the same random numbers, and the code and the sound test); a card that waits to start a stage lets the player change the level
  once the code has been entered; START (Enter, Space, and what the Pause button and P and Esc press) is the program's pause; the
  allowance of missed calls is the program's for every stage, and the Dream's reward is added to it each time it is won; the steps of
  the title, the sound test and the choice of the level see a press that ended before the page's next frame; Z, X, Shift and Backspace
  are A, B and SELECT.
- `sounds.js` (new): the list of the page's sounds for the sound test (checked against `audio.js` by `test/production.test.mjs`).
- `style.css`: the cards (the days' introductions, the results, the pause, the sound test) are sized by the height of the board with
  container queries, with the window's own media queries as the fallback, and their button stays in view, so that none of them scrolls
  inside itself on a phone upright or in a short window.
- `index.html`: the visit counter of the collection (before `</body>`) and an empty favicon link (the page asked the server for a
  `favicon.ico` and got a 404).

Not taken from the package's `public/` side: its `package.json` (a new one with the collection's scripts), `README.md`, `LICENSE` (the
collection's full GPL v3 text), `THIRD_PARTY_NOTICES.md` and `VERSION.txt`. They are kept, unmodified, in `package/`.

**The package's tests.** They are run unmodified by `test/package.test.mjs`. Thirteen of their cases fail against the changed code, and
the test says which and why: `ZS-M27-009`, `ZS-M28-010`, `ZS-M29-008`, `ZS-M30-009`, `ZS-M31-006` and `ZS-M32-011` pin the bytes of the
gameplay core ("byte-identical to the milestone before") and `ZS-M31-006` also the seed of Day 1; `ZS-M25-009` and `ZS-M25-010` pin the
old wording of the credits; `ZS-M10-011` puts the Chief at x = 30 and expects him to slow the player; `ZS-M19-016` and `ZS-M20-017` look
for the line `futureMissLimit=5` (the Dream's reward is now added each time); `ZS-M31-004` and `ZS-M31-005` look for the title screen's
old way of advancing the random generator and for the constant of its wait (the title screen is now the program's front end).
