# M17 core correction — downward ladder entry

M17 supersedes the previous symmetric ladder-entry assumption.

Canonical v1.02 behavior:

- UP ladder acquisition samples `player_y + 23`;
- DOWN ladder acquisition samples `player_y + 24`.

The one-pixel difference comes from the original source incrementing the local Y sample between the UP and DOWN checks. This affects whether a perfectly positioned player can begin descending a ladder.

The movement core now preserves this asymmetry and the full regression remains green.
