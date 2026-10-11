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
 * Abortable Task is used for supporting Thread Control of spawned threads.
 * 
 * @author Ivonne Engemann
 * @version $Id: AbortableTask.java,v 1.4 2006/01/08 13:27:51 marcus Exp $
 * 
 */
public abstract class AbortableTask { 

	/**
	 * Flag to check if Task was aborted
	 */
	private boolean running = false;

	/**
	 * Mark aborted.
	 * @return true if task could be marked aborte.
	 */
	synchronized protected boolean abort() {

		if (!running)
			return false;

		running = false;
		return true;
	}

	/**
	 * Mark as started.
	 * @return true if task could be marked started
	 */
	synchronized protected boolean startRunning() {

		if (running)
			return false;

		running = true;
		return true;
	}

	/**
	 * Check running flag.
	 * @return true if Task is running.
	 */
	synchronized protected boolean isRunning() {
		return running;
	}
}
