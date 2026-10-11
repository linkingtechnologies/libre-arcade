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
 * A single slot in the grid.
 * 
 * Conatins the solution and the current display state.
 * 
 * @author Ivonne Engemann
 * @version $Id: GridSlot.java,v 1.7 2006/03/27 20:45:58 Ivonne Exp $
 */
public class GridSlot {

	/**
	 * The digit displayed. Format: 0 - 9 0 = empty slot
	 */
	private byte shown;

	/**
	 * The correct answer. Format: 1 - 9
	 */
	private byte answer;

	/**
	 * The original digits shown as hint in the beginning of the game. They are
	 * inmutable during the game.
	 */
	private boolean originalDigit;

	/**
	 * Pencil Marks: the user can mark which possible digits are still valid for
	 * the slot. Used during solving too, to identify whicch digits are still
	 * valid.
	 */
	private int pencilMarks = 0;

	public byte getAnswer() {
		return answer;
	}

	public void setAnswer(byte answer) {
		this.answer = answer;
	}

	public byte getShown() {
		return shown;
	}

	public void setShown(byte shown) {
		this.shown = shown;
	}

	public boolean isOriginalDigit() {
		return originalDigit;
	}

	public void setOriginalDigit(boolean originalDigit) {
		this.originalDigit = originalDigit;
	}

	/**
	 * Promote the soltuion. Show the right digit.
	 */
	public void promote() {
		setShown(getAnswer());
	}

	public int getPencilMarks() {
		return pencilMarks;
	}

	public void setPencilMarks(final int pencilMarks) {
		this.pencilMarks = pencilMarks;
	}

	/**
	 * Representation for storage: byte with maximum 3 digit first digit ( = x *
	 * /100) is 1 if original digit (0..1) second digit ( = (x / 10) % 10) is
	 * the shown value (1..9) third digit ( = x % 100) is the answer value
	 * (1..9)
	 * 
	 * @return byte representation of the slot
	 */
	public byte getStateOfSlotForStorage() {

		int i = getAnswer();
		i += (getShown() * 10);
		if (isOriginalDigit())
			i += 100;

		return (byte) i;

	}

	/**
	 * Initialize the slot from storage representation. byte with maximum 3
	 * digit first digit ( = x * /100) is 1 if original digit (0..1) second
	 * digit ( = (x / 10) % 10) is the shown value (1..9) third digit ( = x %
	 * 10) is the answer value (1..9)
	 * 
	 * 
	 * @param storage
	 *            the int containing the Slot Information
	 */
	public void initializeFromStorage(final int storage) {
		setOriginalDigit(storage >= 100);
		setShown((byte) ((storage / 10) % 10));
		setAnswer((byte) (storage % 10));

	}

	/**
	 * Check if a pencil mark is set or not.
	 * 
	 * @param idx
	 *            index of the checked digit (0..8)
	 * @return true if pencil mark is set
	 */
	public boolean isPencilMark(final int idx) {

		return (pencilMarks & (1 << idx)) != 0;
	}

	/**
	 * Set a pencil mark.
	 * 
	 * @param idx
	 *            index of the digit (0..8)
	 * @param mark
	 *            flag is ppencilmark should be marked or not
	 */
	public void setPencilMark(final int idx, final boolean mark) {
		if (mark) {
			this.pencilMarks |= (1 << idx);
		} else {
			this.pencilMarks &= ~(1 << idx);
		}
	}

}
