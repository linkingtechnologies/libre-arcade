# Historical upstream credits

This file preserves the credits stated by the Nova Pinball upstream author/project pages. These are **historical attribution records**; they do not broaden or reinterpret the licenses of third-party material.

## Core project

| Person / project | Historical role | Evidence preserved by this audit |
|---|---|---|
| **Wesley "keyboard monkey" Werner** | Original Nova Pinball author | v0.2.3 README: `Copyleft 2015 Wesley Werner`; upstream repository `wesleywerner/nova-pinball`. |
| **Eric Ahnell** | Later compatibility maintenance | Later project page states: `Updated for LOVE2D 11.2, 2019 Eric Ahnell`. This is post-v0.2.3 maintenance, not authorship of the 2015 game design. |
| **Nova Pinball Engine** | Underlying pinball engine | v0.2.3 README points to `wesleywerner/nova-pinball-engine` and states that the engine is available under the same license. The later maintained project page points to `wrldwzrd89/nova-pinball-engine`. |

## Third-party work credited by the upstream author

The historical README introduces these credits with the sentence:

> Thanks goes to these people for letting me use their work:

| Credit | Role in historical Nova Pinball | Upstream reference |
|---|---|---|
| **Beyond** | Original tracker music | ModArchive member `82730`; `https://soundcloud.com/beyond-26` |
| **Sizenko Alexander** | Creator of **Advanced LED Board-7** | `http://www.styleseven.com`; `http://www.fontspace.com/style-7/advanced-led-board-7` |
| **Nate Halley** | Creator of **Erbos Draco Open NBP** | Upstream states Creative Commons BY-SA; `http://www.fontspace.com/total-fontgeek-dtf-ltd/erbos-draco-monospaced-nbp` |
| **Steve Dekorte** | Creator of the **Lua File Pickler**, Apr 2000 | `http://www.dekorte.com` |
| **Tomas Pettersson** | Creator of the **SFXR** sound-effect generator | `http://www.drpetter.se/project_sfxr.html` |

## Historical pages and preservation sources

- Original/upstream repository: `https://github.com/wesleywerner/nova-pinball`
- Historical/later project page used during the audit: `http://engrams.dev/nova-pinball/`
- Original v0.2.3 engine reference: `https://github.com/wesleywerner/nova-pinball-engine`
- Later maintained engine reference: `https://github.com/wrldwzrd89/nova-pinball-engine`
- Software Heritage preservation origin for the later engine repository: `https://archive.softwareheritage.org/browse/origin/directory/?origin_url=https://github.com/wrldwzrd89/nova-pinball-engine`

Software Heritage is recorded here as an independent preservation source, not as the original distribution channel for Nova Pinball.

## Licensing interpretation used by this restoration

The upstream author's statement that these people allowed him to use their work is strong evidence that their inclusion in historical Nova Pinball was deliberate and authorized. It does **not**, by itself, prove that every permission included a transferable right to sublicense those assets into a separately modified web port.

For that reason the public restoration keeps the historical credits intact while remaining conservative about redistribution:

- Beyond's tracker music is credited and documented but not republished;
- Advanced LED Board-7 is credited and documented but not republished;
- Erbos Draco Open NBP is credited and documented, but no historical font binary is needed or bundled in the final web package;
- `pickle.lua` is credited historically but replaced by guarded JSON/localStorage;
- the original SFXR-generated WAV files are documented but replaced by clean Web Audio synthesis.

See `ASSET_REFERENCE.md`, `AUDIO_PARITY.md`, `PRESERVATION_MATRIX.md`, and `../reference/MANIFEST.md` for the corresponding preservation decisions.
