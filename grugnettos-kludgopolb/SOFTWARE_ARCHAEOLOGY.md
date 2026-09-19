# The software archaeology behind Grugnetto's KludgopolB

This is KludgopolB's own recovery story. For the philosophy shared by every
game in this collection (why reasoning is preserved rather than just
artifacts, why verification runs by execution rather than resemblance, why an
unresolved question is reported as *unknown* rather than *impossible*), see
[`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## An abandoned Java game with a real AI in it

KludgopolB is a property-trading board game written in Java and published on
SourceForge as a Beta project. The release set recovered here is dated
2012-12-24: a source archive (`KludgopolB_src.zip`), a runnable distribution
(`KludgopolB.zip`, with the `KludgopolB.jar`, board data, rule presets and
runtime assets) and an upstream `changelog.txt`. The interesting part is not
the board. It is the computer players: seven distinct CPU personalities, each
with its own numeric parameters, plus a full trading engine that lets them
propose, prune and accept swaps with each other.

That trading engine is what this restoration keeps alive. Its decisions are
recovered from the Java source, not guessed from behaviour: the seven CPU
profiles (Mimrock, Zilla, Queen, Wallace, Hans, Lost Soul, Lemming) and their
numbers, the property valuation model (purchase price plus rent weighted by an
empirical landing frequency, with a group-completion bonus), the hub and
service valuation concepts, the auction valuation with its small random
uplift, the trade proposal generator from `PlayerCPUTrader`, the group-aware
filtering from `CurrentState.removefromtrade`, the trade portfolio arithmetic
(`getTotalGainCostLoss`, `getTradingChanges`, `getTotalGain`) and the
independent acceptance test from `TradeAccepterWindow`. The original rule that
a site cannot be traded while its group is developed is kept as well.

## What was changed on purpose, and what is not finished

Two deviations are deliberate and documented rather than hidden.

The original used several independent, unseeded `java.util.Random`
instances, so no two games could ever be replayed. The restoration derives
deterministic streams from one game seed, without touching any decision
formula. The payoff is checkable: the same seed produces the same game and
the same AI decisions every time (`npm run sim -- --seed 12345`), while the
seed is never shown to players.

The original boards were regional commercial variants with runtime graphics
whose provenance and licence scope cannot be established from the recovered
files. None of that content is used. Play takes place on an original board
built for the Grugnetto Go! world (four worlds of four places each on a
32-space board), with an economy derived from two million simulated movement
turns so that every world costs about the same to acquire in full.

Parity is not complete, and the ledger says so. Auction scheduling and
timing, the automatic purchase policy, development decisions, debt
liquidation order, event-card effects, the detention exit strategy and the
interest effects of trading a pledged place are implemented but not yet
line-for-line ports. Detention-release cards in trades, pending-purchase
permutations during a trade dialog, limited-embellishment inventory auctions,
the configurable rule presets and the original `.conf` parser are not ported
at all. These gaps are isolated in [`specs/parity.md`](specs/parity.md) so
each can be replaced by a faithful port later; nothing there is presented as
verified.

## A second lineage: Pazifik

The eighth friend is not from KludgopolB. Pazifik is a clean behavioural
reimplementation of the documented behaviour of `atlantik.ai.SimpleAI` from
JAtlantik r36 (2007): buy only when cash exceeds the price, bid one coin above
the highest bid up to a strict ceiling, build as soon as cash allows, decline
trades. It imports no JAtlantik code or media, and the r36 snapshot is kept
only as evidence identified by hash. The behaviour is specified in
[`specs/pazifik.md`](specs/pazifik.md) and measured in
[`specs/pazifik-benchmark.md`](specs/pazifik-benchmark.md).

## Provenance and licences

The recovered archives contain no licence text, and the SourceForge metadata
declares both BSD and GPLv3 without saying which covers what. The restoration
records that ambiguity instead of resolving it: GPLv3 is treated as the
grant for the Java-derived source port, and nothing claims that every
original file is dual-licensed. The source archive also embeds original
artwork with no documented licence scope, so neither audited archive is
redistributed. Their exact SHA-256 hashes and upstream locations are kept in
[`reference/EXTERNAL_ARTIFACTS.md`](reference/EXTERNAL_ARTIFACTS.md), so a
private archaeological workspace can be rebuilt from independently retrieved
originals. The upstream changelog is kept unchanged in
[`reference/changelog.txt`](reference/changelog.txt), and the full statement is
in [`reference/provenance.md`](reference/provenance.md) and
[`specs/licensing.md`](specs/licensing.md).

## How it was rebuilt

The path from a headless deterministic simulation to the browser game, and the
reasoning behind each step, is recounted in
[`specs/DEVELOPMENT_HISTORY.md`](specs/DEVELOPMENT_HISTORY.md): the source-grounded
trading port, the economy calibrated from simulation, the frozen and
hash-verified board content, the `GameController` state machine with a versioned
save contract, and the four-language interface on top of it.
