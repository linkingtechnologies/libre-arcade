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

import de.wintermute.sudoku.res.Dict;

/**
 * The thread during solving a puzzle entered by the user.
 * 
 * @author Ivonne Engemann
 * @version $Id: SolverTask.java,v 1.16 2006/10/28 23:21:06 marcus Exp $
 * 
 */
public class SolverTask extends AbortableTask {

	/**
	 * The midlet as receiver for events "solution found".
	 */
	private SudokuMidlet midlet;

	/**
	 * The current game.
	 */
	private Grid grid = null;

	/**
	 * Create Solver Task
	 * 
	 * @param theMidlet
	 *            the SudokuMidlet to call back
	 * @param theGridToSolve
	 *            the Grid
	 */
	public SolverTask(final SudokuMidlet theMidlet, final Grid theGridToSolve) {

		midlet = theMidlet;
		grid = theGridToSolve;
	}

	/**
	 * Start Solving a new game.
	 * 
	 */
	public void solveGame() {

		Runnable r = new Runnable() {

			/*
			 * @see java.lang.Runnable#run()
			 */
			public void run() {

				if (startRunning()) {
					while (isRunning()) {

						midlet.promoteProgress(Dict.getString("prepareSolver"));
						grid.setAllShownDigitsAsOriginal();

						midlet.promoteProgress(Dict
								.getString("checkSimpleRules"));
						final boolean valid = grid.checkForRules();
						if (!valid) {
							unlockAllDigits();
							if (abort()) {
								midlet.userGameNotSolvable();
							}
							return;
						}

						midlet
								.promoteProgress(Dict
										.getString("searchSol"));

						// use brute force to solve puzzle as the Grid Solver is
						// not working for user created
						// since they might be not solvable at all and the grid
						// solver expects one solution already
						final Solver solver = new BruteForceSolver(
								SolverTask.this, false);

						final Vector solutions = solver.searchSolutions(grid);

						midlet.promoteProgress(Dict
								.getString("checkCompleted1")
								+ solutions.size()
								+ Dict.getString("checkCompleted2"));

						if (abort()) {
							Runnable r = new Runnable() {
								public void run() {
									if (solutions.size() > 0) {
										midlet.userGameSolved(solutions);
									} else {
										unlockAllDigits();
										midlet.userGameNotSolvable();
									}
								}
							};
							midlet.invokeLater(r);

						}
					}
				}
			}

		};

		Thread t = new Thread(r);
		t.start();

	}

	/**
	 * make digits editable.
	 */
	protected void unlockAllDigits() {

		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				final GridSlot slot = grid.getSlot(row, col);

				slot.setAnswer((byte) 0);
				slot.setOriginalDigit(false);
				slot.setPencilMarks(0);

			}
		}

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see de.wintermute.sudoku.AbortableTask#abort()
	 */
	protected synchronized boolean abort() {

		if (super.abort()) {
			unlockAllDigits();
			return true;
		}

		return false;
	}
}
