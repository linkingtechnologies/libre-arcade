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

import java.io.IOException;
import java.util.Vector;

import javax.microedition.lcdui.Alert;
import javax.microedition.lcdui.Canvas;
import javax.microedition.lcdui.Command;
import javax.microedition.lcdui.CommandListener;
import javax.microedition.lcdui.Display;
import javax.microedition.lcdui.Displayable;
import javax.microedition.lcdui.List;
import javax.microedition.midlet.MIDlet;
import javax.microedition.midlet.MIDletStateChangeException;
import javax.microedition.rms.RecordStoreException;

import de.wintermute.midlet.ICanvas;
import de.wintermute.midlet.IDisplayable;
import de.wintermute.midlet.UIHelper;
import de.wintermute.sudoku.res.Dict;

/**
 * The midlet of this game.
 * 
 * @author Ivonne Engemann
 * @version $Id: SudokuMidlet.java,v 1.50 2006/10/28 23:21:06 marcus Exp $
 */
public class SudokuMidlet extends MIDlet {
	/**
	 * The display for this MIDlet
	 */
	private Display display;

	/** the level names */
	private final String[] levelNames = Dict.getStringArray("[]levels");

	/**
	 * The real canvas to paint on.
	 */
	private Canvas realizedCanvas;

	/**
	 * The GUI implementation of this midlet.
	 */
	private SudokuUI canvas;

	/**
	 * The external game creator (running in separate thread).
	 */
	private CreatorTask creator;

	/**
	 * The external game solver (running in separate thread).
	 */
	private SolverTask solver;

	/**
	 * Storage for saving and loading settings.
	 */
	private SettingsStore settingStore;

	/** the back commmand */
	private final Command backCommand = new Command(Dict.getString("back"),
			Command.BACK, 99);

	/**
	 * The IN PROGRESS screen during craetion of a new game.
	 */
	final private ProgressScreen progressScreen = new ProgressScreen(Dict
			.getString("createGame"), this);

	/**
	 * Construct new midlet.
	 */
	public SudokuMidlet() {

		display = Display.getDisplay(this);

		// create the new GUI class
		canvas = new SudokuUI();

		// create the Canvas and start the GUI
		createNewCanvas(false);

		settingStore = new SettingsStore(canvas.stateHolder);

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.midlet.MIDlet#startApp()
	 */
	protected void startApp() throws MIDletStateChangeException {

		// are we on first run?
		if (creator == null) {

			if (settingStore != null) {
				try {
					settingStore.read();
				} catch (RecordStoreException e) {
					// do nothing
				} catch (IOException e) {
					// do nothing
				}
			}

			if (canvas.stateHolder.canvasUpdateNeeded) {
				createNewCanvas(canvas.stateHolder.isFullScreenMode());
			}

			final Grid autoSaveGrid = (Grid) GridStore.getAutoSaveGrid();
			if (autoSaveGrid != null) {
				gameCreated(autoSaveGrid);
			} else {
				startNewGame((short) 0);
			}

		} else {

			if (canvas.stateHolder.canvasUpdateNeeded) {
				createNewCanvas(canvas.stateHolder.isFullScreenMode());
			}

			canvas.startTimer();
		}

	}

	/**
	 * Choose a new level.
	 */
	public void chooseLevel() {

		final List levelList = new List(Dict.getString("level"), List.IMPLICIT);
		levelList.addCommand(backCommand);

		for (int i = 0; i < levelNames.length; i++) {
			levelList.append(levelNames[i], null);
		}
		// establish commands
		levelList.setCommandListener(new CommandListener() {

			public void commandAction(final Command command,
					final Displayable displayable) {

				if (command == backCommand) {
					displayCanvas();

				} else {
					final short level = (short) levelList.getSelectedIndex();
					// create new game

					if (level == levelNames.length - 2) {
						// entry is EMPTY USER GAME
						SudokuMidlet.this.startEmptyGame();
					} else if (level == levelNames.length - 1) {
						// last entry is EDIT CURRENT GAME
						SudokuMidlet.this.editCurrentGame();
					} else {
						SudokuMidlet.this.startNewGame(level);
					}
				}

			}
		});
		display.setCurrent(levelList);
	}

	/**
	 * Start a new game with GameCreator -> starts extra Thread.
	 * 
	 * @param level
	 *            the level (given numbers)
	 */
	protected void startNewGame(final short level) {

		((IDisplayable)progressScreen).setTitle(levelNames[level]);
		progressScreen.setAction(Dict.getString("createGame"));
		displayProgressScreen();

		creator = new CreatorTask(this, canvas.stateHolder);
		creator.createGame(level);
	}

	/**
	 * Display the progress screen.
	 */
	protected void displayProgressScreen() {

		display.setCurrent(progressScreen);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.midlet.MIDlet#pauseApp()
	 */
	protected void pauseApp() {
		canvas.stopTimer();
		autoSave();
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.midlet.MIDlet#destroyApp(boolean)
	 */
	protected void destroyApp(boolean arg0) throws MIDletStateChangeException {

		canvas.stopTimer();
		// save current Game/Grid to AUTOSAVE
		autoSave();

	}

	/**
	 * Save the current game and settings.
	 */
	public void autoSave() {

		autoSaveGrid();
		saveSettings();
	}

	/**
	 * Save the current grid to AUTOSAVE.
	 */
	public void autoSaveGrid() {

		if (!canvas.stateHolder.isUserCreatingPuzzle()) {
			// don't save grid if user just edit a new game
			GridStore.autosaveGrid(canvas.grid);
		}
	}

	/**
	 * Save the settings.
	 */
	public void saveSettings() {
		if (settingStore != null) {
			try {
				settingStore.write();
			} catch (RecordStoreException e) {
				// do nothing
			} catch (IOException e) {
				// do nothing
			}
		}
	}

	/**
	 * Callback from GameCreator: has created a vaild new game.
	 * 
	 * @param grid
	 *            the created game
	 */
	protected void gameCreated(final Grid grid) {

		// new game was created => display in canvas
		canvas.setNewGrid(grid);
		displayCanvas();
	}

	/**
	 * Display the canvas.
	 */
	protected void displayCanvas() {
		canvas.paintAll = true;
		canvas.updateCanvas(false);
		display.setCurrent(realizedCanvas);
	}

	/**
	 * Display the alert.
	 * 
	 * @param alert
	 *            the Alert to display
	 */
	protected void displayAlert(final Alert alert) {
		display.setCurrent(alert, realizedCanvas);
	}

	/**
	 * Callback from ProgressScreen: abort the operation.
	 */
	public void abortProcess() {

		if (creator != null) {
			if (creator.abort()) {
				displayCanvas();
			}
		}
		if (solver != null) {
			if (solver.abort()) {
				displayCanvas();
			}
		}
	}

	/**
	 * Callback for GameCreator: Show the progress in the IN PROGRESS screen.
	 * 
	 * @param text
	 *            the info to show
	 */
	public void promoteProgress(final String text) {

		progressScreen.setProgress(text);
	}

	/**
	 * Callback from game solver: the user puzzle is not solvalble.
	 */
	public void userGameNotSolvable() {

		displayCanvas();
		canvas.drawText(Dict.getStringArray("[]notSolvable"), true);
	}

	/**
	 * The user game is solvable.
	 * 
	 * @param solutions
	 *            the Vector with found solutions
	 */
	public void userGameSolved(final Vector solutions) {
		// not needed. called by game created, too
		// displayCanvas();

		final Grid firstSolution = (Grid) solutions.firstElement();
		firstSolution.copyShownToAnswer();
		firstSolution.clearPencilMarks();

		gameCreated(firstSolution);

		if (canvas.stateHolder.isSolveAndPlay()) {
			canvas.stateHolder.resetGrid();
			canvas.startTimer();
		}

		if (solutions.size() > 1) {
			canvas.drawText(Dict.getStringArray("[]multiSol"), true);
		} else {
			canvas.drawText(Dict.getStringArray("[]uniqueSol"), true);
		}
	}

	/**
	 * Start a new game without GameCreator -> User can enter his own game
	 * 
	 */
	protected void startEmptyGame() {

		final Grid gridToSolve = new Grid(Dict.getString("emptyType"));
		canvas.setNewEmptyGrid(gridToSolve);

		displayCanvas();
	}

	/**
	 * Enter User creation mode, but transfer the givens of the current game as
	 * init state.
	 * 
	 */
	protected void editCurrentGame() {
		// only clear, if not already in edit mode.
		if (!canvas.stateHolder.isUserCreatingPuzzle()) {
			final Grid gridToSolve = canvas.grid;
			gridToSolve.resetForEdit();
			canvas.setNewEmptyGrid(gridToSolve);
		}
		displayCanvas();
	}

	/**
	 * Try to solve a user input game.
	 */
	public void solveUserGame() {

		((IDisplayable)progressScreen).setTitle(Dict.getString("solveTitle"));
		progressScreen.setAction(Dict.getString("solveText"));
		displayProgressScreen();

		solver = new SolverTask(this, canvas.grid);
		solver.solveGame();
	}

	/**
	 * Do a callSerially on the display.
	 * 
	 * @param r
	 *            the Runnable to invoke later
	 */
	public void invokeLater(Runnable r) {
		display.callSerially(r);

	}

	/**
	 * Create a new canvas implementation and initilaize the GUI.
	 * 
	 * @param fullScreenRequested
	 */
	public void createNewCanvas(final boolean fullScreenRequested) {

		// get a new canvas implementation
		realizedCanvas = UIHelper.getCanvas(fullScreenRequested);
		// initialize the GUI implemenation
		((ICanvas) realizedCanvas).init(this, canvas);

	}
}
