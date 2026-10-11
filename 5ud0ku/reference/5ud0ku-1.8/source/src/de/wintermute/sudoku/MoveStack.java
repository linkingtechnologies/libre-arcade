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

/**
 * The stack of moves = store changes for UNDO / REDO functionality.
 * 
 * @author Ivonne Engemann
 * @version $Id: MoveStack.java,v 1.6 2006/03/27 20:45:04 Ivonne Exp $
 */
public class MoveStack {

	/**
	 * Maximum number of stored undo moves.
	 */
	final static private int MAX_NUMBER_OF_STORED_MOVES = 100;

	/**
	 * Stack of moves = changes to the grid.
	 */
	private Move[] moves = new Move[MAX_NUMBER_OF_STORED_MOVES];

	/**
	 * The current position within the move stack for UNDO / REDO.
	 */
	private int currentPos = 0;

	/**
	 * The start position within the move stack for UNDO / REDO.
	 */
	private int startPos = 0;

	/**
	 * The endPosition within the move stack for UNDO / REDO.
	 */
	private int endPos = 0;

	/**
	 * A move to store all changes to the grid for UNDO / REDO functionality.
	 * 
	 * @author Ivonne Engemann
	 * @version $Id: MoveStack.java,v 1.6 2006/03/27 20:45:04 Ivonne Exp $
	 */
	private class Move {

		/**
		 * The row of the change.
		 */
		public byte row;

		/**
		 * The column of the change.
		 */
		public byte col;

		/**
		 * The old value in the cell (used if pen mode). In Pencil mode: old
		 * value = new value, because we only toggle the pencil mark.
		 */
		public byte oldValue;

		/**
		 * The new value in the cell (if pen mode). In Pencil mode: the pencil
		 * mark to toggle.
		 */
		public byte newValue;

		/**
		 * Flag if change was done in pen or in pencil mode.
		 */
		public boolean pencilMode;

		/**
		 * Create a new move instance withh all mandatory data.
		 * 
		 * @param row
		 *            the focus row within the grid
		 * @param col
		 *            the focus column within the grid
		 * @param oldValue
		 *            the old value used if pen mode). In Pencil mode: old value =
		 *            new value, because we only toggle the pencil mark.
		 * @param newValue
		 *            the new value in the cell (if pen mode). In Pencil mode:
		 *            the pencil mark to toggle.
		 * @param pencilMode
		 *            Flag if change was done in pen or in pencil mode.
		 */
		private Move(byte row, byte col, byte oldValue, byte newValue,
				boolean pencilMode) {
			super();
			this.row = row;
			this.col = col;
			this.oldValue = oldValue;
			this.newValue = newValue;
			this.pencilMode = pencilMode;
		}

	}

	/**
	 * Add a new move to the stack for UNDO / REDO functionality.
	 * 
	 * @param row
	 *            the focus row within the grid
	 * @param col
	 *            the focus column within the grid
	 * @param oldValue
	 *            the old value used if pen mode). In Pencil mode: old value =
	 *            new value, because we only toggle the pencil mark.
	 * @param newValue
	 *            the new value in the cell (if pen mode). In Pencil mode: the
	 *            pencil mark to toggle.
	 * @param pencilMode
	 *            Flag if change was done in pen or in pencil mode.
	 */
	public void addMove(final byte row, final byte col, final byte oldValue,
			final byte newValue, final boolean pencilMode) {

		final Move newMove = new Move(row, col, oldValue, newValue, pencilMode);
		moves[currentPos] = newMove;
		currentPos++;
		if (currentPos >= moves.length) {
			currentPos = 0;
		}
		endPos = currentPos;
		if (endPos == startPos) {
			startPos = endPos + 1;
			if (startPos >= moves.length) {
				startPos = 0;
			}
		}
	}

	/**
	 * Go one step back in UNDO stack.
	 * 
	 * @param grid
	 *            the grid to do the change on
	 * @return the position within the grid, where the next change takes place.
	 *         returns null, if step back not possible anymore (every UNDO done)
	 */
	public Position stepBack(final Grid grid) {

		// check range of stack
		if (currentPos == startPos) {
			return null;
		}

		currentPos--;
		if (currentPos < 0) {
			currentPos = moves.length - 1;
		}

		final Position pos = getNextUndoPosition();

		final Move move = moves[currentPos];
		final GridSlot slot = grid.getSlot(move.row, move.col);
		if (move.pencilMode) {
			// toggle pencil mark
			boolean oldValue = slot.isPencilMark(move.oldValue - 1);
			slot.setPencilMark(move.oldValue - 1, !oldValue);
		} else {
			// show old value
			slot.setShown(move.oldValue);
		}

		return pos;
	}

	/**
	 * Go one step forward in REDO stack.
	 * 
	 * @param grid
	 *            the grid to do the change on
	 * @return the position within the grid, where the next change takes place.
	 *         returns null, if step forward not possible anymore (every REDO
	 *         done)
	 * 
	 */
	public Position stepForward(final Grid grid) {

		// check ranges of stack
		if (currentPos == endPos) {
			return null;
		}

		final Move move = moves[currentPos];

		final GridSlot slot = grid.getSlot(move.row, move.col);
		if (move.pencilMode) {
			// toggle pencil mark
			final boolean oldValue = slot.isPencilMark(move.newValue - 1);
			slot.setPencilMark(move.newValue - 1, !oldValue);
		} else {
			// show old value
			slot.setShown(move.newValue);
		}

		currentPos++;
		if (currentPos >= moves.length) {
			currentPos = 0;
		}

		final Position pos = getNextUndoPosition();
		return pos;

	}

	/**
	 * Get the position of the next undo..
	 * 
	 * @return the position within the grid, where the next change takes place.
	 *         returns null, if no step was done
	 * 
	 */
	public Position getNextUndoPosition() {

		// check ranges of stack
		if (currentPos == startPos) {
			return null;
		}

		int nextUndoPos = currentPos - 1;
		if (nextUndoPos < 0) {
			nextUndoPos = moves.length - 1;
		}

		final Move currentMove = moves[nextUndoPos];
		final Position pos = new Position(currentMove.row, currentMove.col);
		return pos;

	}

	/**
	 * Reset the whole UNDO / REDO stack.
	 */
	public void resetStack() {

		currentPos = 0;
		startPos = 0;
		endPos = 0;

	}

}
