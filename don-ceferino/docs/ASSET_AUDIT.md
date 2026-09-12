# Asset audit

## Historical license notices

The original 0.97.8 archive contains `LICENSE-KIND.FILES` in all four data groups:

- `data/ima/`
- `data/levels/`
- `data/music/`
- `data/sounds/`

All four files contain the same GPL statement: GNU GPL version 2 or, at the recipient's option, any later version.

## Active original assets

The browser build uses byte-identical files from `data/ima/` for gameplay and scenes:

- gameplay: `gaucho.png`, `pelota_1.png` … `pelota_4.png`, `niveles.png`, `fondos.jpg`, `tiros.png`, `items.png`, `mate.png`, `barra.png`;
- shell/scenes: `menu.jpg`, `tit_1.png`, `tit_2.png`, `tit_3.png`, `how_to_play.png`, `icono.png`;
- intro: `pres_sentado.jpg`, `pres_lee.jpg`, `pres_casa.jpg`, `pres_rapto.jpg`, `pres_vs.jpg`; `pres_losers.jpg` is the documented runtime derivative described below;
- ending: `final1.jpg` … `final6.jpg`;
- levels: `base.map`.

The historical `AUTHORS` file explicitly credits Walter Velazquez for graphics and story. No commercial Pang/Super Pang artwork, ROM dump or extracted executable asset has been identified in the audited set.

The browser build also activates the 12 WAV files loaded by historical `audio.cc`. Their exact copies live under `/public/assets/audio` together with the historical sound-directory license notice. See `AUDIO_AUDIT.md` for the separate audio provenance analysis.

Automated tests compare active historical graphics, levels, WAVs and license notices byte-for-byte with `/reference`, except for the intentionally edited runtime `pres_losers.jpg`. A separate regression check pins both the derivative hash and the unchanged historical original hash.

## Quarantine

### Bitmap fonts

`fuente.png`, `fuente1.png`, `fuente2.png`, `fuente_2.png`

The package-level GPL notice exists, but the release does not document the underlying typeface/source provenance. Browser UI text therefore uses system fonts.

### Music

`menu.xm`

The module is package-licensed and `AUTHORS` credits Javier Da Silva for music, but it was generated with MID2XM and embeds General-MIDI-style samples whose individual source/provenance is not documented. It remains preserved but disabled. See `AUDIO_AUDIT.md`.

## Reference-only media

`data/sounds/explo.wav` is preserved in `/reference` but is not promoted into runtime assets because 0.97.8 `audio.cc` does not load it.

## Policy

Quarantine records provenance uncertainty; it is not a claim that the historical package was unlawfully distributed. A quarantined asset is not used by the browser runtime until the evidence note is updated.

## Runtime derivative: `pres_losers.jpg`

The 1.0.3 browser runtime uses a minimally edited copy of the historical `pres_losers.jpg`: only the obsolete `www.losersjuegos.com.ar` text has been removed. The original 0.97.8 JPEG remains unchanged in `/reference`. This is an intentional presentation-only derivative; all other artwork in the image is retained.
