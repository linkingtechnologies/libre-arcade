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
import java.util.Date;
import java.util.Enumeration;
import java.util.Timer;
import java.util.TimerTask;
import java.util.Vector;

import javax.microedition.lcdui.Canvas;
import javax.microedition.lcdui.Font;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;
import javax.microedition.midlet.MIDlet;

import de.wintermute.midlet.CommonUI;
import de.wintermute.sudoku.res.Dict;

/**
 * The canvas which paints the grid.
 * 
 * @author Ivonne Engemann
 * @version $Id: SudokuUI.java,v 1.5 2006/11/04 13:30:48 ive Exp $
 */

public class SudokuUI extends CommonUI {
	/**
	 * The color for each digit, used to draw pencil marks in same color.
	 */
	private final static int[] COLOR = { 0x00800000, 0x00008000, 0x00000080,
			0x00008080, 0x00000000, 0x00800080, 0x000000FF, 0x00808000,
			0x00FF0000 };

	/**
	 * Background color of a "normal" slot.
	 */
	protected final static Color COLOR_BACKGROUND_NORMAL = new Color("clrBack",
			0x00FFFFFF, 0x00FFFFFF);

	/**
	 * Background color of orginal digit (could not change this digit).
	 */
	protected final static Color COLOR_BACKGROUND_ORIGINAL = new Color(
			"clrBackOrig", 0x00E1E1E1, 0x00E1E1E1);

	/**
	 * Background of focussed digit.
	 */
	protected final static Color COLOR_BACKGROUND_FOCUS_NORMAL = new Color(
			"clrFocus", 0x00FFFF80, 0x00FFFF80);

	/**
	 * Background of focussed digit in PENCIL mode.
	 */
	protected final static Color COLOR_BACKGROUND_FOCUS_PENCIL = new Color(
			"clrFocusPencil", 0x00FF80FF, 0x00FF80FF);

	/**
	 * Background of focussed digit in NAVIGATION mode (#).
	 */
	protected final static Color COLOR_BACKGROUND_FOCUS_NAV = new Color(
			"clrFocusNav", 0x0080FFFF, 0x0080FFFF);

	/**
	 * In mode "show solution" show correct digits with GREEN background.
	 */
	protected final static Color COLOR_BACKGROUND_CORRECT = new Color(
			"clrCorrect", 0x0000FF00, 0x0000FF00);

	/**
	 * In mode "show solution" display wrong digits with RED background.
	 */
	protected final static Color COLOR_BACKGROUND_WRONG = new Color("clrWrong",
			0x00FF0000, 0x00FF0000);

	/**
	 * Mark every second 3x3 block with a different background color (if setting
	 * requires this).
	 */
	protected final static Color COLOR_BACKGROUND_BLOCK = new Color("clrBlock",
			0x00E0E0FF, 0x00E0E0FF);

	/**
	 * The grid color of the line between the 3x3 blocks.
	 */
	private final static int COLOR_GRID_LINE = 0x0;

	/** Normal (smallest) size images */
	private static final int IMAGE_SIZE_DEFAULT = 12;

	/** Big size images */
	private static final int IMAGE_SIZE_BIG = 24;

	/** Middle size images */
	private static final int IMAGE_SIZE_MIDDLE = 18;

	/** Middle size images */
	private static final int IMAGE_SIZE_SMALL = 15;

	/** grid offset of the 3x3 blocks */
	private static final int BLOCK_OFFSET_DEFAULT = 0;

	/** grid offset of the 3x3 blocks */
	private static final int BLOCK_OFFSET_MIDDLE = 2;

	/** grid offset of the 3x3 blocks */
	private static final int BLOCK_OFFSET_BIG = 3;

	/** grid offset of the 3x3 blocks */
	private static final int BLOCK_OFFSET_SMALL = 1;

	/** Happy smiley */
	private static final int LUCKY_SMILEY = 0;

	/** Bad smiley */
	private static final int BAD_SMILEY = 1;

	/** empty smiley (border= */
	private static final int EMPTY_SMILEY = 2;

	/**
	 * the start time of a game for solving
	 */
	private long startTime;

	/** the timer (thread) to change the title display of the canvas */
	private Timer currentTimer;

	/**
	 * The the midlet.
	 */
	private SudokuMidlet midlet = null;

	/**
	 * The grid to display.
	 */
	protected Grid grid;

	/**
	 * The stae holder which contains current status of flags.
	 */
	protected SudokuStateControl stateHolder;

	/**
	 * The height of the canvas.
	 */
	private int height;

	/**
	 * The width of the canvas.
	 */
	private int width;

	/**
	 * The y position for the icon in mode "icons on bottom".
	 */
	private int posYIconsBottom;

	/** width of the grid */
	private int gridHeight;

	/** height of the grid */
	private int gridWidth;

	/**
	 * Draw on off/screen image.
	 */
	private Image offScreenImage;

	/**
	 * The graphic context of the off-screen image.
	 */
	private Graphics offScreenGraphics;

	/**
	 * Location of icons: should be placed on right side, bottom or none display
	 * at all.
	 */
	private int sidebarLocation = SudokuStateControl.SIDEBAR_RIGHT;

	/**
	 * Setup the size of a single image/slot.
	 */
	private int imageSize = IMAGE_SIZE_DEFAULT;

	/**
	 * Setup the size of a single pointer digit (one size less than usual
	 * slots).
	 */
	private int imagePointerSize = IMAGE_SIZE_DEFAULT;

	/**
	 * Setup the size of a block offset.
	 */
	private int blockOffset = BLOCK_OFFSET_DEFAULT;

	/**
	 * The complete image holding all COLOR digits. Position
	 * 0->1,1->2,...,8->9,9->empty,10->pencilmarks
	 */
	private Image combinedImageColor;

	/**
	 * The file name of the image holding all COLOR digits in one size less than
	 * usual size. Position 0->1,1->2,...,8->9,9->empty,10->pencilmarks
	 */
	private String fileNamePointerImageColor;

	/**
	 * The the image holding all digits.
	 */
	private Image pointerImage;

	/**
	 * Indicator for pointer image colored/black.
	 */
	private boolean pointerImageColored;

	/**
	 * The complete image holding all BLACK digits. Position
	 * 0->1,1->2,...,8->9,9->empty,10->pencilmarks
	 */
	private Image combinedImageBlack;

	/**
	 * The file name of the image holding all BLACK digits. Position
	 * 0->1,1->2,...,8->9,9->empty,10->pencilmarks
	 */
	private String fileNameBlackImages;

	/**
	 * The file name of the image holding all COLOR digits.Position
	 * 0->1,1->2,...,8->9,9->empty,10->pencilmarks
	 */
	private String fileNameColorImages;

	/**
	 * The file name of the image holding all BLACK digits in a size less the
	 * usual size. Position 0->1,1->2,...,8->9,9->empty,10->pencilmarks
	 */
	private String fileNamePointerImageBlack;

	/**
	 * The offset position for direction x. To place the grid in the middle.
	 */
	private int offsetX;

	/**
	 * The offset position for direction Y. To place the grid in the middle.
	 */
	private int offsetY;

	/**
	 * indicates, that the digit keys are in MOVE mode
	 */
	private boolean useDigitsToMove;

	/**
	 * is status field active
	 */
	private boolean statusDisplayed;

	/**
	 * The focussed column. Start in middle.
	 */
	protected byte focusColumn = 4;

	/**
	 * The focussed row. Start in middle.
	 */
	protected byte focusRow = 4;

	/**
	 * The digit in pointer bar, which is currently selected.
	 */
	protected byte selectedPointerDigit = 1;

	/**
	 * Store all conflict positions: if entered wrong digit, high-light same
	 * digit in same row, column or block.
	 */
	protected Vector conflictPositions;

	/**
	 * stores previous conflicts for faster screen update
	 */
	protected Vector oldConflictPositions;

	/**
	 * The stack with all changes/moves for UNDO/REDO mode.
	 */
	private MoveStack moves = new MoveStack();

	/**
	 * The x position of the smiley sign.
	 */
	private int xPosSmiley;

	/**
	 * The y position of the smiley sign.
	 */
	private int yPosSmiley;

	/**
	 * The x position of the Pen/Pencil sign.
	 */
	private int xPosPencil;

	/**
	 * The y position of the Pen/Pencil sign.
	 */
	private int yPosPencil;

	/**
	 * The x position of the pointer digit sidebar.
	 */
	private int xPosPointerDigits;

	/**
	 * The y position of the pointer digit sidebar.
	 */
	private int yPosPointerDigits;

	/**
	 * The block size of a pencilmark
	 */
	private int markSize;

	/**
	 * indicates, if the screen update is to be done completly
	 */
	protected boolean paintAll;

	/**
	 * store recent focus row
	 */
	private byte oldFocusRow;

	/**
	 * store recent focus column
	 */
	private byte oldFocusCol;

	/**
	 * Create the canvas.
	 * 
	 */
	public SudokuUI() {

	}

	/**
	 * Get the offscreen image to use for paint().
	 * 
	 * @return Image to use in paint()
	 */
	Image getOffScreenImage() {
		// lazy init, as it may be freed after freeResources() calls
		if (offScreenImage == null) {
			offScreenImage = Image.createImage(getWidth(), getHeight());
		}
		return offScreenImage;
	}

	/**
	 * Initialize the images.
	 * 
	 * @throws IOException
	 */
	private void initializeImages() throws IOException {

		int oldImageSize = imageSize;
		int oldimagePointerSize = imagePointerSize;

		fileNameBlackImages = "/digitsb.png";
		fileNameColorImages = "/digitsc.png";
		imageSize = IMAGE_SIZE_DEFAULT;
		blockOffset = BLOCK_OFFSET_DEFAULT;
		fileNamePointerImageBlack = fileNameBlackImages;
		fileNamePointerImageColor = fileNameColorImages;
		imagePointerSize = imageSize;

		boolean fit = checkSize(IMAGE_SIZE_DEFAULT, BLOCK_OFFSET_SMALL, false);

		if (fit) {
			fit = checkSize(IMAGE_SIZE_SMALL, BLOCK_OFFSET_DEFAULT, true);
		}

		if (fit) {
			fit = checkSize(IMAGE_SIZE_SMALL, BLOCK_OFFSET_SMALL, false);
		}

		if (fit) {
			fit = checkSize(IMAGE_SIZE_SMALL, BLOCK_OFFSET_MIDDLE, false);
		}

		if (fit) {
			fit = checkSize(IMAGE_SIZE_MIDDLE, BLOCK_OFFSET_DEFAULT, !this
					.hasPointerEvents());
		}

		if (fit) {
			fit = checkSize(IMAGE_SIZE_MIDDLE, BLOCK_OFFSET_SMALL, false);
		}

		if (fit) {
			fit = checkSize(IMAGE_SIZE_MIDDLE, BLOCK_OFFSET_MIDDLE, false);
		}

		if (fit) {
			fit = checkSize(IMAGE_SIZE_BIG, BLOCK_OFFSET_SMALL, true);
		}

		if (fit) {
			fit = checkSize(IMAGE_SIZE_BIG, BLOCK_OFFSET_MIDDLE, false);
		}

		if (fit) {
			fit = checkSize(IMAGE_SIZE_BIG, BLOCK_OFFSET_BIG, false);
		}

		// internal size of a block
		markSize = (imageSize - 4) / 3;

		gridWidth = 9 * (imageSize - 1) + 1 + 2 * blockOffset;

		// we need the full grid and one image column on the right at least
		int xSize = gridWidth;
		if (stateHolder.getSidebarLocation() == SudokuStateControl.SIDEBAR_RIGHT) {
			xSize += imageSize;
		}
		final int xLeft = width - xSize;
		offsetX = xLeft / 2;

		gridHeight = 9 * (imageSize - 1) + 1 + 2 * blockOffset;
		int ySize = gridHeight;
		if (stateHolder.getSidebarLocation() == SudokuStateControl.SIDEBAR_BOTTOM) {
			ySize += imageSize;
		}
		final int yLeft = height - ySize;
		offsetY = yLeft / 2;
		if (yLeft < 0
				&& stateHolder.getSidebarLocation() == SudokuStateControl.SIDEBAR_BOTTOM) {
			offsetY = 0;
		}

		// if size changed => load new images
		if (oldImageSize != imageSize) {
			combinedImageBlack = null;
			combinedImageColor = null;
		}
		if (oldimagePointerSize != imagePointerSize) {
			pointerImage = null;
		}

		initializePositions();

	}

	/**
	 * Check if the requested image size fits to width and height of the canvas.
	 * 
	 * @param checkImageSize
	 *            the image size for the grid
	 * @param checkBlockSize
	 *            the size of the lines beetween the grids
	 * @param nextSize
	 *            if true, the next image size is used => copy old size for
	 *            pointer images
	 * @return true, if the size fits
	 */
	private boolean checkSize(final int checkImageSize,
			final int checkBlockSize, final boolean nextSize) {

		if (width >= getMinimumWidth(checkImageSize, checkBlockSize)
				&& height >= getMinimumHeight(checkImageSize, checkBlockSize)) {

			if (nextSize) {
				fileNamePointerImageBlack = fileNameBlackImages;
				fileNamePointerImageColor = fileNameColorImages;
				imagePointerSize = imageSize;
			}

			switch (checkImageSize) {
			case IMAGE_SIZE_SMALL:
				fileNameBlackImages = "/digitsbs.png";
				fileNameColorImages = "/digitscs.png";
				break;
			case IMAGE_SIZE_MIDDLE:
				fileNameBlackImages = "/digitsbm.png";
				fileNameColorImages = "/digitscm.png";
				break;
			case IMAGE_SIZE_BIG:
				fileNameBlackImages = "/digitsbb.png";
				fileNameColorImages = "/digitscb.png";
				break;
			default:
				fileNameBlackImages = "/digitsb.png";
				fileNameColorImages = "/digitsc.png";
				break;
			}

			imageSize = checkImageSize;
			blockOffset = checkBlockSize;

			return true;
		}
		return false;
	}

	/**
	 * Get the minumum width needed for specified image size.
	 * 
	 * @param imageSize
	 *            check this image size
	 * @param blockSize
	 *            corresponding size of block grid
	 * @return the minimum width size needed
	 */
	private int getMinimumWidth(final int imageSize, final int blockSize) {

		int size = 9 * (imageSize - 1) + blockSize * 2 + 1;

		if (stateHolder.getSidebarLocation() == SudokuStateControl.SIDEBAR_RIGHT) {
			size += imageSize;
		}

		return size;
	}

	/**
	 * Get the minumum height needed for specified image size.
	 * 
	 * @param imageSize
	 *            check this image size
	 * @param blockSize
	 *            corresponding size of block grid
	 * @return the minimum height size needed
	 */
	private int getMinimumHeight(final int imageSize, final int blockSize) {

		int size = 9 * (imageSize - 1) + blockSize * 2 + 1;

		if (stateHolder.getSidebarLocation() == SudokuStateControl.SIDEBAR_BOTTOM) {
			size += imageSize;
		}

		return size;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Displayable#paint(javax.microedition.lcdui.Graphics)
	 */

	/**
	 * Redraw the whole grid to off-screen image.
	 * 
	 * @param showWrongSetDigits
	 *            boolean to mark wrong digits
	 */
	public final void updateCanvas(final boolean showWrongSetDigits) {

		// check if image sizes needs to be recalculated after pref changes
		if (sidebarLocation != stateHolder.getSidebarLocation()) {
			recalculateImageSize();
		}

		if (grid != null) {
			if (paintAll) {
				// do a full paint job
				paintAll = false;
				for (byte row = 0; row < 9; row++) {
					for (byte col = 0; col < 9; col++) {
						final GridSlot slot = grid.getSlot(row, col);
						paintSlot(row, col, slot, showWrongSetDigits);
					}
				}
			} else {
				// only paint changes
				paintSlot(focusRow, focusColumn, grid.getSlot(focusRow,
						focusColumn), showWrongSetDigits);
				paintSlot(oldFocusRow, oldFocusCol, grid.getSlot(oldFocusRow,
						oldFocusCol), showWrongSetDigits);
			}
			// only show conflicts if in correct mode
			if (!showWrongSetDigits) {
				drawConflicts();
			}
			drawGrid();

			// check if the sidebar for pointer input or signals is needed
			if (isSidebarShown()) {
				drawSidebar();
			}

			drawPencilPenModeSign();
			checkSolution();
		}
	}

	/**
	 * Check mode and draw conflicts, if any.
	 * 
	 */
	private void drawConflicts() {

		// check if in correct mode to enable conflict drawing
		if (!stateHolder.isShowSolution() && !stateHolder.isUndoMode()
				&& stateHolder.isDisplayConflicts()) {
			// revert old conflicts to normal
			if (oldConflictPositions != null && !oldConflictPositions.isEmpty()) {
				Enumeration oldConflicts = oldConflictPositions.elements();
				while (oldConflicts.hasMoreElements()) {
					Position pos = (Position) oldConflicts.nextElement();
					// redraw marked fields if any
					if (pos.row != focusRow || pos.col != focusColumn) {
						paintSlot(pos.row, pos.col, grid.getSlot(pos.row,
								pos.col), false);
					}
				}
			}
			// draw new conflicts if any
			if (conflictPositions != null && !conflictPositions.isEmpty()) {
				Enumeration conflicts = conflictPositions.elements();
				while (conflicts.hasMoreElements()) {
					Position pos = (Position) conflicts.nextElement();
					// draw a WRONG slot (but only if not focused)
					if (pos.row != focusRow || pos.col != focusColumn) {
						drawSlot(pos.row, pos.col, grid.getSlot(pos.row,
								pos.col).getShown(), COLOR_BACKGROUND_WRONG
								.getValue(), false);
					}
				}
			}
		}
	}

	/**
	 * Check if pointer signs should be displayed. Only done if enough place and
	 * not in special mode like solution mode or puzzle creation mode. If device
	 * supports pointer input display sidebar in user creation mode too.
	 * 
	 * @return true, if sidebar with digits should be displayed
	 */
	private boolean isSidebarShown() {

		return !stateHolder.isShowSolution()
				&& stateHolder.getSidebarLocation() != SudokuStateControl.SIDEBAR_NONE
				&& stateHolder.getSidebarUsage() != SudokuStateControl.SIDEBAR_NONE;
	}

	/**
	 * Draw the lines between 3x3 mini blocks.
	 * 
	 */
	private void drawGrid() {
		final Graphics g = getOffScreenGraphics();
		g.setColor(COLOR_GRID_LINE);
		for (int i = 0; i <= blockOffset; i++) {
			g.drawLine(i + offsetX + (imageSize - 1) * 3, offsetY, i + offsetX
					+ (imageSize - 1) * 3, (blockOffset * 2) + offsetY
					+ (imageSize - 1) * 9);
			g.drawLine(blockOffset + i + offsetX + (imageSize - 1) * 6,
					offsetY, blockOffset + i + offsetX + (imageSize - 1) * 6,
					(blockOffset * 2) + offsetY + (imageSize - 1) * 9);

			g.drawLine(offsetX, i + offsetY + (imageSize - 1) * 3,
					(blockOffset * 2) + offsetX + (imageSize - 1) * 9, i
							+ offsetY + (imageSize - 1) * 3);
			g.drawLine(offsetX,
					blockOffset + i + offsetY + (imageSize - 1) * 6,
					(blockOffset * 2) + offsetX + (imageSize - 1) * 9,
					blockOffset + i + offsetY + (imageSize - 1) * 6);
		}
	}

	/**
	 * Draw a Cell.
	 * 
	 * @param row
	 *            the Row
	 * @param column
	 *            the Colum
	 * @param digit
	 *            the digit to draw
	 * @param backgroundColor
	 *            the color to use
	 * @param coloredDigit
	 *            indicator to use colored or black digits
	 */
	private void drawSlot(final byte row, final byte column, final byte digit,
			final int backgroundColor, final boolean coloredDigit) {
		final int yBlockOffset = (row / 3) * blockOffset;
		final int xBlockOffset = (column / 3) * blockOffset;
		final Graphics g = getOffScreenGraphics();
		// draw background
		g.setColor(backgroundColor);
		g.fillRect(column * (imageSize - 1) + offsetX + xBlockOffset, row
				* (imageSize - 1) + offsetY + yBlockOffset, imageSize,
				imageSize);

		// draw image
		final Image sourceImage = (coloredDigit) ? getCombinedImageColor()
				: getCombinedImageBlack();
		final int pos = (digit == 0) ? 9 : digit - 1;

		drawRegion(g, sourceImage, pos * imageSize, 0, imageSize, imageSize,
				column * (imageSize - 1) + offsetX + xBlockOffset, row
						* (imageSize - 1) + offsetY + yBlockOffset,
				Graphics.TOP | Graphics.LEFT);
	}

	/**
	 * Draw the sign, if we are in pencil or in pen mode.
	 * 
	 */
	public final void drawPencilPenModeSign() {

		if (stateHolder.getSidebarLocation() == SudokuStateControl.SIDEBAR_NONE) {
			// do not show icons at all
			return;
		}

		final boolean pencilMode = stateHolder.isPencilMode();

		final boolean colored = (pencilMode && stateHolder
				.isUseColorPencilMarks())
				|| (!pencilMode && stateHolder.isUseColorDigits());

		final Image sourceImage = colored ? getCombinedImageColor()
				: getCombinedImageBlack();

		final Graphics g = getOffScreenGraphics();
		// draw background
		g.setColor(COLOR_BACKGROUND_NORMAL.getValue());
		g.fillRect(xPosPencil, yPosPencil, imageSize, imageSize);

		int posWithinCombined = pencilMode ? 10 : 12;
		if (useDigitsToMove) {
			posWithinCombined = 9;
		}

		// draw image
		drawRegion(g, sourceImage, posWithinCombined * imageSize, 0, imageSize,
				imageSize, xPosPencil, yPosPencil, Graphics.TOP | Graphics.LEFT);

		if (useDigitsToMove) {
			g.setColor(0x00000000);
			final int crossWidth = imageSize / 5;
			g.fillRect(xPosPencil + crossWidth, yPosPencil + 2 * crossWidth,
					3 * crossWidth, crossWidth);
			g.fillRect(xPosPencil + 2 * crossWidth, yPosPencil + crossWidth,
					crossWidth, 3 * crossWidth);
		}
	}

	/**
	 * Paint the pencil marks.
	 * 
	 * @param row
	 *            the Row
	 * @param col
	 *            the Column
	 * @param colorMark
	 *            indicates if color setting is allowed for the marks
	 */
	private void paintPencilMarks(final byte row, final byte col,
			final boolean colorMark) {
		int yBlockOffset = (row / 3) * blockOffset;
		int xBlockOffset = (col / 3) * blockOffset;

		final int posX = col * (imageSize - 1) + 2 + offsetX + xBlockOffset;
		final int posY = row * (imageSize - 1) + 2 + offsetY + yBlockOffset;
		final Graphics g = getOffScreenGraphics();

		for (byte i = 0; i < 3; i++) {
			for (byte j = 0; j < 3; j++) {
				final int d = i * 3 + j;
				if (grid.getSlot(row, col).isPencilMark(d)) {
					final int x = posX + (markSize + 1) * j;
					final int y = posY + (markSize + 1) * i;

					final int colorToUse = colorMark ? COLOR[d]
							: COLOR_GRID_LINE;
					g.setColor(colorToUse);
					g.fillRect(x, y, markSize, markSize);
				}
			}
		}

	}

	/**
	 * Setup digit and paint it.
	 * 
	 * @param row
	 *            the Row
	 * @param col
	 *            the Column
	 * @param slot
	 *            the GridSlot to use
	 * @param markWrongDigit
	 *            indicator to show erroneous digits
	 */
	private void paintSlot(final byte row, final byte col, final GridSlot slot,
			final boolean markWrongDigit) {

		byte digit = slot.getShown();

		boolean colorDigit = stateHolder.isUseColorDigits();

		final boolean showBlockBackground = (stateHolder.isDisplayBlocks() && ((Position
				.getBlockNumber(row, col) % 2) == 1));

		int background = showBlockBackground ? COLOR_BACKGROUND_BLOCK
				.getValue() : COLOR_BACKGROUND_NORMAL.getValue();

		if (slot.isOriginalDigit() && stateHolder.isDisplayGivens()) {
			background = COLOR_BACKGROUND_ORIGINAL.getValue();
		}

		// Focus
		if (row == focusRow && col == focusColumn) {
			background = stateHolder.isPencilMode() ? COLOR_BACKGROUND_FOCUS_PENCIL
					.getValue()
					: COLOR_BACKGROUND_FOCUS_NORMAL.getValue();
			if (useDigitsToMove) {
				background = COLOR_BACKGROUND_FOCUS_NAV.getValue();
			}
		}

		if (stateHolder.isShowSolution() || markWrongDigit) {
			colorDigit = false;
			// marking digits does not display any answers
			if (!markWrongDigit) {
				digit = slot.getAnswer();
			}

			if (slot.isOriginalDigit() || slot.getShown() == 0) {
				// ignore
			} else if (slot.getShown() == slot.getAnswer()) {
				background = COLOR_BACKGROUND_CORRECT.getValue();
			} else if (slot.getShown() != 0) {
				background = COLOR_BACKGROUND_WRONG.getValue();
			}
		} else if (stateHolder.isUndoMode()) {

			if (row == focusRow && col == focusColumn) {
				colorDigit = false;
				background = COLOR_BACKGROUND_WRONG.getValue();
			} else {
				background = COLOR_BACKGROUND_FOCUS_NORMAL.getValue();
			}

		}

		drawSlot(row, col, digit, background, colorDigit);

		if (digit == 0 && !stateHolder.isShowSolution()
				&& stateHolder.isShowPencilMarks()) {
			boolean colorMarks = stateHolder.isUseColorPencilMarks()
					&& !(stateHolder.isUndoMode() && row == focusRow && col == focusColumn);
			paintPencilMarks(row, col, colorMarks);
		}

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Displayable#keyPressed(int)
	 */
	public void keyPressed(final int key) {

		if (grid == null) {
			return;
		}

		if (key == stateHolder.getQuickSaveKey()) {
			midlet.autoSaveGrid();
		}

		if (stateHolder.isUndoMode()) {
			keyPressedUndoMode(key);
		} else {

			// toggle status if in valid state
			if (toggleStatusPopup(key == Canvas.KEY_STAR
					&& !stateHolder.isUserCreatingPuzzle())) {
				updateCanvas(false);
				repaint();
			}

			if (!stateHolder.isShowSolution()) {
				if (key == Canvas.KEY_POUND) {
					toggleMoveMode();
				}

				if (useDigitsToMove) {
					moveWithDigits(key);
				} else {
					if (key > Canvas.KEY_NUM0 && key <= Canvas.KEY_NUM9) {
						numberPressed((byte) (key - Canvas.KEY_NUM0));
					} else if (key == Canvas.KEY_NUM0
							&& !stateHolder.isUserCreatingPuzzle()) {
						stateHolder.togglePencilMode();
					}
				}
				// no number, so this might be a nav key
				if (key < Canvas.KEY_NUM0 || key > Canvas.KEY_NUM9) {
					storeFocus();
					// game key
					final int action = getGameAction(key);
					switch (action) {

					case Canvas.LEFT:
						focusColumn--;
						if (focusColumn == -1)
							focusColumn = 8;
						break;

					case Canvas.RIGHT:
						focusColumn++;
						if (focusColumn == 9)
							focusColumn = 0;
						break;

					case Canvas.UP:
						focusRow--;
						if (focusRow == -1)
							focusRow = 8;
						break;

					case Canvas.DOWN:
						focusRow++;
						if (focusRow == 9)
							focusRow = 0;
						break;
					}
					updateCanvas(false);
					repaint();
				}
			}
		}
	}

	/**
	 * @param key
	 */
	private void moveWithDigits(final int key) {
		storeFocus();
		switch (key) {
		case Canvas.KEY_NUM1:
			focusColumn--;
			if (focusColumn == -1)
				focusColumn = 8;
			focusRow--;
			if (focusRow == -1)
				focusRow = 8;
			break;
		case Canvas.KEY_NUM2:
			focusRow--;
			if (focusRow == -1)
				focusRow = 8;
			break;
		case Canvas.KEY_NUM3:
			focusColumn++;
			if (focusColumn == 9)
				focusColumn = 0;
			focusRow--;
			if (focusRow == -1)
				focusRow = 8;
			break;
		case Canvas.KEY_NUM4:
			focusColumn--;
			if (focusColumn == -1)
				focusColumn = 8;
			break;
		case Canvas.KEY_NUM6:
			focusColumn++;
			if (focusColumn == 9)
				focusColumn = 0;
			break;
		case Canvas.KEY_NUM7:
			focusColumn--;
			if (focusColumn == -1)
				focusColumn = 8;
			focusRow++;
			if (focusRow == 9)
				focusRow = 0;
			break;
		case Canvas.KEY_NUM8:
			focusRow++;
			if (focusRow == 9)
				focusRow = 0;
			break;
		case Canvas.KEY_NUM9:
			focusColumn++;
			if (focusColumn == 9)
				focusColumn = 0;
			focusRow++;
			if (focusRow == 9)
				focusRow = 0;
			break;
		}
		updateCanvas(false);
		repaint();
	}

	/**
	 * Handle UndoRedo Key Press.
	 * 
	 * @param key
	 *            the key pressed
	 */
	private void keyPressedUndoMode(final int key) {
		// special handling for REDO / UNDO mode

		if (key == Canvas.KEY_POUND) {
			toggleMoveMode();
		} else {
			// game key
			final int action = getGameAction(key);
			switch (action) {

			case Canvas.LEFT:
			case Canvas.DOWN:
				undoMove();
				break;

			case Canvas.RIGHT:
			case Canvas.UP:
				redoMove();
				break;
			default:
				updateCanvas(false);
				repaint();
			}
		}

	}

	/**
	 * Stop update of status display.
	 */
	private void stopStatusDisplay() {

		if (currentTimer != null) {
			currentTimer.cancel();
			currentTimer = null;
		}
		repaint();
	}

	/**
	 * Start update of status display.
	 * 
	 * @param gameSolved
	 *            indicates solving state
	 */
	private void startStatusDisplay(final boolean gameSolved) {

		if (currentTimer != null) {
			currentTimer.cancel();
		}
		final Runnable r = new Runnable() {
			public void run() {
				// events may have been queued, so check, if the need to process
				if (statusDisplayed)
					drawText(new String[] {
							Dict.getString("type") + grid.getType(),
							gameSolved ? Dict.getString("solved") : Dict
									.getString("running"),
							Dict.getString("time") + getFormatElapsedTime() },
							true);
			}
		};
		currentTimer = new Timer();
		TimerTask task = new TimerTask() {

			public void run() {
				midlet.invokeLater(r);
			}
		};
		currentTimer.schedule(task, new Date(), 1000);

	}

	/**
	 * Get formatted time string (mins:secs).
	 * 
	 * @return time string of passed time since puzzle creation/reset.
	 */
	private String getFormatElapsedTime() {
		long time = 0;
		if (stateHolder.isGameSolved()) {
			time = getElapsedTime() / 1000;
		} else {
			time = (System.currentTimeMillis() - startTime) / 1000;
		}
		int mins = (int) time / 60;
		int secs = (int) time % 60;
		StringBuffer sb = new StringBuffer();
		sb.append(mins).append(":");
		if (secs < 10)
			sb.append("0");
		sb.append(secs);
		return (sb.toString());
	}

	/**
	 * The Text Box displays the text on the grid location.
	 * 
	 * @param text
	 *            Text String[] to display
	 * @param callRepaint
	 *            boolean to indicate repaint is requested
	 */
	public final void drawText(String[] text, boolean callRepaint) {

		final Graphics g = getOffScreenGraphics();
		// limit box to grid only
		final int xOld = g.getClipX();
		final int yOld = g.getClipY();
		final int w = g.getClipWidth();
		final int h = g.getClipHeight();
		g.setClip(offsetX, offsetY, gridWidth, gridHeight);

		// initial settings
		// check for best font (default or smaller)
		final int offset = 4;
		Font aFont = Font.getDefaultFont();
		int textHeight = aFont.getHeight() * text.length;
		int textWidth = 0;
		for (int i = 0; i < text.length; i++) {
			textWidth = Math.max(aFont.stringWidth(text[i]), textWidth);
		}
		// switch to smaller font, if default does not fit
		if (textHeight + offset > gridHeight || textWidth + offset > gridWidth) {
			aFont = Font.getFont(Font.FACE_SYSTEM, Font.STYLE_PLAIN,
					Font.SIZE_SMALL);
			textHeight = aFont.getHeight() * text.length;
			textWidth = 0;
			for (int i = 0; i < text.length; i++) {
				textWidth = Math.max(aFont.stringWidth(text[i]), textWidth);
			}
		}
		g.setFont(aFont);

		int x = offsetX + (gridWidth - textWidth) / 2;
		int y = offsetY + (gridHeight - textHeight) / 2;
		g.setColor(COLOR_BACKGROUND_FOCUS_NORMAL.getValue());
		g.fillRect(x - offset, y - offset, textWidth + offset * 2, textHeight
				+ offset * 2);
		g.setColor(COLOR_GRID_LINE);
		g.drawRect(x - offset, y - offset, textWidth + offset * 2 - 1,
				textHeight + offset * 2 - 1);

		for (int i = 0; i < text.length; i++) {
			g.drawString(text[i], x, y + (i * aFont.getHeight()), Graphics.TOP
					| Graphics.LEFT);
		}
		g.setClip(xOld, yOld, w, h);
		if (callRepaint) {
			repaint();
		}
		// do a full paint next time
		paintAll = true;
	}

	/**
	 * Check if the puzzle is solved. If yes, show solution.
	 * 
	 */
	private void checkSolution() {

		if (hasPointerEvents()) {
			drawSmiley(EMPTY_SMILEY);
		} else {
			// clearSmiley();
		}

		if (grid.isCompletelyFilled()) {

			if (grid.isValidSolution()) {
				boolean solvedNow = false;
				if (!stateHolder.isGameSolved()) {
					// Show popup only once.
					solvedNow = true;
					stateHolder.gameSolved();
				}
				drawSmiley(LUCKY_SMILEY);
				if (solvedNow) {
					toggleStatusPopup(true);
				}
			} else {
				drawSmiley(BAD_SMILEY);
			}
		}
	}

	/**
	 * Place a lucky/sad smiley at top right position.
	 * 
	 * @param smileyType
	 *            the smiley type (empty,sad,good)
	 */

	private void drawSmiley(final int smileyType) {

		if (stateHolder.getSidebarLocation() == SudokuStateControl.SIDEBAR_NONE) {
			// do not show icons at all
			return;
		}

		final Image sourceImage = (smileyType == LUCKY_SMILEY) ? getCombinedImageColor()
				: getCombinedImageBlack();
		final int pos = (smileyType == EMPTY_SMILEY) ? 9 : 11;
		// draw background
		clearSmiley();

		// darw image
		drawRegion(getOffScreenGraphics(), sourceImage, pos * imageSize, 0,
				imageSize, imageSize, xPosSmiley, yPosSmiley, Graphics.TOP
						| Graphics.LEFT);

	}

	/**
	 * Draw background on smiley position.
	 * 
	 */

	private void clearSmiley() {

		if (stateHolder.getSidebarLocation() == SudokuStateControl.SIDEBAR_NONE) {
			// do not show icons at all
			return;
		}

		// draw background WHITE
		final Graphics g = getOffScreenGraphics();
		g.setColor(0x00FFFFFF);
		g.fillRect(xPosSmiley, yPosSmiley, imageSize, imageSize);

	}

	/**
	 * Calculate the x start position of the smiley display.
	 * 
	 * @return x position of smiley
	 */
	private int initSmileyStartPositionX() {

		if (stateHolder.getSidebarLocation() == SudokuStateControl.SIDEBAR_BOTTOM) {
			int posX = offsetX;
			// if not enough height at smallest resolution => 2 pixel right
			if (width < (imageSize - 1) * 9 + 1 + 2 * blockOffset) {
				posX += 2;
			}
			return posX;
		}

		// displayed in column 9.5
		// 2 grid lines (between 3x3 blocks) as extra offset

		int posX = offsetX + (9 * (imageSize - 1)) + (imageSize / 2)
				+ (2 * blockOffset);

		// if not enough place => place on right border
		if (width < (10 * imageSize) + (imageSize / 2)) {
			posX = width - imageSize;
		}

		return posX;

	}

	/**
	 * Calculate the x start position of the pen/pencil display.
	 * 
	 * @return get x position of pen/pencil sign
	 */
	private int initPenPencilStartPositionX() {

		if (stateHolder.getSidebarLocation() == SudokuStateControl.SIDEBAR_BOTTOM) {
			int posX = offsetX + (8 * (imageSize - 1)) + (2 * blockOffset);

			// if not enough space at smallest resolution => 2 pixel to left
			if (width < (imageSize - 1) * 9 + 1 + 2 * blockOffset) {
				posX -= 2;
			}
			return posX;
		}

		// displayed in column 9.5
		// 2 grid lines (between 3x3 blocks) as extra offset

		int posX = offsetX + (9 * (imageSize - 1)) + (imageSize / 2)
				+ (2 * blockOffset);

		// if not enought place => place on right border
		if (width < (imageSize - 1) * 9 + 1 + 2 * blockOffset + imageSize
				+ (imageSize / 2)) {
			posX = width - imageSize;
		}

		return posX;

	}

	/**
	 * Calculate the x start position of the pointer digits.
	 * 
	 * @return x position of digit sidebar
	 */
	private int initPointerDigitsStartPositionX() {

		if (stateHolder.getSidebarLocation() == SudokuStateControl.SIDEBAR_BOTTOM) {
			// check how much space is left:
			// 7 big images left, need space for 9 small images
			final int space = (7 * (imageSize - 1)) + (2 * blockOffset)
					- (9 * (imagePointerSize - 1));

			int posX = offsetX + imageSize + (space / 2);
			return posX;
		}
		// display at column 9.5
		// additional offset because of grid lines (between 3x3 blocks)

		int posX = offsetX + (9 * (imageSize - 1)) + (imageSize / 2)
				+ (2 * blockOffset);

		// if not enought place => place on right border
		if (width < (imageSize - 1) * 9 + 1 + 2 * blockOffset + imageSize
				+ (imageSize / 2)) {
			posX = width - imagePointerSize;
		}

		return posX;
	}

	/**
	 * Calculate the y start position of the pointer digits.
	 * 
	 * @return y position of digit sidebar
	 */
	private int initPointerDigitsStartPositionY() {

		if (stateHolder.getSidebarLocation() == SudokuStateControl.SIDEBAR_BOTTOM) {
			return posYIconsBottom;
		}

		// check how much space is left:
		// 7 big images left, need space for 9 small images

		final int space = (7 * (imageSize - 1)) + (2 * blockOffset)
				- (9 * (imagePointerSize - 1));

		int posY = offsetY + imageSize + (space / 2);

		return posY;
	}

	/**
	 * Calculate the y start position of the pen/pencil display.
	 * 
	 * @return y position of pen/pencil sign
	 */
	private int initPenPencilStartPositionY() {

		if (stateHolder.getSidebarLocation() == SudokuStateControl.SIDEBAR_BOTTOM) {
			return posYIconsBottom;
		}
		// display in row 9
		// additional offset because of grid lines (between 3x3 blocks)

		int posY = offsetY + (8 * (imageSize - 1)) + (2 * blockOffset);

		// if not enough space at smallest resolution => 2 pixel to top
		if (height < (imageSize - 1) * 9 + 1 + 2 * blockOffset) {
			posY -= 2;
		}

		return posY;

	}

	/**
	 * Calculate the y start position of the smiley display.
	 * 
	 * @return y position of smiley
	 */
	private int initSmileyStartPositionY() {

		if (stateHolder.getSidebarLocation() == SudokuStateControl.SIDEBAR_BOTTOM) {
			return posYIconsBottom;
		}

		// top position
		int posY = offsetY;

		// if not enough height at smallest resolution => 2 pixel down
		if (height < (imageSize - 1) * 9 + 1 + 2 * blockOffset) {
			posY += 2;
		}

		return posY;

	}

	/**
	 * Calculate the y start position of the botom icons display.
	 * 
	 * @return y position of icons
	 */
	private int initIconsOnBottomPositionY() {

		int posY = offsetY + (9 * (imageSize - 1)) + (2 * blockOffset)
				+ (imageSize / 2);

		// if not enought place => place icon directly below grid
		if (height < posY + imageSize && height - imageSize >= gridHeight) {
			posY = height - imageSize;
		}

		return posY;
	}

	/**
	 * Draw the sidebar with digits for pointer input. Check the usage mode of
	 * the sidebar: pointer input, show possible or show complete.
	 */
	private void drawSidebar() {

		final Image sourceImage = getPointerImage(stateHolder
				.isUseColorDigits());

		if (sourceImage == null) {
			// smallest resolution => don't draw pointer digits
			return;
		}
		final Graphics g = getOffScreenGraphics();

		int[] counts = null;
		if (stateHolder.getSidebarUsage() == SudokuStateControl.SIDEBAR_COMPLETE) {
			counts = grid.getDigitCounts();
		}

		boolean[] markedDigits = null;
		if (stateHolder.getSidebarUsage() == SudokuStateControl.SIDEBAR_POSSIBLE) {
			markedDigits = grid.getConflictingDigitsForPos(focusRow,
					focusColumn);
		}

		for (int i = 0; i < 9; i++) {

			int posWithinCombined = i;
			if ((counts != null && counts[i + 1] >= 9)
					|| (markedDigits != null && markedDigits[i])) {
				// erease digit
				posWithinCombined = 9;
			}

			// draw background
			if (i + 1 == selectedPointerDigit && hasPointerEvents()) {
				g.setColor(COLOR_BACKGROUND_FOCUS_NORMAL.getValue());
			} else {
				g.setColor(COLOR_BACKGROUND_NORMAL.getValue());
			}

			int size = imagePointerSize;
			if (imagePointerSize == imageSize) {
				size -= 2;
			}

			int posX = xPosPointerDigits;
			int posY = yPosPointerDigits + (i * (size - 1));

			if (stateHolder.getSidebarLocation() == SudokuStateControl.SIDEBAR_BOTTOM) {
				posX = xPosPointerDigits + (i * (size - 1));
				posY = yPosPointerDigits;
			}

			g.fillRect(posX, posY, size, size);

			// draw image
			int xCombinedPos = posWithinCombined * imagePointerSize;
			int yCombinedPos = 0;
			if (imagePointerSize == imageSize) {
				xCombinedPos += 1;
				yCombinedPos += 1;
			}

			drawRegion(g, sourceImage, xCombinedPos, yCombinedPos, size, size,
					posX, posY, Graphics.TOP | Graphics.LEFT);

		}

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Displayable#pointerPressed(int, int)
	 */

	public void pointerPressed(final int x, final int y) {

		if (stateHolder.isUndoMode()) {
			pointerPressedUndoMode(x, y);
			return;
		}

		final Position pos = traverseCell(x, y);

		if (pos.row >= 0 && pos.row < 9 && pos.col >= 0 && pos.col < 9) {
			if (!stateHolder.isShowSolution()) {
				// grid cell clicked
				if (statusDisplayed) {
					// check if info popup visible => remove info
					statusDisplayed = false;
					stopStatusDisplay();
					updateCanvas(false);
					repaint();
				} else {
					// => set focused slot
					storeFocus();
					focusRow = pos.row;
					focusColumn = pos.col;
					// digit was selected before...
					numberPressed(selectedPointerDigit);
				}
			}
		} else if (isSmiley(x, y)) {
			// click on smiley = toggle info
			if (!stateHolder.isUserCreatingPuzzle()) {
				keyPressed(Canvas.KEY_STAR);
			}
		} else if (isPenPencilSign(x, y)) {
			// click on pen/pencil sign => toggle mode
			if (!stateHolder.isUserCreatingPuzzle()) {
				stateHolder.togglePencilMode();
			}
		} else if (isDigitSidebar(x, y)) {
			// click on a pointer digit => select this digit for further
			// grid-clicks

			final boolean sideBarOnBottom = (stateHolder.getSidebarLocation() == SudokuStateControl.SIDEBAR_BOTTOM);
			final int i = sideBarOnBottom ? ((x - xPosPointerDigits) / (imagePointerSize - 1))
					: ((y - yPosPointerDigits) / (imagePointerSize - 1));
			final int digit = (i + 1);
			selectedPointerDigit = (byte) digit;
			if (isSidebarShown()) {
				// repaint only digit navigation if any
				drawSidebar();
			}
			repaint();
		}

	}

	/**
	 * Check pointer pos to decide to redo or undo
	 * 
	 * @param x
	 *            the x pos
	 * @param y
	 *            the y pos
	 */
	private void pointerPressedUndoMode(final int x, final int y) {
		if (x > (this.getWidth() / 2)) {
			redoMove();
		} else {
			undoMove();
		}
	}

	/**
	 * Check if x,y position is within digit sidebar for pointer support.
	 * 
	 * @param x
	 *            position of click
	 * @param y
	 *            position of click
	 * @return true if click within sidebar
	 */
	private boolean isDigitSidebar(final int x, final int y) {

		if (stateHolder.getSidebarLocation() == SudokuStateControl.SIDEBAR_BOTTOM) {
			return xPosPointerDigits <= x
					&& x <= xPosPointerDigits + (9 * (imagePointerSize - 1))
					&& yPosPointerDigits <= y
					&& y <= yPosPointerDigits + imagePointerSize;
		}
		return xPosPointerDigits <= x
				&& x <= xPosPointerDigits + imagePointerSize
				&& yPosPointerDigits <= y
				&& y <= yPosPointerDigits + (9 * (imagePointerSize - 1));
	}

	/**
	 * Check if x,y position is within pen/pencil sign for pointer support.
	 * 
	 * @param x
	 *            position of click
	 * @param y
	 *            position of click
	 * @return true if click within pen/pencil sign.
	 */
	private boolean isPenPencilSign(final int x, final int y) {

		return xPosPencil <= x && x <= xPosPencil + imageSize
				&& yPosPencil <= y && y <= yPosPencil + imageSize;
	}

	/**
	 * Check if x,y position is within smiley sign for pointer support.
	 * 
	 * @param x
	 *            position of click
	 * @param y
	 *            position of click
	 * @return true if click within smiley
	 */

	private boolean isSmiley(final int x, final int y) {

		return xPosSmiley <= x && x <= xPosSmiley + imageSize
				&& yPosSmiley <= y && y <= yPosSmiley + imageSize;
	}

	/**
	 * Initialize the x and y positions for pointer support.
	 */
	private void initializePositions() {

		posYIconsBottom = initIconsOnBottomPositionY();

		xPosPencil = initPenPencilStartPositionX();
		yPosPencil = initPenPencilStartPositionY();

		if (hasPointerEvents()) {
			xPosSmiley = initSmileyStartPositionX();
			yPosSmiley = initSmileyStartPositionY();
			xPosPointerDigits = initPointerDigitsStartPositionX();
			yPosPointerDigits = initPointerDigitsStartPositionY();
		} else {
			xPosSmiley = xPosPencil;
			yPosSmiley = yPosPencil;
			xPosPointerDigits = initSmileyStartPositionX();
			yPosPointerDigits = initSmileyStartPositionY();
		}

	}

	/**
	 * Retrieve the position from the x, y position of a 'mouse'-click.
	 * 
	 * @param x
	 *            position of pointerPressed
	 * @param y
	 *            position of pointerPressed
	 * @return Position in (row,col) within the grid, or negative value for
	 *         other navigation elements on canvas
	 */
	private Position traverseCell(final int x, final int y) {

		byte col = (byte) -1;
		byte row = (byte) -1;

		for (byte i = 0; i < 9; i++) {
			final int bOffset = (i / 3) * blockOffset;

			final int xStart = i * (imageSize - 1) + offsetX + bOffset;
			if (x > xStart && x < xStart + imageSize) {
				col = i;
			}
			final int yStart = i * (imageSize - 1) + offsetY + bOffset;
			if (y > yStart && y < yStart + imageSize) {
				row = i;
			}
		}

		return new Position(row, col);

	}

	/**
	 * Show the digit on focus postion.
	 */
	public final void solveSlot() {

		if (grid != null) {
			addSolvedSlotToMoves();

			grid.promote(focusRow, focusColumn);

			final GridSlot slot = grid.getSlot(focusRow, focusColumn);
			if (!slot.isOriginalDigit()) {
				// need to check for conflicts if enabled
				calculateConflicts(slot.getAnswer());
			}

			if (stateHolder.isBeginnerMode()) {
				stateHolder.setupPencilMarks();
			}
			updateCanvas(false);
			repaint();
		}
	}

	/**
	 * Draw Region for MIDP 1.0 (without Transform) by hunkpapa.
	 * 
	 * @param g
	 *            the destination
	 * @param src
	 *            the source
	 * @param x_src
	 * @param y_src
	 * @param width
	 *            destination width
	 * @param height
	 *            destination height
	 * @param x_dest
	 * @param y_dest
	 * @param anchor
	 */
	private final static void drawRegion(final Graphics g, final Image src,
			final int x_src, final int y_src, final int width,
			final int height, final int x_dest, final int y_dest,
			final int anchor) {

		final int xOld = g.getClipX();
		final int yOld = g.getClipY();
		final int w = g.getClipWidth();
		final int h = g.getClipHeight();
		g.setClip(x_dest, y_dest, width, height);
		g.drawImage(src, x_dest - x_src, y_dest - y_src, anchor);
		g.setClip(xOld, yOld, w, h);
	}

	/**
	 * Update the grid with the elapsed time
	 * 
	 * @param elapsed
	 *            time till solving
	 */
	private void setElapsedTime(long elapsed) {
		grid.setElapsedTime(elapsed);
	}

	/**
	 * Get elapsed time from current grid.
	 * 
	 * @return time for current grid.
	 */
	private long getElapsedTime() {
		return grid.getElapsedTime();
	}

	/**
	 * Start the time measuring, if appropriate.
	 */
	public final void startTimer() {

		if (stateHolder.isActiveGame() && !stateHolder.isGameSolved()) {
			long elapsed = getElapsedTime();
			startTime = System.currentTimeMillis() - elapsed;
		}
	}

	/**
	 * Stop the Time measurement.
	 */
	public final void stopTimer() {

		// to save resource, stop status display, if any
		stopStatusDisplay();
		updateTimeInGrid();
	}

	/**
	 * Update the elapsed time in the current grid.
	 */
	public final void updateTimeInGrid() {
		if (stateHolder.isActiveGame() && !stateHolder.isGameSolved()) {
			long elapsed = System.currentTimeMillis() - startTime;
			setElapsedTime(elapsed);
		}
	}

	/**
	 * Place focus in the middle of the grid.
	 */
	public final void resetFocus() {
		storeFocus();
		focusColumn = 4;
		focusRow = 4;
	}

	/**
	 * Toggle between Move and Edit mode.
	 */
	private void toggleMoveMode() {

		useDigitsToMove = !useDigitsToMove;

		updateCanvas(false);
		repaint();
	}

	/**
	 * Set/unset status popup.
	 * 
	 * @param activateKeyPressed
	 *            indicates, that the activation key was used
	 * @return true if status display was deactivated
	 */
	private boolean toggleStatusPopup(boolean activateKeyPressed) {
		final boolean statusWasShown = statusDisplayed;
		if (activateKeyPressed) {
			statusDisplayed = !statusDisplayed;
		} else {
			statusDisplayed = false;
		}

		if (statusDisplayed) {
			startStatusDisplay(stateHolder.isGameSolved());
		} else {
			if (statusWasShown) {
				stopStatusDisplay();
			}
		}

		return statusWasShown && !statusDisplayed;

	}

	/**
	 * A number between 0 and 9 was pressed. Change the digit. If original digit =>
	 * show error.
	 * 
	 * @param d
	 *            the number pressed
	 */
	private void numberPressed(byte d) {

		final GridSlot slot = grid.getSlot(focusRow, focusColumn);
		if (slot.isOriginalDigit()) {
			drawText(Dict.getStringArray("[]givenCannotChanged"), false);
		} else {
			// automatic switch to pen mode, if cell has shown digit
			if (stateHolder.isPencilMode() && slot.getShown() != 0) {
				stateHolder.togglePencilMode();
			}
			if (stateHolder.isPencilMode()) {
				if (!stateHolder.isShowPencilMarks()) {
					drawText(Dict.getStringArray("[]activateMrks"), false);
				} else {
					if (d != 0) {

						// store move for undo
						addMove(d);
						// change grid
						final boolean oldValue = slot.isPencilMark(d - 1);
						slot.setPencilMark(d - 1, !oldValue);
						// need to check for conflicts if enabled
						if (slot.isPencilMark(d - 1)) {
							calculateConflicts(d);
						} else {
							oldConflictPositions = conflictPositions;
							conflictPositions = null;
						}
						updateCanvas(false);
					}
				}
			} else {

				if (slot.getShown() == d) {
					// same digit again => clear slot
					d = (byte) 0;
				}

				// store move for undo
				addMove(d);
				// change slot
				slot.setShown(d);
				// need to check for conflicts if enabled
				calculateConflicts(d);

				if (stateHolder.isBeginnerMode()) {
					stateHolder.setupPencilMarks();
				}
				updateCanvas(false);
			}

		}
		repaint();
	}

	/**
	 * Check the digit, if it conflicts with other set cells.
	 * 
	 * @param d
	 *            the digit to check
	 */
	private void calculateConflicts(byte d) {
		if (stateHolder.isDisplayConflicts()) {
			oldConflictPositions = conflictPositions;
			conflictPositions = grid.getConflictPositions(focusRow,
					focusColumn, d);
		} else {
			conflictPositions = null;
		}
	}

	/**
	 * Setup edit grid.
	 * 
	 * @param gridToSolve
	 *            the new Grid
	 */
	public final void setNewEmptyGrid(final Grid gridToSolve) {

		toggleStatusPopup(false);
		stateHolder.setNewGrid(gridToSolve, true);
	}

	/**
	 * Set a new grid of a newly loaded/created game. Repaint needed.
	 * 
	 * @param grid
	 *            the new grid
	 */
	public final void setNewGrid(final Grid grid) {

		toggleStatusPopup(false);
		stateHolder.setNewGrid(grid, false);
	}

	/**
	 * A single digit was solved vie 'Display digit' command: store this move to
	 * the undo stack.
	 * 
	 */
	private void addSolvedSlotToMoves() {

		final GridSlot slot = (GridSlot) grid.getSlot(focusRow, focusColumn);
		moves.addMove(focusRow, focusColumn, slot.getShown(), slot.getAnswer(),
				false);

	}

	/**
	 * Undo a move in UNDO mode.
	 * 
	 */
	private void undoMove() {

		final Position nextPos = moves.getNextUndoPosition();
		final Position pos = moves.stepBack(grid);
		storeFocus();
		if (pos == null) {
			if (nextPos != null) {
				focusRow = nextPos.row;
				focusColumn = nextPos.col;
			}
		} else {
			focusRow = pos.row;
			focusColumn = pos.col;
		}
		updateCanvas(false);
		if (nextPos == null)
			drawText(Dict.getStringArray("[]undoNotPossible"), false);
		repaint();

	}

	/**
	 * Store the current Focus position to clear the cell in updateCanvas().
	 */
	private void storeFocus() {
		oldFocusRow = focusRow;
		oldFocusCol = focusColumn;

	}

	/**
	 * Redo a move in UNDO mode.
	 * 
	 */
	private void redoMove() {

		final Position nextPos = moves.getNextUndoPosition();
		final Position pos = moves.stepForward(grid);
		storeFocus();
		if (pos == null) {
			if (nextPos != null) {
				focusRow = nextPos.row;
				focusColumn = nextPos.col;
			}
		} else {
			focusRow = pos.row;
			focusColumn = pos.col;
		}
		updateCanvas(false);
		if (pos == null)
			drawText(Dict.getStringArray("[]redoNotPossible"), false);
		repaint();

	}

	/**
	 * Change the navigation to UNDO /REDO mode.
	 */
	public final void switchToUndoMode() {

		// in case of running status timer
		statusDisplayed = false;
		stopStatusDisplay();

		final Position pos = moves.getNextUndoPosition();
		if (pos != null) {
			focusRow = pos.row;
			focusColumn = pos.col;
		}

		// undo/redo needs full paint
		paintAll = true;
		updateCanvas(false);
		if (hasPointerEvents()) {
			drawText(Dict.getStringArray("[]pointerUndo"), false);
		}
		repaint();

	}

	/**
	 * Change the navigation to UNDO /REDO mode.
	 */
	public final void returnFromUndoMode() {

		conflictPositions = null;

		if (focusColumn < 0 || focusRow < 0) {
			resetFocus();
		}
		paintAll = true;
		updateCanvas(false);
		repaint();
	}

	/**
	 * Reset the UNDO/REDO move stack.
	 */
	public final void resetMoveStack() {
		moves.resetStack();
	}

	/**
	 * Reset grid.
	 */
	public final void resetGrid() {

		if (grid != null) {
			statusDisplayed = false;
			grid.clearDigits();
			grid.clearPencilMarks();
			conflictPositions = null;
			oldConflictPositions = null;
			setElapsedTime(0);
			resetFocus();
			resetMoveStack();
		}

	}

	/**
	 * Add a move to the undo stack.
	 * 
	 * @param digit
	 *            the new digit
	 */
	private void addMove(final byte digit) {

		final GridSlot slot = (GridSlot) grid.getSlot(focusRow, focusColumn);
		moves.addMove(focusRow, focusColumn, stateHolder.isPencilMode() ? digit
				: slot.getShown(), digit, stateHolder.isPencilMode());
	}

	/**
	 * Validate the digits and indicate erroneous digits.
	 */
	public final void validateDigits() {
		// mark full paint
		paintAll = true;
		updateCanvas(true);
		repaint();
		// after update be sure to have next update a full paint again
		paintAll = true;

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see javax.microedition.lcdui.Displayable#keyRepeated(int)
	 */
	public void keyRepeated(int key) {
		// allow fast moves
		if (key < Canvas.KEY_NUM0 || key > Canvas.KEY_NUM9 || useDigitsToMove) {
			keyPressed(key);
		}
	}

	/**
	 * Get the graphics object for all offscreen operations.
	 * 
	 * @return the Graphics to draw on
	 */
	private Graphics getOffScreenGraphics() {
		// lazy init, as it may be freed after freeResources() calls
		if (offScreenGraphics == null) {
			offScreenGraphics = getOffScreenImage().getGraphics();
			// be sure to signal complete paint
			paintAll = true;
		}
		return offScreenGraphics;
	}

	/**
	 * Dereference items to save ram.
	 */
	public final void freeResources() {
		offScreenGraphics = null;
		offScreenImage = null;
	}

	/**
	 * Get the pointer image.
	 * 
	 * @param colored
	 *            indicates if colored or black digits requested
	 * @return the pointer image
	 */
	private Image getPointerImage(final boolean colored) {

		if (pointerImage == null || colored != pointerImageColored) {
			pointerImageColored = colored;
			try {
				pointerImage = colored ? Image
						.createImage(fileNamePointerImageColor) : Image
						.createImage(fileNamePointerImageBlack);
			} catch (IOException e) {
				pointerImage = null;
			}
		}
		return pointerImage;
	}

	/**
	 * Get the combined colored image for the digits in the grid.
	 * 
	 * @return the combined image
	 */
	private Image getCombinedImageColor() {

		if (combinedImageColor == null) {
			try {
				combinedImageColor = Image.createImage(fileNameColorImages);
			} catch (IOException e) {
				combinedImageColor = null;
			}
		}
		return combinedImageColor;
	}

	/**
	 * Get the combined black image for the digits in the grid.
	 * 
	 * @return the combined image
	 */
	private Image getCombinedImageBlack() {

		if (combinedImageBlack == null) {
			try {
				combinedImageBlack = Image.createImage(fileNameBlackImages);
			} catch (IOException e) {
				combinedImageBlack = null;
			}
		}
		return combinedImageBlack;
	}

	/**
	 * Recalculate the position settings and redraw everything.
	 * 
	 */
	private void recalculateImageSize() {

		try {
			this.sidebarLocation = stateHolder.getSidebarLocation();

			height = this.getHeight();
			width = this.getWidth();

			initializeImages();
			freeResources();

			// draw background WHITE
			getOffScreenGraphics().setColor(0x00FFFFFF);
			getOffScreenGraphics().fillRect(0, 0, width, height);

		} catch (IOException e) {
			// do nothing
		}

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see de.wintermute.IGui#init(javax.microedition.midlet.MIDlet)
	 */
	public synchronized void init(final Canvas canvas, final MIDlet theMidlet) {

		midlet = (SudokuMidlet) theMidlet;
		setCanvas(canvas);

		if (stateHolder == null) {
			stateHolder = new SudokuStateControl(midlet, this);
		} else {
			stateHolder.updateCommandListener(this);
		}

		height = getHeight();
		width = getWidth();
		freeResources();

		recalculateImageSize();

		// setTitle("5ud0ku");

		paintAll = true;
		updateCanvas(false);
		repaint();

	}

	public void paint(final Graphics graphics) {

		graphics.drawImage(getOffScreenImage(), 0, 0, 0);

	}

}
