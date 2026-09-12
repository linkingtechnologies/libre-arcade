# Legal audit — release 0.97.8

## Code

The source directory contains 62 `.cc`/`.h` files.

- 60 files contain the Don Ceferino Hazaña GPL notice with the explicit wording “either version 2 … or (at your option) any later version”.
- `ceferino-i18n.h` is empty.
- `int.h` is a small gettext compatibility wrapper with no contrary license statement.

The package includes a top-level `COPYING` containing GPL version 2. The source-file grant is the decisive version selector: **GPL-2.0-or-later**, not GPL-2.0-only. A GPLv3 browser port is therefore permitted by the historical grant.

## Data directories

The original archive contains `LICENSE-KIND.FILES` in `data/ima`, `data/levels`, `data/music`, and `data/sounds`. The four notices are byte-identical and each gives the project the same GPL-2.0-or-later grant.

The restoration distinguishes the package license from provenance completeness. Graphics/levels and the historical WAV effects are active under these explicit notices; bitmap fonts and the XM module remain quarantined where source-level provenance is incomplete. See `ASSET_AUDIT.md` and `AUDIO_AUDIT.md`.

## Pang / Super Pang relationship

The historical README itself describes Don Ceferino Hazaña as similar to Super Pang. The examined package uses its own named character, story and credited graphics. No Capcom/Mitchell ROM dump, Pang executable, or file identified as an extracted commercial asset appears in the 0.97.8 archive.

The restoration documents the historical inspiration but does not present itself as an official Pang/Super Pang product.

## Distribution policy

- `/reference`: unmodified historical material under its original terms;
- new JavaScript/HTML/CSS port: GNU GPL version 3;
- active original graphics, levels and WAV effects: historical GPL-2.0-or-later notices retained/documented;
- provenance-sensitive bitmap fonts/XM music: preserved but not loaded by the production browser build.

This is a software-preservation licensing audit, not legal advice.
