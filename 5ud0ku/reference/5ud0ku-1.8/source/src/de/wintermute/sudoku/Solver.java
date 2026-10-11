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
 * Abstract Solver for common solving strategies.
 * 
 * You can retrieve all Solutions or just check if there is a unique solution.
 * 
 * @author Ivonne Engemann
 * @version $Id: Solver.java,v 1.2 2006/01/19 21:26:38 marcus Exp $
 */

public abstract class Solver {

	/** the task in progress (creator/solver) */
	protected AbortableTask task;

	/**
	 * Store the current grid state during solving.
	 */
	protected Grid grid;

	/**
	 * Store all possible solutions.
	 */
	protected Vector possibleSolutions = new Vector();

	protected Position[] emptyPositionsForCompare;

	/**
	 * Create a new solver with the task to abort.
	 * 
	 * @param solverTask
	 */
	protected Solver(final AbortableTask solverTask) {
		super();
		this.task = solverTask;
	}

	/**
	 * Check if the given grid has a unique solution.
	 * 
	 * @return Vector with the first solution(s).
	 */
	public abstract Vector searchSolutions(final Grid newGrid);

	/**
	 * Check if the solution is a new one and if yes, add this solution to the
	 * list.
	 * 
	 * @param newSolution
	 *            the solution to check
	 * @param depth
	 *            the depth of back-tracking
	 * @return true if this solution is new
	 */
	protected final boolean addSolution(final Grid newSolution,
			final short depth) {

		final Enumeration solutions = possibleSolutions.elements();
		while (solutions.hasMoreElements()) {
			final Grid boardToCompare = (Grid) solutions.nextElement();

			if (newSolution.equalShown(boardToCompare,
					this.emptyPositionsForCompare)) {
				// already got this solution
				boardToCompare.setBackTrackingDepth(depth);
				return false;
			}
		}

		// NEW SOLUTION
		newSolution.setBackTrackingDepth(depth);
		possibleSolutions.addElement(newSolution.clone());
		return true;
	}
}
