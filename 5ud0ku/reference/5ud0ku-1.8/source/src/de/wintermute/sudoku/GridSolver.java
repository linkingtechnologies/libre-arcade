/*
 *******************************************************************************
 * Java Tools for common purposes.
 * see startofentry.de or wintermute.de 
 *
 * Copyright (c) 2006 Ivonne Engemann and Marcus Wagner
 *
 * Enjoy.
 ******************************************************************************/
package de.wintermute.sudoku;

import java.util.Enumeration;
import java.util.Vector;

/**
 * Solve a given soduko puzzle via Back-Tracking.
 * 
 * You can retrieve all Solutions or just check if there is a unique solution.
 * 
 * @author Ivonne Engemann
 * @version $Id: GridSolver.java,v 1.23 2006/03/27 20:45:41 Ivonne Exp $
 */

public class GridSolver extends Solver {

	/**
	 * Create GridSolver with a Watchdog.
	 * 
	 * @param runningTask
	 *            the Task to watch.
	 */
	public GridSolver(final AbortableTask runningTask) {
		super(runningTask);
	}

	/**
	 * Check if the grid has a unique solution using
	 * Single/HiddenSingle-Strategy and Backtracking in combination.
	 * 
	 * @param newGrid
	 *            the grid to check
	 * @return true if unique solution found
	 * 
	 */
	public final boolean checkForUniqueSolutionWithMixedStrategy(
			final Grid newGrid) {

		findSolutionsWithMixedStrategy(true, newGrid);

		if (possibleSolutions.size() == 1) {
			final Grid firstSolution = (Grid) possibleSolutions.firstElement();

			// copy complexity value to the transferred grid
			newGrid.setBackTrackingDepth(firstSolution.getBackTrackingDepth());
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Find solutions using Single/HiddenSingle-Strategy and Backtracking in
	 * combination.
	 * 
	 * @param newGrid
	 *            the grid to check
	 * @return the solutions
	 * 
	 */
	public final Vector searchSolutions(final Grid newGrid) {

		findSolutionsWithMixedStrategy(true, newGrid);
		return possibleSolutions;
	}

	/**
	 * Find possible solutions of the grid. If checkUnique is true, stop search
	 * if found second solution.
	 * 
	 * @param containsValidSolution
	 *            indicates, if grid is already filled correctly
	 * @param newGrid
	 *            the grid to check
	 * @return Vector of found solutions
	 */
	private final Vector findSolutionsWithMixedStrategy(
			final boolean containsValidSolution, final Grid newGrid) {

		// important: store a copy !
		// because we manipulating pencil marks and shown digiots
		this.grid = newGrid.clone();
		possibleSolutions.removeAllElements();

		if (containsValidSolution) {
			// one solution is already found
			addFirstSolution();
		}

		// initialize pencil marks
		final Vector emptyPositions = grid.allEmptyPositions();
		grid.intializePencilMarks(emptyPositions);

		// start with 'single' strategy, do not check for unsolvable cells here,
		// because this puzzle is valid
		solveWithSingleStrategy(grid, emptyPositions);

		// store current emptyPositions for later compare to check for unique
		// solution
		emptyPositionsForCompare = new Position[emptyPositions.size()];
		emptyPositions.copyInto(this.emptyPositionsForCompare);

		// solve the remaining with back-tracking
		solveWithGuessStrategy(grid, emptyPositions, (short) 1);

		return possibleSolutions;
	}

	/**
	 * Check for 'Hidden Singles' in the current grid and set the obvious digit.
	 * Check only the empty cells.
	 * 
	 * @param currentGrid
	 *            the grid to check
	 * @param emptyPositions
	 *            the still empty positions.
	 * @return number of found hidden singles
	 */
	private static short checkForHiddenSingles(final Grid currentGrid,
			final Vector emptyPositions) {

		short singleFound = 0;

		final Enumeration positions = emptyPositions.elements();
		while (positions.hasMoreElements()) {
			final Position pos = (Position) positions.nextElement();

			final byte digit = currentGrid.isHiddenSingle(pos);
			if (digit != 0) {
				currentGrid.setSolvedDigit(pos, digit, emptyPositions);
				singleFound++;
			}

		}
		return singleFound;
	}

	/**
	 * Check for 'Singles' and solve these obvious digits. Only check the empty
	 * cells.
	 * 
	 * @param currentGrid
	 *            the grid to check
	 * @param emptyPositions
	 *            the empty positions to check
	 * 
	 * @return number of found singles or -1 if an unsolvable cell was found
	 */
	private static short checkForSingles(final Grid currentGrid,
			final Vector emptyPositions) {

		short singleFound = 0;

		final Enumeration positions = emptyPositions.elements();
		while (positions.hasMoreElements()) {
			final Position pos = (Position) positions.nextElement();

			final byte digit = currentGrid.isSingle(pos);
			if (digit == -1) {
				// unsolvable cell found => abort
				return -1;
			} else if (digit != 0) {
				currentGrid.setSolvedDigit(pos, digit, emptyPositions);
				singleFound++;
			}

		}
		return singleFound;
	}

	/**
	 * Check for 'Singles' and 'Hidden Singles' as long as no more obvious
	 * digits found.
	 * 
	 * @param currentGrid
	 *            the grid to check
	 * @param emptyPositions
	 *            the empty positions
	 * @return false if not solvable
	 */
	private static boolean solveWithSingleStrategy(final Grid currentGrid,
			final Vector emptyPositions) {

		int size = emptyPositions.size();
		int oldSize = size;

		do {
			oldSize = size;

			short found = checkForSingles(currentGrid, emptyPositions);
			if (found == -1) {
				// unsolvable found
				return false;
			}
			checkForHiddenSingles(currentGrid, emptyPositions);

			// loop until nothing is found anymore
			size = emptyPositions.size();

		} while (size != oldSize);

		return true;
	}

	/**
	 * Recursive call to solve the puzzle via back tracking. Guess a digit and
	 * then check for obvious singles.
	 * 
	 * @param currentGrid
	 *            the grid to check
	 * @param emptyPositions
	 *            the empty cells
	 * @param depth
	 *            increase the back-tracking depth to calculate complexity
	 */
	private void solveWithGuessStrategy(final Grid currentGrid,
			final Vector emptyPositions, final short depth) {

		if (task != null && !task.isRunning()) {
			// abort
			return;
		}

		if (possibleSolutions.size() > 1) {
			// second solution found, but only unique-check required =>
			// stop
			return;
		}

		if (emptyPositions.isEmpty()) {

			// all cells filled
			addSolution(currentGrid, depth);
			// back
			return;
		}

		final Position nextPos = (Position) emptyPositions.firstElement();
		emptyPositions.removeElement(nextPos);

		for (byte digit = 1; digit <= 9; digit++) {

			if (currentGrid.getSlot(nextPos.row, nextPos.col).isPencilMark(
					digit - 1)) {

				// copy grid before next guess
				final Grid copyGrid = currentGrid.clone();

				// copy vector of pencilmarks before next guess
				final Vector copyPos = new Vector();
				final Enumeration positions = emptyPositions.elements();
				while (positions.hasMoreElements()) {
					final Position pos = (Position) positions.nextElement();
					copyPos.addElement(pos);
				}

				// set the digit in the copy grid
				copyGrid.setSolvedDigit(nextPos, digit, copyPos);

				// check for singles
				if (solveWithSingleStrategy(copyGrid, copyPos)) {

					// recursion with next postion
					solveWithGuessStrategy(copyGrid, copyPos,
							(short) (depth + 1));
				}
			}

		}

	}

	/**
	 * Register initial solution (from generated grid) to the solutions list to
	 * help unique checking. The solution within the grid is the first valid
	 * solution. So, if we found another different solution, it is not unique.
	 */
	private void addFirstSolution() {

		final Grid firstSolution = grid.clone();

		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				final GridSlot slot = firstSolution.getSlot(row, col);
				// copy the answer to the display
				slot.setShown(slot.getAnswer());
			}
		}

		addSolution(firstSolution, (short) 0);

	}

}
