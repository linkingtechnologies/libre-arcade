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

import java.util.Enumeration;
import java.util.Vector;

import javax.microedition.lcdui.Alert;
import javax.microedition.lcdui.AlertType;
import javax.microedition.lcdui.Command;
import javax.microedition.lcdui.CommandListener;
import javax.microedition.lcdui.Display;
import javax.microedition.lcdui.Displayable;
import javax.microedition.lcdui.Form;
import javax.microedition.lcdui.List;
import javax.microedition.lcdui.TextField;

import de.wintermute.sudoku.res.Dict;

/**
 * The file menu to load, delete and save games.
 * 
 * @author Ivonne Engemann
 * @version $Id: FileMenu.java,v 1.11 2006/10/28 23:21:06 marcus Exp $ 
 * 
 */
public class FileMenu extends List implements CommandListener {

	/**
	 * The SudokuStateControl to use
	 */
	private SudokuStateControl control;

	/**
	 * The display to use (show textfield for save-filename)
	 */
	private Display display;

	/**
	 * The current grid (to save).
	 */
	private Grid currentGrid;

	/** the back commmand */
	private final Command backCommand = new Command(Dict.getString("back"),
			Command.BACK, 99);

	/** the load commmand */
	private final Command loadCommand = new Command(Dict.getString("load"),
			Command.SCREEN, 10);

	/** the save commmand */
	private final Command saveCommand = new Command(Dict.getString("save"),
			Command.SCREEN, 20);

	/** the delete commmand */
	private final Command deleteCommand = new Command(Dict.getString("del"),
			Command.SCREEN, 30);

	/** the select command */
	private final Command okCommand = new Command(Dict.getString("ok"),
			Command.SCREEN, 1);

	/**
	 * Create the file menu.
	 * 
	 * @param theStateHolder
	 *            the SudokuStateControl to use
	 */
	public FileMenu(final SudokuStateControl theStateHolder,
			final Display theDisplay, final Grid grid) {

		super(Dict.getString("file"), List.IMPLICIT);
		control = theStateHolder;
		display = theDisplay;
		currentGrid = grid;

		final Vector filenames = GridStore.getStoredGridFilenames();
		final Enumeration list = filenames.elements();
		while (list.hasMoreElements()) {
			append((String) list.nextElement(), null);
		}

		addCommand(backCommand);
		if (!control.isUserCreatingPuzzle()) {
			addCommand(saveCommand);
		}
		if (!filenames.isEmpty()) {
			addCommand(loadCommand);
			addCommand(deleteCommand);
		}
		setCommandListener(this);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.CommandListener#commandAction(javax.microedition.lcdui.Command,
	 *      javax.microedition.lcdui.Displayable)
	 */
	public void commandAction(final Command command,
			final Displayable displayable) {

		if (command == backCommand) {
			control.fileMenuAborted();
		}

		if (command == loadCommand) {
			loadGame();
		}

		if (command == saveCommand) {
			saveGame();
		}

		if (command == deleteCommand) {
			deleteGame();
		}
		
		if (command == List.SELECT_COMMAND) {
			alertInfo(Dict.getString("selAct"));
		}

	}

	/**
	 * Post alert box.
	 * 
	 * @param text
	 *            the text to display
	 */
	private void alert(final String text) {

		final Alert alert = new Alert(Dict.getString("err"), text, null,
				AlertType.ERROR);
		alert.setTimeout(Alert.FOREVER);
		display.setCurrent(alert);
	}

	/**
	 * Post info alert box.
	 * 
	 * @param text
	 *            the text to display
	 */
	private void alertInfo(final String text) {

		final Alert alert = new Alert(Dict.getString("info"), text, null,
				AlertType.INFO);
		alert.setTimeout(1500);
		display.setCurrent(alert, this);
	}

	/**
	 * Delete selected game.
	 */
	private void deleteGame() {

		final short index = (short) getSelectedIndex();
		if (index < 0) {
			alertInfo(Dict.getString("noGame"));
			return;
		}

		final String deleteFilename = getString(index);

		// delete game
		final boolean deleted = GridStore.deleteGrid(deleteFilename);
		if (deleted) {
			delete(index);
			if (size() <= 0) {
				removeCommand(loadCommand);
				removeCommand(deleteCommand);
			}
			alertInfo(Dict.getString("gameDeleted"));
		} else {
			alert(Dict.getString("gameDeleteFailed"));
		}

	}

	/**
	 * Save current game.
	 */
	private void saveGame() {

		final short index = (short) getSelectedIndex();
		final String seletcedFilename = (index < 0) ? Dict
				.getString("defFile") : getString(index);

		final Form form = new Form(Dict.getString("save"));
		form.addCommand(backCommand);
		form.addCommand(okCommand);
		// create a textfield with max 32 chars (max allowed for record store name)
		final TextField filenameTxt = new TextField(Dict.getString("filename"),
				seletcedFilename, 32, 0);
		form.append(filenameTxt);

		form.setCommandListener(new CommandListener() {

			public void commandAction(final Command command,
					final Displayable displayable) {

				if (command == backCommand) {
					// return to file menu
					display.setCurrent(FileMenu.this);

				} else {
					final String saveFilename = filenameTxt.getString();
					if (saveFilename.trim().length() > 0) {

						// set elapseTime to Grid befor save
						control.updateTimer();
						// save game
						boolean saved = GridStore.saveGrid(currentGrid,
								saveFilename);
						if (saved) {
							addGameToList(saveFilename);
							alertInfo(Dict.getString("gameSaved"));

						} else {
							alert(Dict.getString("gameSaveFailed"));
						}
					} else {
						alert(Dict.getString("saveFailedEmptyName"));
					}
				}
			}

			private void addGameToList(String saveFilename) {
				boolean inList = false;
				for (int i = 0; i < size() && !inList; i++) {
					inList = inList || saveFilename.equals(getString(i));
				}
				if (!inList) {
					FileMenu.this.append(saveFilename, null);
				}
				addCommand(loadCommand);
				addCommand(deleteCommand);

			}

		});
		display.setCurrent(form);

	}

	/**
	 * Load a saved game.
	 */
	private void loadGame() {

		final short index = (short) getSelectedIndex();
		if (index < 0) {
			alertInfo(Dict.getString("noGame"));
			return;
		}
		final String loadFilename = getString(index);

		// load game
		final Grid loaded = GridStore.loadGrid(loadFilename);
		if (loaded != null) {
			control.gameLoaded(loaded);
		} else {
			alert(Dict.getString("gameLoadFailed"));
		}

	}

}
