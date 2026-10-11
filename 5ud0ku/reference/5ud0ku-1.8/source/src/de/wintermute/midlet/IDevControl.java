/*
 *******************************************************************************
 * Java Tools for common purposes.
 * see startofentry.de or wintermute.de 
 *
 * Copyright (c) 2006 Ivonne Engemann and Marcus Wagner
 *
 * Enjoy.
 ******************************************************************************/
package de.wintermute.midlet;

/**
 * Interface to allow access to DevSpecific actions in abstract way.
 * 
 * @author marcus
 * @version $Id: IDevControl.java,v 1.2 2006/10/21 14:30:18 ive Exp $
 */
public interface IDevControl {
	/**
	 * Set the backlight value of the display.
	 * 
	 * @param level
	 *            an int (0=off)
	 */
	public void setBacklight(final int level);
}
