# Frozen board configuration format

Starting with milestone 0.5, playable boards are immutable, versioned configuration packages. Engine code contains no board names, prices or translated event text.

## Layout

```text
boards/
  index.json
  grugnetto-32-v1.4/         # frozen v1.4.1 / current default (only packaged revision)
    board.json
    SHA256SUMS
    i18n/
      it.json
      en.json
      fr.json
      de.json
```

`boards/index.json` is the board registry. A future board is added as another package and registry entry; an already-frozen board is not silently rebalanced.

## `board.json`

The mechanical file is language-neutral and contains stable IDs only. Required metadata:

- `schemaVersion`
- `id`
- `contentVersion`
- `frozen: true`
- `defaultLocale`
- `locales`

Gameplay data includes starting cash, salary, Base Camp rules, development rules, spaces, events, world groups, assets and calibrated economy metadata.

Every space has a stable `id` such as `flower-path`, `base-camp` or `heart-of-mine`. Event cards similarly keep stable IDs (`a1`…`a8`, `i1`…`i8`). Internal space types such as `hub`, `service` and `detention` are retained for historical KludgopolB AI parity; player-facing terminology comes only from locale files.

## Locale files

Each locale contains the board title, UI strings, terminology, four world names, all 32 space names and all 16 event-card texts. Locale files must cover exactly the same stable IDs as `board.json`.

Frozen v1 languages:

- `it` — Italiano
- `en` — English
- `fr` — Français
- `de` — Deutsch

Adding another language does not change board mechanics or invalidate deterministic gameplay. Tests reject incomplete translations.

## Integrity

`SHA256SUMS` records hashes for `board.json` and all four locale files. Any mechanical balance change requires a new `contentVersion` (and preferably a new board package/version) rather than silently replacing the frozen v1 data.

## Supported space types

- `start`
- `site`
- `hub` — player-facing Portal
- `service` — player-facing Special Place
- `event`
- `tax`
- `neutral`
- `detention`
- `moveToDetention`

A site defines `world`, `group`, `price`, `buildCost`, `rents`, and `landingWeight`. Hub and service spaces define their own rent arrays/factors.

## Event effects (v1.1+)

Event cards remain language-neutral. Supported fields are composable where sensible:

- `cash`: fixed bank payment/reward;
- `move`: relative movement;
- `moveTo`: forward movement to a stable space ID;
- `moveToNextType`: forward movement to the next matching internal space type (e.g. `hub` / Portal);
- `salary`: whether absolute/next-type forward movement may collect pass-start salary;
- `resolve`: whether the destination space is resolved after movement;
- `cashPerOwnedSite`: reward/charge per owned Place;
- `cashPerEmbellishment`: reward/charge per owned Embellishment;
- `grantEmbellishment`: free deterministic Embellishment on an eligible Place;
- `removeEmbellishment`: deterministic loss of an owned Embellishment;
- `fallbackCash`: cash fallback when a conditional ownership/Embellishment effect cannot apply;
- `detain`: send the player to Base Camp.

See `events.md` for the current themed decks and measured board frequencies.
