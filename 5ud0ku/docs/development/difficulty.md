# Difficulty

5ud0ku 1.8 exposes three generated difficulty levels: Easy, Normal and Hard.

Difficulty is not simply a function of the number of empty cells.

- Easy and Normal generation are primarily driven by their givens targets plus the uniqueness constraint.
- Hard generation evaluates multiple candidates and ranks them using solver-derived complexity information.

The recovered ranking gives priority to greater backtracking depth, then fewer `singles + givens`, then fewer givens.

Consequently, two Hard games may have visibly different numbers of givens while retaining the same historical difficulty label. The restoration preserves this behaviour rather than reclassifying puzzles with a modern rating system.
