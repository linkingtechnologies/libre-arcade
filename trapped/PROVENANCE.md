# Provenance: Trapped

## Source

- Repository: https://github.com/Rysm/html-minigames (Andy Wang), commit `1197d28da4ffdb63dd2d00638e71d602e8a44de5`, licence MIT "Copyright (c) 2018 Andy Wang".
- Files in `twine_horror_game/`:

| File | sha-256 | Use |
|---|---|---|
| `Trapped.html` | `dbb8f4bf5344a995116b94ddfe0ef01a3788825379620fe0b990f19f30de72ca` | the published story; kept verbatim as `source/Trapped.original.html` |
| `Trapped.tws` | `db34bd09407245d877152babcc63c3c91a8193fde0146294f7a42325f3bfba73` | Twine 1.4 workspace (Python pickle); read for provenance only, not distributed |
| `proj2_playtest.pages` | `164844e0d446f25b4bc8f98d9b01b6accaaffe3ecc28d913b3b5e8b9f4430463` | Apple Pages playtest notes; not read, not distributed |
| `twinelink.dms` | `f93fedd7703043be1ad9ce1321a1ab667e99b0fb3289de002d3b0aa311d2705f` | one-line link to a philome.la page; not distributed |

- Authoring tool: Twine 1.4.2 on macOS, built 2015-04-27, story format "Sugarcane" (based on TiddlyWiki 1.2.39 by Jeremy Ruston, copyright Osmosoft Limited 2005, BSD licence, notice in the file header).
- `StoryAuthor` passage: "Andy Wang and Roberto Ortiz". The workspace stores a build path `/Users/andywang/Desktop/CS 80k/proj2/` (a course project).
- Every passage title of `Trapped.html` also appears in `Trapped.tws`; no "Untitled Passage" is present. A full passage-by-passage diff of the pickle was not made.

## Open point: co-author

Roberto Ortiz is named as co-author, but the repository's MIT notice names only
Andy Wang. Publishing in a repository under Andy Wang's MIT licence is the only
grant on record; Roberto Ortiz's consent is not independently verified. The rights
register marks the story files `ok-with-note`. Proposed resolution: ask Andy Wang
(the repository owner) to confirm, or accept the risk knowingly.

## What was verified and how

- **The original runs unchanged in a current browser** (checked in a real browser and headless): no console errors, the opening passage and all links render. So no new runtime was written and no `eval` was added by this project; the engine's own use of `eval` for macros is part of the original.
- **Level 1, executable oracle**: the tests drive the original engine itself (jsdom, `Math.random` pinned or seeded). Endings, antagonist, variables, restart and the Italian build are tested against that real engine, not a re-implementation.
- **Italian layer**: a build-time check requires that each declared English segment exists exactly the declared number of times, and a test confirms that links, `<<display>>` targets and macros are unchanged.

Not covered: Safari and old browsers (the original author notes Safari problems); visual comparison of fades and transitions.
