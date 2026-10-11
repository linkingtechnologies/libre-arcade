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

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.util.Enumeration;
import java.util.Vector;

import javax.microedition.lcdui.Alert;
import javax.microedition.lcdui.AlertType;
import javax.microedition.lcdui.Command;
import javax.microedition.lcdui.CommandListener;
import javax.microedition.lcdui.Display;
import javax.microedition.lcdui.Displayable;
import javax.microedition.lcdui.List;

import de.wintermute.midlet.UIHelper;
import de.wintermute.sudoku.res.Dict;

/**
 * The state holder: contolling all flags and handle display/hide of command.
 * 
 * @author Ivonne Engemann
 * @version $Id: SudokuStateControl.java,v 1.48 2006/11/04 13:30:48 ive Exp $
 * 
 */
public class SudokuStateControl implements CommandListener {

	/**
	 * The Midlet for callbacks.
	 */
	private SudokuMidlet midlet;

	/**
	 * The ui which holds the commands.
	 */
	private SudokuUI canvas;

	/**
	 * The user currently created a new puuzle.
	 */
	private boolean userCreatingPuzzle = false;

	/**
	 * The game is currently in undo/redo mode..
	 */
	private boolean undoMode = false;

	/**
	 * Flag if pencil marks should be displayed.
	 */
	private boolean showPencilMarks = true;

	/**
	 * Flag if pencil marks should be updated all the time.
	 */
	private boolean beginnerMode = false;

	/**
	 * Flag if the conflict digits should be high-lighted after entering a wrong
	 * number.
	 */
	private boolean displayConflicts = true;

	/**
	 * Flag if the given digits should be displayed with special background.
	 */
	private boolean displayGivens = true;

	/**
	 * Flag if every second 3x3 block should be displayed with special
	 * background.
	 */
	private boolean displayBlocks = false;

	/**
	 * Flag which decide if we are in PEN mode (=filling big digits) or in
	 * PENCIL mode (=settng pencil marks).
	 */
	private boolean pencilMode = false;

	/**
	 * Flag which decide if we should show the current board of the user or the
	 * solution (with red/green marked slots to show error).
	 */
	private boolean showSolution = false;

	/**
	 * Use color digits or only black digits (in generell).
	 */
	private boolean useColorDigits = true;

	/**
	 * Use color pencil marks.
	 */
	private boolean useColorPencilMarks = true;

	/**
	 * Do not show sidebar.
	 */
	public static final int SIDEBAR_NONE = 0;

	/**
	 * Use sidebar for pointer input.
	 */
	public static final int SIDEBAR_POINTER_INPUT = 1;

	/**
	 * Use sidebar to display possible digits of the current cell.
	 */
	public static final int SIDEBAR_POSSIBLE = 2;

	/**
	 * Use sidebar to display all completed digits (count >9).
	 */
	public static final int SIDEBAR_COMPLETE = 3;

	/**
	 * Display side bar on the right side.
	 */
	public static final int SIDEBAR_RIGHT = 4;

	/**
	 * Display side bar on the bottom.
	 */
	public static final int SIDEBAR_BOTTOM = 5;

	/**
	 * Mode which kind of usage is requested for the sidebar.
	 */
	private int sidebarUsage = SIDEBAR_NONE;

	/**
	 * Location of the sidebar: right side, bottom or none display at all.
	 */
	private int sidebarLocation = SIDEBAR_RIGHT;

	/**
	 * The flag if full screen mode should be used (if possible).
	 */
	private boolean fullScreenMode = false;

	/**
	 * Key to use undefined.
	 */
	public final static int KEY_UNDEFINED = -9999;

	/**
	 * The key value of the quick save key.
	 */
	private int quickSaveKey = KEY_UNDEFINED;

	/**
	 * EXIT command.
	 */
	private final Command exitCommand = new Command(Dict.getString("exit"),
			Command.EXIT, 9999);

	/** the back commmand */
	private final Command backCommand = new Command(Dict.getString("back"),
			Command.BACK, 9999);

	/**
	 * Toggle solution/puzzle display.
	 */
	private final Command solutionCommand = new Command(Dict
			.getString("dispSol"), Command.SCREEN, 550);

	/**
	 * Display File menu.
	 */
	private final Command fileCommand = new Command(Dict.getString("file"),
			Command.SCREEN, 520);

	private final Command preferencesCommand = new Command(Dict
			.getString("prefs"), Command.SCREEN, 7500);

	private final Command solveAndPlayUserPuzzleCommand = new Command(Dict
			.getString("solvePlay"), Command.SCREEN, 9);

	private final Command solveUserPuzzleCommand = new Command(Dict
			.getString("solve"), Command.SCREEN, 10);

	private final Command puzzleCommand = new Command(Dict
			.getString("dispPuzzle"), Command.SCREEN, 550);

	/**
	 * Start a new game after selecting level.
	 */
	private final Command newGameCommand = new Command(Dict
			.getString("newGame"), Command.SCREEN, 80);

	/**
	 * Reset an existing game.
	 */
	private final Command resetGameCommand = new Command(Dict
			.getString("rstGame"), Command.SCREEN, 500);

	/**
	 * display the solution of a single slot.
	 */
	private final Command solveSlotCommand = new Command(Dict
			.getString("dispDgt"), Command.SCREEN, 450);

	/**
	 * Check command to validate puzzle.
	 */
	private final Command checkCommand = new Command(Dict.getString("check"),
			Command.SCREEN, 40);

	/**
	 * Switch to UNDO/REDO mode.
	 */
	private final Command undoModeCommand = new Command(Dict
			.getString("undomode"), Command.SCREEN, 50);

	/**
	 * Recalculate Pencil Marks.
	 */
	private final Command recalculatePencilMarksCommand = new Command(Dict
			.getString("calcMrks"), Command.SCREEN, 400);

	/**
	 * Show pencil marks.
	 */
	private final Command showPencilMarksCommand = new Command(Dict
			.getString("showMrks"), Command.SCREEN, 100);

	/**
	 * Hide pencil marks.
	 */
	private final Command hidePencilMarksCommand = new Command(Dict
			.getString("hideMrks"), Command.SCREEN, 100);

	/**
	 * Clear pencil marks.
	 */
	private final Command clearPencilMarksCommand = new Command(Dict
			.getString("clearMrks"), Command.SCREEN, 120);

	/**
	 * Display Help menu.
	 */
	private final Command helpCommand = new Command(Dict.getString("help"),
			Command.HELP, 5000);

	/**
	 * Display Options menu: additional commands.
	 */
	private final Command optionsCommand = new Command(Dict
			.getString("options"), Command.SCREEN, 500);

	/**
	 * Toggle PEN/PENCIL command.
	 */
	private final Command pencilCommand = new Command(Dict.getString("pencil"),
			Command.BACK, 10);

	private final Command penCommand = new Command(Dict.getString("pen"),
			Command.BACK, 10);

	/** indicates game was solved once state */
	private boolean gameSolved;

	/**
	 * is a game running (not in creation or load-mode)
	 */
	private boolean activeGame;

	/**
	 * the version read from the descriptor
	 */
	private final String version;

	/**
	 * The maximum number of iterations during game creation.
	 */
	private int maxCreationIterations = DEFAULT_MAX_CREATION_ITERATIONS;

	/**
	 * The maximum number of seconds for game creation.
	 */
	private int maxCreationTimeout = DEFAULT_MAX_CREATION_TIMEOUT;

	/**
	 * indicates to go to play after solving a user input/edit game
	 */
	private boolean solveAndPlay;

	/**
	 * Internal Flag if a new canvas implementation is needed, for example if
	 * fullscreen mode has been changed.
	 */
	protected boolean canvasUpdateNeeded = false;

	/**
	 * The level for the backlight (only supported for NOKIA phones). 0 = off,
	 * 1-100 = on; 1 = dark, 100 = full bright
	 */
	private int backlightLevel = 0;

	/**
	 * The default number of iterations during game creation.
	 */
	protected static final int DEFAULT_MAX_CREATION_ITERATIONS = 3;

	/**
	 * The default number of seconds for game creation.
	 */
	protected static final int DEFAULT_MAX_CREATION_TIMEOUT = 15;

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.CommandListener#commandAction(javax.microedition.lcdui.Command,
	 *      javax.microedition.lcdui.Displayable)
	 */
	public void commandAction(final Command command,
			final Displayable displayable) {

		try {
			if (command == exitCommand) {
				canvas.stopTimer();
				// autosave
				midlet.autoSave();
				midlet.notifyDestroyed();
			} else

			if (command == solutionCommand) {
				showSolution();
			} else

			if (command == puzzleCommand) {
				showPuzzle();
			} else

			if (command == pencilCommand || command == penCommand) {
				togglePencilMode();
			} else

			if (command == newGameCommand) {
				canvas.freeResources();
				midlet.chooseLevel();
			} else

			if (command == resetGameCommand) {
				resetGrid();
				canvas.startTimer();
			} else

			if (command == solveSlotCommand) {
				canvas.solveSlot();
			} else

			if (command == solveUserPuzzleCommand
					|| command == solveAndPlayUserPuzzleCommand) {
				solveAndPlay = command == solveAndPlayUserPuzzleCommand;
				canvas.freeResources();
				midlet.solveUserGame();
			} else

			if (command == recalculatePencilMarksCommand) {
				setupPencilMarks();
			} else

			if (command == hidePencilMarksCommand) {
				hidePencilMarks();
			} else

			if (command == showPencilMarksCommand) {
				showPencilMarks();
			} else

			if (command == preferencesCommand) {
				canvas.freeResources();
				openPreferences();
			} else

			if (command == helpCommand) {
				openHelpList();
			} else

			if (command == clearPencilMarksCommand) {
				clearPencilMarks();
			} else

			if (command == fileCommand) {
				openFileMenu();
			} else

			if (command == undoModeCommand) {
				switchToUndoMode();
			} else

			if (command == backCommand && undoMode) {
				returnFromUndoMode();
			} else

			if (command == checkCommand) {
				canvas.validateDigits();
			} else

			if (command == optionsCommand) {
				displayAdditionalCommands();
			}

		} catch (final Throwable ex) {
			alertError(ex.toString() + "\n" + ex.getMessage());
		}
	}

	/**
	 * Return from UNDO mode to normal mode.
	 */
	private void returnFromUndoMode() {

		undoMode = false;
		updateCommands();
		canvas.returnFromUndoMode();
	}

	/**
	 * Change the navigation to UNDO /REDO mode.
	 */
	private void switchToUndoMode() {

		undoMode = true;
		updateCommands();
		canvas.switchToUndoMode();

	}

	/**
	 * Open help list: About, Rules & Keys.
	 */
	private void openHelpList() {

		final List helpList = new List(Dict.getString("help"), List.IMPLICIT);

		final Command backCommand = new Command(Dict.getString("back"),
				Command.BACK, 99);
		helpList.addCommand(backCommand);

		helpList.append(Dict.getString("about"), null);
		helpList.append(Dict.getString("rules"), null);
		helpList.append(Dict.getString("keys"), null);
		if (canvas.hasPointerEvents()) {
			helpList.append(Dict.getString("pntr"), null);
		}

		// establish commands
		helpList.setCommandListener(new CommandListener() {

			public void commandAction(final Command command,
					final Displayable displayable) {

				if (command == backCommand) {
					midlet.displayCanvas();

				} else {
					final short level = (short) helpList.getSelectedIndex();
					switch (level) {
					case 0:
						alertAbout();
						break;
					case 1:
						alertRules();
						break;
					case 2:
						alertKeys();
						break;
					case 3:
						alertPointer();
					}
				}
			}

			/**
			 * Post an about alert box.
			 */
			private void alertAbout() {
				final StringBuffer sb = new StringBuffer();
				sb.append(Dict.getString("aboutvrs"));
				if (version != null && version.length() > 0) {
					sb.append("V").append(version).append(" ");
				}
				sb.append(Dict.getString("abouttxt"));

				final Alert alert = new Alert(Dict.getString("about"), sb
						.toString(), null, AlertType.INFO);
				alert.setTimeout(Alert.FOREVER);
				Display.getDisplay(midlet).setCurrent(alert);
			}

			/**
			 * Post an alert box with key instructions.
			 */
			private void alertKeys() {
				final Alert alert = new Alert(Dict.getString("keys"), Dict
						.getString("keystxt"), null, AlertType.INFO);
				alert.setTimeout(Alert.FOREVER);
				Display.getDisplay(midlet).setCurrent(alert);
			}

			/**
			 * Post an alert box with pointer instructions.
			 */
			private void alertPointer() {
				final Alert alert = new Alert(Dict.getString("pntr"), Dict
						.getString("pntrtxt"), null, AlertType.INFO);
				alert.setTimeout(Alert.FOREVER);
				Display.getDisplay(midlet).setCurrent(alert);
			}

			/**
			 * Post an alert box with Sudoku Rules.
			 */
			private void alertRules() {
				final Alert alert = new Alert(Dict.getString("rules"), Dict
						.getString("rulestxt"), null, AlertType.INFO);
				alert.setTimeout(Alert.FOREVER);
				Display.getDisplay(midlet).setCurrent(alert);
			}
		});
		Display.getDisplay(midlet).setCurrent(helpList);
	}

	/**
	 * Clear all pencilmarks of current grid.
	 */
	private void clearPencilMarks() {

		canvas.grid.clearPencilMarks();

		updateCommands();
		canvas.paintAll = true;
		canvas.updateCanvas(false);
		canvas.repaint();

	}

	/**
	 * Hide current pencil marks.
	 */
	private void hidePencilMarks() {

		showPencilMarks = false;

		updateCommands();
		canvas.paintAll = true;
		canvas.updateCanvas(false);
		canvas.repaint();
	}

	/**
	 * Display commands matching game state.
	 */
	private void updateCommands() {

		if (!userCreatingPuzzle && !undoMode) {

			canvas.addCommand(exitCommand);
			canvas.addCommand(helpCommand);
			canvas.addCommand(newGameCommand);
			canvas.addCommand(fileCommand);

			if (showSolution) {
				canvas.addCommand(puzzleCommand);
				canvas.removeCommand(optionsCommand);
				canvas.removeCommand(undoModeCommand);
				canvas.removeCommand(preferencesCommand);
				canvas.removeCommand(checkCommand);
			} else {
				canvas.addCommand(optionsCommand);
				canvas.removeCommand(puzzleCommand);
				canvas.addCommand(undoModeCommand);
				canvas.addCommand(preferencesCommand);
				canvas.addCommand(checkCommand);
			}

			if (pencilMode) {
				canvas.addCommand(penCommand);
				canvas.removeCommand(pencilCommand);
			} else {
				canvas.addCommand(pencilCommand);
				canvas.removeCommand(penCommand);
			}

			canvas.removeCommand(solveUserPuzzleCommand);
			canvas.removeCommand(solveAndPlayUserPuzzleCommand);
			canvas.removeCommand(backCommand);

		} else {

			canvas.removeCommand(pencilCommand);
			canvas.removeCommand(penCommand);
			canvas.removeCommand(preferencesCommand);
			canvas.removeCommand(undoModeCommand);
			canvas.removeCommand(optionsCommand);
			canvas.removeCommand(puzzleCommand);
			canvas.removeCommand(checkCommand);

			if (userCreatingPuzzle) {
				canvas.addCommand(solveUserPuzzleCommand);
				canvas.addCommand(solveAndPlayUserPuzzleCommand);

			} else {
				canvas.removeCommand(solveUserPuzzleCommand);
				canvas.removeCommand(solveAndPlayUserPuzzleCommand);
			}

			if (undoMode) {
				canvas.addCommand(backCommand);
				canvas.removeCommand(exitCommand);
				canvas.removeCommand(helpCommand);
				canvas.removeCommand(newGameCommand);
				canvas.removeCommand(fileCommand);

			} else {
				canvas.removeCommand(backCommand);
				canvas.addCommand(exitCommand);
				canvas.addCommand(helpCommand);
				canvas.addCommand(newGameCommand);
				canvas.addCommand(fileCommand);

			}
		}
	}

	/**
	 * Display additional commands.
	 */
	private void displayAdditionalCommands() {

		final List menuList = new List(Dict.getString("options"), List.IMPLICIT);
		menuList.addCommand(backCommand);

		final Vector additionalCommands = getAdditionalCommands();
		final Enumeration cmds = additionalCommands.elements();
		while (cmds.hasMoreElements()) {
			final Command cmd = (Command) cmds.nextElement();
			menuList.append(cmd.getLabel(), null);
		}

		// establish commands
		menuList.setCommandListener(new CommandListener() {

			public void commandAction(final Command command,
					final Displayable displayable) {

				if (command == backCommand) {
					midlet.displayCanvas();

				} else {
					final short index = (short) menuList.getSelectedIndex();
					midlet.displayCanvas();
					final Command cmd = (Command) additionalCommands
							.elementAt(index);
					SudokuStateControl.this.commandAction(cmd, null);
				}
			}
		});
		Display.getDisplay(midlet).setCurrent(menuList);
	}

	/**
	 * Create state holder with midlet and canvas.
	 * 
	 * @param theMidlet
	 *            the midlet to use
	 * @param theCanvas
	 *            the Canvas to use
	 */
	public SudokuStateControl(final SudokuMidlet theMidlet,
			final SudokuUI theCanvas) {

		midlet = theMidlet;
		canvas = theCanvas;

		updateCommandListener(theCanvas);

		version = midlet.getAppProperty("MIDlet-Version");

		sidebarUsage = canvas.hasPointerEvents() ? SIDEBAR_POINTER_INPUT
				: SIDEBAR_NONE;

	}

	/**
	 * Set a new grid of a newly loaded/created game. Repaint needed.
	 * 
	 * @param grid
	 *            the new game
	 * @param creatingPuzzle
	 *            indicates edit mode
	 */
	protected void setNewGrid(final Grid grid, final boolean creatingPuzzle) {

		canvas.grid = grid;
		canvas.resetFocus();

		showSolution = false;
		userCreatingPuzzle = creatingPuzzle;
		// beginnerMode = false; // leave unchanged, is set in prefs
		pencilMode = false;

		canvas.conflictPositions = null;
		canvas.oldConflictPositions = null;
		canvas.resetMoveStack();

		if (userCreatingPuzzle) {
			// showPencilMarks = false;
			activeGame = false;
			gameSolved = false;
			canvas.stopTimer();

		} else {
			// init game state
			activeGame = true;
			gameSolved = grid.isCompletelyFilled() || grid.isSolved();
			canvas.startTimer();
		}

		updateCommands();
		canvas.paintAll = true;
		// canvas.updateCanvas(false);
		canvas.drawPencilPenModeSign();
		// canvas.repaint();
	}

	/**
	 * Show current pencil marks.
	 */
	private void showPencilMarks() {

		showPencilMarks = true;

		updateCommands();
		canvas.paintAll = true;
		canvas.updateCanvas(false);
		canvas.repaint();
	}

	/**
	 * Show the playing grid.
	 */
	private void showPuzzle() {

		showSolution = false;

		updateCommands();
		canvas.paintAll = true;
		canvas.updateCanvas(false);
		canvas.repaint();
	}

	/**
	 * Show the solution.
	 */
	private void showSolution() {

		showSolution = true;

		updateCommands();
		canvas.paintAll = true;
		canvas.updateCanvas(false);
		canvas.repaint();
	}

	/**
	 * Display preferences screen.
	 */
	private void openPreferences() {

		// just create a new prefs screen. May take longer, but can be gc
		// afterwards.
		final PreferencesScreen form = new PreferencesScreen(this, midlet,
				canvas.hasPointerEvents());
		Display.getDisplay(midlet).setCurrent(form);
	}

	/**
	 * Display File Menu.
	 */
	private void openFileMenu() {

		final FileMenu form = new FileMenu(this, Display.getDisplay(midlet),
				canvas.grid);
		Display.getDisplay(midlet).setCurrent(form);
	}

	/**
	 * Switch beginner mode.
	 */
	protected void setBeginnerMode(final boolean newBeginnerMode) {

		beginnerMode = newBeginnerMode;
		showPencilMarks = true;

	}

	/**
	 * Recalculate the current pencil marks.
	 */
	protected void setupPencilMarks() {

		if (canvas.grid != null) {
			canvas.grid.setupPossibleDigits();
		}

		showPencilMarks = true;
		showSolution = false;

		updateCommands();
		canvas.paintAll = true;
		canvas.updateCanvas(false);
		canvas.repaint();
	}

	/**
	 * Toggle between PENCIL and PEN mode.
	 */
	protected void togglePencilMode() {

		pencilMode = !pencilMode;

		updateCommands();
		canvas.updateCanvas(false);
		canvas.drawPencilPenModeSign();
		canvas.repaint();
	}

	/**
	 * Reset grid.
	 */
	public void resetGrid() {

		gameSolved = false;
		showSolution = false;
		canvas.stopTimer();
		canvas.resetGrid();

		updateCommands();
		canvas.paintAll = true;
		canvas.updateCanvas(false);
		canvas.repaint();
	}

	protected boolean isBeginnerMode() {
		return beginnerMode;
	}

	protected boolean isPencilMode() {
		return pencilMode;
	}

	protected boolean isShowPencilMarks() {
		return showPencilMarks;
	}

	protected boolean isShowSolution() {
		return showSolution;
	}

	protected boolean isUserCreatingPuzzle() {
		return userCreatingPuzzle;
	}

	protected boolean isGameSolved() {
		return gameSolved;
	}

	protected boolean isActiveGame() {
		return activeGame;
	}

	/**
	 * Mark game solved.
	 */
	protected void gameSolved() {

		canvas.stopTimer();
		gameSolved = true;
	}

	/**
	 * Serialize Settings.
	 * 
	 * @return byte[] with encoded settings
	 * @throws IOException
	 *             if creation failed
	 */
	public byte[] asByteArrayForStorage() throws IOException {

		final ByteArrayOutputStream baos = new ByteArrayOutputStream();
		final DataOutputStream outputStream = new DataOutputStream(baos);

		outputStream.writeInt(SettingsStore.currentVersion);
		outputStream.writeBoolean(this.beginnerMode);
		outputStream.writeBoolean(this.displayConflicts);
		outputStream.writeBoolean(this.displayGivens);
		outputStream.writeBoolean(this.displayBlocks);
		outputStream.writeBoolean(this.pencilMode);
		outputStream.writeBoolean(this.showPencilMarks);
		outputStream.writeBoolean(this.showSolution);
		outputStream.writeBoolean(this.userCreatingPuzzle);
		outputStream.writeBoolean(this.useColorDigits);
		outputStream.writeBoolean(this.useColorPencilMarks);
		outputStream.writeInt(this.maxCreationIterations);
		outputStream.writeInt(this.maxCreationTimeout);
		outputStream.writeInt(this.sidebarUsage);
		outputStream.writeInt(this.sidebarLocation);
		outputStream.writeBoolean(this.fullScreenMode);
		outputStream.writeInt(this.quickSaveKey);
		outputStream.writeInt(this.backlightLevel);

		// store colors
		Color[] cols = getVariableColors();
		for (int i = 0; i < cols.length; i++) {
			outputStream.writeInt(cols[i].getValue());
		}

		return baos.toByteArray();

	}

	/**
	 * Restore settings from byte[].
	 * 
	 * @param byteArray
	 *            the byte[] to read
	 * @throws IOException
	 *             if read failed
	 */
	public void initializeSettings(final byte[] byteArray) throws IOException {

		final ByteArrayInputStream bais = new ByteArrayInputStream(byteArray);
		final DataInputStream inputStream = new DataInputStream(bais);

		// check version of settings
		final int settingVersion = inputStream.readInt();
		if (settingVersion != SettingsStore.currentVersion) {
			return;
		}

		this.beginnerMode = inputStream.readBoolean();
		this.displayConflicts = inputStream.readBoolean();
		this.displayGivens = inputStream.readBoolean();
		this.displayBlocks = inputStream.readBoolean();
		this.pencilMode = inputStream.readBoolean();
		this.showPencilMarks = inputStream.readBoolean();
		this.showSolution = inputStream.readBoolean();
		this.userCreatingPuzzle = inputStream.readBoolean();
		this.useColorDigits = inputStream.readBoolean();
		this.useColorPencilMarks = inputStream.readBoolean();
		this.maxCreationIterations = inputStream.readInt();
		this.maxCreationTimeout = inputStream.readInt();
		this.sidebarUsage = inputStream.readInt();
		this.sidebarLocation = inputStream.readInt();
		this.setFullScreenMode(inputStream.readBoolean());
		this.quickSaveKey = inputStream.readInt();
		this.backlightLevel = inputStream.readInt();

		// init colors
		Color[] cols = getVariableColors();
		for (int i = 0; i < cols.length; i++) {
			cols[i].setValue(inputStream.readInt());
		}

		if (getBacklightLevel() != 0) {
			UIHelper.setBacklight(getBacklightLevel());
		}
	}

	protected boolean isUseColorDigits() {
		return useColorDigits;
	}

	protected void setUseColorDigits(boolean useColorDigits) {
		this.useColorDigits = useColorDigits;
	}

	protected boolean isUseColorPencilMarks() {
		return useColorPencilMarks;
	}

	protected void setUseColorPencilMarks(boolean useColorPencilMarks) {
		this.useColorPencilMarks = useColorPencilMarks;
	}

	/**
	 * Preferences changed: Update the canvas and repaint.
	 */
	public void preferencesChanged() {

		midlet.saveSettings();

		if (canvasUpdateNeeded) {
			canvasUpdateNeeded = false;
			midlet.createNewCanvas(isFullScreenMode());
		}

		UIHelper.setBacklight(getBacklightLevel());

		canvas.updateCanvas(false);
		canvas.repaint();
		midlet.displayCanvas();
	}

	/**
	 * Callback from File Screen: has loaded a vaild new game.
	 * 
	 * @param grid
	 *            the loaded game
	 */
	public void gameLoaded(final Grid grid) {

		canvas.resetMoveStack();

		midlet.gameCreated(grid);
	}

	/**
	 * Callback from File Screen:: return to canvas.
	 */
	public void fileMenuAborted() {
		midlet.displayCanvas();
	}

	/**
	 * Callback from File Screen: update the elapsed time in the currrent grid
	 * (before save)
	 */
	protected void updateTimer() {

		canvas.updateTimeInGrid();
	}

	public int getMaxCreationIterations() {
		return maxCreationIterations;
	}

	public void setMaxCreationIterations(int maxCreationIterations) {
		this.maxCreationIterations = maxCreationIterations;
	}

	public int getMaxCreationTimeout() {
		return maxCreationTimeout;
	}

	public void setMaxCreationTimeout(int maxCreationTimeout) {
		this.maxCreationTimeout = maxCreationTimeout;
	}

	public boolean isUndoMode() {
		return undoMode;
	}

	protected boolean isSolveAndPlay() {
		return solveAndPlay;
	}

	protected boolean isDisplayConflicts() {
		return displayConflicts;
	}

	protected void setDisplayConflicts(boolean displayConflicts) {
		this.displayConflicts = displayConflicts;
	}

	protected boolean isDisplayBlocks() {
		return displayBlocks;
	}

	protected void setDisplayBlocks(boolean displayBlocks) {
		this.displayBlocks = displayBlocks;
	}

	protected boolean isDisplayGivens() {
		return displayGivens;
	}

	protected void setDisplayGivens(boolean displayGivens) {
		this.displayGivens = displayGivens;
	}

	/**
	 * Calculate the additional commands.
	 * 
	 * @return Vector of commands
	 */
	private Vector getAdditionalCommands() {

		final Vector cmds = new Vector();

		if (showPencilMarks) {
			cmds.addElement(hidePencilMarksCommand);
			cmds.addElement(clearPencilMarksCommand);
		} else {
			cmds.addElement(showPencilMarksCommand);
		}

		cmds.addElement(recalculatePencilMarksCommand);
		cmds.addElement(solveSlotCommand);
		cmds.addElement(resetGameCommand);

		if (!showSolution) {
			cmds.addElement(solutionCommand);
		}

		return cmds;

	}

	/**
	 * Get colors which are allowed to be changed by user.
	 * 
	 * @return the colors which can be altered (by user)
	 */
	public Color[] getVariableColors() {
		return new Color[] { SudokuUI.COLOR_BACKGROUND_FOCUS_NORMAL,
				SudokuUI.COLOR_BACKGROUND_FOCUS_PENCIL,
				SudokuUI.COLOR_BACKGROUND_FOCUS_NAV,
				SudokuUI.COLOR_BACKGROUND_NORMAL,
				SudokuUI.COLOR_BACKGROUND_BLOCK,
				SudokuUI.COLOR_BACKGROUND_ORIGINAL,
				SudokuUI.COLOR_BACKGROUND_CORRECT,
				SudokuUI.COLOR_BACKGROUND_WRONG };
	}

	/**
	 * Set the usage mode for the sidebar.
	 * 
	 * @param mode
	 *            usage mode for sidebar: none, pointer input, possible or
	 *            completed.
	 */
	public void setSidebarUsage(final int mode) {
		sidebarUsage = mode;
	}

	/**
	 * Get the usage mode for the sidebar.
	 * 
	 * @return usage mode for sidebar: none, pointer input, possible or
	 *         completed.
	 */
	public int getSidebarUsage() {
		return sidebarUsage;
	}

	/**
	 * Check if full screen mode should be used.
	 * 
	 * @return true if full screen mode
	 */
	public boolean isFullScreenMode() {

		return fullScreenMode;
	}

	/**
	 * Set the flag to use full screen mode (if possible).
	 * 
	 * @param newFullscreenMode
	 *            true if full screen mode should be used
	 */
	public void setFullScreenMode(final boolean newFullscreenMode) {

		if (newFullscreenMode != this.fullScreenMode)
			canvasUpdateNeeded = true;

		this.fullScreenMode = newFullscreenMode;
	}

	/**
	 * Get Location of the sidebar: right side, bottom or none display at all.
	 * 
	 * @return SIDEBAR_NONE, SIDEBAR_RIGHT or SIDEBAR_BOTTOM
	 */
	public int getSidebarLocation() {

		return sidebarLocation;
	}

	/**
	 * Set Location of the sidebar: right side, bottom or none display at all.
	 * 
	 * @param sidebarLocation
	 *            SIDEBAR_NONE, SIDEBAR_RIGHT or SIDEBAR_BOTTOM
	 */
	public void setSidebarLocation(final int sidebarLocation) {

		this.sidebarLocation = sidebarLocation;
	}

	/**
	 * Post error alert box.
	 * 
	 * @param text
	 *            the text to display
	 */
	private void alertError(final String text) {

		final Alert alert = new Alert(Dict.getString("err"), text, null,
				AlertType.ERROR);
		alert.setTimeout(Alert.FOREVER);
		midlet.displayAlert(alert);
	}

	/**
	 * Get the key used for quick save.
	 * 
	 * @return the key value of the quick-save key.
	 */
	public int getQuickSaveKey() {

		return quickSaveKey;
	}

	/**
	 * Set the key used for quick save.
	 * 
	 * @param quickSaveKey
	 *            the key value for quick save.
	 */
	public void setQuickSaveKey(int quickSaveKey) {

		this.quickSaveKey = quickSaveKey;
	}

	/**
	 * Update the command listener and re-initialize all commands.
	 * 
	 * @param theGui
	 *            the hitori GUI
	 */
	public void updateCommandListener(final SudokuUI theGui) {

		theGui.setCommandListener(this);
		updateCommands();
	}

	/**
	 * Set the level for the backlight (only supported for NOKIA phones). 0 =
	 * off, 1-100 = on; 1 = dark, 100 = full bright
	 * 
	 * @return 0 = off, 1-100 = on
	 */
	public int getBacklightLevel() {

		return backlightLevel;
	}

	/**
	 * Set the level for the backlight (only supported for NOKIA phones). 0 =
	 * off, 1-100 = on; 1 = dark, 100 = full bright
	 * 
	 * @param backlightLevel
	 *            0 = off, 1-100 = on
	 */
	public void setBacklightLevel(final int backlightLevel) {

		this.backlightLevel = backlightLevel;
	}
}
