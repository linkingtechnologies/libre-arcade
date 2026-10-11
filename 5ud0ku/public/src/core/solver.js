export class Solver {
  constructor(task = null) {
    this.task = task;
    this.grid = null;
    this.possibleSolutions = [];
    this.emptyPositionsForCompare = null;
  }

  addSolution(newSolution, depth) {
    for (const existing of this.possibleSolutions) {
      if (newSolution.equalShown(existing, this.emptyPositionsForCompare)) {
        existing.setBackTrackingDepth(depth);
        return false;
      }
    }
    newSolution.setBackTrackingDepth(depth);
    // Historical Grid.clone() intentionally loses backTrackingDepth here.
    this.possibleSolutions.push(newSolution.clone());
    return true;
  }
}
