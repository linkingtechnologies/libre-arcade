# Legal status and licensing record

This document records this project's current interpretation, corroborated by
dated primary sources retrieved directly from the Wayback Machine. It is a
provenance note, not legal advice.

## What the original 2001 archive contains

The preserved release identifies Patrick Stein as the author and includes
the complete C++/SDL sources, Noweb sources, documentation, board data,
artwork, and editable image sources. It does not contain a standalone
`LICENSE` or `COPYING` file, and the bundled README does not state a
software license by name.

## Resolution: a site-wide grant the release's own webpage was built to inherit

The archive's own `data/webpage/hdr.php` and `tail.php` include
`$path . "/etc/hdr.php"` and `$path . "/etc/tail.php"` — nklein.com's
site-wide header/footer system — rather than standing alone. That system's
copyright page, `nklein.com/etc/copyright.php`, was fetched from the Wayback
Machine at two dates bracketing the 54321 release:

- 13 Jun 2001 (five months before release): states "all of the items on
  this site have a Universal, Non-Exclusive License," authorizing anyone to
  "do anything you like" with the site's images/text/software provided they
  "do not restrict the rights of others to do what they like with them,"
  and explicitly disclaiming any requirement to "give away your products."
- 26 Dec 2005: same operative text, confirming the policy's stability over
  years, not a one-off statement.

The 54321 product page itself was independently confirmed via a 21 Dec 2001
capture (five weeks after release), matching the tarball's own
`body.html` content and using the same site template as the copyright page.
LibreGameWiki independently classifies 54321's code and media as
"a very simple copyleft license," citing the same copyright-page URL, and
states the source and media "are available to be studied, modified, and
distributed." Full quotes, dates, and archive URLs are in
`../LICENSE-RESEARCH.md`; the verbatim license text is preserved in
`../../LICENSES/LicenseRef-NKlein-Universal-NonExclusive.txt`.

## Repository policy (current)

- Preserve the original release unchanged under `/reference`, licensed
  `LicenseRef-NKlein-Universal-NonExclusive` (Patrick Stein / nklein
  software, 2001).
- The browser-shell reconstruction and the faithful JavaScript transcription
  of the original game logic are licensed GPL-3.0-or-later by this
  repository — permitted because nklein's grant does not require a
  derivative work to carry the same terms or remain unrestricted itself; it
  only requires that the *original* material stay equally available to
  everyone, which `/reference` and the byte-identical copies in
  `public/src/assets/original/` do.
- Do not claim GPL-3.0-or-later, MIT, or any other SPDX-standard identifier
  *for the original material itself* — it is recorded as the custom
  `LicenseRef-NKlein-Universal-NonExclusive`, not FSF/OSI-certified,
  per `../../REUSE.toml`.
- Do not remove Patrick Stein's attribution or third-party notices.
- The Blue Vinyl font's precise license remains unidentified and unused in
  the browser runtime; this is unaffected by the above resolution.

## Abandonment status

No later upstream gameplay release by Patrick Stein has been identified
after `1.0.2001.11.16`. Modern OS/2/SDL2 activity is treated as downstream
preservation/porting, not resumed upstream development. This historical
abandonment is relevant to preservation value; it has no bearing on the
license analysis above, which rests on nklein software's own published
grant, not on the project being unmaintained.

See also `../LICENSE-RESEARCH.md`, `../../PROVENANCE.md` and
`../../THIRD_PARTY_NOTICES.md`.
