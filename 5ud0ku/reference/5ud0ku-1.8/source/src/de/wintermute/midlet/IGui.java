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
 * The interface for the GUI class to use.
 * 
 * @author Ivonne Engemann
 * @version $Id: IGui.java,v 1.4 2006/10/21 13:42:02 marcus Exp $
 */
public interface IGui {

	/**
	 * Paint the current display.
	 * 
	 * @param g
	 *            the graphic context to use
	 */
	public void paint(final Graphics g);

	/**
	 * A Key was pressed: handle the key in the GUI class.
	 * 
	 * @param key
	 *            the key code of the pressed key
	 */
	public void keyPressed(final int key);

	/**
	 * A pointer click was done to the display.
	 * @param x the x axis
	 * @param y the y axis
	 */
	public void pointerPressed(final int x, final int y);

	/**
	 * A Key was pressed: handle the key in the GUI class.
	 * 
	 * @param key
	 *            the key code of the pressed key
	 */
	public void keyRepeated(final int key);

	/**
	 * Initialize the GUI class with the canvas inplemenatation.
	 * 
	 * @param canvas
	 *            the canvas implemenation to use
	 * @param theMidlet
	 *            the midlet to use
	 * 
	 */
	public void init(final Canvas canvas, final MIDlet theMidlet);

}
