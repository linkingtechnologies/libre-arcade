/**
 * What the original draws for one cell while the solution is displayed (SudokuUI.paintSlot with showSolution set):
 * the stored answer in every cell, and for a digit the player entered, whether it was right or wrong.
 * Given numbers and empty cells carry no mark.
 */
export function solutionViewCell(slot) {
  const answer = slot.getAnswer();
  const shown = slot.getShown();
  if (slot.isOriginalDigit()) return { digit: answer, mark: 'given' };
  if (shown === 0) return { digit: answer, mark: 'empty' };
  return { digit: answer, mark: shown === answer ? 'correct' : 'wrong' };
}
