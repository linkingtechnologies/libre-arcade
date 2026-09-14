# goose-game — audit status

- Project: `zaccaro1980/goose-game`.
- Audited snapshot: commit `2c12317749b0c6b0a78b4a019132cd016432c965` (2018-10-03).
- Role in Grugnetto’s Goose: behavioural/parity reference, not UI source.
- Historical source bundled here: **No**.
- Code copied into `public/src`: **No**.

## Licensing evidence

The selected repository state is internally inconsistent:

- repository `LICENSE`: GNU GPL v3 text;
- README: says the project is GPLv3;
- `package.json`: declares `"license": "ISC"`.

Because these signals conflict, Grugnetto’s Goose does not redistribute or derive code from this snapshot. The implementation is used only as behavioural evidence until the licensing intent can be resolved.

## Behavioural value

The source is useful for confirming a simple turn loop, two dice, exact finish/bounce, a Bridge implementation and repeated movement on implemented Goose tiles. Its board is incomplete as a traditional Game of the Goose reference: only the early Goose sequence is represented and the major traditional special spaces are absent.
