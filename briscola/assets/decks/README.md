# Regional card decks

The UI loads regional artwork through `assets/decks/index.json` and each deck's
`briscolab_manifest.json`. The game engine and every AI continue to use the same
logical 40-card Briscola model; artwork is presentation-only.

## Bundled decks

- **Viterbesi–Murari 1900** — restored historical deck already present in BriscoLab v1.6.1.
- **Napoletane Pignalosa 1882** — user-supplied historical restoration added later.
- **Symbols** — built-in CSS/text fallback when no bitmap deck is available.

Both bitmap decks contain 40 fronts plus a back image and declare their mapping
through a version-1 `briscolab-deck-manifest` file.

## Logical mapping

Imported manifests translate external suit/rank names to the engine IDs:

- suits: `cups → coppe`, `swords → spade`, `coins → denari`, `batons → bastoni`
- ranks: `ace → 1`, `jack → 8`, `knight → 9`, `king → 10`

This keeps every AI independent from the selected visual deck.

## Adding another deck

1. Create a folder under `assets/decks/<slug>/`.
2. Add the 40 card images and, optionally, a back image.
3. Add `briscolab_manifest.json` following the existing version-1 manifests.
4. Add the manifest path to `assets/decks/index.json`.
5. Run the deck-registry tests before publishing.

Code licensing and artwork provenance must be reviewed separately before a public
redistribution of any newly imported historical deck.
