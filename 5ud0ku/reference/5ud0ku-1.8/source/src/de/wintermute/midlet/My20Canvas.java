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
 * The Canvas class with MIDP 2.0 support.
 * 
 * 
 * @author Ivonne Engemann
 * @version $Id: My20Canvas.java,v 1.4 2006/10/21 13:42:02 marcus Exp $
 */
public class My20Canvas extends MyCanvas {

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Displayable#sizeChanged(int, int)
	 */
	public void sizeChanged(final int newWidth, final int newHeight) {

		// some devices use this callback to tell the new size
		// re-initialize the GUI class to use new width or height
		init(midlet, gui);
	}

	/**
	 * Use FullScreen-Mode if requested and possible.
	 * 
	 * @param useFullScreen
	 */
	public void setFullScreenRequested(final boolean useFullScreen) {

		setFullScreenMode(useFullScreen);
		super.setFullScreenRequested(useFullScreen);

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see de.wintermute.midlet.ICanvas#init(javax.microedition.midlet.MIDlet,
	 *      de.wintermute.midlet.IGui)
	 */
	public void init(final MIDlet m, final IGui g) {
		super.init(m, g);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see de.wintermute.midlet.ICanvas#setNewTitle(java.lang.String)
	 */
	public void setNewTitle(final String newTitle) {
		setTitle(newTitle);
		super.setNewTitle(newTitle);
	}
}
