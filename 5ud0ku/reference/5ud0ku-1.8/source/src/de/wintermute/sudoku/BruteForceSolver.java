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

import java.util.Vector;

/**
 * BruteForce Solver for user created puzzles.
 * 
 * @author Ivonne Engemann
 * @version $Id: BruteForceSolver.java,v 1.6 2006/03/27 20:42:28 Ivonne Exp $
 * 
 */
public class BruteForceSolver extends Solver {

	/** Max Number of Search runs */
	private int maxNumberOfSolutionsToSearch;

	/**
	 * Create a new solver with the task to abort.
	 * 
	 * @param solverTask
	 *            the task to watch
	 * @param findFirst
	 *            indicates the solver to stop when one solution was found
	 */
	protected BruteForceSolver(final AbortableTask solverTask, boolean findFirst) {
		super(solverTask);
		maxNumberOfSolutionsToSearch = findFirst ? 1 : 2;
	}

	/**
	 * Check if the given grid has a unique solution.
	 * 
	 * @return Vector with the first solution(s).
	 */
	public final Vector searchSolutions(final Grid newGrid) {

		findSolutions(newGrid);
		return possibleSolutions;
	}

	/**
	 * Find possible solutions of the grid.
	 * 
	 * @param newGrid
	 *            the grid to check
	 * @return Vector of found solutions
	 */
	private final Vector findSolutions(final Grid newGrid) {

		// important: store a copy !
		// because we manipulating pencil marks and shown digits
		this.grid = newGrid.clone();
		possibleSolutions.removeAllElements();

		// initialize all possible digits for each position
		grid.setupPossibleDigits();

		// store the empty position for later compare of solutions
		Vector emptyPositions = grid.allEmptyPositions();
		emptyPositionsForCompare = new Position[emptyPositions.size()];
		emptyPositions.copyInto(emptyPositionsForCompare);

		// start recursion with position 0
		checkSolution((short) 0);

		return possibleSolutions;
	}

	/**
	 * Recursion call: check each position with all possible digits in a
	 * back-tracking algorithmen.
	 * 
	 * @param pos
	 *            the position to examine
	 */
	private void checkSolution(final short pos) {

		if (task != null && !task.isRunning()) {
			// abort
			return;
		}

		if (possibleSolutions.size() >= maxNumberOfSolutionsToSearch) {
			// stop search
			return;
		}

		if (pos >= 81) {

			// all slots filled => check the solution
			addSolution(grid, (short) 0);

			// back
			return;
		}

		// calculate the row and column from the postion
		final byte row = (byte) (pos / 9);
		final byte col = (byte) (pos % 9);
		final GridSlot slot = grid.getSlot(row, col);

		if (slot.isOriginalDigit()) {
			checkSolution((short) (pos + 1));

		} else {

			for (byte d = 1; d <= 9; d++) {
				// check if digit is possible from prechecked array and from
				// current state of solving
				if (grid.getSlot(row, col).isPencilMark(d - 1)
						&& possible(row, col, d)) {
					// digit possible => set to current grid
					slot.setShown(d);
					// go on with next position => recursion
					checkSolution((short) (pos + 1));
				}
			}
		}
	}

	/**
	 * Check if digit is possible for this slot in the current solving state.
	 * Check if the same digit already occurs in a row above in the same column
	 * or in a column left of the current slot in the same row. Checking blocks,
	 * too.
	 * 
	 * @param row
	 *            the Row
	 * @param col
	 *            The Column
	 * @param d
	 *            the digit to check
	 * @return true if digit is matching
	 */
	private boolean possible(final byte row, final byte col, final byte d) {

		for (byte r = 0; r < row; r++) {
			if (grid.getSlot(r, col).getShown() == d) {
				return false;
			}
		}

		for (byte c = 0; c < col; c++) {
			if (grid.getSlot(row, c).getShown() == d) {
				return false;
			}
		}

		final byte blockStartRow = (byte) (((int) (row / 3)) * 3);
		final byte blockStartCol = (byte) (((int) (col / 3)) * 3);
		for (byte r = blockStartRow; r < blockStartRow + 3; r++) {
			for (byte c = blockStartCol; c < blockStartCol + 3; c++) {
				if (r == row && c == col) {
					return true;
				}
				if (grid.getSlot(r, c).getShown() == d) {
					return false;
				}
			}
		}
		return true;
	}
}
