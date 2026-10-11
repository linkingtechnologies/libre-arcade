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
import javax.microedition.lcdui.Command;
import javax.microedition.lcdui.CommandListener;

/**
 * The abstract ui class to be extended by .
 * 
 * @author Ivonne Engemann
 * @version $Id: CommonUI.java,v 1.1 2006/10/21 13:38:21 marcus Exp $
 */

public abstract class CommonUI implements IGui {

	/**
	 * The canvas itself.
	 */
	private Canvas theCanvas;

	/**
	 * Set the canvas delegate.
	 * 
	 * @param theCanvas
	 *            the canvas implementation to use.
	 */
	protected void setCanvas(final Canvas theCanvas) {

		this.theCanvas = theCanvas;
	}

	/**
	 * Add a command to the canvas.
	 * 
	 * @param command
	 *            the command to add
	 */
	public final void addCommand(final Command command) {

		if (theCanvas != null)
			theCanvas.addCommand(command);
	}

	/**
	 * Get the game action for the key.
	 * 
	 * @param key
	 *            the pressed key
	 * @return the game action
	 */
	public final int getGameAction(final int key) {

		if (theCanvas != null)
			return theCanvas.getGameAction(key);

		return 0;
	}

	/**
	 * Check if the canvas supports pointer events.
	 * 
	 * @return true if pointer is supported
	 */
	public final boolean hasPointerEvents() {

		if (theCanvas != null)
			return theCanvas.hasPointerEvents();

		return false;
	}

	/**
	 * Remove a command from the canvas.
	 * 
	 * @param command
	 *            the command to remove
	 */
	public final void removeCommand(final Command command) {

		if (theCanvas != null)
			theCanvas.removeCommand(command);
	}

	/**
	 * Repaint the canvas
	 */
	public final void repaint() {

		if (theCanvas != null)
			theCanvas.repaint();

	}

	/**
	 * Get the width.
	 * 
	 * @return the width of the current canvas
	 */
	public final int getWidth() {

		if (theCanvas != null) {
			// need to cast to ICanvas here, to make sure that the code is
			// linked correctly
			return ((ICanvas) theCanvas).getWidth();
		}

		return 0;
	}

	/**
	 * Get the height.
	 * 
	 * @return the height of the current canvas
	 */
	public final int getHeight() {

		if (theCanvas != null) {
			// need to cast to ICanvas here, to make sure that the code is
			// linked correctly
			return ((ICanvas) theCanvas).getHeight();
		}

		return 0;
	}

	/**
	 * Set a new title to the canvas (only supported in MIDP 2.0).
	 * 
	 * @param newTitle
	 *            thenew title
	 */
	public final void setTitle(final String newTitle) {

		if (theCanvas != null) {
			((ICanvas) theCanvas).setNewTitle(newTitle);
		}

	}

	/**
	 * Set the command listener of the canvas.
	 * 
	 * @param aController
	 *            the controller to use as command listener
	 */
	public final void setCommandListener(final CommandListener aController) {

		if (theCanvas != null)
			theCanvas.setCommandListener(aController);
	}

}
