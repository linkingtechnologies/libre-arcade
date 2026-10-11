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

import javax.microedition.lcdui.Canvas;
import javax.microedition.lcdui.ChoiceGroup;
import javax.microedition.lcdui.Command;
import javax.microedition.lcdui.CommandListener;
import javax.microedition.lcdui.Display;
import javax.microedition.lcdui.Displayable;
import javax.microedition.lcdui.Font;
import javax.microedition.lcdui.Form;
import javax.microedition.lcdui.Gauge;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Item;
import javax.microedition.lcdui.List;
import javax.microedition.lcdui.StringItem;

import de.wintermute.midlet.UIHelper;
import de.wintermute.sudoku.res.Dict;

/**
 * The screen to change the preferences of the game: settings for generation of
 * "harder" games, color mode, beginner mode ...
 * 
 * @author Ivonne Engemann
 * @version $Id: PreferencesScreen.java,v 1.39 2006/11/19 13:07:38 marcus Exp $
 * 
 */
public class PreferencesScreen extends List implements CommandListener {

	/**
	 * The State holder to use.
	 */
	private final SudokuStateControl stateHolder;

	/**
	 * The midlet to use.
	 */
	private final SudokuMidlet midlet;

	/**
	 * Flag if device supoorts pointer input.
	 */
	private final boolean pointerSupport;

	/**
	 * The key pressed in special key selection canvas.
	 */
	private int key;

	/** the back commmand */
	private final Command backCommand = new Command(Dict.getString("back"),
			Command.BACK, 99);

	/**
	 * Choose colored or black digits.
	 */
	private final ChoiceGroup choiceColorBlackDigit = new ChoiceGroup(Dict
			.getString("dispDgts"), ChoiceGroup.MULTIPLE,
			new String[] { Dict.getString("colored") }, null);

	/**
	 * Choose colored or black pencil marks.
	 */
	private final ChoiceGroup choiceColorBlackPencilMarks = new ChoiceGroup(
			Dict.getString("dispMrks"), ChoiceGroup.MULTIPLE,
			new String[] { Dict.getString("colored") }, null);

	/**
	 * Choose beginner mode = auto-update pencil marks.
	 */
	private final ChoiceGroup choiceBeginnerMode = new ChoiceGroup(Dict
			.getString("beginnerMode"), ChoiceGroup.MULTIPLE,
			new String[] { Dict.getString("on") }, null);

	/**
	 * Choose display conflict mode = high-light positions with same digit in
	 * same row, column or block after entering a wrong digit.
	 */
	private final ChoiceGroup choiceDisplayConflicts = new ChoiceGroup(Dict
			.getString("dispCnflcts"), ChoiceGroup.MULTIPLE,
			new String[] { Dict.getString("on") }, null);

	/**
	 * Choose display given mode = special background for given digits.
	 */
	private final ChoiceGroup choiceDisplayGivens = new ChoiceGroup(Dict
			.getString("dispGvns"), ChoiceGroup.MULTIPLE,
			new String[] { Dict.getString("on") }, null);

	/**
	 * Choose display block mode = high-light every second 3x3 block with a
	 * special background color.
	 */
	private final ChoiceGroup choiceDisplayBlocks = new ChoiceGroup(Dict
			.getString("dispBlcks"), ChoiceGroup.MULTIPLE,
			new String[] { Dict.getString("on") }, null);

	/**
	 * Display Icons on right side, on buttom or none display at all.
	 */
	private final ChoiceGroup choiceSidebarLocation = new ChoiceGroup(Dict
			.getString("sidebarLoc"), ChoiceGroup.EXCLUSIVE, new String[] {
			Dict.getString("right"), Dict.getString("bottom"),
			Dict.getString("none") }, null);

	/**
	 * Radio buttons to choose sidebar usage: show possible, show completed,
	 * pointer input/none. last element depends on pointer input is supported at
	 * this device or not.
	 */
	private final ChoiceGroup choiceSidebarUsage = new ChoiceGroup(Dict
			.getString("sidebarUsage"), ChoiceGroup.EXCLUSIVE, new String[] {
			Dict.getString("showPossible"), Dict.getString("showCompleted"),
			Dict.getString("pntrInput") }, null);;

	/**
	 * Flag if full screen should be used.
	 */
	private final ChoiceGroup choiceFullscreenOnOff = new ChoiceGroup(Dict
			.getString("fullscreen"), ChoiceGroup.MULTIPLE, new String[] { Dict
			.getString("on") }, null);

	/**
	 * The label above the settings for "harder" games.
	 */
	private final StringItem harderGameLabel = new StringItem(Dict
			.getString("settingsHardTitle"), Dict.getString("settingsHardText"));

	/**
	 * The gauge for complexity.
	 */
	private final Gauge gaugeIterations = new Gauge(Dict
			.getString("iterations"), true, 50, 3);

	/**
	 * The gauge for 'naked digits'.
	 */
	private final Gauge gaugeTimeout = new Gauge(Dict.getString("timeout"),
			true, 90, 30);

	/**
	 * The form for game settings.
	 */
	private final Form gameSettings = new Form(Dict.getString("prefs"),
			new Item[] { choiceBeginnerMode, choiceDisplayConflicts,
					harderGameLabel, gaugeIterations, gaugeTimeout });
	{
		gameSettings.addCommand(backCommand);
		gameSettings.setCommandListener(this);
	}

	/**
	 * The form for layout settings.
	 */
	private final Form layoutSettings = new Form(Dict.getString("prefs"));
	{

		layoutSettings.addCommand(backCommand);
		layoutSettings.setCommandListener(this);
	}

	/**
	 * The label above the settings for quick save.
	 */
	private final StringItem quickSaveLabel = new StringItem("", Dict
			.getString("quickSavePref"));

	/**
	 * Flag if quick-save of game is requested.
	 */
	private final ChoiceGroup choiceQuickSave = new ChoiceGroup(Dict
			.getString("quickSaveText"), ChoiceGroup.MULTIPLE,
			new String[] { Dict.getString("on") }, null);

	/**
	 * The form for special settings.
	 */
	private final Form specialSettings = new Form(Dict.getString("specials"),
			new Item[] { quickSaveLabel, choiceQuickSave });
	{
		specialSettings.addCommand(backCommand);
		specialSettings.setCommandListener(this);
	}

	/**
	 * The gauge for setting backlight value.
	 */
	private final Gauge gaugeBacklight = new Gauge(Dict.getString("backlight"),
			true, 10, 0);

	/**
	 * Offer language selection.
	 */
	private final List languageSettings = new List(Dict.getString("language"),
			List.IMPLICIT, Dict.getAvailableLanguages(), null);
	{
		languageSettings.addCommand(backCommand);
		languageSettings.setCommandListener(this);
	}

	/**
	 * Create preferences form.
	 * 
	 * @param theStateHolder
	 *            the state holder to use
	 * @param theMidlet
	 *            the Midlet to call back
	 * @param hasPointerSupport
	 *            indicates device is equipped with pointer input
	 */
	public PreferencesScreen(final SudokuStateControl theStateHolder,
			final SudokuMidlet theMidlet, final boolean hasPointerSupport) {

		super(Dict.getString("prefs"), List.IMPLICIT);
		stateHolder = theStateHolder;
		midlet = theMidlet;
		pointerSupport = hasPointerSupport;

		// only allow sidebar setting if it can be displayed at all
		if (!hasPointerSupport) {
			choiceSidebarUsage.set(2, Dict.getString("none"), null);
		}

		layoutSettings.append(choiceColorBlackDigit);
		layoutSettings.append(choiceColorBlackPencilMarks);
		layoutSettings.append(choiceDisplayGivens);
		layoutSettings.append(choiceDisplayBlocks);
		layoutSettings.append(choiceSidebarLocation);
		layoutSettings.append(choiceSidebarUsage);

		// do not allow full screen on pointer devices to prevent unreachable
		// commands.
		if (UIHelper.isFullScreenSupported() && !hasPointerSupport) {
			layoutSettings.append(choiceFullscreenOnOff);
		}

		if (UIHelper.isBacklightSupported()) {
			layoutSettings.append(gaugeBacklight);
		}

		append(Dict.getString("gamePrefs"), null);
		append(Dict.getString("layoutPrefs"), null);
		append(Dict.getString("clrPrefs"), null);
		append(Dict.getString("specials"), null);
		if (languageSettings.size() > 1) {
			append(Dict.getString("language"), null);
		}
		append(Dict.getString("rst"), null);

		addCommand(backCommand);
		setCommandListener(this);

		setupDefaultValues();

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
			if (displayable == specialSettings && choiceQuickSave.isSelected(0)) {
				enterQuickSaveKey();
			} else if (displayable == this) {
				savePreferences();
			} else {
				showPrefList();
			}
		} else {
			// Select command
			if (displayable == languageSettings) {
				Dict.storePreferredLanguage(languageSettings
						.getString(languageSettings.getSelectedIndex()));
				showPrefList();
			} else {
				final int index = getSelectedIndex();
				switch (index) {
				case 0:
					showGameSettings();
					break;
				case 1:
					showLayoutSettings();
					break;
				case 2:
					showColorPrefs();
					break;
				case 3:
					showSpecialSettings();
					break;
				case 4:
					if (languageSettings.size() > 1)
						showLanguageSettings();
					else
						resetPreferences();
					break;
				case 5:
					resetPreferences();
					break;
				}
			}
		}
	}

	/**
	 * Show the Preference List Screen
	 */
	private void showPrefList() {

		Display.getDisplay(midlet).setCurrent(this);
	}

	/**
	 * Show Color Preference Screen
	 */
	private void showColorPrefs() {
		// just create a new selector. May take longer, but can be gc
		// afterwards.
		final Displayable selector = new ColorSelector(14, 18, stateHolder
				.getVariableColors()) {

			public void colorsChanged() {
				showPrefList();
			}

		};
		Display.getDisplay(midlet).setCurrent(selector);
	}

	/**
	 * Save the changed preferences in the state holder.
	 */
	private void savePreferences() {

		stateHolder.setUseColorDigits(choiceColorBlackDigit.isSelected(0));
		stateHolder.setUseColorPencilMarks(choiceColorBlackPencilMarks
				.isSelected(0));
		stateHolder.setBeginnerMode(choiceBeginnerMode.isSelected(0));
		stateHolder.setDisplayConflicts(choiceDisplayConflicts.isSelected(0));
		stateHolder.setDisplayGivens(choiceDisplayGivens.isSelected(0));
		stateHolder.setDisplayBlocks(choiceDisplayBlocks.isSelected(0));
		stateHolder.setMaxCreationIterations(gaugeIterations.getValue());
		stateHolder.setMaxCreationTimeout(gaugeTimeout.getValue());
		stateHolder.setBacklightLevel(gaugeBacklight.getValue() * 10);

		if (choiceQuickSave.isSelected(0)) {
			stateHolder.setQuickSaveKey(key);
		} else {
			stateHolder.setQuickSaveKey(SudokuStateControl.KEY_UNDEFINED);
		}

		stateHolder.setFullScreenMode(choiceFullscreenOnOff.isSelected(0));

		switch (choiceSidebarUsage.getSelectedIndex()) {
		case 0:
			stateHolder.setSidebarUsage(SudokuStateControl.SIDEBAR_POSSIBLE);
			break;
		case 1:
			stateHolder.setSidebarUsage(SudokuStateControl.SIDEBAR_COMPLETE);
			break;
		case 2:
			if (pointerSupport)
				stateHolder
						.setSidebarUsage(SudokuStateControl.SIDEBAR_POINTER_INPUT);
			else
				stateHolder.setSidebarUsage(SudokuStateControl.SIDEBAR_NONE);
			break;
		}

		switch (choiceSidebarLocation.getSelectedIndex()) {
		case 0:
			stateHolder.setSidebarLocation(SudokuStateControl.SIDEBAR_RIGHT);
			break;
		case 1:
			stateHolder.setSidebarLocation(SudokuStateControl.SIDEBAR_BOTTOM);
			break;
		case 2:
			stateHolder.setSidebarLocation(SudokuStateControl.SIDEBAR_NONE);
			break;
		}

		stateHolder.preferencesChanged();

	}

	/**
	 * Reset the changed preferences in the state holder.
	 */
	private void resetPreferences() {

		choiceColorBlackDigit.setSelectedIndex(0, true);
		choiceColorBlackPencilMarks.setSelectedIndex(0, true);
		choiceBeginnerMode.setSelectedIndex(0, false);
		choiceDisplayConflicts.setSelectedIndex(0, true);
		choiceDisplayGivens.setSelectedIndex(0, true);
		choiceDisplayBlocks.setSelectedIndex(0, false);
		gaugeIterations
				.setValue(SudokuStateControl.DEFAULT_MAX_CREATION_ITERATIONS);
		gaugeTimeout.setValue(SudokuStateControl.DEFAULT_MAX_CREATION_TIMEOUT);
		choiceSidebarUsage.setSelectedIndex(2, true);
		choiceSidebarLocation.setSelectedIndex(0, true);
		choiceQuickSave.setSelectedIndex(0, false);
		choiceFullscreenOnOff.setSelectedIndex(0, false);
		gaugeBacklight.setValue(0);

		// reset colors
		Color[] colors = stateHolder.getVariableColors();
		for (int i = 0; i < colors.length; i++) {
			colors[i].reset();
		}

		savePreferences();
		// clear the preferred language 
		Dict.storePreferredLanguage(null);

	}

	/**
	 * Set the current values to all widgets.
	 * 
	 */
	private void setupDefaultValues() {

		gaugeIterations.setValue(stateHolder.getMaxCreationIterations());
		gaugeTimeout.setValue(stateHolder.getMaxCreationTimeout());

		choiceColorBlackDigit.setSelectedIndex(0, stateHolder
				.isUseColorDigits());
		choiceColorBlackPencilMarks.setSelectedIndex(0, stateHolder
				.isUseColorPencilMarks());
		choiceBeginnerMode.setSelectedIndex(0, stateHolder.isBeginnerMode());
		choiceDisplayConflicts.setSelectedIndex(0, stateHolder
				.isDisplayConflicts());
		choiceDisplayGivens.setSelectedIndex(0, stateHolder.isDisplayGivens());
		choiceDisplayBlocks.setSelectedIndex(0, stateHolder.isDisplayBlocks());
		choiceQuickSave
				.setSelectedIndex(
						0,
						stateHolder.getQuickSaveKey() != SudokuStateControl.KEY_UNDEFINED);

		choiceFullscreenOnOff.setSelectedIndex(0, stateHolder
				.isFullScreenMode());

		gaugeBacklight.setValue(stateHolder.getBacklightLevel() / 10);

		switch (stateHolder.getSidebarUsage()) {
		case SudokuStateControl.SIDEBAR_POSSIBLE:
			choiceSidebarUsage.setSelectedIndex(0, true);
			break;
		case SudokuStateControl.SIDEBAR_COMPLETE:
			choiceSidebarUsage.setSelectedIndex(1, true);
			break;
		case SudokuStateControl.SIDEBAR_POINTER_INPUT:
		case SudokuStateControl.SIDEBAR_NONE:
			choiceSidebarUsage.setSelectedIndex(2, true);
			break;
		}

		switch (stateHolder.getSidebarLocation()) {
		case SudokuStateControl.SIDEBAR_RIGHT:
			choiceSidebarLocation.setSelectedIndex(0, true);
			break;
		case SudokuStateControl.SIDEBAR_BOTTOM:
			choiceSidebarLocation.setSelectedIndex(1, true);
			break;
		case SudokuStateControl.SIDEBAR_NONE:
			choiceSidebarLocation.setSelectedIndex(2, true);
			break;
		}

	}

	/**
	 * Display the widgets for game setting.
	 * 
	 */
	private void showGameSettings() {

		Display.getDisplay(midlet).setCurrent(gameSettings);
	}

	/**
	 * Display the widgets for layout setting.
	 * 
	 */
	private void showLayoutSettings() {

		Display.getDisplay(midlet).setCurrent(layoutSettings);
	}

	/**
	 * Display the widgets for layout setting.
	 */
	private void showLanguageSettings() {
		Display.getDisplay(midlet).setCurrent(languageSettings);
	}

	/**
	 * Display the widgets for special setting.
	 * 
	 */
	private void showSpecialSettings() {

		Display.getDisplay(midlet).setCurrent(specialSettings);
	}

	/**
	 * Enter the key for quick save.
	 * 
	 */
	private void enterQuickSaveKey() {

		final Canvas canvas = new Canvas() {

			protected void paint(final Graphics g) {

				g.setColor(0x00FFFFFF);

				drawText(g, Dict.getStringArray("[]quickSaveKey"));
			}

			protected void keyPressed(final int pressedKey) {
				PreferencesScreen.this.key = pressedKey;
				commandAction(backCommand, this);
			}

		};

		Display.getDisplay(midlet).setCurrent(canvas);
		canvas.repaint();
	}

	/**
	 * The Text Box displays the text on the grid location.
	 * 
	 * @param g
	 *            the graphics to use
	 * @param text
	 *            Text String[] to display
	 */
	private final static void drawText(final Graphics g, final String[] text) {

		// initial settings
		final int offset = 4;
		Font aFont = Font.getDefaultFont();
		int textHeight = aFont.getHeight() * text.length;
		int textWidth = 0;
		for (int i = 0; i < text.length; i++) {
			textWidth = Math.max(aFont.stringWidth(text[i]), textWidth);
		}

		g.setColor(0x00FFFF80);
		g.fillRect(offset, offset, textWidth + offset * 2, textHeight + offset
				* 2);
		g.setColor(0x00000000);
		g.drawRect(offset, offset, textWidth + offset * 2 - 1, textHeight
				+ offset * 2 - 1);

		for (int i = 0; i < text.length; i++) {
			g.drawString(text[i], offset * 2, offset * 2
					+ (i * aFont.getHeight()), Graphics.TOP | Graphics.LEFT);
		}
	}

}
