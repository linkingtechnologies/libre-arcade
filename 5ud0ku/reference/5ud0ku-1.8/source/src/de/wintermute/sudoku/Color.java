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
 * Color type stores default color, identifier and current color values.
 * 
 * @author marcus
 * @version $Id: Color.java,v 1.2 2006/06/13 18:09:32 marcus Exp $
 */
public class Color {

	/** the default color value */
	private final int defaultValue;

	/** the current color value */
	private int value;

	/** the id used to e.g. access dict entries. */
	private final String identifier;

	/**
	 * Create a color object
	 * 
	 * @param name
	 *            the id used to refer to the color, e.g. for Dict access
	 * @param defaultValue
	 *            the int specifying the standard color
	 * @param currentValue
	 *            the int specifying the current valid color
	 */
	public Color(final String name, final int defaultValue,
			final int currentValue) {
		this.identifier = name;
		this.defaultValue = defaultValue;
		if (currentValue < 0) {
			this.value = defaultValue;
		} else {
			this.value = currentValue;
		}
	}

	/**
	 * Reset the color to its default value.
	 */
	public void reset() {
		this.value = this.defaultValue;
	}

	/**
	 * @return the name-id of this color
	 */
	public String getIdentifier() {
		return identifier;
	}

	/**
	 * @return the current value
	 */
	public int getValue() {
		return value;
	}

	/**
	 * Set the current value.
	 * 
	 * @param value
	 *            the int Color value to set as current
	 */
	public void setValue(int value) {
		this.value = value;
	}
}
