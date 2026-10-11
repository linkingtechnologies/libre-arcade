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

import java.util.Random;
import java.util.Vector;

import de.wintermute.sudoku.res.Dict;

/**
 * Create a new SODUKO puzzle.
 * 
 * There are predefined difficilities. They define the number of shown digits in
 * the beginning of the puzzle.
 * 
 * The grid will have one solution, but there could be multiple solutions.
 * 
 * @author Ivonne Engemann
 * @version $Id: GridCreator.java,v 1.28 2006/03/11 16:54:24 marcus Exp $
 */

public class GridCreator {

	/**
	 * Predefine standard game. More givens (filled slots at the beginning) and
	 * the game is easier.
	 */

	/** Number of cell which we hide by random at startup */
	private final static short NUMBER_RANDOM_HIDDENS = 36;

	/** Easy Game given cells */
	public final static short EASY_GAME = 40;

	/** Normal Game given cells */
	public final static short NORMAL_GAME = 33;

	/** Hard Game given cells */
	public final static short HARD_GAME = 23;


	/**
	 * For the starting grid use this digits for column one.
	 */
	private final static Byte[] NUMBERS = new Byte[9];
	{
		for (byte i = 1; i < 10; i++) {
			NUMBERS[i - 1] = new Byte(i);
		}
	}

	/**
	 * Define number of symmetries which are available.
	 */
	private static final byte NUMBER_OF_SYMMETRIES = (byte) 3;

	/**
	 * Access the Grid Creator.
	 * 
	 * @return the GridCreator
	 */
	public static GridCreator getInstance() {

		if (instance == null)
			instance = new GridCreator();
		return instance;

	}

	/**
	 * Store the grid itself.
	 */
	private Grid board;

	/**
	 * Store the number of given cells.
	 */
	private short numberOfGivens;

	/**
	 * Random functionality.
	 */
	private static final Random random = new Random();

	/** the only creator */
	private static GridCreator instance;

	/**
	 * The abortable task.
	 */
	private AbortableTask task;

	/**
	 * The grid solver to use for unique-solution-check.
	 */
	private GridSolver solver;

	/**
	 * Set the abortable task (to stop generation).
	 * 
	 * @param task
	 */
	public GridCreator setTask(final AbortableTask task) {

		this.task = task;
		return this;
	}

	/**
	 * Get printable type.
	 * 
	 * @param givens
	 *            number of given cells
	 * @return String name for the level
	 */
	private String getTypeForHints(final short givens) {

		if (givens <= HARD_GAME) {
			return Dict.getString("hard");
		} else {
			if (givens <= NORMAL_GAME) {
				return Dict.getString("normal");
			} else {
				return Dict.getString("easy");
			}
		}
	}

	/**
	 * Fill up the matrix with some inital values which do not intercept each other.
	 */
	private void createInitialMatrix() {
		// iterate over 3 of 9 blocks
		for (int block = 0; block < 3; block++) {
			final Vector numbers = getNumbers();
			for (byte row = (byte) (block * 3); row < block * 3 + 3; row++) {
				for (byte col = (byte) (block * 3); col < block * 3 + 3; col++) {
					final GridSlot slot = board.getSlot(row, col);
					final byte digit = removeRandomNumberFrom(numbers);
					slot.setShown(digit);
					slot.setAnswer(digit);
					slot.setOriginalDigit(true);
				}
			}
		}

	}

	/**
	 * Get the digits
	 * @return Vector of possible digits
	 */
	private Vector getNumbers() {
		final Vector numbers = new Vector(NUMBERS.length);
		for (int i = 0; i < NUMBERS.length; i++) {
			numbers.addElement(NUMBERS[i]);
		}
		return numbers;
	}

	/**
	 * Get a random number.
	 * @param numbers the Vector with the remaining numbers
	 * @return the selected byte
	 */
	private byte removeRandomNumberFrom(Vector numbers) {
		final int size = numbers.size();
		if (size == 0) {
			return 0;
		}
		final int next = (Math.abs(random.nextInt()) % size);
		final byte number = ((Byte) numbers.elementAt(next)).byteValue();
		numbers.removeElementAt(next);
		return number;
	}

	/**
	 * Hide numbers with a stregegy: first hide all numbers for a EASY game,
	 * check if this game is unique. If not return null. If still unique, hide
	 * more and mor numbers, but only if it is still a unique puzzle.
	 * 
	 * @return true if unique solution found
	 */
	private boolean hideNumbersForUniqueGrid() {

		final int symmetry = randomDigit(NUMBER_OF_SYMMETRIES);
		final Vector positionsNotYetChecked = Position.allPositions();

		// startup with with easy game
		final short hideAtStartup = NUMBER_RANDOM_HIDDENS;
		hideNumbersAtStartup(symmetry, hideAtStartup, positionsNotYetChecked);

		// check if still unique solution
		solver = new GridSolver(task);
		if (!solver.checkForUniqueSolutionWithMixedStrategy(board)) {
			return false;
		}

		// hide some numbers
		short numbersToHide = (short) (81 - numberOfGivens - hideAtStartup);
		hideNumbersAndCheckUnique(symmetry, numbersToHide,
				positionsNotYetChecked);

		return true;
	}

	/**
	 * Create a new random puzzle with spcified number of given digits. This
	 * puzzle will have a unique solution. If no unique solution found for
	 * random puzzle, so return null.
	 * 
	 * @param newNumberOfGivens
	 *            the number of given digits
	 * @return the new game, or null if no unique solution was found
	 */
	public Grid createNewUniqueGame(final short newNumberOfGivens) {

		createShuffledBoard(newNumberOfGivens);
		if (board != null) {
			final boolean found = hideNumbersForUniqueGrid();
			if (found) {
				board.clearPencilMarks();
				return board;
			}
		}
		return null;
	}

	/**
	 * Create a new grid with shuffled digits.
	 * 
	 * @param newNumberOfGivens
	 */
	private void createShuffledBoard(final short newNumberOfGivens) {

		board = new Grid(getTypeForHints(newNumberOfGivens));
		numberOfGivens = newNumberOfGivens;

		// create an initial grid and create a solution for it
		createInitialMatrix();

		// the inital grid only hold independent numbers, so solve it now to get
		// a full sudoku

		Solver initalSolver = new BruteForceSolver(task, true);
		Vector sol = initalSolver.searchSolutions(board);

		if (!sol.isEmpty()) {
			board = (Grid) sol.firstElement();
			// prepare board for hiding numbers
			board.setAllShownDigitsAsOriginal();
		} else {
			board = null;
		}
	}

	/**
	 * Returns a random number from 0 to (n-1).
	 * 
	 * @param n
	 *            the range
	 * @return a byte within the range
	 */
	private byte randomDigit(byte n) {
		return (byte) (Math.abs(random.nextInt()) % n);
	}

	/**
	 * Hide 2 or 4 digits by random. Using the not checked position vector to
	 * don#T check the same position again. Use 3 different symmetries to hide 2
	 * or 4 digits.
	 * 
	 * @param symmetry
	 *            the symmetry to use
	 * @param positionsNotYetChecked
	 *            the position which were not checked yet
	 * @return a list of all new hidden positions
	 */
	private Vector hideNumbersByRandomUsingSymmetry(final int symmetry,
			final Vector positionsNotYetChecked) {

		final Vector hidePositions = new Vector();

		// randomly use a position which is not yet checked
		final short index = (short) (Math.abs(random.nextInt()) % positionsNotYetChecked
				.size());
		final Position pos = (Position) positionsNotYetChecked.elementAt(index);

		// hide this position
		boolean wasFilled = board.hideNumber(pos);
		if (wasFilled) {
			hidePositions.addElement(pos);
			positionsNotYetChecked.removeElement(pos);
		} else {
			// slot already empty (should not happen) => return
			return hidePositions;
		}

		final byte r2 = (byte) (8 - pos.row);
		final byte c2 = (byte) (8 - pos.col);

		switch (symmetry) {

		case 0:
			// switch
			Position posToHide = new Position(pos.col, pos.row);
			wasFilled = board.hideNumber(posToHide);
			if (wasFilled) {
				hidePositions.addElement(posToHide);
				positionsNotYetChecked.removeElement(posToHide);
			}
			break;

		case 1:
			// diagonal
			posToHide = new Position(r2, c2);
			wasFilled = board.hideNumber(posToHide);
			if (wasFilled) {
				hidePositions.addElement(posToHide);
				positionsNotYetChecked.removeElement(posToHide);
			}
			break;

		case 2:
			// 4x mirror
			posToHide = new Position(pos.row, c2);
			wasFilled = board.hideNumber(posToHide);
			if (wasFilled) {
				hidePositions.addElement(posToHide);
				positionsNotYetChecked.removeElement(posToHide);
			}
			posToHide = new Position(r2, pos.col);
			wasFilled = board.hideNumber(posToHide);
			if (wasFilled) {
				hidePositions.addElement(posToHide);
				positionsNotYetChecked.removeElement(posToHide);
			}
			posToHide = new Position(r2, c2);
			wasFilled = board.hideNumber(posToHide);
			if (wasFilled) {
				hidePositions.addElement(posToHide);
				positionsNotYetChecked.removeElement(posToHide);
			}
			break;

		}

		return hidePositions;

	}

	/**
	 * Hide as many numbers as possible. Check every time if puzzle still has a
	 * unique solution. If not, unhide the last digits again and try some other.
	 * Always check the not touched positions only.
	 * 
	 * @param symmetry
	 *            the symmetry to use for hiding 2 or 4 digits at the same time
	 * @param numbersToHide
	 *            the number of digits which still needs to be removed
	 * @param positionsNotYetChecked
	 *            the not touche dposition
	 */
	private void hideNumbersAndCheckUnique(final int symmetry,
			short numbersToHide, final Vector positionsNotYetChecked) {

		while (numbersToHide > 0 && !positionsNotYetChecked.isEmpty()
				&& task.isRunning()) {

			final Vector hiddenNumbers = hideNumbersByRandomUsingSymmetry(
					symmetry, positionsNotYetChecked);

			if (solver.checkForUniqueSolutionWithMixedStrategy(board)) {
				numbersToHide -= hiddenNumbers.size();
			} else {
				// reset
				board.unhideNumbers(hiddenNumbers);
			}
		}

	}

	/**
	 * Just hide a number of digits in the grid, whichout check for unique
	 * solutiuon.
	 * 
	 * @param symmetry
	 *            the symmetry to use
	 * @param numbersToHide
	 *            the number of digits to hide
	 * @param positionsNotYetChecked
	 *            the not touched positions
	 */
	private void hideNumbersAtStartup(final int symmetry, short numbersToHide,
			final Vector positionsNotYetChecked) {

		while (numbersToHide > 0 && !positionsNotYetChecked.isEmpty()) {

			final Vector hiddenNumbers = hideNumbersByRandomUsingSymmetry(
					symmetry, positionsNotYetChecked);

			numbersToHide -= hiddenNumbers.size();
		}
	}

}
