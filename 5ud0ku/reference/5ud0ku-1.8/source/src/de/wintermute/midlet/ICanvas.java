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

import javax.microedition.midlet.MIDlet;

/**
 * The common interface to use the special canvas implementation from the midlet
 * class.
 * 
 * @author Ivonne Engemann
 * @version $Id: ICanvas.java,v 1.2 2006/10/21 13:38:54 marcus Exp $
 */
public interface ICanvas {

	/**
	 * Initialize the canvas.
	 * 
	 * @param gui
	 *            the the GUI to use
	 * @param midlet
	 *            the midlet to use
	 */
	public void init(final MIDlet midlet, final IGui gui);

	/**
	 * Try to use the FullScreen Mode (if requested and possible).
	 * 
	 * @param useFullScreen
	 */
	public void setFullScreenRequested(final boolean useFullScreen);

	/**
	 * Declaration of your own getHeight() method, just because getHeight() was
	 * moved from Canvas to Displayable in MIDP 2.0 => avoid that code is linked
	 * to Displayable during build with MIDP 2.0, which might cause problems on
	 * MIPD 1.0 devices (NoSuchMethodError)
	 * 
	 * @return the height of the canvas (depending on fullsize option)
	 */
	public int getHeight();

	/**
	 * Declaration of your own getWidth() method, just because getWidth() was
	 * moved from Canvas to Displayable in MIDP 2.0 => avoid that code is linked
	 * to Displayable during build with MIDP 2.0, which might cause problems on
	 * MIPD 1.0 devices (NoSuchMethodError)
	 * 
	 * @return the width of the canvas (depending on fullsize option)
	 */
	public int getWidth();
	/**
	 * Set a canvas title.
	 * 
	 * @param newTitle the String with the new title
	 */
	public void setNewTitle(final String newTitle);
}