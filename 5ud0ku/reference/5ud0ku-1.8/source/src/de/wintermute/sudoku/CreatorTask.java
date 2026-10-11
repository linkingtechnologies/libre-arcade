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

import de.wintermute.sudoku.res.Dict;

/**
 * The CreatorTask uses a Thread to create a new unique puzzle.
 * 
 * @author Ivonne Engemann
 * @version $Id: CreatorTask.java,v 1.15 2006/02/12 15:38:31 marcus Exp $
 */
public class CreatorTask extends AbortableTask {

	/**
	 * The midlet as receiver for events "solution found".
	 */
	private SudokuMidlet midlet;

	/**
	 * The state holder with the preferences for creation to use.
	 */
	private SudokuStateControl preferences;

	/**
	 * The current game.
	 */
	private Grid grid = null;

	/**
	 * Number of filled given cells for the game.
	 */
	private short given;

	/**
	 * The back-tracking depth of the 'best' game.
	 */
	private short bestBacktracking;

	/**
	 * The single count of the 'best' game.
	 */
	private short bestSingles;

	/**
	 * The number of givens of the 'best' game.
	 */
	private short bestGiven;

	/**
	 * Level IDs used for creating grids.
	 */
	private static short[] LEVEL = { GridCreator.EASY_GAME,
			GridCreator.NORMAL_GAME, GridCreator.HARD_GAME };

	/**
	 * Constructor for the CreatorTask.
	 * 
	 * @param theMidlet
	 *            the reciever Midlet
	 * @param theStateHolder
	 *            The state holder with the preferences for creation to use.
	 */
	public CreatorTask(final SudokuMidlet theMidlet,
			final SudokuStateControl theStateHolder) {

		midlet = theMidlet;
		preferences = theStateHolder;
	}

	/**
	 * Start creation a new game.
	 * 
	 * @param level
	 *            number of given cells.
	 */
	public void createGame(final short level) {

		given = GridCreator.NORMAL_GAME;
		if (level >= 0 || level < LEVEL.length) {
			given = LEVEL[level];
		}

		Runnable r = new Runnable() {

			public void run() {

				if (startRunning()) {
					int numberOfFoundGrids = 0;
					int numberOfGeneratedGrid = 0;
					boolean timeout = false;
					final int maxIt = (given == GridCreator.HARD_GAME) ? preferences
							.getMaxCreationIterations()
							: 1;
					final long endTime = System.currentTimeMillis()
							+ preferences.getMaxCreationTimeout() * 1000;

					while (isRunning()
							&& (grid == null || (!timeout && numberOfFoundGrids < maxIt))) {

						boolean foundUnique = CreatorTask.this
								.generateNextGame(++numberOfGeneratedGrid);

						if (foundUnique) {
							numberOfFoundGrids++;
						}

						timeout = System.currentTimeMillis() > endTime;

					} // end of while

					if (abort()) {
						grid.randomizeDigits();
						Runnable r = new Runnable() {
							public void run() {
								midlet.gameCreated(grid);
							}
						};
						midlet.invokeLater(r);
					}

				}
			}

		};

		Thread t = new Thread(r);
		t.start();

	}

	/**
	 * Generate a new game and check if it has a unique solution.
	 * 
	 * @param tryNbr
	 *            the number within loop to display
	 * @return true if unique solution found
	 */
	private boolean generateNextGame(final int tryNbr) {

		midlet.promoteProgress(Dict.getString("grid") + tryNbr
				+ Dict.getString("generating"));

		final Grid newGrid = GridCreator.getInstance().setTask(this)
				.createNewUniqueGame(given);

		if (newGrid != null) {
			// found unique solution
			checkAndStoreGrid(newGrid);

			midlet.promoteProgress(Dict.getString("grid") + tryNbr
					+ Dict.getString("generated"));

			return true;
		}

		return false;
	}

	/**
	 * Found a unique puzzle. Check if this puzzle is fullfilling the
	 * requirements (number of given) and store it, if it is 'better'/'harder'
	 * than the currently stored game.
	 * 
	 * @param gridToCheck
	 *            the new generated grid
	 */
	private void checkAndStoreGrid(final Grid gridToCheck) {

		final short foundGiven = gridToCheck.getNumberOfGiven();

		// check complexity
		gridToCheck.setupPossibleDigits();
		final short numberOfSingles = gridToCheck.getNumberOfSingles();
		final short backtrackingDepth = gridToCheck.getBackTrackingDepth();

		if (grid == null) {
			// no stored grid yet, so this is the 'best'
			storeGrid(gridToCheck, foundGiven, numberOfSingles,
					backtrackingDepth);
			return;
		}

		// first check back-tracking depth
		if (backtrackingDepth > bestBacktracking) {
			// better back-tracking
			storeGrid(gridToCheck, foundGiven, numberOfSingles,
					backtrackingDepth);
		} else {
			if (backtrackingDepth == bestBacktracking) {
				if (numberOfSingles + foundGiven < bestSingles + bestGiven) {
					// same backtracking, but less given + singles
					storeGrid(gridToCheck, foundGiven, numberOfSingles,
							backtrackingDepth);
				} else {
					if (foundGiven < bestGiven) {
						// only better number of givens
						storeGrid(gridToCheck, foundGiven, numberOfSingles,
								backtrackingDepth);
					}
				}
			}
		}

	}

	/**
	 * Store this grid as 'best'.
	 * 
	 * @param gridToCheck
	 * @param foundGiven
	 * @param numberOfSingles
	 * @param backtrackingDepth
	 */
	private void storeGrid(final Grid gridToCheck, final short foundGiven,
			final short numberOfSingles, final short backtrackingDepth) {

		gridToCheck.clearPencilMarks();
		bestGiven = foundGiven;
		bestSingles = numberOfSingles;
		bestBacktracking = backtrackingDepth;
		grid = gridToCheck;

	}
}
