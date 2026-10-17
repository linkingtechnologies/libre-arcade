# Full 50-level playthrough validation

The release candidate has been completed end-to-end by an automated player that uses only the same directional-priority inputs available to a human player. It does not modify board state, teleport the locomotive, suppress collisions, or force level completion.

## Certified result

- **50 / 50 levels completed**
- **1,042 / 1,042 wagons collected**
- **0 collisions** in the certified routes
- **2,154 junction decisions**
- all 50 post-level Human Rights quizzes traversed in one continuous campaign
- level 50 completed, final life bonus applied, and the original high-score state reached
- campaign flag: `completedCampaign = true`
- final unlocked level: 50

Each route was first discovered by a planner and then replayed independently at the validated **16 ms simulation step**. Coarser planning results were never accepted as proof. Two coarse candidates (levels 27 and 39) failed the exact replay and were replaced before certification.

The exact per-level results are in `reports/LEVEL_PLAYTHROUGH_RESULTS.csv`; the replayable directional sequences are in `test/playthrough_solutions.json`. `test/playthrough_all_levels.mjs` reruns the complete campaign through the normal JavaScript gameplay/session classes.

The sum of the standalone certified level runs is **2,157.088 seconds** of gameplay simulation (about 35m 57s), excluding quiz/result pauses. The continuous campaign test also includes the original post-win pauses and quiz-result delays.

This is a gameplay/completability certification, not a claim that the automated routes are optimal or representative of ideal human play.
