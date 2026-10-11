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

import javax.microedition.lcdui.Canvas;
import javax.microedition.lcdui.Graphics;
import javax.microedition.midlet.MIDlet;

/**
 * The "normal" canvas class (not Device Specific, not MIDP 2.0).
 * 
 * @author Ivonne Engemann
 * @version $Id: MyCanvas.java,v 1.4 2006/10/21 13:42:03 marcus Exp $
 * 
 */
public class MyCanvas extends Canvas implements ICanvas {

	/**
	 * The GUI class to use for painting and key handling.
	 */
	protected IGui gui;

	/**
	 * The midlet to use
	 */
	protected MIDlet midlet;

	/**
	 * Use FullScreen-Mode if requested and possible.
	 * 
	 * @param useFullScreen
	 */
	public void setFullScreenRequested(final boolean useFullScreen) {
		// no effect in midp1
	}

	/**
	 * Initialize the canvas.
	 * 
	 * @param g
	 *            the GUI implementation to use
	 * 
	 * @param m
	 *            the midlet to use
	 * @return the GUI implementation
	 */
	public void init(final MIDlet m, final IGui g) {

		midlet = m;
		gui = g;

		gui.init(this, midlet);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Canvas#paint(javax.microedition.lcdui.Graphics)
	 */
	protected void paint(final Graphics g) {
		gui.paint(g);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Canvas#keyPressed(int)
	 */
	protected void keyPressed(final int k) {
		gui.keyPressed(k);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Displayable#keyRepeated(int)
	 */
	public void keyRepeated(final int key) {
		gui.keyRepeated(key);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Canvas#pointerPressed(int, int)
	 */
	public void pointerPressed(final int x, final int y) {
		gui.pointerPressed(x, y);
	}

	/**
	 * Set new Title, if possible (MIDP 2.0 only).
	 * 
	 * @param newTitle
	 *            the new title
	 */
	public void setNewTitle(final String newTitle) {
		// no effect in midp1
	}
}
