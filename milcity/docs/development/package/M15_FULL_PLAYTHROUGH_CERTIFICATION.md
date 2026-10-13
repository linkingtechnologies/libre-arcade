# M15 — Full Playthrough Certification

Date: 2026-10-12
Baseline: MilCity HTML5 M14, historical ruleset 1.0.5

## Purpose

M15 stops adding gameplay features and tests whether the restored rules can carry complete matches all the way to a terminal state. The certification deliberately covers victory, defeat, long-running AI activity, save/resume during a match, and end-of-match browser UX.

This is a **headless simulation certification**, not a claim that a human has manually clicked through every screen in a real browser. The scripted human policy uses only legal build/fire operations and only radar state that is visible to the human player for target selection. It does not inspect the enemy building list when choosing where to fire.

## Complete scripted human matches

All runs use the normal defaults: $100 starting money, 1000 maximum score, 50% water and the historical rules/timing. The script builds a viable power/economy/missile city, then applies a simple Battleship-style targeting policy: scan unknown ground; after a visible hit, probe neighboring cells. It does **not** rely on hidden enemy coordinates and does not deliberately farm the destroyed-cell repeat-score quirk.

| AI | QA seed | Result | Simulated duration | Human score | AI score |
|---|---:|---|---:|---:|---:|
| Easy | 20261012 | Human victory | 1012 s (16:52) | 1000 | 950 |
| Medium | 20261013 | Human victory | 882 s (14:42) | 1000 | 310 |
| Hard | 20261014 | Human victory | 819 s (13:39) | 1000 | 640 |
| Madness | 20261015 | Human victory | 775 s (12:55) | 1020 | 80 |

The score may exceed 1000 on the final attack because a multi-cell destruction can award several 10-point events before the next win check, matching the preserved rules.

## Autonomous long-match coverage

Five Easy-vs-Easy **AI-vs-AI** matches were also run at default settings. Every match terminated with exactly one winner and no economic, targeting, cooldown or simulation deadlock.

| Seed | Duration | Winner score |
|---:|---:|---:|
| 1 | 877 s | 1010 |
| 2 | 906 s | 1010 |
| 3 | 884 s | 1000 |
| 4 | 794 s | 1000 |
| 5 | 959 s | 1000 |

## Defeat path

A deliberately invalid opening was used to certify a genuine loss: the human builds a Commercial building but never builds a Power Plant. The city remains at non-positive energy and reaches the historical blackout timeout.

- terminal time: **121 s**;
- human: `lost = true`;
- AI: `won = true`;
- game: `ended = true`.

This also certifies the historical strict `> 120 s` timeout boundary rather than an early loss at exactly 120 seconds.

## Save/resume during a real long match

A Madness match (seed 20261015) was played for 400 simulated seconds, serialized through JSON, restored with `Game.fromState()`, and then both the uninterrupted and restored copies continued under the same visible-information player policy.

Both copies:

- finish at **775 s**;
- finish with the same winner and score;
- have byte-equivalent serialized simulation state at completion;
- preserve AI turn/RNG, building clocks, status grid, ammo, cooldowns and economy across the restore.

Therefore autosave/resume is certified not merely as a snapshot round-trip, but across the remainder of a complete match.

## End-state stability

After `game.ended === true`, calling `tick()` for another 300 seconds leaves the serialized game state unchanged. A completed match cannot continue simulating in the background.

## M15 browser endgame UX

M15 adds a dedicated terminal panel. When the human wins or loses:

- live City/Military/action controls are hidden;
- the final result, score and elapsed simulated time are shown;
- **Play again / Gioca ancora** starts another match at the same AI level (or Training);
- **Main menu / Menu principale** returns cleanly to the main menu;
- unfinished-match autosave is cleared, so a completed game is never offered as `Resume Game`.

The canvas still displays the preserved victory/defeat overlay, while the modern side panel supplies understandable browser actions.

## Certification status

**PASS — core/full-match simulation.**

MilCity can start from the normal defaults, develop an economy, manufacture ammunition, exchange attacks with all four historical AI levels, reach a real victory condition, reach a real defeat condition, and survive a mid-match save/resume without diverging.

### Remaining manual gate

A final human browser playthrough using mouse/touch through the public UI remains desirable before tagging the package as final production release. That gate is about interaction/browser integration, not an unresolved gameplay deadlock in the simulation core.
