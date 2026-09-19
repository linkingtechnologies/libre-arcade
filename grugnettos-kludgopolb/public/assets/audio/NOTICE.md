# Project-authored sound effects

`dice.wav` and `unlock.wav` were generated for Grugnetto's Goose (the sibling game in the same collection, by the same author), which documents them as project-authored with no third-party recordings. They are reused here as the dice roll and the pledge-redeemed sound, and are distributed under the same terms as this project's own code: **GPL-3.0-only**.

`cash-register.wav`, the "ka-ching" of every money movement, is synthesised by `scripts/cash-register.mjs` (a clack and a double-struck bell, from a seeded noise source) and written byte for byte identically each time; a test checks that the committed file matches the generator. It contains no recording and is distributed under **GPL-3.0-only**.

The other sound effects (`../third_party/kenney/audio/`) are Kenney's and keep their own **CC0 1.0** licence, with each pack's `License.txt` alongside. `../../config/sounds.json` maps every game event to the files that make its sound.
