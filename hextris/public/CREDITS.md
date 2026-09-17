# Credits

## Hextris

The game itself. Vendored here with local modifications — see [`specs/design.md`](../specs/design.md) for the full list of what changed from upstream and why.

- **By**: Logan Engstrom & Garrett Finucane, and the [Hextris](https://github.com/Hextris/hextris) contributors
- **Source**: https://github.com/Hextris/hextris
- **License**: GNU GPL-3.0 — see [`LICENSE.md`](LICENSE.md) in this folder

## Vendored libraries (`vendor/`)

| Library | Version | License | Used by this game? |
|---|---|---|---|
| [jQuery](https://jquery.com/) | 3.7.1 | MIT | Yes |
| [js-cookie](https://github.com/js-cookie/js-cookie) | 3.0.5 | MIT | Yes — `js/view.js`'s `Cookies.set("visited", true)` |
| [Keypress](https://github.com/dmauro/Keypress) | 1.0.8 | Apache-2.0 | Yes — all keyboard input, `js/input.js` |
| [JSONfn](https://github.com/vkiryukhin/jsonfn) | (unversioned in this vendored copy) | MIT | Yes — save-state serialization, `js/main.js`/`js/save-state.js` |

`jQuery` and `js-cookie` were upgraded from the versions Hextris originally shipped (1.9.1 and 2.0.0-pre) — both had known CVEs (jQuery: CVE-2019-11358, CVE-2015-9251; js-cookie: CVE-2026-46625). `Hammer.js` and `SweetAlert` (the original v1, not SweetAlert2) were removed outright rather than upgraded — neither was ever called anywhere in this game's own code.

## Fonts (`style/fonts/`, `style/fa/`)

| Font | Used? |
|---|---|
| Exo 2 (Natanael Gama, SIL Open Font License 1.1) | Yes — the game's primary UI font |
| [Font Awesome](https://fontawesome.com/) 4.1.0 (Dave Gandy — CSS: MIT, font: SIL Open Font License 1.1) | **Yes** — not via any `<i class="fa-*">` markup (there is none), but drawn directly onto the `<canvas>`: `js/view.js`/`js/render.js` set `ctx.font = "...FontAwesome"` and `fillText()` the play-triangle icon (codepoint `0xf04b`) for the start button and arrow-key hints. See `specs/design.md`'s vendor-audit table for how this was first wrongly deleted as "unused" (a plain HTML-class grep can't see canvas-drawn icon usage) and restored. |

Three more font files shipped in upstream (Quattrocento Sans, Roboto, Lovelo) were vendored too but never referenced by any `@font-face` or `ctx.font`/`renderText(...)` call anywhere in this game's own HTML/JS/CSS — confirmed unused (checked both the CSS-class AND the canvas-font-usage pattern, see the point above), and **deleted**. Not upstream's fault to begin with (dead weight in the original repo too) — removing them here is a straight deletion, not a functional change.
