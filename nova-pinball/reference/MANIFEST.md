# Reference manifest

The historical archives are **not embedded in the public repository**. They contain media whose redistribution terms are not sufficiently documented for this modified web restoration.

## Upstream

- Repository: `https://github.com/wesleywerner/nova-pinball`
- Baseline release: `v0.2.3` (2017-12-22)
- Baseline tag commit: `ce25d474ed89b4e5f584de44c08228f1556539a1`
- Engine submodule at baseline: `b8f7c1ef2e77006b547e6178cded09eb73c6c541`

## Historical web / preservation references

- Historical/later project page: `http://engrams.dev/nova-pinball/`
- v0.2.3 README engine repository: `https://github.com/wesleywerner/nova-pinball-engine`
- Later maintained engine repository: `https://github.com/wrldwzrd89/nova-pinball-engine`
- Software Heritage origin for the later engine repository: `https://archive.softwareheritage.org/browse/origin/directory/?origin_url=https://github.com/wrldwzrd89/nova-pinball-engine`

See `../docs/UPSTREAM_CREDITS.md` for the people and third-party works explicitly credited by upstream.

## Preserved artifacts

Keep local copies unchanged and verify them against these values:

| File | Bytes | SHA-256 | Official source |
|---|---:|---|---|
| `nova-pinball-0.2.3.love` | 4,731,182 | `4872440c2ffa80d45dcc20548033179bd49a2ce426d103c9a1029fc0793606a1` | `https://github.com/wesleywerner/nova-pinball/releases/download/v0.2.3/nova-pinball-0.2.3.love` |
| `nova-pinball-0.2.3-win.zip` | 7,698,226 | `f213d95f5470b545623eb8913e87920348a595fa8453ee97a75fb75c1bfc60e0` | `https://github.com/wesleywerner/nova-pinball/releases/download/v0.2.3/nova-pinball-0.2.3-win.zip` |
| `nova-pinball-0.2.2.2.love` | 4,314,995 | `50776b96167e1fa2e38c4258681aabdeef082058ba7dc551cca596f7d23eae2f` | `https://github.com/wesleywerner/nova-pinball/releases/download/v0.2.2.2/nova-pinball-0.2.2.2.love` |

## Windows-build cross-check

The v0.2.3 Windows executable is a fused LÖVE runtime. Its first **381,952 bytes** are the runtime executable; the appended payload is exactly the official `nova-pinball-0.2.3.love` artifact. The extracted payload therefore has the same SHA-256:

`4872440c2ffa80d45dcc20548033179bd49a2ce426d103c9a1029fc0793606a1`

This independently corroborates the baseline artifact distributed to Windows players.

## Quarantine / not redistributed

- `modules/pickle.lua` — historical header states only “Freeware”; replaced by JSON/localStorage.
- `fonts/advanced_led_board-7.*` — restrictive freeware/home-use terms; not bundled.
- historical tracker music attributed to **Beyond** — historical authorization/attribution is evident, but the surviving materials do not document redistribution/sublicensing terms clearly enough for this modified web port.
- historical WAV and raster media — not required by the public build; used only as archaeological/parity references and replaced by clean procedural output.

Quarantine does **not** assert that the original author used these assets unlawfully. It is a conservative decision about redistribution by this separate modified project.
