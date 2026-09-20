# HighMoon — Libre Arcade

The first public repository commit for the HighMoon browser restoration. The playable game is in [`public/highmoon/`](public/highmoon/); launch it with a static server, or use `npm run serve` from that directory. It opens on a welcome menu with IT/EN instructions, original author and restoration credits, mode selection, and an explicit Play button.

The **Audio** menu offers On/Off. A short sound confirms Play; shots and impacts have their own effects. There is no background soundtrack.

- [`reference/highmoon/reference/HighMoon/`](reference/highmoon/reference/HighMoon/): byte-identical historical HighMoon 1.2.4 source files, documentation, original GPL notice and **original upstream `NEWS`**. Upstream GIF/WAV/icon bytes are deliberately excluded from the public repository and kept in a separate private archival ZIP.
- [`reference/highmoon/oracle/`](reference/highmoon/oracle/): C++ native behavioral oracle, instrumentation, source guard, replay/comparison tools and compressed JSONL traces.
- [`specs/highmoon/`](specs/highmoon/): archaeological history, legal and asset audits, provenance manifests and QA evidence.
- [`REFERENCE_POLICY.md`](REFERENCE_POLICY.md) and [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md): provenance and distribution decisions.

**Verify before committing** from repository root:

```sh
python3 scripts/verify_commit.py
```

This is the **initial public release candidate**, `1.0.0-rc.5`. There is deliberately no changelog for the new browser port before its first commit. Do not erase or rewrite `reference/highmoon/reference/HighMoon/NEWS`: it is part of the 2006 archaeological record. Final `1.0.0` sign-off still requires Firefox, Safari/iOS and live Libre Arcade hosting smoke tests.
