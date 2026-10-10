# ConnectLab release-candidate checklist

## Green

- [x] 22 principal intelligences plus one explicitly separated control
- [x] unique common-contract player IDs
- [x] original/reference source trees retained
- [x] provenance, checksums and third-party notices retained
- [x] GPLv3-compatible distribution boundary documented
- [x] no unverified historical media redistributed
- [x] historical/native parity tests retained
- [x] deterministic paired Arena and replay seed
- [x] illegal-move protection
- [x] IT/EN interface
- [x] responsive CSS rules
- [x] provenance filters and labels
- [x] readable standings plus raw replay data
- [x] node and elapsed-time telemetry
- [x] multi-seed strength calibration and frozen rating snapshot
- [x] six measured opponent levels without artificial blunders
- [x] Laboratory mode retaining every AI/profile
- [x] no build step or runtime dependency

## Before public 1.0

- [ ] manual Chrome desktop play and full Arena smoke test
- [ ] manual Firefox desktop play and full Arena smoke test
- [ ] manual Safari/WebKit play smoke test
- [ ] narrow-screen portrait check at 320, 375 and 430 CSS pixels
- [ ] keyboard-only navigation and visible-focus review
- [ ] screen-reader labels for board state and tournament table
- [ ] long-running Arena responsiveness review; decide whether a future release needs a Web Worker
- [ ] validate production hosting cache headers and MIME types

## Release decision

Code and automated gates qualify as **RC1**. Public 1.0 remains conditional on the manual browser/accessibility checks above. No additional AI should be added during this gate.
