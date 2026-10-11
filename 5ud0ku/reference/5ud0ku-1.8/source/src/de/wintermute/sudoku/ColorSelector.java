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
import javax.microedition.lcdui.Command;
import javax.microedition.lcdui.CommandListener;
import javax.microedition.lcdui.Displayable;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;

import de.wintermute.midlet.IDisplayable;
import de.wintermute.sudoku.res.Dict;

/**
 * The Color Selector displays a canvas and a RGB color selection of configured
 * color sets.
 * 
 * @author marcus
 * @version $Id: ColorSelector.java,v 1.14 2006/10/28 23:21:06 marcus Exp $
 */
public abstract class ColorSelector extends Canvas implements CommandListener, IDisplayable {
	/** the name ids of the base colors */
	private static final String[] COLOR_NAMES = new String[] { "clrR", "clrG",
			"clrB" };

	/** Back command to return to game */
	private static final Command COMMAND_BACK = new Command(Dict
			.getString("back"), Command.BACK, 100);

	/** default command to reset color value */
	private static final Command COMMAND_DEFAULT = new Command(Dict
			.getString("def"), Command.SCREEN, 100);

	/** static for increment of color value */
	private static final int HIGH_INCREASE = 1;

	/** static for increment of color value */
	private static final int LOW_INCREASE = 2;

	/** static for increment of color value */
	private static final int HIGH_DECREASE = 3;

	/** static for increment of color value */
	private static final int LOW_DECREASE = 4;

	/** the displayed red value */
	private int red;

	/** the displayed green value */
	private int green;

	/** the displayed blue value */
	private int blue;

	/** color selection mark */
	private int currentColorIndex;

	/** component (color, r, g, b) mark */
	private int currentComponentIndex;

	/** The graphic context of the off-screen image. */
	private final Graphics offScreenGraphics;

	/** the offscreen image wich is drawn to the canvas in paint */
	private Image offScreenImage;

	/** the cell height of the color marks */
	private final int cellHeight;

	/** the cell height of the color marks */
	private final int cellWidth;

	/** the colors to update */
	private Color[] colors;

	/** cursor block size */
	private int cursorBlockSize;

	/** the max width of the color names for screen size calculation */
	private int maxWidthNames;

	/** the width of the Numbers section */
	private int widthRGBNumber;

	/** number of pix to put the cursor apart from text/bottom/top */
	private int cursorOffset;

	/** offset to RGB numbers to enable RIGHT justified text display */
	private int offsetXNumbers;

	/** font height */
	private int fontHeight;

	/** offset to the beginning of the RGB Value section */
	private int offsetYRGBBlock;

	/**
	 * Create a color selector.
	 * 
	 * @param cellWidth
	 *            the width of the color portions
	 * @param cellHeight
	 *            the height of the color portions
	 * @param colors
	 *            the Color Array to use
	 */
	public ColorSelector(final int cellWidth, final int cellHeight,
			final Color[] colors) {

		this.cellWidth = cellWidth;
		this.cellHeight = cellHeight;
		this.colors = colors;
		this.setCommandListener(this);
		this.addCommand(COMMAND_BACK);
		this.addCommand(COMMAND_DEFAULT);

		// init and calculate graphicsizes
		offScreenImage = Image.createImage(((IDisplayable)this).getWidth(), ((IDisplayable)this).getHeight());
		offScreenGraphics = offScreenImage.getGraphics();
		initializeGraphics();

	}

	/**
	 * Init Graphics values.
	 */
	private void initializeGraphics() {
		// calculate positions and heights and offsets
		cursorBlockSize = cellWidth / 4 + 1;

		// font
		fontHeight = offScreenGraphics.getFont().getHeight();

		// cursorOffset is aligned with font height
		cursorOffset = (fontHeight - cursorBlockSize) / 2;

		// width of the color blocks
		int widthColors = cursorBlockSize + cursorOffset + colors.length
				* cellWidth;

		// max width of the color names
		for (int i = 0; i < colors.length; i++) {
			maxWidthNames = Math.max(maxWidthNames, offScreenGraphics.getFont()
					.stringWidth(Dict.getString(colors[i].getIdentifier())));
		}

		// max width of the RGB numbers and names

		widthRGBNumber = offScreenGraphics.getFont().stringWidth("< 000 >");
		int maxWidthRGBNames = 0;
		for (int i = 0; i < COLOR_NAMES.length; i++) {
			maxWidthRGBNames = Math.max(maxWidthRGBNames, offScreenGraphics
					.getFont().stringWidth(Dict.getString(COLOR_NAMES[i])));
		}
		// offset X to the right justified color component values
		offsetXNumbers = cursorBlockSize + cursorOffset + maxWidthRGBNames
				+ widthRGBNumber;

		// calculate height and width of the drawing area
		int internalHeight = 4 * fontHeight + cellHeight + cursorBlockSize
				+ cursorOffset * 2;
		int internalWidth = Math.max(Math.max(maxWidthNames, widthColors),
				offsetXNumbers);

		// translate to the correct offset
		offScreenGraphics.setColor(0x00FFFFFF);
		offScreenGraphics.fillRect(0, 0, ((IDisplayable)this).getWidth(), ((IDisplayable)this).getHeight());
		offScreenGraphics.translate((((IDisplayable)this).getWidth() - internalWidth) / 2,
				(((IDisplayable)this).getHeight() - internalHeight) / 2);

		// draw fixed values (blocks, rgb names)
		for (int i = 0; i < colors.length; i++) {
			offScreenGraphics.setColor(colors[i].getValue());
			drawColorBlock(i);
		}
		// Y offset to the color component section
		offsetYRGBBlock = fontHeight + cellHeight + 2 * cursorOffset
				+ cursorBlockSize;
		// display red green blue
		for (int i = 0; i < COLOR_NAMES.length; i++) {
			int y = offsetYRGBBlock + i * fontHeight;
			int x = cursorBlockSize + cursorOffset;
			offScreenGraphics.setColor(0);
			offScreenGraphics.drawString(Dict.getString(COLOR_NAMES[i]), x, y,
					Graphics.LEFT | Graphics.TOP);

		}
		// initial cursor position
		selectedComponentChanged(0);
		selectedColorChanged(-1, 0);

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Displayable#paint(javax.microedition.lcdui.Graphics)
	 */
	protected void paint(final Graphics graphics) {
		graphics.drawImage(offScreenImage, 0, 0, 0);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Displayable#keyPressed(int)
	 */
	protected void keyPressed(final int key) {

		// is it a number and can we accept it
		if (currentComponentIndex != 0 && key >= KEY_NUM0 && key <= KEY_NUM9) {
			numberPressed((byte) (key - KEY_NUM0));
		} else {
			// handle the game keys for navigation, no support for devices
			// wihtout game keys

			final int gamekey = getGameAction(key);
			switch (gamekey) {

			case LEFT:
				if (currentComponentIndex == 0)
					changeSelectedColor(false);
				else
					changeCurrentColorComponent(LOW_DECREASE);
				break;
			case RIGHT:
				if (currentComponentIndex == 0)
					changeSelectedColor(true);
				else
					changeCurrentColorComponent(LOW_INCREASE);
				break;
			case UP:
				if (currentComponentIndex != 0)
					changeSelectedComponent(false);
				break;
			case DOWN:
				if (currentComponentIndex != 3)
					changeSelectedComponent(true);
				break;

			}
		}

		repaint();
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Displayable#pointerPressed(int, int)
	 */

	protected void pointerPressed(final int x, final int y) {

		// check for color selection.
		int selectedColorBlock = getPointerSelectedColor(x, y);
		if (selectedColorBlock >= 0) {
			// reset component index
			selectedComponentChanged(0);
			selectedColorChanged(currentColorIndex, selectedColorBlock);
		} else {
			// update selected component (if not already set)
			final int rgbValueIndex = getPointerSelectedRGBIndex(x, y);
			if (rgbValueIndex > 0) {
				if (rgbValueIndex != currentComponentIndex) {
					selectedComponentChanged(rgbValueIndex);
				}
				changeCurrentColorComponent(getPointerSelectedIncreaseFactor(x));
			}
		}
		repaint();
	}

	/**
	 * Retrieve the In/Decrease Factor for the selected color.
	 * 
	 * @param x
	 *            the pointer x
	 * @return an int being a increase/decrease factor depending on x position
	 */
	private int getPointerSelectedIncreaseFactor(final int x) {
		final int startX = offsetXNumbers + offScreenGraphics.getTranslateX();
		if (x > startX - widthRGBNumber / 4)
			return HIGH_INCREASE;
		if (x > startX - widthRGBNumber / 2)
			return LOW_INCREASE;
		if (x > startX - widthRGBNumber * 3 / 4)
			return LOW_DECREASE;
		return HIGH_DECREASE;
	}

	/**
	 * Check and return a pointer selected in/decrease.
	 * 
	 * @param x
	 *            the x pointer
	 * @param y
	 *            the y pointer
	 * @return int with 1,2,3 for r,g,b or 0 if no selection.
	 */
	private int getPointerSelectedRGBIndex(final int x, final int y) {

		final int startX = offsetXNumbers - widthRGBNumber
				+ offScreenGraphics.getTranslateX();
		for (int i = 0; i < 3; i++) {
			int startY = offsetYRGBBlock + i * fontHeight
					+ offScreenGraphics.getTranslateY();
			if (x >= startX && x <= startX + widthRGBNumber && y >= startY
					&& y <= startY + fontHeight)
				return i + 1;
		}
		return 0;
	}

	/**
	 * Retrieve the index of the pointer-selected color block, if any.
	 * 
	 * @param x
	 *            pointer x
	 * @param y
	 *            pointer y
	 * @return color index or -1 in case of no selection
	 */
	private int getPointerSelectedColor(final int x, final int y) {

		final int areaStartY = fontHeight + offScreenGraphics.getTranslateY();
		for (int i = 0; i < colors.length; i++) {
			int areaStartX = (i * cellWidth) + cursorBlockSize + cursorOffset
					+ offScreenGraphics.getTranslateX();
			if (x >= areaStartX && x <= (areaStartX + (cellWidth - 2))
					&& y >= areaStartY && y <= areaStartY + (cellHeight - 2)) {
				return i;
			}
		}
		return -1;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Displayable#keyRepeated(int)
	 */

	protected void keyRepeated(final int key) {

		final int gamekey = getGameAction(key);
		switch (gamekey) {

		case LEFT:
			if (currentComponentIndex != 0)
				changeCurrentColorComponent(HIGH_DECREASE);
			break;
		case RIGHT:
			if (currentComponentIndex != 0)
				changeCurrentColorComponent(HIGH_INCREASE);
			break;
		}

		repaint();
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.CommandListener#commandAction(javax.microedition.lcdui.Command,
	 *      javax.microedition.lcdui.Displayable)
	 */
	public void commandAction(Command command, Displayable display) {
		if (command == COMMAND_BACK) {
			saveSelectedColor();
			colorsChanged();
		} else if (command == COMMAND_DEFAULT) {
			resetCurrentColor();
		}

	}

	/**
	 * Callback method to parent.
	 */
	public abstract void colorsChanged();

	/**
	 * Draw a color block
	 * 
	 * @param i
	 *            the index within the color array
	 */
	private void drawColorBlock(int i) {
		offScreenGraphics.fillRect((i * cellWidth) + cursorBlockSize
				+ cursorOffset, fontHeight, cellWidth - 2, cellHeight - 2);
		offScreenGraphics.setColor(0);
		offScreenGraphics.drawRect((i * cellWidth) + cursorBlockSize
				+ cursorOffset, fontHeight, cellWidth - 2, cellHeight - 2);

	}

	/**
	 * Update the color selection indicator.
	 * 
	 * @param oldIndex
	 *            the old position to overwrite
	 */
	private void drawColorCursor(final int oldIndex) {

		// clear old cursor + paint new cursor
		int colorCursorYOffset = cursorOffset + cellHeight + fontHeight;
		int colorCursorXOffset = cursorOffset + (cellWidth - cursorBlockSize)
				/ 2 + cursorBlockSize;

		if (oldIndex >= 0) {
			offScreenGraphics.setColor(0x00FFFFFF);
			offScreenGraphics.fillRect((oldIndex * cellWidth)
					+ colorCursorXOffset, colorCursorYOffset, cursorBlockSize,
					cursorBlockSize);
		}
		offScreenGraphics.setColor(0);
		offScreenGraphics.fillRect((currentColorIndex * cellWidth)
				+ colorCursorXOffset, colorCursorYOffset, cursorBlockSize,
				cursorBlockSize);
	}

	/**
	 * Update the component (color, r, g, b) selection indicator.
	 * 
	 */
	private void drawComponentCursor() {

		// clear old cursor + paint new cursor
		offScreenGraphics.setColor(0x00FFFFFF);
		offScreenGraphics.fillRect(0, fontHeight, cursorBlockSize,
				offsetYRGBBlock + fontHeight * 3);

		int y = offsetYRGBBlock + cursorOffset + fontHeight
				* (currentComponentIndex - 1);
		switch (currentComponentIndex) {
		case 0:
			offScreenGraphics.setColor(0);
			y = fontHeight + (cellHeight - cursorBlockSize) / 2;
			break;
		case 1:
			offScreenGraphics.setColor(255, 0, 0);
			break;
		case 2:
			offScreenGraphics.setColor(0, 255, 0);
			break;
		case 3:
			offScreenGraphics.setColor(0, 0, 255);
			break;
		}

		offScreenGraphics.fillRect(0, y, cursorBlockSize, cursorBlockSize);

	}

	/**
	 * Update the current RGB numeric values.
	 */
	private void drawRGBValues() {

		if (currentComponentIndex == 0) {
			// complete color changed => redraw all 3 values
			drawRGBValue(0);
			drawRGBValue(1);
			drawRGBValue(2);

		} else {
			// redraw only the current changed value
			drawRGBValue(currentComponentIndex - 1);
		}
	}

	/**
	 * Update on RGB numeric value.
	 * 
	 * @param i
	 *            the value to update (r,g,b)
	 */
	private void drawRGBValue(final int i) {

		// clear RGB value and draw new string

		String value = "";
		switch (i) {
		case 0:
			value = String.valueOf(red);
			break;
		case 1:
			value = String.valueOf(green);
			break;
		case 2:
			value = String.valueOf(blue);
			break;
		}

		int x = offsetXNumbers - widthRGBNumber;
		int y = offsetYRGBBlock + i * fontHeight;

		// clear
		offScreenGraphics.setColor(0x00FFFFFF);
		offScreenGraphics.fillRect(x, y, widthRGBNumber + 2, fontHeight);

		// draw new
		offScreenGraphics.setColor(0);
		offScreenGraphics.drawString("< ", x, y, Graphics.LEFT | Graphics.TOP);
		offScreenGraphics.drawString(value + " >", offsetXNumbers, y,
				Graphics.RIGHT | Graphics.TOP);

	}

	/**
	 * Update the color-values of the selected color on screen.
	 */
	private void drawCurrentColorCell() {

		// fill cell with new color
		offScreenGraphics.setColor(red, green, blue);
		drawColorBlock(currentColorIndex);

	}

	/**
	 * Show the name-id of the current selected color.
	 */
	private void drawColorName() {

		// clear name area + write new name
		offScreenGraphics.setColor(0x00FFFFFF);
		offScreenGraphics.fillRect(0, 0, maxWidthNames + 2, fontHeight);
		offScreenGraphics.setColor(0);
		offScreenGraphics.drawString(Dict.getString(colors[currentColorIndex]
				.getIdentifier()), 0, 0, Graphics.LEFT | Graphics.TOP);

	}

	/**
	 * Work a selection change of the color.
	 * 
	 * @param oldIndex
	 *            old index from array
	 * @param newIndex
	 *            new index from array
	 */
	private void selectedColorChanged(final int oldIndex, final int newIndex) {

		if (oldIndex >= 0)
			saveSelectedColor();

		currentColorIndex = newIndex;
		drawColorCursor(oldIndex);

		drawColorName();

		loadSelectedColor();
		drawRGBValues();
	}

	/**
	 * update the component selection.
	 * 
	 * @param newIndex
	 *            index of the selected component.
	 */
	private void selectedComponentChanged(final int newIndex) {

		currentComponentIndex = newIndex;
		drawComponentCursor();
	}

	/**
	 * get numeric values for selected color.
	 */
	private void loadSelectedColor() {
		final Color c = colors[currentColorIndex];
		// use graphis to extract rgb values
		offScreenGraphics.setColor(c.getValue());
		red = offScreenGraphics.getRedComponent();
		green = offScreenGraphics.getGreenComponent();
		blue = offScreenGraphics.getBlueComponent();
	}

	/**
	 * update numeric values into the color.
	 */
	private void saveSelectedColor() {

		if (currentColorIndex >= 0 && currentColorIndex <= colors.length) {
			final Color c = colors[currentColorIndex];
			offScreenGraphics.setColor(red, green, blue);
			final int saveColor = offScreenGraphics.getColor();
			c.setValue(saveColor);
		}
	}

	/**
	 * Change the value of the color component.
	 * 
	 * @param increaseFactor
	 *            int to be filled with static values to indicate the
	 *            increase/decrease option
	 */
	private void changeCurrentColorComponent(final int increaseFactor) {

		int diff = (increaseFactor == HIGH_INCREASE || increaseFactor == HIGH_DECREASE) ? 10
				: 1;
		if (increaseFactor == LOW_DECREASE || increaseFactor == HIGH_DECREASE)
			diff = -diff;

		switch (currentComponentIndex) {
		case 1:

			red = red + diff;
			if (red > 255)
				red = 255;
			else if (red < 0)
				red = 0;

			break;
		case 2:
			green = green + diff;
			if (green > 255)
				green = 255;
			else if (green < 0)
				green = 0;
			break;
		case 3:
			blue = blue + diff;
			if (blue > 255)
				blue = 255;
			else if (blue < 0)
				blue = 0;
			break;
		}

		drawRGBValues();
		drawCurrentColorCell();

	}

	/**
	 * change the components value.
	 * 
	 * @param increase
	 *            boolean to raise or lower value
	 */
	private void changeSelectedComponent(final boolean increase) {

		if (increase) {
			if (currentComponentIndex != 3) {
				selectedComponentChanged(currentComponentIndex + 1);
			}
		} else {
			if (currentComponentIndex != 0) {
				selectedComponentChanged(currentComponentIndex - 1);
			}
		}

	}

	/**
	 * Change color selection.
	 * 
	 * @param increase
	 *            boolean to go forward or backword in color array
	 */
	private void changeSelectedColor(final boolean increase) {

		if (increase) {
			if (currentColorIndex != (colors.length - 1)) {
				selectedColorChanged(currentColorIndex, currentColorIndex + 1);
			}
		} else {
			if (currentColorIndex != 0) {
				selectedColorChanged(currentColorIndex, currentColorIndex - 1);
			}
		}

	}

	/**
	 * Work a Number press.
	 * 
	 * @param digit
	 *            the number pressed
	 */
	private void numberPressed(final byte digit) {

		int value = 0;
		switch (currentComponentIndex) {
		case 1:
			value = red;
			break;
		case 2:
			value = green;
			break;
		case 3:
			value = blue;
			break;
		}

		int newValue = ((value * 10) + digit) % 1000;

		if (newValue > 255)
			newValue = (newValue % 100) + 100;

		switch (currentComponentIndex) {
		case 1:
			red = newValue;
			break;
		case 2:
			green = newValue;
			break;
		case 3:
			blue = newValue;
			break;
		}

		drawRGBValues();
		drawCurrentColorCell();

	}

	/**
	 * reset a color to its default value.
	 */
	private void resetCurrentColor() {

		final Color c = colors[currentColorIndex];
		c.reset();

		loadSelectedColor();
		selectedComponentChanged(0);
		drawRGBValues();
		drawCurrentColorCell();
		repaint();
	}
}
