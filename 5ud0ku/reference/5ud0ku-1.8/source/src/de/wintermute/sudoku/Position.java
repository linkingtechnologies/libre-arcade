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
 * A position with the grid: row + column.
 *  
 * @author Ivonne Engemann
 * @version $Id: Position.java,v 1.5 2006/03/11 16:54:24 marcus Exp $
 */
public class Position {

	/**
	 * The row (0..8).
	 */
	public byte row;

	/**
	 * The column (0..8).
	 */
	public byte col;

	/**
	 * Create new postion.
	 * 
	 * @param row
	 *            the row (0..8)
	 * @param col
	 *            the col (0..8)
	 */
	public Position(final byte row, final byte col) {
		super();
		this.row = row;
		this.col = col;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see java.lang.Object#equals(java.lang.Object)
	 */
	public boolean equals(Object pos) {

		if (pos instanceof Position) {
			return this.row == ((Position) pos).row
					&& this.col == ((Position) pos).col;
		} else {
			return false;
		}
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see java.lang.Object#hashCode()
	 */
	public int hashCode() {

		return this.row + this.col * 13;
	}

	/**
	 * Calculate the block number of a position.
	 * 
	 * @return the block number (1-9)
	 */
	public byte getBlockNumber() {

		return Position.getBlockNumber(row, col);
	}

	/**
	 * Get all positions.
	 * 
	 * @return return vector of Positions
	 */
	public static Vector allPositions() {

		final Vector positions = new Vector();

		for (byte row = 0; row < 9; row++) {
			for (byte col = 0; col < 9; col++) {

				positions.addElement(new Position(row, col));
			}
		}

		return positions;

	}

	/**
	 * Calculate block number of digit.
	 * 
	 * @param aRow the row byte
	 * @param aCol the col byte
	 * @return block number (1-9)
	 */
	public static byte getBlockNumber(byte aRow, byte aCol) {
		return (byte) ((((int) (aRow / 3)) * 3) + (aCol / 3));
	}
}
