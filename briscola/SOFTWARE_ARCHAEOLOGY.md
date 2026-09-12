# The software archaeology behind BriscoLab

This is BriscoLab's own recovery story. For the philosophy shared by every
game in this collection — why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why an unresolved search is reported as *unknown* rather than
*impossible* — see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## Nine programmers who never met

Briscola is a simple game to state and a hard game to play well: two players,
forty cards, one hidden trump suit, and a lot of inference about what the
opponent is holding. Because the rules are small and the strategy space is
rich, it has attracted an unusually long line of hobbyist implementations —
a Qt desktop app, a Ruby heuristic shared on a cooperative's blog, a Python
script from a university mailing list, a Java applet, a paper's worth of
deterministic policies, a reinforcement-learning agent trained in a Godot
prototype, a browser demo whose only surviving trace is its own compiled
bundle. Some of these projects have public repositories. Some exist only as
a ZIP file, a NuGet package, or a PDF. None of their authors coordinated with
each other, and most had no idea the others existed.

BriscoLab exists to put all of them on the same table — literally. It
recovers the decision logic each of these programs used to choose which card
to play, ports it to a single JavaScript engine under one set of rules, and
lets it play thousands of games against every other recovered player. The
oldest source dates to 2005, the newest to 2026: two decades of programmers
solving the same forty-card problem with whatever tools and idioms were
available to them at the time, from handwritten heuristics counting known
cards to a policy network exported to ONNX.

## Comparability with provenance, not modernization

The rule BriscoLab holds itself to is stated in its own contributor
guidelines: comparability with provenance, not modernization of old
algorithms. A faithful port is not an opportunity to fix what looks like a
bug, simplify an odd branch, or rename a variable for clarity if the upstream
author's own naming survives the translation better. If a 2007 script always
saves its cheapest sufficient trump before checking a more expensive one, the
JavaScript port checks in the same order, even where a modern rewrite might
short-circuit sooner. When a deviation is unavoidable — an untranslatable
language feature, a missing source file, a licensing gap — BriscoLab records
it rather than papering over it.

That discipline gets harder as the sources get less cooperative. Two of the
git-hosted ports (QBriscola, JBriscola) could be read line by line. Others
could not: Giacomelli's πG/πH/πC policies exist as a published paper with no
bundled source, so BriscoLab reconstructs them from the paper's own
operational definitions rather than presenting invented code as a historical
snapshot. CardFramework's three CPU levels were reverse-engineered from a
compiled NuGet package and its IL, not from C# source at all. Briscola.js's
two heuristics survive only inside a deployed, unlicensed browser bundle,
so BriscoLab reconstructs their observed behavior but does not redistribute
the original bundle. Each of these boundaries — snapshot, reconstruction,
paper-derived, unverifiable — is written down in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and
[`reference/`](reference/README.md) instead of being smoothed into a single
uniform story.

## An arena instead of a single verdict

Restoring nine implementations only proves they still run. BriscoLab's Arena
is what turns that into evidence: every recovered player, plus a modern deep
reinforcement-learning agent (BriscolaBot) and twenty-three PoIAna model
checkpoints, plays repeated, seeded matches against every other player in
both seating positions. The results are committed as data
(`arena/results/`), not asserted as opinion — a 2007 heuristic's actual win
rate against a 2026 neural network is something you can point to, not
something either author would have been able to guess.
