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

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.util.Enumeration;
import java.util.Random;
import java.util.Vector;

/**
 * Grid for the soduko puzzle. Array of 9 rows and 9 colums.
 * 
 * @author Ivonne Engemann
 * @version $Id: Grid.java,v 1.33 2006/03/27 20:46:33 Ivonne Exp $
 */
public class Grid {

	/**
	 * Random functionality.
	 */
	private static final Random random = new Random();

	/**
	 * An all-true array to be used as default value for allowed numbers on a
	 * cell, which contains a given digit.
	 */
	private static final boolean[] ALL_TRUE = { true, true, true, true, true,
			true, true, true, true };

	/** elapsed time stores time in ms since this game has been played */
	private long elapsedTime;

	/**
	 * The array to store the slots.
	 */
	private final GridSlot[][] board = new GridSlot[9][9];

	/** the grids type */
	private String type;

	/**
	 * The back-tracking depth during solving.
	 */
	private short backTrackingDepth = 0;

	/**
	 * Constructor: initialize the empty slots.
	 * 
	 * @param type
	 *            the Grid's type
	 */
	public Grid(String type) {
		super();
		this.type = type;

		// intialize array
		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				board[row][col] = new GridSlot();
			}
		}

	}

	/**
	 * Constructor to initialize the empty slots from storage.
	 * 
	 * @param byteArray
	 *            the byte[] containing the stored data
	 * 
	 * @throws IOException
	 *             if byteArray could not be read as expected
	 */
	public Grid(final byte[] byteArray) throws IOException {
		super();

		// intialize array
		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				board[row][col] = new GridSlot();
			}
		}

		// fill grid from byte array
		final ByteArrayInputStream bais = new ByteArrayInputStream(byteArray);
		final DataInputStream inputStream = new DataInputStream(bais);

		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				final GridSlot slot = getSlot(row, col);
				final int b = inputStream.readUnsignedByte();
				slot.initializeFromStorage(b);
			}
		}
		setElapsedTime(inputStream.readLong());
		type = inputStream.readUTF();

		readPencilMarkPositions(inputStream);

	}

	/**
	 * Copy the current grid. Used to store a possible solution.
	 * 
	 * @return cloned Grid
	 */
	public Grid clone() {

		final Grid newGrid = new Grid(type);

		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				final GridSlot toCopy = getSlot(row, col);
				final GridSlot newSlot = newGrid.board[row][col] = new GridSlot();

				newSlot.setAnswer(toCopy.getAnswer());
				newSlot.setShown(toCopy.getShown());
				newSlot.setOriginalDigit(toCopy.isOriginalDigit());

				// copy pencil marks
				newSlot.setPencilMarks(toCopy.getPencilMarks());
			}
		}
		return newGrid;
	}

	/**
	 * Get the slot at the specified position.
	 * 
	 * @param row
	 *            the Row
	 * @param col
	 *            The Column
	 * @return the specific GridSlot
	 */
	public GridSlot getSlot(final byte row, final byte col) {
		return board[row][col];
	}

	/**
	 * Check if the current grid is equal to the specified grid (comparing
	 * display state).
	 * 
	 * @param grid2
	 *            Grid to compare
	 * @param posToCompare
	 *            the Position[] to reduce the check on
	 * @return true if equal to solution 2
	 */
	public final boolean equalShown(final Grid grid2,
			final Position[] posToCompare) {

		for (int i = 0; i < posToCompare.length; i++) {
			Position position = posToCompare[i];
			final int d1 = this.getSlot(position.row, position.col).getShown();
			final int d2 = grid2.getSlot(position.row, position.col).getShown();
			if (d1 != d2) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Promote a hidden digit and show the solution for this slot.
	 * 
	 * @param row
	 *            the Row
	 * @param col
	 *            the Column
	 */
	public void promote(final byte row, final byte col) {
		getSlot(row, col).promote();
	}

	/**
	 * Clear all pencil marks. Needed after creation, to elimitate the temporary
	 * solutions.
	 */
	public void clearPencilMarks() {

		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {

				board[row][col].setPencilMarks(0);
			}
		}
	}

	/**
	 * Clear all not-original digits.
	 */
	public void clearDigits() {

		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {

				if (!board[row][col].isOriginalDigit()) {
					board[row][col].setShown((byte) 0);
				}
			}
		}
	}

	/**
	 * Check if every shown digit equals the answer.
	 * 
	 * @return true if grid is filled correctly
	 */
	public boolean isSolved() {

		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				if (board[row][col].getShown() != board[row][col].getAnswer()) {
					return false;
				}
			}
		}
		return true;
	}

	/**
	 * Check if every shown digit is filled.
	 * 
	 * @return true if all cells are occupied
	 */
	public boolean isCompletelyFilled() {

		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				if (board[row][col].getShown() == 0) {
					return false;
				}
			}
		}
		return true;
	}

	/**
	 * Initialze the array 'possibleDigits'. At the beginning every digit is
	 * possible at each slot. Than check each row, column and block and
	 * elimanate the digits which are already fixed (orginalDigit).
	 * 
	 * @return number of possible digits (left pencimarks, a complexity
	 *         indicator)
	 */
	protected short setupPossibleDigits() {

		// set everything to true
		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				for (byte i = 0; i < 9; i++) {
					this.getSlot(row, col).setPencilMark(i, true);
				}
			}
		}

		short sum = 81 * 9;

		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				final GridSlot slot = this.getSlot(row, col);
				final byte d = slot.getShown();

				if (d > 0) {
					// original slot => only this digit is valid
					for (byte i = 0; i < 9; i++) {
						if (i != d - 1) {
							if (this.getSlot(row, col).isPencilMark(i))
								sum--;
							this.getSlot(row, col).setPencilMark(i, false);
						}
					}
				}

				// remove digits in row
				for (byte r = 0; r < 9; r++) {
					final GridSlot checkSlot = this.getSlot(r, col);
					final byte digit = checkSlot.getShown();
					if (digit > 0 && checkSlot != slot) {
						if (this.getSlot(row, col).isPencilMark(digit - 1))
							sum--;
						this.getSlot(row, col).setPencilMark(digit - 1, false);
					}
				}

				// remove digits in column
				for (byte c = 0; c < 9; c++) {
					final GridSlot checkSlot = this.getSlot(row, c);
					final byte digit = checkSlot.getShown();
					if (digit > 0 && checkSlot != slot) {
						if (this.getSlot(row, col).isPencilMark(digit - 1))
							sum--;
						this.getSlot(row, col).setPencilMark(digit - 1, false);
					}
				}

				// check blocks
				final byte basicRow = (byte) (((byte) row / 3) * 3);
				final byte basicCol = (byte) (((byte) col / 3) * 3);
				for (byte i = 0; i < 3; i++) {
					for (byte j = 0; j < 3; j++) {
						final GridSlot checkSlot = this.getSlot(
								(byte) (basicRow + i), (byte) (basicCol + j));
						final byte digit = checkSlot.getShown();
						if (digit > 0 && checkSlot != slot) {
							if (this.getSlot(row, col)
									.isPencilMark(digit - 1))
								sum--;
							this.getSlot(row, col).setPencilMark(digit - 1,
									false);
						}
					}
				}

			} // foreach column
		}// foreach row

		return sum;
	}

	/**
	 * Initialze the pencil marks. Remove all given digits from empty position
	 * vector.
	 * 
	 * @param emptyPostions
	 *            the positions of still empty slots
	 */
	public void intializePencilMarks(final Vector emptyPostions) {

		// at startup: all pencil marks are possible
		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				for (byte digit = 0; digit < 9; digit++) {
					board[row][col].setPencilMark(digit, true);
				}
			}
		}

		// set already given digits (and remove the invalid pencil marks)
		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				if (board[row][col].isOriginalDigit()) {
					setSolvedDigit(new Position(row, col), board[row][col]
							.getAnswer(), emptyPostions);
				}
			}
		}

	}

	/**
	 * Get Elapsed time stored in the grid. This is not the current running
	 * time, but the last stored run-time
	 * 
	 * @return stored elapsed time
	 */
	public long getElapsedTime() {
		return elapsedTime;
	}

	/**
	 * Set the elapsed time for this Grid.
	 * 
	 * @param elapsedTime
	 */
	public void setElapsedTime(long elapsedTime) {
		this.elapsedTime = elapsedTime;
	}

	/**
	 * Stores the Digits from the cells to the output Stream.
	 * 
	 * @param outputStream
	 *            the DataOutputStream to write into
	 * @throws IOException
	 *             if writing fails
	 */
	private void storeSlots(DataOutputStream outputStream) throws IOException {

		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				final GridSlot slot = getSlot(row, col);
				outputStream.writeByte(slot.getStateOfSlotForStorage());
			}
		}
	}

	/**
	 * Stores the Pencilmarks from the cells to the output Stream.
	 * 
	 * @param outputStream
	 *            the DataOutputStream to write into
	 * @throws IOException
	 *             if writing fails
	 */
	private void storePencilMarks(final DataOutputStream outputStream)
			throws IOException {

		for (byte i = 0; i < 9; i++) {
			boolean digitWritten = false;
			for (byte row = 0; row < 9; row++) {
				for (byte col = 0; col < 9; col++) {
					final GridSlot slot = getSlot(row, col);
					final int pos = row * 9 + col;

					if (slot.isPencilMark(i)) {
						if (!digitWritten) {
							// digits are indicated by +100
							outputStream.writeByte(100 + i);
							digitWritten = true;
						}
						outputStream.writeByte(pos);
					}
				}
			}
		}
		// write End Mark
		outputStream.writeByte(110);

	}

	/**
	 * Pencil mark stored as list of bytes. '110' is the last byte to mark the
	 * end. All bytes >= 100 represent the digit ( x - 100). All following bytes <
	 * 100 represent the positions for the pencil mark.
	 * 
	 * @param inputStream
	 *            the DataInputStream to read from
	 * @throws IOException
	 */
	private void readPencilMarkPositions(final DataInputStream inputStream)
			throws IOException {

		int digit = 0;
		int b = 0;
		do {
			b = inputStream.readUnsignedByte();
			if (b >= 100) {
				digit = b - 100;
			} else {
				final byte row = (byte) (b / 9);
				final byte col = (byte) (b % 9);
				final GridSlot slot = getSlot(row, col);
				slot.setPencilMark(digit, true);

			}
		} while (b != 110);

	}

	/**
	 * Serialize the Grid.
	 * 
	 * @return the byte[] with the serialized grid
	 * @throws IOException
	 *             if writing fails
	 */
	public byte[] toByteArray() throws IOException {

		final ByteArrayOutputStream baos = new ByteArrayOutputStream();
		final DataOutputStream outputStream = new DataOutputStream(baos);

		storeSlots(outputStream);
		outputStream.writeLong(getElapsedTime());
		outputStream.writeUTF(type);

		storePencilMarks(outputStream);

		return baos.toByteArray();

	}

	/**
	 * Get Type (normal, hard ,...) of grid game.
	 * 
	 * @return String with type identifier.
	 */
	public String getType() {
		return type;
	}

	/**
	 * Set a digit to a position. Remove this postion fom empty positions and
	 * recalculate pencil marks for this digit for all still empty positions.
	 * 
	 * @param pos
	 *            the position
	 * @param digit
	 *            the digit to set
	 * @param emptyPositons
	 *            the empty positions (will be reduced)
	 */
	public void setSolvedDigit(final Position pos, final byte digit,
			final Vector emptyPositons) {

		// set new values
		board[pos.row][pos.col].setShown(digit);
		board[pos.row][pos.col].setOriginalDigit(true);

		// only this pencil marks is still valid
		board[pos.row][pos.col].setPencilMarks(0);
		board[pos.row][pos.col].setPencilMark(digit - 1, true);

		// position is now filled => remove from vector
		emptyPositons.removeElement(pos);

		// eliminate pencil marks
		eliminatePencilMarks(pos, digit, emptyPositons);
	}

	/**
	 * Remove all pencil marks of this digit in the same row, column and block.
	 * Only check the still empty positons.
	 * 
	 * @param pos
	 *            the position which had been solved
	 * @param digit
	 *            the digit of this position
	 * @param emptyPositons
	 *            the empty cells to check.
	 */
	private void eliminatePencilMarks(final Position pos, final byte digit,
			final Vector emptyPositons) {

		// loop over all still empty positions
		final Enumeration positions = emptyPositons.elements();
		while (positions.hasMoreElements()) {
			final Position posToCheck = (Position) positions.nextElement();

			// eliminate pencil marks
			// check row
			if (posToCheck.row == pos.row && posToCheck.col != pos.col) {
				board[pos.row][posToCheck.col].setPencilMark(digit - 1, false);
			}

			// check column
			if (posToCheck.col == pos.col && posToCheck.row != pos.row) {
				board[posToCheck.row][pos.col].setPencilMark(digit - 1, false);
			}

			// check block
			if (posToCheck.getBlockNumber() == pos.getBlockNumber()) {
				if (posToCheck.row != pos.row && posToCheck.col != pos.col) {
					board[posToCheck.row][posToCheck.col].setPencilMark(
							digit - 1, false);
				}
			}
		}
	}

	/**
	 * Get all positions of not-given cells.
	 * 
	 * @return vector of Positions
	 */
	public Vector allEmptyPositions() {

		final Vector emptyPositions = new Vector();

		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {

				if (!board[row][col].isOriginalDigit()) {
					emptyPositions.addElement(new Position(row, col));
				}
			}
		}

		return emptyPositions;
	}

	/**
	 * Check if the position is a 'Single'. Count possible pencil marks for this
	 * position. If only 1 pencilmark left, than this is a 'Single'. Returns the
	 * digit which is left. Returns 0 if this is not a 'Single'.
	 * 
	 * @param pos
	 *            the position to check
	 * @return 0 if no single, or the digit if this is a single or -1 if
	 *         unsolvable
	 */
	public byte isSingle(final Position pos) {

		int count = 0;
		byte lastValidDigit = 0;

		// count pencil marks for this slot
		for (int i = 0; i < 9; i++) {
			if (board[pos.row][pos.col].isPencilMark(i)) {
				count++;
				lastValidDigit = (byte) (i + 1);
			}
		}

		if (count == 1) {
			// found single
			return lastValidDigit;
		} else if (count == 0) {
			return -1;
		}

		return 0;
	}

	/**
	 * Check if the position contains a 'Hidden Single'. Check each possible
	 * digit, if there is another place of this digit in this row, column or
	 * block.
	 * 
	 * @param pos
	 *            the position to check
	 * @return 0, if no hidden single. Returns the digit if this is a hidden
	 *         single.
	 */
	public byte isHiddenSingle(final Position pos) {

		for (byte digit = 0; digit < 9; digit++) {

			if (board[pos.row][pos.col].isPencilMark(digit)) {
				// still a valid digit for the cell to check

				if (isHiddenSingle(pos, digit)) {
					return (byte) (digit + 1);
				}
			}
		}

		return 0;
	}

	/**
	 * Check if this position contains a 'Hidden Single' for this digit. Check
	 * if this digit is a valid pencilmark in this row, column or this vblock.
	 * 
	 * @param pos
	 *            the position to check
	 * @param digit
	 *            the digit to check
	 * @return true, if hidden single is found
	 */
	public boolean isHiddenSingle(final Position pos, final byte digit) {

		// check row
		int count = 0;
		for (byte r = 0; r < 9; r++) {
			if (board[r][pos.col].isPencilMark(digit)) {
				count++;
			}
		}
		if (count == 1) {
			return true;
		}

		// check column
		count = 0;
		for (byte c = 0; c < 9; c++) {
			if (board[pos.row][c].isPencilMark(digit)) {
				count++;
			}
		}
		if (count == 1) {
			return true;
		}

		// check 3x3 block
		count = 0;
		final byte blockStartRow = (byte) (((int) (pos.row / 3)) * 3);
		final byte blockStartCol = (byte) (((int) (pos.col / 3)) * 3);
		for (byte r = blockStartRow; r < blockStartRow + 3; r++) {
			for (byte c = blockStartCol; c < blockStartCol + 3; c++) {

				if (board[r][c].isPencilMark(digit)) {
					count++;
				}
			}
		}
		if (count == 1) {
			return true;
		}

		return false;
	}

	/**
	 * Hide a position.
	 * 
	 * @param pos
	 *            the position to check
	 * @return true, if number was filled before
	 */
	public boolean hideNumber(final Position pos) {

		final GridSlot slot = board[pos.row][pos.col];
		if (slot.getShown() > 0) {
			// 0 = clear this slot for display
			slot.setShown((byte) 0);
			slot.setOriginalDigit(false);
			return true;
		}
		return false;
	}

	/**
	 * Unhide a position.
	 * 
	 * @param pos
	 *            the position to show
	 */
	private void unhideNumber(final Position pos) {

		final GridSlot slot = board[pos.row][pos.col];
		slot.setShown(slot.getAnswer());
		slot.setOriginalDigit(true);
	}

	/**
	 * Unhide the positions.
	 * 
	 * @param hidePositions
	 *            list of Positions
	 */
	public void unhideNumbers(final Vector hidePositions) {

		final Enumeration positions = hidePositions.elements();
		while (positions.hasMoreElements()) {
			final Position pos = (Position) positions.nextElement();

			unhideNumber(pos);

		}
	}

	/**
	 * Helper to copy Shown digit to Answer digit.
	 * 
	 */
	public void copyShownToAnswer() {

		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				final GridSlot slot = getSlot(row, col);

				slot.setAnswer(slot.getShown());
			}
		}

	}

	/**
	 * Helper to copy all answer digits and reset the others (including pencil
	 * marks).
	 * 
	 */
	public void resetForEdit() {

		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				final GridSlot slot = getSlot(row, col);

				if (!slot.isOriginalDigit()) {
					slot.setShown((byte) 0);
					slot.setAnswer((byte) 0);
				}
				slot.setOriginalDigit(false);
				slot.setPencilMarks(0);
			}
		}

	}

	/**
	 * Set input digits to be given ones.
	 */
	protected void setAllShownDigitsAsOriginal() {

		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				final GridSlot slot = getSlot(row, col);

				if (slot.getShown() > 0) {
					slot.setAnswer(slot.getShown());
					slot.setOriginalDigit(true);
				}
			}
		}
	}

	/**
	 * Get the number of backtracks during solve to help rating a puzzle.
	 * 
	 * @return the number of backtracking usage during automated solving
	 */
	public short getBackTrackingDepth() {
		return backTrackingDepth;
	}

	/**
	 * Set the Numbers of backtrack step during puzzle solve.
	 * 
	 * @param backTrackingDepth
	 *            the number of back track steps
	 */
	public void setBackTrackingDepth(short backTrackingDepth) {
		this.backTrackingDepth = backTrackingDepth;
	}

	/**
	 * Set a type name for the puzzle (hard, easy, user, ...)
	 * 
	 * @param type
	 *            the String to set
	 */
	public void setType(String type) {
		this.type = type;
	}

	/**
	 * Get the number of given cells.
	 * 
	 * @return the current number of not empty cells
	 */
	public short getNumberOfGiven() {
		return (short) (81 - allEmptyPositions().size());
	}

	/**
	 * Get the number of 'Singles' and 'Hidden Singles'.
	 * 
	 * @return the current number of singles and hidden singles
	 */
	public short getNumberOfSingles() {

		short sum = 0;

		final Enumeration emptyPositions = allEmptyPositions().elements();
		while (emptyPositions.hasMoreElements()) {
			final Position pos = (Position) emptyPositions.nextElement();

			if (isSingle(pos) > 0 || isHiddenSingle(pos) > 0) {
				sum++;
			}
		}

		return sum;
	}

	/**
	 * Helper Method to check a grid if some 'basic' rules are valid for an user
	 * edited grid.
	 * 
	 * @return true if rules passed
	 */
	public boolean checkForRules() {

		setupPossibleDigits();
		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				final GridSlot slot = getSlot(row, col);
				int count = 0;
				for (int i = 0; i < 9; i++) {
					if (slot.isPencilMark(i)) {
						count++;
					}
				}
				if (count == 0) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Count the occurences of every shown digit within this grid.
	 * 
	 * @return digit counts in array for 0 (not set) to digits 1..9
	 */
	public int[] getDigitCounts() {

		final int[] count = new int[10];
		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {
				count[getSlot(row, col).getShown()]++;
			}
		}

		return count;
	}

	/**
	 * Randomize the digits. Change all d1's to d2's and vice versa
	 */
	protected void randomizeDigits() {

		for (byte d1 = 1; d1 <= 9; d1++) {
			byte d2 = d1;
			while (d1 == d2) {
				// search another digit
				d2 = (byte) (randomDigit((byte) 9) + 1);
			}
			// change all d1's to d2's and vice versa
			for (byte row = 0; row < 9; row++) {
				for (byte col = 0; col < 9; col++) {
					final GridSlot slot = getSlot(row, col);
					if (slot.getAnswer() == d1) {
						slot.setAnswer(d2);
						if (slot.getShown() != 0) {
							slot.setShown(d2);
						}
					} else if (slot.getAnswer() == d2) {
						slot.setAnswer(d1);
						if (slot.getShown() != 0) {
							slot.setShown(d1);
						}
					}
				}
			}
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
	 * Check if the entered digit on the specified position as any conflict with
	 * already shown digits in the same row, column or block. If there are
	 * conflicts, return the position of these conflict-slot. If there are no
	 * conflict, the list is empty.
	 * 
	 * @param row
	 *            the row position of the new entered digit
	 * @param col
	 *            the col position of the new entered digit
	 * @param digit
	 *            the entered digit
	 * @return the list with conflict-slots
	 */
	public Vector getConflictPositions(final byte row, final byte col,
			final int digit) {

		if (digit == 0) {
			// clear a slot => no conflicts
			return null;
		}
		final Vector conflictPos = new Vector();
		for (byte i = 0; i < 9; i++) {
			// check row
			if (i != row && board[i][col].getShown() == digit) {
				conflictPos.addElement(new Position(i, col));
			}
			// check column
			if (i != col && board[row][i].getShown() == digit) {
				conflictPos.addElement(new Position(row, i));
			}
		}

		// check 3x3 block
		final byte blockStartRow = (byte) (((int) (row / 3)) * 3);
		final byte blockStartCol = (byte) (((int) (col / 3)) * 3);
		for (byte r = blockStartRow; r < blockStartRow + 3; r++) {

			if (r == row)
				continue;

			for (byte c = blockStartCol; c < blockStartCol + 3; c++) {

				if (c == col)
					continue;

				if (board[r][c].getShown() == digit) {
					conflictPos.addElement(new Position(r, c));
				}
			}
		}

		return conflictPos;
	}

	/**
	 * Retrieve not allowed digits info for a specific cell by checking a
	 * digit's occurance in col, row, block.
	 * 
	 * @param row
	 *            the row position to observe
	 * @param col
	 *            the col position to observe
	 * 
	 * @return the boolean[] for the conflicting digits (if set, digit is in
	 *         conflict).
	 */
	public boolean[] getConflictingDigitsForPos(final byte row, final byte col) {

		// original digit cannot be set, so all digits are in conflict, as none
		// can be set to the cell
		if (board[row][col].isOriginalDigit()) {
			return ALL_TRUE;
		}
		final boolean[] notAllowedDigits = new boolean[9];

		for (byte digit = 1; digit < 10; digit++) {

			for (byte i = 0; i < 9 && !notAllowedDigits[digit - 1]; i++) {
				// check row
				if (i != row && board[i][col].getShown() == digit) {
					notAllowedDigits[digit - 1] = true;
				}
				// check column
				if (i != col && board[row][i].getShown() == digit) {
					notAllowedDigits[digit - 1] = true;
				}
			}

			// check 3x3 block
			final byte blockStartRow = (byte) (((int) (row / 3)) * 3);
			final byte blockStartCol = (byte) (((int) (col / 3)) * 3);
			for (byte r = blockStartRow; !notAllowedDigits[digit - 1]
					&& r < blockStartRow + 3; r++) {

				if (r == row)
					continue;

				for (byte c = blockStartCol; c < blockStartCol + 3; c++) {

					if (c == col)
						continue;

					if (board[r][c].getShown() == digit) {
						notAllowedDigits[digit - 1] = true;
					}
				}
			}
		}
		return notAllowedDigits;
	}

	/**
	 * Check the grid.
	 * 
	 * @return true if this solution is valid for the grid
	 */
	public boolean isValidSolution() {

		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {

				final byte digit = board[row][col].getShown();
				if (digit == 0)
					return false;

				for (byte i = 0; i < 9; i++) {
					// check row
					if (i != row && board[i][col].getShown() == digit) {
						return false;
					}
					// check column
					if (i != col && board[row][i].getShown() == digit) {
						return false;
					}
				}

				// check 3x3 block
				final byte blockStartRow = (byte) (((int) (row / 3)) * 3);
				final byte blockStartCol = (byte) (((int) (col / 3)) * 3);
				for (byte r = blockStartRow; r < blockStartRow + 3; r++) {

					if (r == row)
						continue;

					for (byte c = blockStartCol; c < blockStartCol + 3; c++) {

						if (c == col)
							continue;

						if (board[r][c].getShown() == digit) {
							return false;
						}
					}
				}

			}
		}
		return true;
	}
}
