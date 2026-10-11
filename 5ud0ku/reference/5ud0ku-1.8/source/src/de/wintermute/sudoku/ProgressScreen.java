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

import javax.microedition.lcdui.Command;
import javax.microedition.lcdui.CommandListener;
import javax.microedition.lcdui.Displayable;
import javax.microedition.lcdui.Form;
import javax.microedition.lcdui.StringItem;

import de.wintermute.midlet.IDisplayable;
import de.wintermute.sudoku.res.Dict;

/**
 * "In progress" creen to show during creation of new game. Shows label with
 * progress. Abort command to stop creation of new game. If abort => return to
 * previous state.
 * 
 * @author Ivonne Engemann
 * @version $Id: ProgressScreen.java,v 1.8 2006/10/21 17:56:32 marcus Exp $
 * 
 */
public class ProgressScreen extends Form implements CommandListener, IDisplayable {

	/**
	 * The midlet as receiver for event "abort".
	 */
	private SudokuMidlet midlet;

	/**
	 * Show the progress info.
	 */
	private StringItem label = new StringItem(Dict.getString("genNewGame"), "");

	/**
	 * Abort the run.
	 */
	private Command abortCommand = new Command(Dict.getString("abort"),
			Command.EXIT, 99);

	/**
	 * Construct a new progress screen with the midlet as receiver.
	 * 
	 * @param title
	 *            the screen title
	 * @param theMidlet
	 *            to callback on abort
	 */
	public ProgressScreen(final String title, final SudokuMidlet theMidlet) {
		super(title);

		midlet = theMidlet;
		append(label);
		addCommand(abortCommand);
		setCommandListener(this);
	}

	/**
	 * Work command.
	 * 
	 * @param command
	 *            the Command to check
	 * @param displayable
	 *            the source Displayable
	 * @see javax.microedition.lcdui.CommandListener#commandAction(javax.microedition.lcdui.Command,
	 *      javax.microedition.lcdui.Displayable)
	 */
	public void commandAction(final Command command,
			final Displayable displayable) {

		if (command == abortCommand) {
			midlet.abortProcess();
		}
	}

	/**
	 * Change the progress info text.
	 * 
	 * @param progress
	 *            the String to show.
	 */
	public void setProgress(final String progress) {

		label.setText(progress);
	}

	/**
	 * Change the progress info label.
	 * 
	 * @param txt
	 *            the String to show
	 */
	public void setAction(final String txt) {

		label.setLabel(txt);
	}

}
