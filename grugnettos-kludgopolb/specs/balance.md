# Balance study

What thousands of simulated games say about the Grugnetto board and the eight CPU friends, and what was changed because of it. Everything here measures **CPU against CPU** on the engine the browser game uses. It says nothing about how a person plays, and nothing about whether the game is fun.

## Method

- `npm run balance` (`scripts/balance.mjs`) plays many games with fixed seeds and reports how they end, who wins by seat and by friend, and how often the leader after round 20 goes on to win. The commands and the numbers they print are at the end of this page; the same seeds always give the same numbers.
- **Mirror tables** seat identical players: any asymmetry comes from the seat (the engine shuffles the start order from the game seed). **Mixed tables** draw random lineups from the eight friends. **Duels** seat two players.
- A game counts as *finished* if exactly one player is left before the turn cap (2,400 turns in the tables below, 6,000 in the game itself). A game that hits the cap is a stalemate, not a hang: the engine stays responsive.
- Some larger samples (1,600 mixed games, 800-game mirrors, 560 duels, 200-game tables of six and eight) come from a one-off harness around the same engine; where a number is quoted from it, the script repeats it at a smaller scale and agrees.

## What the games show

**Who wins.** In random four-player tables (1,600 games), wins per appearance, with 25% as the fair share: Wallace 52%, Hans 49%, Zilla 38%, Queen 38%, Mimrock 15%, Pazifik 5%, Lost Soul 3%, Lemming 0.1%. Two bands, then: four friends who contest the game and four who rarely win. In two-player duels (cap 1,500 turns, decided games only): Queen 72%, Wallace 68%, Zilla 60%, Lost Soul 53%, Hans 51%, Mimrock 44%, Lemming 0%. Lost Soul is middling in duels and poor in crowds, which is what his card says; Lemming does not win a single game against any friend, which is what a beginner friend should do.

**Seats.** With identical strong players the first seat wins more: Zilla in four-player tables 29.8% against 22% for seats three and four, six-player tables 23% for seat one against 11% for seat six. With Wallace the difference is smaller and not significant (27.5%). In **random mixed tables there is no detectable seat effect**: 25.0%, 25.7%, 24.8%, 24.6% over 1,600 four-player games; tables of six and eight (200 games each) show no pattern beyond noise. Two-player games split 55/45 and 51.5/48.5, not significant. The start order is random in every game, so over many games nobody is favoured.

*Giving later seats extra starting coins does not help*: the first seat's edge comes from reaching places first, not from cash. With 20 coins per seat of compensation the first seat still won 29.5%, with 40 it won 31%. Left alone.

**Snowball.** The table leader after round 20 wins 49% of identical Zilla tables, 70% of Wallace tables and 58% of mixed tables, against about 25% by chance; after round 10 it is only 31% to 41%. The early game is open, and the game is largely decided by about round 30.

**Length.** Median 42 to 57 rounds at four players, with the slowest tenth well beyond (78 to 143 rounds without Pazifik, 600 or more with him). A person's minutes per round have not been measured.

**Games that never end.** In 3% to 3.5% of four-player games between strong, identical players, and in about a quarter of the random tables with Pazifik, nobody ever goes bankrupt:
- Two players are left, each with two complete, fully embellished Worlds. They trade rents back and forth, one of them holding more than 20,000 coins in the two games inspected, and with Home paying 160 a lap the random walk takes hundreds of rounds to drift apart.
- At tables with Pazifik, who never proposes a trade and normally refuses incoming ones, Worlds stay split among players who each keep collecting their salary; with three Lemming and Pazifik, 97% of games never finished. Lemming alone does not cause it (99% finished without Pazifik).

**A casual player.** Pazifik (buys anything, never trades) stands in for a player who does not know the game: against three Wallace he wins 7.6% of games and goes bankrupt in 78%; against three Mimrock, 6.4% and 75%. The game rewards strategy over luck.

## What was changed: growing rents

[`rent-escalation.md`](rent-escalation.md) describes the rule: from round 40, and every 20 rounds after, every rent rises 25%. It was chosen over lowering the Home salary, which ended four-player games but trimmed the long tail less and ended far fewer games at tables of players who never trade. Results with the engine's own implementation:

| Table (seeds 100000 and up) | Finished, off | Finished, on | Median rounds, off | Median, on | Slowest tenth, off | Slowest tenth, on |
|---|---|---|---|---|---|---|
| Zilla ×4, 800 games | 96.8% | 100% | 56 | 53 | 143 | 88 |
| Wallace ×4, 800 games | 96.5% | 100% | 42 | 41 | 97 | 73 |
| Random ×4, 600 games | 85.7% | 100% | 54 | 51 | 600 | 265 |

The median game is almost unchanged, the strength order of the friends is unchanged (Wallace 49.5%, Hans 48.4%, Zilla 43.6%, Queen 34.8%, Mimrock 14.5%, Pazifik 6.5%, Lost Soul 4%, Lemming 0%) and the seat shares do not move. The slowest tenth of random tables is still long because of Pazifik; it no longer never ends.

A rule for the shipped game, not a repair of the original: the engine leaves it off unless asked, so the older figures and the parity ledger are unaffected. The browser game ticks it by default and lets the player untick it.

## What is not known

- How a person plays against these friends, and for how long. Several hundred real games would be needed.
- Whether the rule's constants (+25%, round 40, every 20 rounds) feel right to a person. They were checked only for how games end.
- Per-World balance: whether any World wins more often than the others. The economy was calibrated for the landing frequencies, not re-measured here.
- Tables of six and eight were sampled lightly (200 games each), and 81% of the games at a table of all eight friends finished without the rule.

## Repeating it

```bash
npm run balance -- mirror --profile Zilla --players 4 --games 800
npm run balance -- mirror --profile Zilla --players 4 --games 800 --escalation
npm run balance -- mirror --profile Wallace --players 4 --games 800
npm run balance -- mixed --players 4 --games 600
npm run balance -- mixed --players 4 --games 600 --escalation
```

A 800-game mirror takes a few minutes, the mixed tables up to ten (games that hit the cap are slow). Expected output for the first lines of the table above: `finished 96.8%`, `rounds: median 56, 90th percentile 143` for Zilla ×4 off; `finished 100%`, `median 53`, `90th percentile 88` with `--escalation`.
