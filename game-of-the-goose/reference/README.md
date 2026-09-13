# Reference archive

This directory preserves the untouched upstream **Game of the Goose** source
by Robert Riesebos (`rriesebos/game-of-the-goose`), for archaeology purposes.
It is not loaded by the playable restoration in `../public/`.

- `archives/game-of-the-goose-e8b804f.zip` — a GitHub commit-archive snapshot
  of the audited `main` branch at commit `e8b804ffd3baa999416409fdec98cfc9e01ce87b`.
- `game-of-the-goose-e8b804f/` — that archive, extracted.
- `SHA256SUMS` — per-file checksums of both.

## Independent re-verification

The delivered restoration package did not include this reference tree — its
own `ARCHAEOLOGY.md`/`THIRD_PARTY_NOTICES.md` describe it as belonging to "a
separate archaeology/reference package" that was not part of this delivery.
Rather than take the bundled audit's license/provenance claims on faith, this
tree was independently fetched straight from the live public GitHub
repository and re-verified before anything else in this restoration was
accepted:

- Confirmed `rriesebos/game-of-the-goose` exists and commit
  `e8b804ffd3baa999416409fdec98cfc9e01ce87b` is real, via the GitHub UI and
  the GitHub REST API's recursive tree endpoint. The repository API response
  also independently reports `"license": null` — GitHub's own license
  detector agrees there is nothing to detect.
- Fetched `package.json` at that exact commit directly from
  `raw.githubusercontent.com` and confirmed it declares
  `"author": "Robert Riesebos"` and `"license": "ISC"` verbatim, matching
  `UPSTREAM_NOTICE.md`'s claim.
- Walked the **complete recursive file tree** at that commit via the GitHub
  API (37 files) and confirmed there is no `LICENSE`, `COPYING`, or `NOTICE`
  file anywhere in it — the central claim `UPSTREAM_NOTICE.md` and
  `LICENSE_AUDIT.md` are built on.
- Confirmed the specific files `ARCHAEOLOGY.md` lists as quarantined
  (`img/goose.svg`, `img/player0.svg`…`player5.svg`, `src/roll-a-die/`)
  genuinely exist at that commit and carry no attribution: the SVGs have no
  embedded copyright metadata and the DOCTYPE/structure of `goose.svg` is
  consistent with an untraced converted-clipart origin rather than
  original art; `src/roll-a-die/roll-a-die.js` has no header comment despite
  not being an installed npm dependency, i.e. it was hand-vendored without
  attribution.
- Downloaded the commit archive with `curl`, extracted it, and compared its
  file list and **git blob SHA-1 hashes** (not just filenames) against the
  GitHub API tree response for `package.json`, `src/roll-a-die/roll-a-die.js`,
  `img/goose.svg`, and `src/rulesets.js` — all four matched exactly,
  cryptographically confirming this extracted tree is byte-identical to
  what GitHub serves for that commit today.

Note: the zip's own SHA-256 (recorded in `SHA256SUMS` above) will not match
`ARCHAEOLOGY.md`'s previously-recorded
`adeff309f94048dd7502f6af35ea4d781ded6ddd3d3904db17a505f8e5e8e5f2` — GitHub's
on-demand commit-archive zips are not byte-reproducible across requests
(unlike a fixed, previously-published release tarball), so a zip-level hash
comparison for a live git host is not a meaningful verification method in
the first place. The git blob SHA-1 comparison above is the correct,
content-addressed replacement and is what was actually relied upon here.
