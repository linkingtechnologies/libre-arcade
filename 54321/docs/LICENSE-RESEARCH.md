# License research status

## Resolved: the original material carries nklein software's own "Universal, Non-Exclusive License"

Earlier drafts of this document treated 54321's licensing as unresolved,
because the 2001 archive contains no standalone `LICENSE`/`COPYING` file.
That was too cautious: it treated the *absence of a bundled file* as
equivalent to *absence of a license*, when US copyright law does not require
a non-exclusive license to be granted in a signed, bundled document — it can
be granted in exactly the terms a rightsholder publishes and points to, and
the site-wide page this game's own archive points to has since been
independently located, dated, and quoted verbatim. The evidentiary chain:

### 1. The 2001 archive wires its own webpage into nklein.com's site-wide copyright system

`reference/54321-1.0.2001.11.16/data/webpage/hdr.php`:

```php
<?php $copyright="2001"; ?>
<?php $path="../.."; ?>
<?php $title="products/54321"; ?>
<?php include $path . "/etc/hdr.php"; ?>
```

`tail.php` correspondingly includes `$path . "/etc/tail.php"`. This is not a
page discovered decades later and loosely associated with the same author —
it is the *actual source*, inside the tarball being preserved, that the
author wired into the site's shared `etc/` header/footer/copyright system at
the time of release.

### 2. The site-wide copyright page, verified via the Wayback Machine, predates the release

Both of these captures were fetched and read directly (not taken from a
secondary summary) on 2026-09-12:

- **13 Jun 2001** — <https://web.archive.org/web/20010613000000/http://www.nklein.com/etc/copyright.php>
  (five months *before* 54321's 16 Nov 2001 release; footer reads
  "(copyright 2000)"). Full text:

  > We made all images, text, software, and other stuff on this web site.
  > We authorize you to do anything you like with these so long as you do
  > not restrict the rights of others to do what they like with them. We're
  > not saying you have to give away your products. We're just saying that
  > all of the items on this site have a Universal, Non-Exclusive License.
  >
  > For example, if you wanted to take some of these images or some of
  > this software and plaster your name on them and sell them, fine. But,
  > you cannot keep Sally Q. Public from taking those same items and
  > plastering her name on them and selling them. You just can't. It's all
  > as hers as it is yours.

- **26 Dec 2005** — <https://web.archive.org/web/20051226000000/http://www.nklein.com/etc/copyright.php>
  (footer "(copyright 2002)"). Same operative text, with one added
  parenthetical excluding "the xhtml, css, and paypal icons at the bottom."

The full verbatim text, with both capture dates as provenance, is preserved
in [`../LICENSES/LicenseRef-NKlein-Universal-NonExclusive.txt`](../LICENSES/LicenseRef-NKlein-Universal-NonExclusive.txt).

### 3. The 54321 product page itself matches the preserved tarball, dated 5 weeks after release

<https://web.archive.org/web/20011221000000/http://www.nklein.com/products/54321/>
(21 Dec 2001, footer "(copyright 2001)") renders the same section structure
and wording as `reference/54321-1.0.2001.11.16/data/webpage/body.html` —
same contest sponsors, same "Pre-compiled package / Source Code /
Screenshots / Requires" layout — using the same site-wide header/nav
template as the copyright page above. This confirms the tarball's own
webpage source is the real page nklein.com served for this exact release,
not a later reconstruction.

### 4. Independent secondary confirmation

<https://libregamewiki.org/54321> (retrieved 2026-09-12) lists:

> Code license: a very simple copyleft license [1]
> Media license: a very simple copyleft license
>
> 54321 is a free game. This means that the source code and media files are
> available to be studied, modified, and distributed.

with footnote `[1]` citing `http://old.nklein.com/etc/copyright.php` —
the same page quoted above. LibreGameWiki lists the developer as "Patrick
Fleckenstein," while every other source (the archive's own README, the
nklein site, this project's own research) says "Patrick Stein." This is
noted as an unresolved minor discrepancy in the wiki's own metadata; it does
not affect the license-page citation, which independently corroborates the
same URL this project verified directly.

## What this does and doesn't establish

It establishes, with primary and dated evidence, that nklein software's
publicly stated terms for "all of the items on this site" — a broad,
non-exclusive permission to copy, modify, and redistribute, with the single
condition that you not restrict others from doing the same with the
*original* material — were live and unchanged across at least 2001-2005,
and that the 54321 release's own webpage was built to inherit exactly that
site-wide notice.

It does not establish an SPDX-recognized or FSF/OSI-certified license
identifier: nklein's grant is a bespoke, plain-English permission, not GPL,
MIT, or any other named license. It is recorded as the custom identifier
`LicenseRef-NKlein-Universal-NonExclusive`, per the REUSE convention for
non-standard licenses (see `../REUSE.toml`).

## Decision

The preserved original material (`reference/`, and the byte-identical
artwork/board-data copies in `public/src/assets/original/`) is licensed
`LicenseRef-NKlein-Universal-NonExclusive`. This repository's own new work —
the browser-shell reconstruction and, since nklein's grant explicitly
permits a derivative work to carry different terms without an obligation to
"give away" the result, the faithful JavaScript transcription of the
original game logic — is licensed GPL-3.0-or-later. See `PROVENANCE.md` for
the full per-layer breakdown and `docs/archaeology/LEGAL_STATUS.md` for the
policy record.

The one asset this project still declines to use or attribute a specific
license to is the Blue Vinyl display font (`font.png`'s credited typeface):
its precise terms remain unidentified, and it was already excluded from the
browser runtime for that reason — see `docs/ASSET-PROVENANCE.md`.
